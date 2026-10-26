// API(backend/main.py)の返す形。DB の列名と同じではなく、API のモデルに合わせている
export type Vehicle = {
  id: number
  name: string
  image_path: string
}

export async function fetchVehicles(signal: AbortSignal): Promise<Vehicle[]> {
  const response = await fetch('/api/vehicles', { signal })
  if (!response.ok) {
    throw new Error(`車両の取得に失敗しました(${response.status})`)
  }
  return response.json()
}

// 車両の画像の上の、押せる範囲(左上の角と幅・高さ。画像に対する 0〜1 の割合)
type Area = {
  x: number
  y: number
  w: number
  h: number
}

export type PartSummary = {
  id: number
  name: string
  area: Area
}

export async function fetchVehicleParts(
  vehicleId: number,
  signal: AbortSignal,
): Promise<PartSummary[]> {
  const response = await fetch(`/api/vehicles/${vehicleId}/parts`, { signal })
  if (!response.ok) {
    throw new Error(`部位の取得に失敗しました(${response.status})`)
  }
  const body: { parts: PartSummary[] } = await response.json()
  return body.parts
}

// 部位の画像は、表(外側)と裏(内側)の 2 枚
export type Side = 'front' | 'back'

type BoltSummary = {
  id: number
  name: string
  image_path: string
}

// 部位の画像の上の、ボルトの取り付け位置(ボルトの頭の中心。画像に対する 0〜1 の割合)
type Mount = {
  id: number
  side: Side
  x: number
  y: number
  bolt: BoltSummary
}

export type VehiclePartDetail = {
  id: number
  name: string
  vehicle_id: number
  front_image_path: string
  back_image_path: string
  mounts: Mount[]
}

export async function fetchVehiclePart(
  partId: number,
  signal: AbortSignal,
): Promise<VehiclePartDetail> {
  const response = await fetch(`/api/vehicle-parts/${partId}`, { signal })
  if (!response.ok) {
    throw new Error(`部位の詳細の取得に失敗しました(${response.status})`)
  }
  return response.json()
}

// ボルトが置かれている部品棚と、棚の中のマス(段・列)。map_x、map_y は、工場マップの画像の上の位置(割合)
type ShelfPlacement = {
  parts_shelf_id: number
  zone_name: string
  address_code: string
  shelf_no: string
  map_x: number
  map_y: number
  shelf_rows: number
  shelf_cols: number
  slot_row: number
  slot_col: number
}

// 見た目や置き場所が似ていて、間違えやすいボルト(違いの説明つき)
type SimilarBolt = {
  id: number
  part_number: string
  name: string
  image_path: string
  supplier_name: string
  back_number: string
  difference_note: string | null
  shelves: ShelfPlacement[]
}

export type BoltDetail = {
  id: number
  part_number: string
  name: string
  spec: string | null
  image_path: string
  supplier_name: string
  back_number: string
  shelves: ShelfPlacement[]
  similar_bolts: SimilarBolt[]
}

export async function fetchBolt(boltId: number, signal: AbortSignal): Promise<BoltDetail> {
  const response = await fetch(`/api/bolts/${boltId}`, { signal })
  if (!response.ok) {
    throw new Error(`ボルトの詳細の取得に失敗しました(${response.status})`)
  }
  return response.json()
}

// 部品棚の絵(段 × 列の格子)を描くための情報。埋まっているマスだけが入っている(空のマスは、画面側で描く)
type ShelfCell = {
  slot_row: number
  slot_col: number
  bolt: {
    id: number
    name: string
    part_number: string
    image_path: string
    supplier_name: string
    back_number: string
  }
}

export type ShelfDetail = {
  id: number
  zone_name: string
  address_code: string
  shelf_no: string
  shelf_rows: number
  shelf_cols: number
  map_x: number
  map_y: number
  cells: ShelfCell[]
}

export async function fetchShelf(shelfId: number, signal: AbortSignal): Promise<ShelfDetail> {
  const response = await fetch(`/api/parts-shelves/${shelfId}`, { signal })
  if (!response.ok) {
    throw new Error(`部品棚の取得に失敗しました(${response.status})`)
  }
  return response.json()
}
