import { useEffect, useState } from 'react'
import { fetchVehicleParts, type PartSummary, type Vehicle } from './api'

type Props = {
  vehicle: Vehicle
  selectedPartId: number | null
  onSelectPart: (partId: number) => void
}

// 取得した部位は、どの車両のものかを一緒に持つ(車両を切り替えた直後に、前の車両の部位が出ないようにするため)
type LoadedParts =
  | { vehicleId: number; status: 'ready'; parts: PartSummary[] }
  | { vehicleId: number; status: 'error'; message: string }

// 画像の高さの上限(100dvh から、ヘッダー・フッター・車名・選択中の部位の行・余白を引いた分)
const IMAGE_MAX_HEIGHT = 'calc(100dvh - 12.5rem)'

export function VehicleView({ vehicle, selectedPartId, onSelectPart }: Props) {
  const [loaded, setLoaded] = useState<LoadedParts | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchVehicleParts(vehicle.id, controller.signal)
      .then((parts) => setLoaded({ vehicleId: vehicle.id, status: 'ready', parts }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setLoaded({
          vehicleId: vehicle.id,
          status: 'error',
          message: error instanceof Error ? error.message : '部位の取得に失敗しました',
        })
      })
    return () => controller.abort()
  }, [vehicle.id])

  const current = loaded?.vehicleId === vehicle.id ? loaded : null
  const parts = current?.status === 'ready' ? current.parts : []

  return (
    <figure className="relative flex max-h-full min-h-0 w-full flex-col items-center py-4">
      {/* 部位の範囲は、画像に対する割合で持っているので、画像と同じ大きさの枠(3:2)の中に置く */}
      <div
        className="relative"
        style={{ aspectRatio: '3 / 2', width: `min(100%, calc(${IMAGE_MAX_HEIGHT} * 1.5))` }}
      >
        {/* 画像の背景が白一色なので、中央のエリアを白にして、画像の白い背景は multiply で溶け込ませる(円の装飾が、画像の四角で切れないように) */}
        <img
          src={vehicle.image_path}
          alt={vehicle.name}
          className="absolute inset-0 size-full object-contain mix-blend-multiply"
        />

        {/* 押せる場所は、最初から薄い枠で見える。色が変わるのは、マウスのある環境のホバーと、押している間だけ */}
        {parts.map((part) => (
          <button
            key={part.id}
            type="button"
            title={part.name}
            aria-label={part.name}
            aria-pressed={part.id === selectedPartId}
            onClick={() => onSelectPart(part.id)}
            className="absolute cursor-pointer rounded-lg border-2 border-accent-500/70 bg-accent-500/5 transition-colors hover:border-accent-600 hover:bg-accent-500/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 active:bg-accent-500/45 aria-pressed:border-accent-600 aria-pressed:bg-accent-500/35"
            style={{
              left: `${part.area.x * 100}%`,
              top: `${part.area.y * 100}%`,
              width: `${part.area.w * 100}%`,
              height: `${part.area.h * 100}%`,
            }}
          />
        ))}

        {current?.status === 'ready' && parts.length === 0 && (
          <p className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-mist-100 px-5 py-2 text-sm text-navy-800">
            この車種の部位は、準備中です
          </p>
        )}
        {current?.status === 'error' && (
          <p
            role="alert"
            className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-mist-100 px-5 py-2 text-sm text-navy-900"
          >
            {current.message}
          </p>
        )}
      </div>
      <figcaption className="pt-2 text-xl font-bold text-navy-900">{vehicle.name}</figcaption>
      {/* 部位のポップアップは、3 段階目で作る。それまでは、押せたことを確かめるための表示。
          押す前から 1 行分の場所を確保して、押したときに画面が動かないようにする */}
      <p className="h-5 text-sm leading-5 text-navy-700">
        選択中の部位: {parts.find((part) => part.id === selectedPartId)?.name ?? 'なし'}
      </p>
    </figure>
  )
}
