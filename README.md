# キャラクターシート管理アプリ

小説執筆用のキャラクター設定管理Webアプリです。複数の登場人物のプロフィール、性格、過去、人間関係などをブラウザ上で整理・編集・閲覧できます。

## 特徴

- キャラクターの作成・閲覧・編集・削除
- イメージカラーの複数登録とカラーチップ表示
- キャラクターの並び替え（上へ/下へボタン）
- キャラクター名による検索
- JSONファイルへのエクスポート・インポート
- スマートフォン/PC両対応のレスポンシブUI
- ブラウザのLocalStorageへのデータ保存（サーバー不要）
- GitHub Pages等の静的ホスティングで動作

## セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name

# 依存パッケージをインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

## コマンド

```bash
npm run dev        # 開発サーバー起動
npm run build      # 本番ビルド
npm run start      # 本番サーバー起動
npm run test       # テスト実行
npm run typecheck  # TypeScript型チェック
npm run lint       # ESLint実行
npm run lint:fix   # ESLint自動修正
```

## GitHub Pagesへのデプロイ

### 事前準備

`next.config.ts` の `basePath` をリポジトリ名に合わせて変更してください：

```ts
const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/your-repo-name', // リポジトリ名に変更
  images: { unoptimized: true },
}
```

### 自動デプロイ（GitHub Actions）

リポジトリの **Settings → Pages → Source** を `GitHub Actions` に設定すると、`main` ブランチへのプッシュ時に自動デプロイされます。

ワークフローファイル: `.github/workflows/deploy.yml`

公開URLは `https://your-username.github.io/your-repo-name/` になります。

### 手動デプロイ

```bash
npm run build
# out/ ディレクトリを gh-pages ブランチにプッシュ
```

## データの保存とプライバシーについて

**重要**: キャラクターデータはブラウザの **LocalStorage** にのみ保存されます。

- GitHubリポジトリにはキャラクターデータが含まれません
- 外部サーバーへのデータ送信は一切行いません
- 同じ端末・同じブラウザ・同じサイトを操作できる人はLocalStorageのデータを閲覧できる可能性があります
- ブラウザのデータをクリアするとキャラクターデータも削除されます。**定期的なエクスポートでバックアップしてください**

### GitHubリポジトリの公開範囲について

GitHub Pagesを利用する場合、アプリのソースコード（HTML/CSS/JS）は公開されますが、LocalStorageに保存されたキャラクターデータは公開されません。

リポジトリを非公開にしたい場合は、GitHubの有料プランが必要です。詳細はGitHubの公式ドキュメントをご確認ください。

## ディレクトリ構成

```
├── app/                    # Next.js App Router ページ
│   ├── layout.tsx
│   ├── page.tsx            # キャラクター一覧
│   └── characters/
│       ├── new/page.tsx    # キャラクター追加
│       └── [id]/
│           ├── page.tsx    # キャラクター詳細
│           └── edit/page.tsx # キャラクター編集
├── components/             # Reactコンポーネント
├── lib/                    # ユーティリティ・型定義
│   ├── types.ts
│   ├── constants.ts
│   ├── validation.ts
│   ├── storage.ts
│   └── utils.ts
├── __tests__/              # テストコード
│   ├── unit/
│   └── components/
└── .github/workflows/      # GitHub Actions
```

## 技術スタック

- [Next.js](https://nextjs.org/) 15 (App Router, Static Export)
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/) 5
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/)
- LocalStorage（データ永続化）
