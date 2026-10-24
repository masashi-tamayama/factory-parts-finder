import { Modal } from './Modal'

type Props = {
  onClose: () => void
}

// 文章は、README の「画像・データについて」をもとにしている(画像生成のツール名は、「AI」に変えてある)
export function NoticeDialog({ onClose }: Props) {
  return (
    <Modal titleId="notice-dialog-title" closeLabel="閉じる" onClose={onClose}>
      <div className="w-[min(36rem,calc(100vw-6rem))]">
        <h2 id="notice-dialog-title" className="text-2xl font-bold">
          画像・データについて
        </h2>
        <div className="mt-4 flex flex-col gap-3 leading-relaxed">
          <p>本アプリは、自動車製造ラインでの部品検索業務を想定して開発したポートフォリオ作品です。</p>
          <p>
            登場する車両・部品・取り付け箇所は架空のものであり、画像素材は AI
            の画像生成機能を使用して制作しました。実在する自動車メーカーおよび製品とは関係ありません。
          </p>
          <p>部品の規格・取り付け位置などの情報はデモ用であり、実際の製造作業には使用できません。</p>
        </div>
      </div>
    </Modal>
  )
}
