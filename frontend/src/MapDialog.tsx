import { useEffect, useState } from 'react'
import { fetchBolt, fetchShelf, type BoltDetail, type ShelfDetail } from './api'
import { Modal } from './Modal'

type Props = {
  boltId: number
  shelfId: number
  onSelectShelf: (shelfId: number) => void
  onClose: () => void
}

// 取得した情報は、どのボルト・棚のものかを一緒に持つ(切り替えた直後に、前のものが出ないようにするため)
type LoadedBolt =
  | { boltId: number; status: 'ready'; bolt: BoltDetail }
  | { boltId: number; status: 'error'; message: string }
type LoadedShelf =
  | { shelfId: number; status: 'ready'; shelf: ShelfDetail }
  | { shelfId: number; status: 'error'; message: string }

// 工場マップの画像の大きさ(座標の割合は、この画像に対して計算してある。画像を書き出し直したら、座標も計算し直す)
const MAP_WIDTH = 2130
const MAP_HEIGHT = 2026

// 画像の高さの上限(100dvh から、見出し・余白を引いた分)
const MAP_MAX_HEIGHT = 'calc(100dvh - 11rem)'

// 画像の幅の上限を決めるための、横方向の余白の合計: 画面の端の余白(2rem × 2)+ パネルの内側の余白(1.5rem × 2)+ 地図と棚のパネルの間(1.5rem)+ 棚のパネル(22rem)
const CHROME_WIDTH = '4rem - 3rem - 1.5rem - 22rem'

