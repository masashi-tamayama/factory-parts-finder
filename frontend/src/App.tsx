import { useEffect, useState } from 'react'
import { fetchVehicles, type Vehicle } from './api'

// 「今の画面の状態」は、ここに 1 か所にまとめる(あとで URL に持たせる形に切り替えやすくするため)
type ViewState = {
  vehicleId: number | null
}

type Vehicles =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: Vehicle[] }

function App() {
  const [vehicles, setVehicles] = useState<Vehicles>({ status: 'loading' })
  const [view, setView] = useState<ViewState>({ vehicleId: null })

  useEffect(() => {
    const controller = new AbortController()
    fetchVehicles(controller.signal)
      .then((items) => {
        setVehicles({ status: 'ready', items })
        // 最初は、先頭の車両を選んでおく
        setView((current) => ({ vehicleId: current.vehicleId ?? items[0]?.id ?? null }))
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setVehicles({
          status: 'error',
          message: error instanceof Error ? error.message : '車両の取得に失敗しました',
        })
      })
    return () => controller.abort()
  }, [])

  const items = vehicles.status === 'ready' ? vehicles.items : []
  const selected = items.find((vehicle) => vehicle.id === view.vehicleId)

  return (
    <div className="flex h-dvh flex-col bg-linear-to-br from-navy-950 via-navy-900 to-navy-700 text-white">
      <header className="flex h-16 shrink-0 items-center justify-between px-6">
        <h1 className="text-lg font-bold tracking-wide">部品検索</h1>
        <label className="flex items-center gap-3 text-sm">
          <span className="text-mist-200">車種</span>
          <select
            className="h-11 min-w-56 rounded-lg border border-white/30 bg-navy-800 px-3 text-base text-white disabled:opacity-50"
            value={view.vehicleId ?? ''}
            disabled={items.length === 0}
            onChange={(event) => setView({ vehicleId: Number(event.target.value) })}
          >
            {items.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-white px-6">
        {/* 薄い灰色の飾り(装飾なので、読み上げの対象外) */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 size-96 rounded-full bg-mist-100" />
          <div className="absolute -bottom-32 -left-20 size-112 rounded-full bg-mist-100" />
        </div>

        {vehicles.status === 'loading' && <p className="text-navy-800">読み込み中…</p>}
        {vehicles.status === 'error' && (
          <p role="alert" className="rounded-lg bg-mist-100 px-4 py-3 text-navy-900">
            {vehicles.message}
          </p>
        )}
        {selected && (
          <figure className="relative flex max-h-full min-h-0 flex-col items-center py-4">
            {/* 画像の背景が白一色なので、中央のエリアを白にして、画像の白い背景は multiply で溶け込ませる(円の装飾が、画像の四角で切れないように) */}
            <img
              src={selected.image_path}
              alt={selected.name}
              className="min-h-0 w-auto max-w-full flex-1 object-contain mix-blend-multiply"
              style={{ aspectRatio: '3 / 2', maxHeight: 'calc(100dvh - 11rem)' }}
            />
            <figcaption className="pt-2 text-xl font-bold text-navy-900">{selected.name}</figcaption>
          </figure>
        )}
      </main>

      <footer className="shrink-0 px-6 py-2 text-center text-xs text-mist-300">
        車両・部品・ボルトの画像とデータは、すべて架空のものです(画像は AI で生成)
      </footer>
    </div>
  )
}

export default App
