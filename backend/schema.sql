-- テーブル定義(部品検索アプリ)
-- ローカル: psql -d factory_parts_dev -f backend/schema.sql
-- 空の DB に 1 回だけ流す想定(再実行する場合は、先にテーブルを削除する)

-- 車両
CREATE TABLE vehicle (
    id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        text NOT NULL,
    image_path  text NOT NULL
);

-- 部位(Fr バンパーなど)。表と裏の画像を持つ(表 = 外側、裏 = 内側)
-- area_x, area_y, area_w, area_h: 車両の画像の上の、押せる範囲(左上の角と、幅・高さ。0〜1 の割合)
CREATE TABLE vehicle_part (
    id                integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    vehicle_id        integer NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
    name              text NOT NULL,
    front_image_path  text NOT NULL,
    back_image_path   text NOT NULL,
    area_x            numeric(5, 4) NOT NULL,
    area_y            numeric(5, 4) NOT NULL,
    area_w            numeric(5, 4) NOT NULL,
    area_h            numeric(5, 4) NOT NULL,
    CONSTRAINT vehicle_part_area_check CHECK (
        area_x >= 0 AND area_y >= 0 AND area_w > 0 AND area_h > 0
        AND area_x + area_w <= 1 AND area_y + area_h <= 1
    )
);

-- 工区(名前は重複しない)
CREATE TABLE zone (
    id    integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  text NOT NULL UNIQUE
);

-- 所番地(工場全体で重複しない 2 桁。どの工区に属するか)
CREATE TABLE address (
    id       integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    zone_id  integer NOT NULL REFERENCES zone(id),
    code     text NOT NULL UNIQUE CHECK (code ~ '^[0-9]{2}$')
);

-- 部品棚(1 つの棚)。棚番号は、所番地の中でだけ一意
-- map_x, map_y: 工場マップ画像上の棚の中心(0〜1 の割合)
-- shelf_rows, shelf_cols: 棚の段数・列数(棚の絵の格子)
CREATE TABLE parts_shelf (
    id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    address_id  integer NOT NULL REFERENCES address(id),
    shelf_no    text NOT NULL CHECK (shelf_no ~ '^[0-9]{3}$'),
    map_x       numeric(5, 4) NOT NULL CHECK (map_x BETWEEN 0 AND 1),
    map_y       numeric(5, 4) NOT NULL CHECK (map_y BETWEEN 0 AND 1),
    shelf_rows  integer NOT NULL CHECK (shelf_rows >= 1),
    shelf_cols  integer NOT NULL CHECK (shelf_cols >= 1),
    UNIQUE (address_id, shelf_no)
);

-- メーカー(名前は重複しない)
CREATE TABLE supplier (
    id    integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  text NOT NULL UNIQUE
);

-- ボルト。部品番号は 1 つに 1 つ。背番号は、メーカーの中でだけ一意
CREATE TABLE bolt (
    id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    part_number  text NOT NULL UNIQUE
                 CHECK (part_number ~ '^[0-9]{4}-[0-9]{4}-[0-9]{4}$'),
    supplier_id  integer NOT NULL REFERENCES supplier(id),
    back_number  text NOT NULL CHECK (back_number ~ '^[0-9]{3}$'),
    name         text NOT NULL,
    spec         text,
    image_path   text NOT NULL,
    UNIQUE (supplier_id, back_number)
);

-- 取り付け位置(部位の画像のどこに、どのボルトがあるか。x, y は 0〜1 の割合)
CREATE TABLE bolt_mount (
    id               integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    vehicle_part_id  integer NOT NULL REFERENCES vehicle_part(id) ON DELETE CASCADE,
    side             text NOT NULL CHECK (side IN ('front', 'back')),
    x                numeric(5, 4) NOT NULL CHECK (x BETWEEN 0 AND 1),
    y                numeric(5, 4) NOT NULL CHECK (y BETWEEN 0 AND 1),
    bolt_id          integer NOT NULL REFERENCES bolt(id)
);

-- ボルトの配置(ボルトと部品棚の多対多。部品棚の中の段・列。1 マスには 1 種類)
-- slot_row, slot_col が棚の段数・列数に収まるかは、テーブルでは守れない(登録する側で確認する)
CREATE TABLE bolt_shelf (
    bolt_id         integer NOT NULL REFERENCES bolt(id) ON DELETE CASCADE,
    parts_shelf_id  integer NOT NULL REFERENCES parts_shelf(id) ON DELETE CASCADE,
    slot_row        integer NOT NULL CHECK (slot_row >= 1),
    slot_col        integer NOT NULL CHECK (slot_col >= 1),
    PRIMARY KEY (bolt_id, parts_shelf_id),
    UNIQUE (parts_shelf_id, slot_row, slot_col)
);

-- 類似ボルト(1 組を 1 行だけ。小さい id を bolt_id 側にする。検索は両方向)
-- difference_note: 2 つの違いの説明(備考欄。例: 「色が違う(銀色と金色)」)。空でもよい
CREATE TABLE similar_bolt (
    bolt_id          integer NOT NULL REFERENCES bolt(id) ON DELETE CASCADE,
    similar_bolt_id  integer NOT NULL REFERENCES bolt(id) ON DELETE CASCADE,
    difference_note  text,
    PRIMARY KEY (bolt_id, similar_bolt_id),
    CHECK (bolt_id < similar_bolt_id)
);
