import { useEffect, useState } from 'react'
import { fetchVehicles, type Side, type Vehicle } from './api'
import { GuideHint } from './Guide'
import { GUIDE_LAST_STEP, hasSeenGuide, markGuideSeen } from './guideData'
import { IntroDialog } from './IntroDialog'
import { MapDialog } from './MapDialog'
import { PartDialog } from './PartDialog'
import { VehicleView } from './VehicleView'

// 「今の画面の状態」は、ここに 1 か所にまとめる(あとで URL に持たせる形に切り替えやすくするため)
type ViewState = {
  vehicleId: number | null
  partId: number | null // null = 部位のポップアップは閉じている
  side: Side | null // null = ボルトがある側を、最初に出す
  mountId: number | null
  map: { boltId: number; shelfId: number } | null // null = 工場マップは閉じている(開くと、ボルトのポップアップの上に重なる)
  intro: boolean // 最初に出す案内を開いているか
  guide: number | null // 操作ガイドの今の手順(1〜6)。null = ガイドは出していない(ヘッダーの「使い方」で、もう一度始められる)
}

type Vehicles =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: Vehicle[] }

function App() {
  const [vehicles, setVehicles] = useState<Vehicles>({ status: 'loading' })
  const [view, setView] = useState<ViewState>({
    vehicleId: null,
    partId: null,
    side: null,
    mountId: null,
    map: null,
    intro: true, // 最初に開いたときは、案内を出す
    guide: null,
  })
  // 操作ガイドを見せるのは、初回だけ(あとからは、ヘッダーの「使い方」で見られる)
  const [firstVisit] = useState(() => !hasSeenGuide())

  useEffect(() => {
    const controller = new AbortController()
    fetchVehicles(controller.signal)
      .then((items) => {
        setVehicles({ status: 'ready', items })
        // 最初は、先頭の車両を選んでおく
        setView((current) => ({ ...current, vehicleId: current.vehicleId ?? items[0]?.id ?? null }))
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

  const startGuide = () => {
    markGuideSeen()
    setView((current) => ({
      ...current,
      intro: false,
      partId: null,
      side: null,
      mountId: null,
      map: null,
      guide: 1,
    }))
  }
  const skipGuide = () => setView((current) => ({ ...current, guide: null }))
  // 次の手順へ。最後の手順(6)の次は、ガイドを終える
  const nextGuide = () =>
    setView((current) => ({
      ...current,
      guide: current.guide === null || current.guide >= GUIDE_LAST_STEP ? null : current.guide + 1,
    }))

  const items = vehicles.status === 'ready' ? vehicles.items : []
  const selected = items.find((vehicle) => vehicle.id === view.vehicleId)

  return (
    <div className="flex h-dvh flex-col bg-linear-to-br from-navy-950 via-navy-900 to-navy-700 text-white">
      <header className="flex h-16 shrink-0 items-center justify-between px-6">
        <h1 className="text-lg font-bold tracking-wide">部品検索</h1>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={startGuide}
            className="h-11 cursor-pointer rounded-lg border border-white/30 px-4 text-sm font-bold hover:bg-white/10 active:bg-white/20"
          >
            使い方
          </button>
          <label className="relative flex items-center gap-3 text-sm">
            <span className="text-mist-200">車種</span>
            <select
              className="h-11 min-w-56 rounded-lg border border-white/30 bg-navy-800 px-3 text-base text-white disabled:opacity-50"
              value={view.vehicleId ?? ''}
              disabled={items.length === 0}
              onChange={(event) =>
                setView((current) => ({
                  vehicleId: Number(event.target.value),
                  partId: null,
                  side: null,
                  mountId: null,
                  map: null,
                  intro: false,
                  guide: current.guide === 1 ? 2 : current.guide, // 車種を選んだら、次の手順へ
                }))
              }
            >
              {items.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </select>
            {view.guide === 1 && <GuideHint step={1} align="end" nextLabel="次へ" onNext={nextGuide} onSkip={skipGuide} />}
          </label>
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-white px-6">
        {/* 薄い灰色の飾り(装飾なので、読み上げの対象外) */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-24 size-96 rounded-full bg-mist-100" />
          <div className="absolute -bottom-32 -left-20 size-112 rounded-full bg-mist-100" />
        </div>

        {/* 操作ガイド 2 の吹き出しは、車両の画像の枠ではなく、この白い領域の左上に置く(広い画面でも、左端に寄って、車に被らない) */}
        {view.guide === 2 && <GuideHint step={2} parts="bubble" side="inside" onSkip={skipGuide} />}

        {vehicles.status === 'loading' && <p className="text-navy-800">読み込み中…</p>}
        {vehicles.status === 'error' && (
          <p role="alert" className="rounded-lg bg-mist-100 px-4 py-3 text-navy-900">
            {vehicles.message}
          </p>
        )}
        {selected && (
          <VehicleView
            vehicle={selected}
            highlight={view.guide === 2}
            onSelectPart={(partId) =>
              setView((current) => ({
                ...current,
                partId,
                side: null,
                mountId: null,
                guide: current.guide === 2 ? 3 : current.guide, // 部位を押したら、次の手順へ
              }))
            }
          />
        )}
      </main>

      {view.partId !== null && (
        <PartDialog
          key={view.partId}
          partId={view.partId}
          side={view.side}
          mountId={view.mountId}
          // 表裏を切り替えると、選んでいたボルトが外れるので、ガイドは「ボルトを選ぶ」(3)に戻す
          onSelectSide={(side) =>
            setView((current) => ({
              ...current,
              side,
              mountId: null,
              guide: current.guide === 4 || current.guide === 5 ? 3 : current.guide,
            }))
          }
          onSelectMount={(mountId) =>
            setView((current) => ({ ...current, mountId, guide: current.guide === 3 ? 4 : current.guide }))
          }
          onOpenMap={(boltId, shelfId) =>
            setView((current) => ({
              ...current,
              map: { boltId, shelfId },
              guide: current.guide === 5 ? 6 : current.guide, // 「マップ」を押したら、次の手順へ
            }))
          }
          onClose={() =>
            setView((current) => ({
              ...current,
              partId: null,
              side: null,
              mountId: null,
              map: null,
              // 部位のポップアップを閉じたら、ガイドは「部位を選ぶ」(2)に戻す
              guide: current.guide !== null && current.guide >= 3 ? 2 : current.guide,
            }))
          }
          guide={view.guide}
          onGuideNext={nextGuide}
          onGuideSkip={skipGuide}
        />
      )}

      {/* 工場マップは、ボルトのポップアップの上に重ねる。閉じると、ボルトのポップアップに戻る */}
      {view.map && (
        <MapDialog
          key={view.map.boltId}
          boltId={view.map.boltId}
          shelfId={view.map.shelfId}
          onSelectShelf={(shelfId) =>
            setView((current) =>
              current.map
                ? { ...current, map: { ...current.map, shelfId }, guide: current.guide === 6 ? null : current.guide } // 棚の印を押したら、ガイドは終わり
                : current,
            )
          }
          // マップを閉じたら、ガイドは「マップを押す」(5)に戻す
          onClose={() => setView((current) => ({ ...current, map: null, guide: current.guide === 6 ? 5 : current.guide }))}
          guide={view.guide}
          onGuideDone={nextGuide}
          onGuideSkip={skipGuide}
        />
      )}

      <footer className="flex h-10 shrink-0 items-center justify-center px-6 text-xs text-mist-300">
        車両・部品・ボルトの画像とデータは、すべて架空のものです(画像は AI で生成)
      </footer>

      {view.intro && (
        <IntroDialog
          willGuide={firstVisit}
          // 閉じ方によらず、初回はガイドを始める。2 回目以降は、案内を閉じるだけ
          onStart={() => (firstVisit ? startGuide() : setView((current) => ({ ...current, intro: false })))}
        />
      )}
    </div>
  )
}

export default App
