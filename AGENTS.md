# AGENTS.md

このリポジトリは Next.js (App Router) で構築された多言語対応ブログです。

## 技術スタック

- **フレームワーク**: Next.js (canary) — App Router, React Server Components, `"use cache"` ディレクティブ
- **言語**: TypeScript (strict mode, `"module": "esnext"`)
- **ランタイム / パッケージマネージャ**: Bun
- **スタイリング**: Tailwind CSS v4 + PostCSS
- **コンテンツ**: MDX (`next-mdx-remote-client`, `remark-gfm`)
- **リンター / フォーマッター**: Biome
- **テスト**: Bun test (ユニット) + Playwright (E2E)
- **ツール管理**: Mise
- **デプロイ**: Docker (distroless + AWS Lambda Web Adapter)

## プロジェクト構成

```bash
app/                  # Next.js App Router ページ
  [locale]/           # 多言語ルーティング (en, ja)
    blog/[slug]/      # ブログ記事ページ
    privacy-policy/   # プライバシーポリシー
  api/images/         # 画像プロキシ API
components/           # 共有 React コンポーネント
lib/
  content/            # コンテンツローダー (local / GitHub)
  i18n/               # 国際化 (辞書, ロケール設定)
  toc.ts              # 目次生成
content/
  posts/{en,ja}/      # MDX ブログ記事
  images/             # コンテンツ用画像
test/
  unit/               # Bun ユニットテスト
  e2e/                # Playwright E2E テスト
```

## コーディング規約

### 全般

- インデント: スペース 2 つ
- 改行コード: LF
- 文字コード: UTF-8
- セミコロン: 省略 (`"semicolons": "asNeeded"`)
- 末尾改行: あり

### TypeScript

- `strict: true` を遵守
- パスエイリアス `@/*` をプロジェクトルートからのインポートに使用
- 未使用インポートはエラー (`noUnusedImports: "error"`)
- `useBlockStatements: "error"` — 常にブロック文 `{}` を使用
- `noUselessElse: "error"` — 不要な else を書かない

### React / Next.js

- React Compiler が有効 (`reactCompiler: true`)
- Server Components をデフォルトとし、必要な場合のみ `"use client"` を付与
- `"use cache"` ディレクティブによるキャッシュ制御を活用
- コンポーネント props には `Readonly<>` を適用
- 型付きルート (`typedRoutes: true`) を使用

### コンテンツ

- ブログ記事は `content/posts/{locale}/` に MDX ファイルとして配置
- Frontmatter には `title`, `date`, `description`, `tags` を必須とする
- `CONTENT_SOURCE` 環境変数でローカル / GitHub ソースを切り替え可能

## テスト方針

### ユニットテスト

```bash
bun test:unit
```

- テストランナー: Bun test
- DOM 環境: Happy DOM (`happydom.ts` でグローバル登録)
- `next/image`, `next/link` はモックに差し替え済み
- テストファイルは `test/unit/` 配下にソースと対応する構造で配置
- ファイル名: `*.test.ts` / `*.test.tsx`
- Testing Library (`@testing-library/react`, `@testing-library/dom`) を使用
- プロパティベーステスト: `fast-check` を利用可能

### E2E テスト

```bash
bun run build && bun test:e2e
```

- テストランナー: Playwright
- テストファイルは `test/e2e/` 配下に配置
- 対象ブラウザ: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- テスト前にスタンドアロンサーバー (`bun .next/standalone/server.js`) を起動
- CI ではリトライ 2 回、ワーカー 1 に制限

## コマンド一覧

| コマンド | 説明 |
| --- | --- |
| `bun dev` | 開発サーバー起動 |
| `bun run build` | プロダクションビルド |
| `bun start` | プロダクションサーバー起動 |
| `bun check` | Biome によるフォーマット + リント (自動修正) |
| `bun test:unit` | ユニットテスト実行 |
| `bun test:e2e` | E2E テスト実行 |

## コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/) に準拠:

```bash
<type>(<scope>): <summary>
```

- type: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`
- scope (例): `biome`, `bun`, `common`, `css`, `docker`, `git`, `security`, `vscode`
- summary: 命令形・現在形、先頭小文字、末尾ピリオドなし
