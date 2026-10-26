import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { fetchBolt, type BoltDetail } from './api'
import { GuideHint } from './Guide'

type Props = {
  boltId: number | null
  // 部品棚の場所の行を押したときに、その棚を選んだ状態で、工場マップを開く
  onOpenMap: (boltId: number, shelfId: number) => void
  // 操作ガイドの今の手順。4 = パネル全体に枠、5 = 部品棚の表の最初の行の「マップ」に枠(吹き出しは、呼び出し側が別の場所に出す)
  guide?: number | null
  onGuideSkip?: () => void
}

// 取得した詳細は、どのボルトのものかを一緒に持つ(ボルトを切り替えた直後に、前のボルトが出ないようにするため)
type LoadedBolt =
  | { boltId: number; status: 'ready'; bolt: BoltDetail }
  | { boltId: number; status: 'error'; message: string }

export function BoltPanel({ boltId, onOpenMap, guide, onGuideSkip }: Props) {
  const [loaded, setLoaded] = useState<LoadedBolt | null>(null)

  // 操作ガイド 5 の枠を、部品棚の表の「行すべて」(tbody)の上に重ねる。表の行(tbody)は、位置の基準にしにくいので、
  // 表を包む枠(wrap)との位置の差を測って、枠(frame)の位置と大きさを直接書き込む(再描画のたびに測り直す)
  const wrapRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLTableSectionElement>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const place = () => {
      const wrap = wrapRef.current
      const body = bodyRef.current
      const frame = frameRef.current
      if (!wrap || !body || !frame) return
      const wrapBox = wrap.getBoundingClientRect()
      const bodyBox = body.getBoundingClientRect()
      frame.style.left = `${bodyBox.left - wrapBox.left}px`
      frame.style.top = `${bodyBox.top - wrapBox.top}px`
      frame.style.width = `${bodyBox.width}px`
      frame.style.height = `${bodyBox.height}px`
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  })

  useEffect(() => {
    if (boltId === null) return
    const controller = new AbortController()
    fetchBolt(boltId, controller.signal)
      .then((bolt) => setLoaded({ boltId, status: 'ready', bolt }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setLoaded({
          boltId,
          status: 'error',
          message: error instanceof Error ? error.message : 'ボルトの詳細の取得に失敗しました',
        })
      })
    return () => controller.abort()
  }, [boltId])

  const current = boltId !== null && loaded?.boltId === boltId ? loaded : null
  const bolt = current?.status === 'ready' ? current.bolt : null

  return (
    // 高さは、左の画像の列に合わせる(パネルの中身の長さで、ポップアップが画面からはみ出さないように)。
    // 中身が収まらない小さい画面だけ、パネルの中でスクロールする
    <aside aria-label="ボルトの詳細" className="relative w-80 shrink-0 rounded-xl bg-mist-50 text-navy-900">
      {guide === 4 && onGuideSkip && <GuideHint step={4} parts="mark" onSkip={onGuideSkip} />}
      <div className="absolute inset-0 overflow-y-auto p-4">
        {boltId === null && (
          <p className="pt-2 text-sm leading-relaxed text-navy-700">
            左の画像のボルトを押すと、ここに詳細が出ます。
          </p>
        )}
        {boltId !== null && !current && <p className="pt-2 text-sm text-navy-700">読み込み中…</p>}
        {current?.status === 'error' && (
          <p role="alert" className="pt-2 text-sm">
            {current.message}
          </p>
        )}
        {bolt && (
          <div className="flex flex-col gap-3">
            {/* ボルトの画像は、横長と縦長がある。同じ大きさの枠に収めて、名前の横に置く */}
            <div className="flex gap-3">
              <div className="relative size-24 shrink-0 rounded-lg border border-mist-200 bg-white">
                <img src={bolt.image_path} alt={bolt.name} className="absolute inset-0 size-full object-contain" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base leading-snug font-bold">{bolt.name}</h3>
                <p className="mt-1 text-xs text-navy-700">{bolt.spec}</p>
              </div>
            </div>

            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-navy-700">部品番号</dt>
              <dd className="font-mono">{bolt.part_number}</dd>
              <dt className="text-navy-700">メーカー</dt>
              <dd>
                {bolt.supplier_name}(背番号 {bolt.back_number})
              </dd>
            </dl>

            {/* 部品棚の場所の表。行を押すと、その棚を選んだ状態で、工場マップが開く(行全体が押せる。キーボード用に、最後の列に本物のボタンも置く) */}
            <div ref={wrapRef} className="relative">
              <table className="w-full text-left text-sm">
                <caption className="pb-1 text-left text-sm font-bold">部品棚の場所</caption>
                <thead className="text-xs text-navy-700">
                  <tr>
                    <th scope="col" className="py-1 font-normal">工区</th>
                    <th scope="col" className="py-1 font-normal">所番地</th>
                    <th scope="col" className="py-1 font-normal">棚</th>
                    <th scope="col" className="py-1 font-normal">段・列</th>
                    <th scope="col" className="py-1 font-normal"><span className="sr-only">工場マップ</span></th>
                  </tr>
                </thead>
                <tbody ref={bodyRef}>
                  {bolt.shelves.map((shelf) => (
                    <tr
                      key={`${shelf.parts_shelf_id}-${shelf.slot_row}-${shelf.slot_col}`}
                      onClick={() => onOpenMap(bolt.id, shelf.parts_shelf_id)}
                      className="cursor-pointer border-t border-mist-200 hover:bg-mist-100 active:bg-mist-200"
                    >
                      <td className="py-2">{shelf.zone_name}</td>
                      <td className="py-2">{shelf.address_code}</td>
                      <td className="py-2">{shelf.shelf_no}</td>
                      <td className="py-2">
                        {shelf.slot_row}段 {shelf.slot_col}列
                      </td>
                      <td className="py-1 text-right">
                        <button
                          type="button"
                          aria-label={`${shelf.zone_name} ${shelf.address_code}-${shelf.shelf_no} を工場マップで見る`}
                          className="h-9 cursor-pointer rounded-md px-2 text-xs font-bold whitespace-nowrap text-navy-800"
                        >
                          マップ ›
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* 操作ガイド 5: 部品棚の行すべてを枠で囲み、そのすぐ下に吹き出しを出す(下の表に被ってもよい)。枠の箱は、行を押せるように、クリックを通す(吹き出しだけが押せる) */}
              {guide === 5 && onGuideSkip && (
                <div ref={frameRef} className="pointer-events-none absolute">
                  <GuideHint step={5} onSkip={onGuideSkip} />
                </div>
              )}
            </div>

            {/* 類似ボルト。「これだけ似たものがある」と見せるための表なので、押せない(間違えて、似たボルトの詳細を開かないため) */}
            <table className="w-full text-left text-sm">
              <caption className="pb-1 text-left text-sm font-bold">類似ボルト</caption>
              <thead className="text-xs text-navy-700">
                <tr>
                  <th scope="col" className="w-[55%] py-1 font-normal">名前・メーカー</th>
                  <th scope="col" className="py-1 font-normal">違い</th>
                </tr>
              </thead>
              <tbody>
                {bolt.similar_bolts.length === 0 && (
                  <tr className="border-t border-mist-200">
                    <td colSpan={2} className="py-2 text-navy-700">類似ボルトはありません</td>
                  </tr>
                )}
                {bolt.similar_bolts.map((similar) => (
                  <tr key={similar.id} className="border-t border-mist-200 align-top">
                    <td className="py-1.5 pr-2">
                      <span className="block">{similar.name}</span>
                      <span className="block text-xs text-navy-700">
                        {similar.supplier_name}(背番号 {similar.back_number})
                      </span>
                    </td>
                    <td className="py-1.5 text-xs">{similar.difference_note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </aside>
  )
}