export function MapDialog({ boltId, shelfId, onSelectShelf, onClose }: Props) {
  const [loadedBolt, setLoadedBolt] = useState<LoadedBolt | null>(null)
  const [loadedShelf, setLoadedShelf] = useState<LoadedShelf | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchBolt(boltId, controller.signal)
      .then((bolt) => setLoadedBolt({ boltId, status: 'ready', bolt }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setLoadedBolt({
          boltId,
          status: 'error',
          message: error instanceof Error ? error.message : 'ボルトの取得に失敗しました',
        })
      })
    return () => controller.abort()
  }, [boltId])

  useEffect(() => {
    const controller = new AbortController()
    fetchShelf(shelfId, controller.signal)
      .then((shelf) => setLoadedShelf({ shelfId, status: 'ready', shelf }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setLoadedShelf({
          shelfId,
          status: 'error',
          message: error instanceof Error ? error.message : '部品棚の取得に失敗しました',
        })
      })
    return () => controller.abort()
  }, [shelfId])

  const currentBolt = loadedBolt?.boltId === boltId ? loadedBolt : null
  const bolt = currentBolt?.status === 'ready' ? currentBolt.bolt : null
  const currentShelf = loadedShelf?.shelfId === shelfId ? loadedShelf : null
  const shelf = currentShelf?.status === 'ready' ? currentShelf.shelf : null
  // 探しているボルトの、この棚の中の位置(段・列)
  const placement = bolt?.shelves.find((item) => item.parts_shelf_id === shelfId)

  return (
    <Modal titleId="map-dialog-title" closeLabel="マップを閉じる" onClose={onClose}>
      <div className="flex gap-6">
        <div
          className="flex flex-col gap-3"
          style={{
            width: `min(calc(${MAP_MAX_HEIGHT} * ${MAP_WIDTH} / ${MAP_HEIGHT}), calc(100vw - ${CHROME_WIDTH}))`,
          }}
        >
          <h2 id="map-dialog-title" className="flex h-8 items-baseline gap-3 text-2xl leading-8 font-bold">
            <span className="shrink-0">工場マップ</span>
            {/* ボルトの名前が長くても、折り返さず 1 行に収める(下のマップに重ならないように) */}
            <span className="min-w-0 truncate text-base font-normal text-navy-700">
              {bolt ? `探しているボルト: ${bolt.name}` : ''}
            </span>
          </h2>

          <div className="relative w-full" style={{ aspectRatio: `${MAP_WIDTH} / ${MAP_HEIGHT}` }}>
            <img
              src="/images/map/factory_map.png"
              alt="工場全体のマップ"
              className="absolute inset-0 size-full rounded-lg border border-mist-200 object-contain"
            />
            {currentBolt?.status === 'error' && (
              <p role="alert" className="absolute top-3 left-3 rounded bg-mist-100 px-3 py-1 text-sm">
                {currentBolt.message}
              </p>
            )}
            {/* 探しているボルトが置かれている棚の印。下の棚のマスが見えるように、半透明にする。選択中の棚は、赤の外枠 */}
            {bolt?.shelves.map((item) => {
              const selected = item.parts_shelf_id === shelfId
              return (
                <button
                  key={item.parts_shelf_id}
                  type="button"
                  title={`${item.zone_name} ${item.address_code}-${item.shelf_no}`}
                  aria-label={`${item.zone_name} 所番地 ${item.address_code} 棚 ${item.shelf_no}`}
                  aria-pressed={selected}
                  onClick={() => onSelectShelf(item.parts_shelf_id)}
                  className="absolute size-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-accent-500/30 ring-2 ring-white transition-colors hover:bg-accent-500/60 active:bg-accent-500/60 aria-pressed:ring-[3px] aria-pressed:ring-red-600"
                  style={{ left: `${item.map_x * 100}%`, top: `${item.map_y * 100}%` }}
                />
              )
            })}
          </div>
        </div>

        {/* 部品棚のパネル。高さは、左のマップの列に合わせる(中身の長さで、ポップアップが画面からはみ出さないように) */}
        <aside aria-label="部品棚" className="relative w-88 shrink-0 rounded-xl bg-mist-50">
          <div className="absolute inset-0 overflow-y-auto p-4">
            {!currentShelf && <p className="pt-2 text-sm text-navy-700">読み込み中…</p>}
            {currentShelf?.status === 'error' && (
              <p role="alert" className="pt-2 text-sm">
                {currentShelf.message}
              </p>
            )}
            {shelf && (
              <div className="flex flex-col gap-3">
                <div>
                  <h3 className="text-lg leading-snug font-bold">
                    {shelf.zone_name} {shelf.address_code}-{shelf.shelf_no}
                  </h3>
                  <p className="text-xs text-navy-700">
                    所番地 {shelf.address_code}・棚 {shelf.shelf_no}({shelf.shelf_rows}段 × {shelf.shelf_cols}列)
                  </p>
                </div>

                {/* 棚の絵。1 段目を上にして、段 × 列の格子で描く。埋まっていないマスは、点線の空き */}
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${shelf.shelf_cols}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: shelf.shelf_rows * shelf.shelf_cols }, (_, index) => {
                    const row = Math.floor(index / shelf.shelf_cols) + 1
                    const col = (index % shelf.shelf_cols) + 1
                    const cell = shelf.cells.find((item) => item.slot_row === row && item.slot_col === col)
                    if (!cell) {
                      return (
                        <div
                          key={index}
                          aria-label={`${row}段 ${col}列(空き)`}
                          className="aspect-square rounded-lg border border-dashed border-mist-300"
                        />
                      )
                    }
                    const target = cell.bolt.id === boltId
                    return (
                      <div
                        key={index}
                        title={`${cell.bolt.name}(${cell.bolt.supplier_name}・背番号 ${cell.bolt.back_number})`}
                        className={
                          target
                            ? 'flex aspect-square flex-col items-center gap-1 rounded-lg border-2 border-accent-600 bg-white p-1 ring-2 ring-accent-500/40'
                            : 'flex aspect-square flex-col items-center gap-1 rounded-lg border border-mist-200 bg-white p-1'
                        }
                      >
                        <img src={cell.bolt.image_path} alt="" className="min-h-0 w-full flex-1 object-contain" />
                        <span className="line-clamp-2 text-center text-[11px] leading-tight">{cell.bolt.name}</span>
                      </div>
                    )
                  })}
                </div>

                <p className="text-sm">
                  <span className="mr-2 inline-block size-3 rounded-sm border-2 border-accent-600 align-middle" />
                  {placement ? `探しているボルト: ${placement.slot_row}段 ${placement.slot_col}列` : '探しているボルトの枠'}
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </Modal>
  )
}
