import { Modal } from './Modal'

type Props = {
  // 「部品検索を始める」を押したとき。✕・背景・Esc で閉じたときも、同じ(初回は、ここから操作ガイドが始まる)
  onStart: () => void
  // 操作ガイドを、これから見せるか(初回だけ true)。案内の一文を出すかどうかに使う
  willGuide: boolean
}

// 最初に開いたときに出す案内。初めて触る方(面接官・採用担当者)向けの、概要・想定機器・「リクエストの旅」の紹介・注記(文章は、README の「画像・データについて」と同じ。画像生成のツール名は「AI」)。使い方は、画面の上に出す操作ガイド(Guide.tsx)で案内する
export function IntroDialog({ onStart, willGuide }: Props) {
  return (
    <Modal titleId="intro-dialog-title" closeLabel="閉じる" onClose={onStart}>
      <div className="w-[min(60rem,calc(100vw-6rem))]">
        <h2 id="intro-dialog-title" className="text-2xl font-bold">
          初めてご覧になる方へ
        </h2>

        {/* 内容が多いので、低い画面では、案内の中だけがスクロールする */}
        <div className="mt-4 max-h-[calc(100dvh-12rem)] overflow-y-auto pr-2">
          <div className="flex flex-col gap-6 text-[0.9375rem] leading-relaxed">
            <section className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-navy-800">どんなアプリか</h3>
              <p>自動車製造ラインで約 19 年働いてきた経験をもとに、現場で実際にあった困りごとを解決するために作りました。製造ラインを任されている管理者向けのシステムです。</p>
              <p>工場内には、ボルトが何千点もの種類があります。急に必要になったとき、取り出す場所を間違えて、誤ったボルトを車両に組み付けてしまうと、品質不具合になります。類似品で強度が違うものだと、ボルトが破断して、接合している部品が脱落し、災害につながる恐れもあります。</p>
              <p>探す手間も膨大になるため、管理の面でも便利な道具になります。</p>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-navy-800">使用を想定している機器</h3>
              <ul className="flex list-disc flex-col pl-5">
                <li>iPad の横向き</li>
                <li>一般的な画面サイズのパソコン</li>
              </ul>
              <p className="text-sm text-navy-700">スマートフォンの画面サイズでの使用は、想定していません。</p>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-navy-800">画面の裏側を見る</h3>
              <p>
                画面の上の「リクエストの旅」では、ボルトを押したときなどに、データが取り出される道を、アニメーションで見られます。ブラウザからサーバー、データベースまでを往復する様子を、実際のコードや SQL とあわせて確認できます。
              </p>
              <p className="text-sm text-navy-700">新しいタブで開きます。</p>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-lg font-bold text-navy-800">画像・データについて</h3>
              <p>本アプリは、自動車製造ラインでの部品検索業務を想定して開発したポートフォリオ作品です。</p>
              <p>
                登場する車両・部品・取り付け箇所は架空のものであり、画像素材は AI
                の画像生成機能を使用して制作しました。実在する自動車メーカーおよび製品とは関係ありません。
              </p>
              <p>部品の規格・取り付け位置などの情報はデモ用であり、実際の製造作業には使用できません。</p>
            </section>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-4">
          {willGuide && <p className="text-sm text-navy-700">このあと、画面の上で操作を案内します</p>}
          <button
            type="button"
            onClick={onStart}
            className="h-12 min-w-40 cursor-pointer rounded-lg bg-navy-800 px-6 text-base font-bold text-white hover:bg-navy-700 active:bg-navy-900"
          >
            部品検索を始める
          </button>
        </div>
      </div>
    </Modal>
  )
}
