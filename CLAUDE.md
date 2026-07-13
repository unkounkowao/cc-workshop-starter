# ワークショップ プロジェクト

## はじめに
このプロジェクトには、AIエージェントチームが事前設定されています。
あなたのサービスアイデアをClaude Codeに伝えるだけで、チームが自動的にWebサイトを構築します。

## エージェントチーム

| Agent | 役割 | 何をしてくれるか |
|-------|------|-----------------|
| Sherpa | 計画役 | アイデアを具体的なタスクに分解 |
| Artisan | 実装役 | Next.js + Tailwind CSSでコードを実装 |
| Radar | 検証役 | ビルド確認・品質チェック |

## 技術制約

- Next.js Static Export（`output: 'export'`）
- Tailwind CSS
- DB無し、API無し、フロントエンドのみ
- 日本語UI
- レスポンシブデザイン
- `npm run build` でエラーが出ないこと

## ワークフロー

参加者がサービスアイデアを伝えたら:
1. Sherpa でタスク分解を行う
2. Artisan で実装する
3. Radar でビルド確認・品質検証する
4. 結果を参加者に報告する

## 出力言語
全ての出力は日本語。

---

## 開発ログ

### 2026-07-13 に実装・修正した内容

**追加したフィールド**
- `nameReading`（読み方）: 名前の直下にヘッダー表示
- `summary`（概要）: テーマと性格の間
- `imageSong`（イメソン）+ `imageSongUrl`（リンク）: イメージモチーフの直後に表示、URLがあればリンクになる

**削除した機能**
- キャラ名検索（一覧ページの検索欄）
- 読み込み（ImportExport コンポーネント）

**UI改善**
- 編集フォームのヘッダー（キャラクターを編集 / キャンセル / 保存）をスクロール時も固定（`sticky top-0`）
- Ctrl+S（⌘+S）でページ遷移なしのクイックセーブ、保存ボタンは詳細ページへ遷移
- カードの「上へ / 下へ」ボタンが常に下端に揃うよう修正（`flex flex-col` + `flex-1`）
- 詳細ページの項目内空白行を狭く（`\n\n` を段落分割して `space-y-3`）
- 詳細ページのフィールド間隔を `gap-8` に設定

**バグ修正**
- Gist同期: 削除したキャラが復元される問題、ソート順が同期されない問題など多数修正
- イメソンが `quickSave`（Ctrl+S）で保存されていなかった問題を修正
- モバイル用カラーピッカーをHSLスライダーに変更、PCはネイティブピッカーを維持

**技術メモ**
- データ: localStorage（`novel-character-sheet-data`）
- 同期: GitHub Gist API（PAT + GistID を localStorage に保存）
- `lib/types.ts` の `Character` 型に新フィールド追加時は `CharacterForm` の `save` と `quickSave` 両方に追加すること
- デプロイ: `git push origin main` → GitHub Actions → GitHub Pages 自動デプロイ（約1分）
