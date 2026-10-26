// 初回だけ出す操作ガイド。押す場所に「枠 + 番号 + 吹き出し」を重ねて、実際に押すと次の番号に進む。
// 印は、押す場所を包む `relative` の枠の中に描く(位置を計算せずに済む。標準の <dialog> は最前面に出るので、ポップアップの中の印も、ポップアップの内側に置く必要がある)

import { GUIDE_TEXTS } from './guideData'

type Props = {
  step: number // 1 から始まる番号
  // 出すもの。'all' = 枠・番号・吹き出し、'mark' = 枠と番号だけ、'bubble' = 吹き出し(番号つき)だけ。
  // 押す場所と吹き出しを、別の場所に置きたいとき(押す場所の情報を隠したくないとき)に、'mark' と 'bubble' を別々に置く
  parts?: 'all' | 'mark' | 'bubble'
  // 吹き出しを出す向き。
  // 'top' / 'bottom' = 押す場所の上・下、'right' = 押す場所の右
  // 'inside' = 枠の内側の左上、'inside-bottom' = 枠の内側の左下(枠が大きくて、外に出せないとき。車両や部位の画像など)。
  //   この 2 つは、文を 1 行にする(2 行だと背が高くなって、車などの絵に被るため。幅で切り替えると、ブラウザの幅によって、動きが変わってしまう)
  side?: 'top' | 'bottom' | 'right' | 'inside' | 'inside-bottom'
  // 吹き出しを、押す場所の左端・右端のどちらにそろえるか('top' / 'bottom' のとき)
  align?: 'start' | 'end'
  // 押す場所を、枠で囲むか(複数の場所に枠をつけるときは、false にして、枠は呼び出し側でつける)
  ring?: boolean
  // 押すだけでは次に進まない手順(見るだけの手順)に、「次へ」のボタンを出す
  nextLabel?: string
  onNext?: () => void
  onSkip: () => void
}

const BADGE =
  'flex size-8 items-center justify-center rounded-full bg-accent-600 text-base font-bold text-white shadow-md'

const BUBBLE_POSITIONS = {
  top: 'bottom-full mb-4',
  bottom: 'top-full mt-3',
  right: 'top-16 left-full ml-8',
  inside: 'top-5 left-6',
  'inside-bottom': 'bottom-4 left-4',
} as const

export function GuideHint({
  step,
  parts = 'all',
  side = 'bottom',
  align = 'start',
  ring = true,
  nextLabel,
  onNext,
  onSkip,
}: Props) {
  const text = GUIDE_TEXTS[step - 1]
  const inside = side === 'inside' || side === 'inside-bottom'
  // 吹き出しだけを出すときや、枠の内側に出すときは、番号を吹き出しの角につける
  const badgeOnBubble = parts === 'bubble' || inside
  const horizontal = side === 'top' || side === 'bottom' ? (align === 'start' ? 'left-0' : 'right-0') : ''

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {parts !== 'bubble' && ring && <div className="absolute -inset-1 animate-pulse rounded-xl ring-4 ring-accent-500" />}
      {parts !== 'bubble' && !badgeOnBubble && (
        <span aria-hidden className={`absolute -top-3 -left-3 ${BADGE}`}>
          {step}
        </span>
      )}
      {parts !== 'mark' && (
        <div
          role="status"
          className={`pointer-events-auto absolute ${inside ? 'w-max' : 'w-72'} rounded-xl border-2 border-accent-500 bg-white p-3 text-sm leading-relaxed text-navy-900 shadow-xl ${BUBBLE_POSITIONS[side]} ${horizontal}`}
        >
          {badgeOnBubble && (
            <span aria-hidden className={`absolute -top-3 -left-3 ${BADGE}`}>
              {step}
            </span>
          )}
          <p className={inside ? 'pl-3 whitespace-nowrap' : badgeOnBubble ? 'pl-3 whitespace-pre-line' : 'whitespace-pre-line'}>{text}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="h-9 cursor-pointer rounded px-2 text-xs text-navy-700 underline underline-offset-2 hover:bg-mist-100 active:bg-mist-200"
            >
              スキップ
            </button>
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                className="h-9 cursor-pointer rounded-lg bg-navy-800 px-4 text-sm font-bold text-white hover:bg-navy-700 active:bg-navy-900"
              >
                {nextLabel ?? '次へ'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
