import os
from contextlib import contextmanager
from typing import Literal

import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from psycopg.rows import dict_row
from pydantic import BaseModel

load_dotenv(os.environ.get("ENV_FILE", ".env"))
DATABASE_URL = os.environ["DATABASE_URL"]

# Vercel では /api/(.*) だけがバックエンドに渡るので、API の説明ページも /api の下に置く
app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")


@contextmanager
def get_cursor():
    # リクエストごとに接続する(サーバーレスでは、接続を持ち越せない。接続の使い回しは Neon のプールが行う)
    with psycopg.connect(DATABASE_URL, row_factory=dict_row) as conn:
        yield conn.cursor()


class Vehicle(BaseModel):
    id: int
    name: str
    image_path: str


class Area(BaseModel):
    """車両の画像の上の、押せる範囲(左上の角と幅・高さ。画像に対する 0〜1 の割合)"""

    x: float
    y: float
    w: float
    h: float


class PartSummary(BaseModel):
    id: int
    name: str
    area: Area


class VehicleParts(BaseModel):
    vehicle: Vehicle
    parts: list[PartSummary]


class BoltSummary(BaseModel):
    id: int
    name: str
    image_path: str


class Mount(BaseModel):
    """部位の画像の上の、ボルトの取り付け位置(ボルトの頭の中心。画像に対する 0〜1 の割合)"""

    id: int
    side: Literal["front", "back"]  # front = 表(外側)、back = 裏(内側)
    x: float
    y: float
    bolt: BoltSummary


class VehiclePartDetail(BaseModel):
    id: int
    name: str
    vehicle_id: int
    front_image_path: str
    back_image_path: str
    mounts: list[Mount]


class ShelfPlacement(BaseModel):
    """ボルトが置かれている部品棚と、棚の中のマス(段・列)"""

    parts_shelf_id: int
    zone_name: str
    address_code: str
    shelf_no: str
    map_x: float  # 工場マップ画像の上の位置(0〜1 の割合)
    map_y: float
    shelf_rows: int
    shelf_cols: int
    slot_row: int
    slot_col: int


class SimilarBolt(BaseModel):
    id: int
    part_number: str
    name: str
    image_path: str
    supplier_name: str
    back_number: str
    difference_note: str | None
    shelves: list[ShelfPlacement]  # 間違えたときに、おおよその場所が分かるように、類似ボルトの置き場所も返す


class BoltDetail(BaseModel):
    id: int
    part_number: str
    name: str
    spec: str | None
    image_path: str
    supplier_name: str
    back_number: str
    shelves: list[ShelfPlacement]
    similar_bolts: list[SimilarBolt]


class BoltInShelf(BaseModel):
    id: int
    name: str
    part_number: str
    image_path: str
    supplier_name: str
    back_number: str


class ShelfCell(BaseModel):
    slot_row: int
    slot_col: int
    bolt: BoltInShelf


class ShelfDetail(BaseModel):
    """部品棚の絵(段 × 列の格子)を描くための情報。埋まっているマスだけを返す(空のマスは画面側で描く)"""

    id: int
    zone_name: str
    address_code: str
    shelf_no: str
    shelf_rows: int
    shelf_cols: int
    map_x: float
    map_y: float
    cells: list[ShelfCell]


@app.get("/api/vehicles", response_model=list[Vehicle])
def list_vehicles():
    with get_cursor() as cur:
        cur.execute("SELECT id, name, image_path FROM vehicle ORDER BY id")
        return cur.fetchall()


@app.get("/api/vehicles/{vehicle_id}/parts", response_model=VehicleParts)
def list_vehicle_parts(vehicle_id: int):
    with get_cursor() as cur:
        cur.execute("SELECT id, name, image_path FROM vehicle WHERE id = %s", (vehicle_id,))
        vehicle = cur.fetchone()
        if vehicle is None:
            raise HTTPException(status_code=404, detail="vehicle not found")
        # numeric は、JSON で数値として返すため float に変換する
        cur.execute(
            """
            SELECT id, name,
                   area_x::float AS x, area_y::float AS y,
                   area_w::float AS w, area_h::float AS h
            FROM vehicle_part
            WHERE vehicle_id = %s
            ORDER BY id
            """,
            (vehicle_id,),
        )
        parts = [
            {"id": r["id"], "name": r["name"], "area": {k: r[k] for k in ("x", "y", "w", "h")}}
            for r in cur.fetchall()
        ]
    return {"vehicle": vehicle, "parts": parts}


