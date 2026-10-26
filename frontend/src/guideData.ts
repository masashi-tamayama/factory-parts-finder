// 操作ガイドの文面と、「初回のみ」の記録(部品は Guide.tsx)

// 文の中の「\n」は、吹き出しでの改行位置(自動の折り返しだと、「ボルト」「工場全体」などの言葉の途中で切れるため)
export const GUIDE_TEXTS = [
  '車種を選択してください。',
  '探すボルトの部位を選択してください。',
  '表面と裏面が表示できます。\nその後のボルトを選択してください。',
  'ボルトの情報を確認してください。',
  'こちらを押すと\n工場全体マップが開きます。',
  '棚の詳細情報を確認してください。',
] as const

// 最後の手順の番号
export const GUIDE_LAST_STEP = GUIDE_TEXTS.length

const STORAGE_KEY = 'factory-parts-finder:guide-seen'

// 「初回のみ」の記録。ブラウザに保存できない環境(シークレットモードなど)でも動くように、例外は握りつぶす(その場合は、毎回出る)
export function hasSeenGuide(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function markGuideSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // 保存できなくても、ガイドは動く
  }
}
