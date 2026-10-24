import { useEffect, useState } from 'react'
import { fetchBolt, type BoltDetail } from './api'

type Props = {
  boltId: number | null
}

// 取得した詳細は、どのボルトのものかを一緒に持つ(ボルトを切り替えた直後に、前のボルトが出ないようにするため)
type LoadedBolt =
  | { boltId: number; status: 'ready'; bolt: BoltDetail }
  | { boltId: number; status: 'error'; message: string }

export function BoltPanel({ boltId }: Props) {
  const [loaded, setLoaded] = useState<LoadedBolt | null>(null)

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

            {/* 部品棚の場所の表。5 段階目で、行を押すと工場マップに切り替わる入口にする */}
            <table className="w-full text-left text-sm">
              <caption className="pb-1 text-left text-sm font-bold">部品棚の場所</caption>
              <thead className="text-xs text-navy-700">
                <tr>
                  <th scope="col" className="py-1 font-normal">工区</th>
                  <th scope="col" className="py-1 font-normal">所番地</th>
                  <th scope="col" className="py-1 font-normal">棚</th>
                  <th scope="col" className="py-1 font-normal">段・列</th>
                </tr>
              </thead>
              <tbody>
                {bolt.shelves.map((shelf) => (
                  <tr key={`${shelf.parts_shelf_id}-${shelf.slot_row}-${shelf.slot_col}`} className="border-t border-mist-200">
                    <td className="py-2">{shelf.zone_name}</td>
                    <td className="py-2">{shelf.address_code}</td>
                    <td className="py-2">{shelf.shelf_no}</td>
                    <td className="py-2">
                      {shelf.slot_row}段 {shelf.slot_col}列
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

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
