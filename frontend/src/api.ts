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
export type Area = {
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

export type BoltSummary = {
  id: number
  name: string
  image_path: string
}

// 部位の画像の上の、ボルトの取り付け位置(ボルトの頭の中心。画像に対する 0〜1 の割合)
export type Mount = {
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
export type ShelfPlacement = {
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

export type BoltDetail = {
  id: number
  part_number: string
  name: string
  spec: string | null
  image_path: string
  supplier_name: string
  back_number: string
  shelves: ShelfPlacement[]
}

export async function fetchBolt(boltId: number, signal: AbortSignal): Promise<BoltDetail> {
  const response = await fetch(`/api/bolts/${boltId}`, { signal })
  if (!response.ok) {
    throw new Error(`ボルトの詳細の取得に失敗しました(${response.status})`)
  }
  return response.json()
}
