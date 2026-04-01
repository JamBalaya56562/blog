# 実装計画: 記事ナビゲーション (post-navigation)

## 概要

ブログ記事ページの末尾に前後記事へのナビゲーションを追加する。Content Loaderのユーティリティ関数追加、ナビゲーションコンポーネント作成、i18n辞書拡張、ブログ記事ページへの統合の順で実装する。

## タスク

- [x] 1. i18n辞書の拡張
  - [x] 1.1 `lib/i18n/dictionaries/en.json` の `blog` セクションに `previousPost` と `nextPost` キーを追加する
    - `"previousPost": "Previous Post"`, `"nextPost": "Next Post"` を追加
    - _Requirements: 5.1_
  - [x] 1.2 `lib/i18n/dictionaries/ja.json` の `blog` セクションに `previousPost` と `nextPost` キーを追加する
    - `"previousPost": "前の記事"`, `"nextPost": "次の記事"` を追加
    - _Requirements: 5.1_

- [x] 2. 前後記事取得ユーティリティ関数の実装
  - [x] 2.1 `lib/content/adjacent.ts` を作成し、`AdjacentPost` / `AdjacentPosts` 型と `findAdjacentPosts` 関数を実装する
    - `Post[]`（日付降順ソート済み）と `currentSlug` を受け取り、前後記事の `slug` と `title` を返す純粋関数
    - 該当slugが見つからない場合、空リスト、1件のみの場合は `{ previous: null, next: null }` を返す
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 2.2 `test/unit/lib/content/adjacent.test.ts` に `findAdjacentPosts` のユニットテストを作成する
    - 中間記事の前後取得、最初/最後の記事の境界、1件のみ、空リスト、存在しないslugのケースをテスト
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [x] 2.3 `test/unit/lib/content/adjacent.test.ts` にプロパティベーステストを追加する（Property 1: 前後記事の正確な特定）
    - **Property 1: 前後記事の正確な特定**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
    - fast-checkでランダムな記事リストとslugを生成し、インデックスベースの期待値と一致することを検証

- [x] 3. チェックポイント - テスト確認
  - すべてのテストが通ることを確認し、不明点があればユーザーに質問する。

- [x] 4. ナビゲーションコンポーネントの実装
  - [x] 4.1 `components/post-navigation.tsx` に `PostNavigation` コンポーネントを作成する
    - React Server Componentとして実装（`"use client"` 不要）
    - `locale`, `adjacentPosts`, `dictionary` をpropsとして受け取る（`Readonly<>` 適用）
    - `previous`/`next` が非nullの場合のみ対応するリンクを表示、両方nullなら `null` を返す
    - Next.js `Link` コンポーネントで `/{locale}/blog/{slug}` へ遷移
    - タイトルは Tailwind CSS `truncate` で1行に切り詰め
    - ラベルテキストは辞書の `blog.previousPost` / `blog.nextPost` から取得
    - モバイル（640px未満）で縦積み、デスクトップ（640px以上）で横並びのレスポンシブレイアウト
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 6.1, 6.2_
  - [x] 4.2 `test/unit/components/post-navigation.test.tsx` に `PostNavigation` コンポーネントのユニットテストを作成する
    - 両方リンク存在、片方のみ存在、両方null、truncateクラス適用、Linkコンポーネント使用を検証
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3_
  - [x] 4.3 `test/unit/components/post-navigation.test.tsx` にプロパティベーステストを追加する（Property 2: 条件付きリンク表示）
    - **Property 2: 条件付きリンク表示**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**
    - fast-checkでランダムな `AdjacentPosts` を生成し、リンクの有無が状態と一致することを検証
  - [x] 4.4 `test/unit/components/post-navigation.test.tsx` にプロパティベーステストを追加する（Property 3: リンクhrefの正確性）
    - **Property 3: リンクhrefの正確性**
    - **Validates: Requirements 4.1, 4.2**
    - fast-checkでランダムなロケールとslugを生成し、hrefが `/{locale}/blog/{slug}` 形式であることを検証
  - [x] 4.5 `test/unit/components/post-navigation.test.tsx` にプロパティベーステストを追加する（Property 4: ラベルテキストの辞書一致）
    - **Property 4: ラベルテキストの辞書一致**
    - **Validates: Requirements 5.1**
    - fast-checkでランダムなラベルテキストを含む辞書を生成し、表示ラベルが辞書の値と一致することを検証

- [x] 5. ブログ記事ページへの統合
  - [x] 5.1 `app/[locale]/blog/[slug]/page.tsx` を修正し、`PostNavigation` コンポーネントを統合する
    - `createContentLoader().getAllPosts(locale)` でソート済み記事リストを取得
    - `findAdjacentPosts` で前後記事を特定
    - `<article>` の直後に `<PostNavigation>` を配置
    - _Requirements: 1.1, 2.1, 4.1, 4.2, 5.2_

- [x] 6. 最終チェックポイント - 全テスト確認
  - すべてのテストが通ることを確認し、不明点があればユーザーに質問する。

## 備考

- `*` マーク付きのタスクはオプションであり、MVP優先の場合はスキップ可能
- 各タスクは具体的な要件への参照を含む
- チェックポイントでインクリメンタルな検証を実施
- プロパティベーステストは普遍的な正当性プロパティを検証
- ユニットテストは具体的な例とエッジケースを検証
