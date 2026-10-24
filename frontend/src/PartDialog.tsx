import { useEffect, useRef, useState } from 'react'
import { fetchVehiclePart, type Side, type VehiclePartDetail } from './api'
import { BoltPanel } from './BoltPanel'

type Props = {
  partId: number
  // null のときは、ボルトがある側を最初に出す(左F/D は裏、ホイールは表)
  side: Side | null
  mountId: number | null
  onSelectSide: (side: Side) => void
  onSelectMount: (mountId: number) => void
  onClose: () => void
}

// 取得した詳細は、どの部位のものかを一緒に持つ(部位を切り替えた直後に、前の部位が出ないようにするため)
type LoadedPart =
  | { partId: number; status: 'ready'; part: VehiclePartDetail }
  | { partId: number; status: 'error'; message: string }

const SIDE_LABELS: Record<Side, string> = { front: '表(外側)', back: '裏(内側)' }

// 画像の高さの上限(100dvh から、ポップアップの見出し・切り替え・ボルトの行・余白を引いた分)
const IMAGE_MAX_HEIGHT = 'calc(100dvh - 15rem)'

// 画像の幅の上限を決めるための、横方向の余白の合計: 画面の端の余白(2rem × 2)+ パネルの内側の余白(1.5rem × 2)+ 画像と詳細パネルの間(1.5rem)+ 詳細パネル(18rem)
const CHROME_WIDTH = '4rem - 3rem - 1.5rem - 18rem'

function defaultSide(part: VehiclePartDetail): Side {
  return part.mounts.some((mount) => mount.side === 'front') ? 'front' : 'back'
}

export function PartDialog({ partId, side, mountId, onSelectSide, onSelectMount, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [loaded, setLoaded] = useState<LoadedPart | null>(null)

  // <dialog> は、showModal() で開くと、背景を暗くし、Esc で閉じ、フォーカスを中に閉じ込めてくれる
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchVehiclePart(partId, controller.signal)
      .then((part) => setLoaded({ partId, status: 'ready', part }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setLoaded({
          partId,
          status: 'error',
          message: error instanceof Error ? error.message : '部位の詳細の取得に失敗しました',
        })
      })
    return () => controller.abort()
  }, [partId])

  const current = loaded?.partId === partId ? loaded : null
  const part = current?.status === 'ready' ? current.part : null
  const activeSide = side ?? (part ? defaultSide(part) : 'front')
  const imagePath = part ? (activeSide === 'front' ? part.front_image_path : part.back_image_path) : null
  const mounts = part ? part.mounts.filter((mount) => mount.side === activeSide) : []
  const selectedMount = mounts.find((mount) => mount.id === mountId)

  // ボルトがない面だけ、画像の下に 1 行の案内を出す(行の場所は、最初から確保する)
  const noBolts = part !== null && mounts.length === 0

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="part-dialog-title"
      onClose={onClose}
      // 暗い背景(::backdrop)を押したときも閉じる
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className="m-auto max-h-none max-w-none overflow-visible bg-transparent p-0 backdrop:bg-navy-950/70"
    >
      <div className="relative rounded-2xl bg-white p-6 text-navy-900 shadow-2xl">
        {/* 閉じるボタンは、パネルの右上の角に重ねる */}
        <button
          type="button"
          aria-label="閉じる"
          onClick={onClose}
          className="absolute -top-4 -right-4 flex size-12 cursor-pointer items-center justify-center rounded-full border border-mist-300 bg-white text-2xl leading-none text-navy-800 shadow-md hover:bg-mist-100 active:bg-mist-200"
        >
          ✕
        </button>

        <div className="flex gap-6">
          <div
            className="flex flex-col gap-3"
            style={{ width: `min(calc(${IMAGE_MAX_HEIGHT} * 1.5), calc(100vw - ${CHROME_WIDTH}))` }}
          >
            <h2 id="part-dialog-title" className="h-8 text-2xl leading-8 font-bold">
              {part?.name ?? ''}
            </h2>

            {/* 表 / 裏の切り替え(選択中 = 紺で塗る、非選択 = 白に紺の枠) */}
            <div role="group" aria-label="表裏の切り替え" className="flex overflow-hidden rounded-lg border border-navy-800">
              {(['front', 'back'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={value === activeSide}
                  disabled={!part}
                  onClick={() => onSelectSide(value)}
                  className="h-11 flex-1 cursor-pointer bg-white text-base font-bold text-navy-800 hover:bg-mist-100 active:bg-mist-200 aria-pressed:bg-navy-800 aria-pressed:text-white"
                >
                  {SIDE_LABELS[value]}
                </button>
              ))}
            </div>

            <div className="relative w-full" style={{ aspectRatio: '3 / 2' }}>
              {imagePath && (
                <img src={imagePath} alt={`${part?.name}(${SIDE_LABELS[activeSide]})`} className="absolute inset-0 size-full object-contain" />
              )}
              {!part && (
                <p
                  role={current?.status === 'error' ? 'alert' : undefined}
                  className="absolute inset-0 flex items-center justify-center text-navy-800"
                >
                  {current?.status === 'error' ? current.message : '読み込み中…'}
                </p>
              )}
              {/* ボルトの印。位置は、画像に対する割合(ボルトの頭の中心)。押す前は透明で、ボルトの絵をそのまま見せる。色が出るのは、ホバー(マウスのある環境)・押している間・選択中だけ */}
              {mounts.map((mount) => (
                <button
                  key={mount.id}
                  type="button"
                  title={mount.bolt.name}
                  aria-label={mount.bolt.name}
                  aria-pressed={mount.id === mountId}
                  onClick={() => onSelectMount(mount.id)}
                  className="absolute size-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full transition-colors hover:bg-accent-500/40 hover:ring-2 hover:ring-accent-600 focus-visible:ring-2 focus-visible:ring-accent-600 active:bg-accent-500/60 aria-pressed:bg-accent-500/50 aria-pressed:ring-2 aria-pressed:ring-accent-600"
                  style={{ left: `${mount.x * 100}%`, top: `${mount.y * 100}%` }}
                />
              ))}
            </div>

            <p className="h-5 text-sm leading-5 text-navy-700">{noBolts ? 'この面には、ボルトがありません' : ''}</p>
          </div>

          <BoltPanel boltId={selectedMount?.bolt.id ?? null} />
        </div>
      </div>
    </dialog>
  )
}