@app.get("/api/vehicle-parts/{part_id}", response_model=VehiclePartDetail)
def get_vehicle_part(part_id: int):
    with get_cursor() as cur:
        cur.execute(
            "SELECT id, name, vehicle_id, front_image_path, back_image_path FROM vehicle_part WHERE id = %s",
            (part_id,),
        )
        part = cur.fetchone()
        if part is None:
            raise HTTPException(status_code=404, detail="vehicle part not found")
        cur.execute(
            """
            SELECT m.id, m.side, m.x::float AS x, m.y::float AS y,
                   b.id AS bolt_id, b.name AS bolt_name, b.image_path AS bolt_image_path
            FROM bolt_mount m
            JOIN bolt b ON b.id = m.bolt_id
            WHERE m.vehicle_part_id = %s
            ORDER BY m.side, m.y, m.x
            """,
            (part_id,),
        )
        part["mounts"] = [
            {
                "id": r["id"],
                "side": r["side"],
                "x": r["x"],
                "y": r["y"],
                "bolt": {"id": r["bolt_id"], "name": r["bolt_name"], "image_path": r["bolt_image_path"]},
            }
            for r in cur.fetchall()
        ]
    return part


def fetch_shelf_placements(cur, bolt_ids: list[int]) -> dict[int, list[dict]]:
    """ボルトごとの、置かれている部品棚(工区 → 所番地 → 棚番号の順)。棚に置かれていないボルトは、キー自体がない"""
    cur.execute(
        """
        SELECT bs.bolt_id, ps.id AS parts_shelf_id, z.name AS zone_name, a.code AS address_code, ps.shelf_no,
               ps.map_x::float AS map_x, ps.map_y::float AS map_y,
               ps.shelf_rows, ps.shelf_cols, bs.slot_row, bs.slot_col
        FROM bolt_shelf bs
        JOIN parts_shelf ps ON ps.id = bs.parts_shelf_id
        JOIN address a ON a.id = ps.address_id
        JOIN zone z ON z.id = a.zone_id
        WHERE bs.bolt_id = ANY(%s)
        ORDER BY z.id, a.code, ps.shelf_no
        """,
        (bolt_ids,),
    )
    placements: dict[int, list[dict]] = {}
    for row in cur.fetchall():
        placements.setdefault(row.pop("bolt_id"), []).append(row)
    return placements


@app.get("/api/bolts/{bolt_id}", response_model=BoltDetail)
def get_bolt(bolt_id: int):
    with get_cursor() as cur:
        cur.execute(
            """
            SELECT b.id, b.part_number, b.name, b.spec, b.image_path, b.back_number,
                   s.name AS supplier_name
            FROM bolt b
            JOIN supplier s ON s.id = b.supplier_id
            WHERE b.id = %s
            """,
            (bolt_id,),
        )
        bolt = cur.fetchone()
        if bolt is None:
            raise HTTPException(status_code=404, detail="bolt not found")
        bolt["shelves"] = fetch_shelf_placements(cur, [bolt_id]).get(bolt_id, [])
        # 類似ボルトは 1 組を 1 行で持つので、どちら側から見ても出るように、相手の側を取り出す
        cur.execute(
            """
            SELECT o.id, o.part_number, o.name, o.image_path, s.name AS supplier_name,
                   o.back_number, sb.difference_note
            FROM similar_bolt sb
            JOIN bolt o ON o.id = CASE WHEN sb.bolt_id = %(id)s THEN sb.similar_bolt_id ELSE sb.bolt_id END
            JOIN supplier s ON s.id = o.supplier_id
            WHERE sb.bolt_id = %(id)s OR sb.similar_bolt_id = %(id)s
            ORDER BY o.id
            """,
            {"id": bolt_id},
        )
        similar_bolts = cur.fetchall()
        placements = fetch_shelf_placements(cur, [similar["id"] for similar in similar_bolts])
        for similar in similar_bolts:
            similar["shelves"] = placements.get(similar["id"], [])
        bolt["similar_bolts"] = similar_bolts
    return bolt


@app.get("/api/parts-shelves/{shelf_id}", response_model=ShelfDetail)
def get_parts_shelf(shelf_id: int):
    with get_cursor() as cur:
        cur.execute(
            """
            SELECT ps.id, z.name AS zone_name, a.code AS address_code, ps.shelf_no,
                   ps.shelf_rows, ps.shelf_cols, ps.map_x::float AS map_x, ps.map_y::float AS map_y
            FROM parts_shelf ps
            JOIN address a ON a.id = ps.address_id
            JOIN zone z ON z.id = a.zone_id
            WHERE ps.id = %s
            """,
            (shelf_id,),
        )
        shelf = cur.fetchone()
        if shelf is None:
            raise HTTPException(status_code=404, detail="parts shelf not found")
        cur.execute(
            """
            SELECT bs.slot_row, bs.slot_col,
                   b.id, b.name, b.part_number, b.image_path, b.back_number, s.name AS supplier_name
            FROM bolt_shelf bs
            JOIN bolt b ON b.id = bs.bolt_id
            JOIN supplier s ON s.id = b.supplier_id
            WHERE bs.parts_shelf_id = %s
            ORDER BY bs.slot_row, bs.slot_col
            """,
            (shelf_id,),
        )
        shelf["cells"] = [
            {
                "slot_row": r["slot_row"],
                "slot_col": r["slot_col"],
                "bolt": {k: r[k] for k in ("id", "name", "part_number", "image_path", "back_number", "supplier_name")},
            }
            for r in cur.fetchall()
        ]
    return shelf
