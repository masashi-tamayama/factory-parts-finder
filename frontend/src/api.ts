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
