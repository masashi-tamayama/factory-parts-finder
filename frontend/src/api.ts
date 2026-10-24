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
