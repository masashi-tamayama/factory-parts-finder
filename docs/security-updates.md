# セキュリティ更新の記録

使用している言語・ライブラリの脆弱性情報を確認し、更新した内容を記録しています。

## 更新履歴

| 日付 | 対象 | 更新前 → 更新後 | 理由 |
|---|---|---|---|
| 2026-10-23 | Node.js(開発・ビルド用) | 24.21.0 → **24.22.1** | Node.js 公式のセキュリティリリース(2026-10-21)への対応。修正は 10 件(深刻度 High 4、Medium 3、Low 3)。TLS のホスト名検証、`dns.resolve`、Brotli デコーダーなどの問題が含まれる。[公式の発表](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases) |
| 2026-10-23 | Python(API 用) | 3.14.7 → **3.14.9** | Python 公式のセキュリティリリース(2026-10-21)への対応。同梱の pip と certifi の更新(認証局 eMudhra / emSign の証明書の問題への対応)など。直前の 3.14.8(2026-09-30)では、TLS の `SSLContext` に関するメモリの問題(CVE-2026-19445)などが修正されており、3.14.9 は、その後の修正も含む保守リリース。更新後に、5 つの API の動作と、依存パッケージの照合(0 件)を確認した。[3.14.9](https://www.python.org/downloads/release/python-3149/)、[3.14.8](https://www.python.org/downloads/release/python-3148/) |

## 新しく導入したパッケージの確認

| 日付 | 対象 | 導入前の確認 | 結果 |
|---|---|---|---|
| 2026-10-24 | Tailwind CSS(`tailwindcss`、`@tailwindcss/vite`)**4.3.3**(固定) | npm の最新版が 4.3.3(2026-07-16 公開)であること、`@tailwindcss/vite` が Vite 8 に対応していること(peerDependencies に `^8`)、GitHub の [Security advisories](https://github.com/tailwindlabs/tailwindcss/security/advisories) に公開された脆弱性がないこと、ライセンスが MIT であること、公式の[リリースノート](https://github.com/tailwindlabs/tailwindcss/releases)(4.3.0〜4.3.3)にセキュリティ修正・破壊的変更の記載がないこと、動作環境(Safari 16.4 以上、Chrome 111 以上、Firefox 128 以上。[公式](https://tailwindcss.com/docs/compatibility))を確認した | 導入前・導入後とも `npm audit`: 脆弱性 0 件。ビルドと lint も成功 |

## 確認のみ(更新不要だったもの)

| 日付 | 対象 | 結果 |
|---|---|---|
| 2026-10-23 | Starlette(FastAPI の土台) | 使用中の 1.9.0 は、2026 年 5〜6 月に公開された既知の脆弱性 2 件の修正版より新しく、対象外 |
| 2026-10-23 | フロントの依存パッケージ | `npm audit`: 脆弱性 0 件 |
| 2026-10-23 | バックエンドの依存パッケージ(23 個) | [OSV](https://osv.dev/) で照合: 脆弱性 0 件 |
| 2026-10-23 | PHP | このアプリでは使用していないため、対象外 |

## 確認の方法

1. 言語・フレームワークの**公式の発表**(Node.js、Python)で、修正版のバージョンと内容を確認する
2. 使用中のバージョンを `node -v`、`pip list` などで実際に調べて、修正版と比べる
3. 依存パッケージを、公開の脆弱性データベースで照合する(フロントは `npm audit`、バックエンドは OSV)
4. 更新後は、ビルドと動作確認を行い、再度 `npm audit` で確認する

## 影響範囲の考え方

- **Node.js**: 手元の開発とビルドにだけ使っています。本番の画面は、ビルド済みの静的ファイルで、Node.js のサーバーは動いていません
- **Python**: API は Python で動いています。HTTPS の処理は、公開先(Vercel)が受け持ち、このアプリのコードは `SSLContext` を使っていません
- 公開先(Vercel)の実行環境の更新は、Vercel 側が管理しています

## 今後の運用

- 大きな脆弱性のニュースが出たときと、月に 1 回程度、上の方法で確認します
- GitHub の Dependabot によるセキュリティ通知は、公開後に有効にする予定です
