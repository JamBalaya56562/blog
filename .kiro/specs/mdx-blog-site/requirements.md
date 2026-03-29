# 要件定義書

## はじめに

Next.js App RouterとMDXを使用したブログサイトの構築。本番環境ではAWS Lambda上でDockerコンテナとして実行し、ブログコンテンツ（MDXファイル・画像）はGitHubリポジトリからランタイムにフェッチする。開発環境ではローカルの`content/posts/{locale}`ディレクトリからコンテンツを読み込みプレビューできる。記事一覧ページ、個別記事ページ、タグによるフィルタリング機能を提供する。既存のMDX設定（`@next/mdx`、`remark-gfm`、`remark-toc`）を活用し、Tailwind CSS v4によるスタイリングを行う。コンテンツレベルのi18nに対応し、同一のブログ記事を英語（`content/posts/en/`）と日本語（`content/posts/ja/`）の両方で提供する。

## 用語集

- **Blog_System**: MDXファイルベースのブログ記事管理・表示システム全体
- **Content_Loader**: コンテンツソースからMDXファイルを読み込み、フロントマターを解析するモジュール。環境に応じてローカルファイルまたはGitHub APIからデータを取得する
- **Content_Source**: コンテンツの取得元。開発環境ではローカルファイルシステム（`content/posts/{locale}`）、本番環境ではGitHubリポジトリ
- **Locale_Content_Directory**: ロケールごとに分けられたコンテンツディレクトリ。`content/posts/en/`（英語）と`content/posts/ja/`（日本語）の2つが存在する
- **GitHub_Fetcher**: GitHub REST API（raw.githubusercontent.com）を使用してMDXファイルと画像をフェッチするモジュール
- **Post**: タイトル、日付、タグ、本文を持つ個別のブログ記事
- **Frontmatter**: MDXファイル先頭のYAMLメタデータ（title、date、tags、description）
- **Frontmatter_Parser**: MDXファイルからFrontmatterを解析し、型安全なオブジェクトに変換するパーサー
- **Post_List_Page**: ブログ記事の一覧を表示するページ（`/{locale}/blog`）
- **Post_Detail_Page**: 個別のブログ記事を表示するページ（`/{locale}/blog/[slug]`）
- **Tag_Filter**: タグによる記事のフィルタリング機能
- **MDX_Components**: MDXコンテンツ内で使用されるカスタムReactコンポーネント群
- **Layout**: ヘッダー、フッター、ナビゲーションを含むサイト全体の共通レイアウト
- **Image_Proxy**: GitHubリポジトリから画像を取得し配信するモジュール
- **I18n_System**: 多言語対応システム。UIテキストの翻訳、ロケール切り替え、およびコンテンツレベルの多言語対応を管理する
- **Locale**: 言語設定。`en`（英語、デフォルト）と`ja`（日本語）をサポートする
- **Translation_Pair**: 異なるLocale_Content_Directory内に同一スラッグで存在する、互いの翻訳であるMDXファイルのペア

## 要件

### 要件 1: コンテンツソースの抽象化

**ユーザーストーリー:** ブログ運営者として、開発時はローカルファイルで記事をプレビューし、本番ではGitHubリポジトリからコンテンツを取得したい。環境に応じた柔軟なコンテンツ管理を行うため。

#### 受け入れ基準

1. THE Content_Loader SHALL 環境変数によってContent_Sourceを切り替える
2. WHILE 開発環境で実行中、THE Content_Loader SHALL ローカルの`content/posts/{locale}`ディレクトリからMDXファイルを読み込む（`{locale}`は`en`または`ja`）
3. WHILE 本番環境で実行中、THE Content_Loader SHALL GitHub REST APIを使用してリモートリポジトリからMDXファイルをフェッチする
4. THE Content_Loader SHALL Content_Sourceに依存しない統一されたインターフェースを提供する
5. THE Blog_System SHALL 各MDXファイルのファイル名（拡張子を除く）をスラッグとして使用する
6. THE Content_Loader SHALL ロケールパラメータを受け取り、対応するLocale_Content_Directoryからコンテンツを取得する

### 要件 2: フロントマター解析

**ユーザーストーリー:** ブログ運営者として、各記事にタイトル・日付・タグなどのメタデータを設定したい。記事一覧での表示やフィルタリングに利用するため。

#### 受け入れ基準

1. THE Frontmatter_Parser SHALL MDXファイル先頭のYAML形式のFrontmatterを解析する
2. THE Frontmatter_Parser SHALL `title`（文字列）、`date`（ISO 8601形式の日付文字列）、`description`（文字列）、`tags`（文字列の配列）フィールドを必須フィールドとして扱う
3. IF 必須フィールドが欠落している場合、THEN THE Frontmatter_Parser SHALL ビルド時にエラーメッセージを出力する
4. THE Frontmatter_Parser SHALL 解析結果を型安全なTypeScriptオブジェクトとして返す
5. FOR ALL 有効なFrontmatterオブジェクトに対して、Frontmatterをシリアライズし再度パースした結果は元のオブジェクトと等価である（ラウンドトリップ特性）

### 要件 3: 記事一覧ページ

**ユーザーストーリー:** 読者として、ブログの全記事を一覧で閲覧したい。興味のある記事を見つけやすくするため。

#### 受け入れ基準

1. WHEN 読者が`/{locale}/blog`にアクセスした場合、THE Post_List_Page SHALL 現在のロケールに対応する記事の一覧を表示する
2. THE Post_List_Page SHALL 各記事のタイトル、日付、説明文、タグを表示する
3. THE Post_List_Page SHALL 記事を日付の降順（新しい順）で並べる
4. WHEN 読者が記事タイトルをクリックした場合、THE Post_List_Page SHALL 該当する記事の詳細ページ（`/{locale}/blog/[slug]`）に遷移する
5. THE Post_List_Page SHALL サーバーサイドでコンテンツをフェッチし、動的にレンダリングする

### 要件 4: 個別記事ページ

**ユーザーストーリー:** 読者として、個別のブログ記事を読みたい。記事の全文とメタデータを確認するため。

#### 受け入れ基準

1. WHEN 読者が`/{locale}/blog/[slug]`にアクセスした場合、THE Post_Detail_Page SHALL 該当するロケールとスラッグのMDXファイルの内容をレンダリングして表示する
2. THE Post_Detail_Page SHALL 記事のタイトル、公開日、タグを記事本文の上部に表示する
3. THE Post_Detail_Page SHALL MDXコンテンツ内のGFM（GitHub Flavored Markdown）記法を正しくレンダリングする
4. IF 存在しないスラッグが指定された場合、THEN THE Post_Detail_Page SHALL 404ページを返す
5. THE Post_Detail_Page SHALL サーバーサイドでコンテンツをフェッチし、動的にレンダリングする
6. THE Post_Detail_Page SHALL 記事ごとに適切な`<title>`と`<meta description>`を設定する
7. WHEN 同一スラッグのTranslation_Pairが他のロケールに存在する場合、THE Post_Detail_Page SHALL 他言語版への切り替えリンクを表示する

### 要件 5: タグフィルタリング

**ユーザーストーリー:** 読者として、特定のタグに関連する記事だけを表示したい。興味のあるトピックの記事を効率的に探すため。

#### 受け入れ基準

1. WHEN 読者が`/{locale}/blog?tag=タグ名`にアクセスした場合、THE Tag_Filter SHALL 現在のロケールの記事から指定されたタグを持つ記事のみを一覧表示する
2. THE Post_List_Page SHALL 各記事のタグをクリック可能なリンクとして表示する
3. WHEN 読者がタグリンクをクリックした場合、THE Tag_Filter SHALL そのタグでフィルタリングされた記事一覧を表示する
4. WHILE タグフィルタが適用されている間、THE Post_List_Page SHALL 現在選択中のタグを視覚的に示す
5. THE Tag_Filter SHALL フィルタリング後も記事を日付の降順で並べる

### 要件 6: MDXカスタムコンポーネント

**ユーザーストーリー:** ブログ運営者として、MDX内でカスタムスタイルのHTML要素を使用したい。記事の見た目を統一し、読みやすくするため。

#### 受け入れ基準

1. THE MDX_Components SHALL 見出し（h1〜h4）、段落、リスト、コードブロック、リンク、画像、引用、テーブルにカスタムスタイルを適用する
2. THE MDX_Components SHALL Tailwind CSSのユーティリティクラスを使用してスタイリングする
3. THE MDX_Components SHALL ダークモードとライトモードの両方に対応したスタイルを提供する
4. THE MDX_Components SHALL `mdx-components.tsx`ファイルで定義し、全MDXコンテンツに自動適用する

### 要件 7: サイトレイアウト

**ユーザーストーリー:** 読者として、サイト全体で統一されたナビゲーションとレイアウトを利用したい。サイト内を快適に移動するため。

#### 受け入れ基準

1. THE Layout SHALL サイト名を含むヘッダーを全ページに表示する
2. THE Layout SHALL ホームページ（`/{locale}`）とブログ一覧（`/{locale}/blog`）へのナビゲーションリンクをヘッダーに含める
3. THE Layout SHALL コピーライト表記を含むフッターを全ページに表示する
4. THE Layout SHALL レスポンシブデザインに対応し、モバイルとデスクトップの両方で適切に表示する
5. THE Layout SHALL 既存のGeistフォント設定を維持する

### 要件 8: トップページ

**ユーザーストーリー:** 読者として、サイトのトップページからブログの概要と最新記事にアクセスしたい。サイトの内容を素早く把握するため。

#### 受け入れ基準

1. WHEN 読者が`/{locale}`にアクセスした場合、THE Blog_System SHALL ブログの紹介文と現在のロケールの最新記事へのリンクを表示する
2. THE Blog_System SHALL トップページに現在のロケールの最新5件の記事のタイトルと日付を表示する
3. WHEN 読者がトップページの記事リンクをクリックした場合、THE Blog_System SHALL 該当する記事の詳細ページに遷移する

### 要件 9: SEOとメタデータ

**ユーザーストーリー:** ブログ運営者として、各ページに適切なメタデータを設定したい。検索エンジンでの表示を最適化するため。

#### 受け入れ基準

1. THE Blog_System SHALL サイト全体のデフォルトメタデータ（タイトル、説明文）を`layout.tsx`で設定する
2. THE Post_Detail_Page SHALL 各記事のFrontmatterからページ固有のメタデータを生成する
3. THE Blog_System SHALL `generateMetadata`関数を使用して動的にメタデータを生成する

### 要件 10: GitHubコンテンツフェッチ

**ユーザーストーリー:** ブログ運営者として、本番環境ではGitHubリポジトリからブログコンテンツを取得したい。Dockerイメージに静的ファイルを含めず、コンテンツの更新をデプロイなしで反映するため。

#### 受け入れ基準

1. THE GitHub_Fetcher SHALL GitHub REST API（`raw.githubusercontent.com`）を使用してMDXファイルを取得する
2. THE GitHub_Fetcher SHALL 環境変数でリポジトリのオーナー、リポジトリ名、ブランチ、コンテンツパスを設定可能にする
3. THE GitHub_Fetcher SHALL ロケールパラメータを受け取り、対応するLocale_Content_Directory（`content/posts/en/`または`content/posts/ja/`）からMDXファイルの一覧を取得する
4. THE GitHub_Fetcher SHALL 指定されたロケールとスラッグに対応する個別のMDXファイルの内容を取得する機能を提供する
5. IF GitHub APIからのフェッチが失敗した場合、THEN THE GitHub_Fetcher SHALL エラーメッセージをログに出力し、適切なエラーレスポンスを返す
6. THE GitHub_Fetcher SHALL Next.jsのデータキャッシュを活用してAPIリクエストを最適化する

### 要件 11: 画像配信

**ユーザーストーリー:** ブログ運営者として、記事内の画像もGitHubリポジトリから配信したい。画像管理をコンテンツと同じリポジトリで一元化するため。

#### 受け入れ基準

1. THE Image_Proxy SHALL GitHubリポジトリから画像ファイルを取得して配信する
2. WHILE 開発環境で実行中、THE Image_Proxy SHALL ローカルの`content/images`ディレクトリから画像を配信する
3. WHILE 本番環境で実行中、THE Image_Proxy SHALL GitHubリポジトリから画像をフェッチして配信する
4. THE MDX_Components SHALL MDXコンテンツ内の画像パスを適切なソースに解決する

### 要件 12: デプロイ構成

**ユーザーストーリー:** ブログ運営者として、DockerfileでビルドしAWS Lambdaにデプロイしたい。サーバーレスで運用コストを抑えるため。

#### 受け入れ基準

1. THE Blog_System SHALL Next.jsの`standalone`出力モードを使用してDockerイメージをビルドする
2. THE Blog_System SHALL `aws-lambda-adapter`を使用してAWS Lambda上で実行可能にする
3. THE Blog_System SHALL Dockerイメージにブログコンテンツ（MDXファイル・画像）を含めない
4. THE Blog_System SHALL 環境変数でContent_Sourceの切り替えとGitHubリポジトリの設定を行う

### 要件 13: 多言語対応（i18n）

**ユーザーストーリー:** 読者として、ブログサイトを英語または日本語で閲覧したい。自分の言語でコンテンツとUIの両方を利用するため。

#### 受け入れ基準

1. THE I18n_System SHALL デフォルト言語を英語（`en`）とし、日本語（`ja`）への切り替えをサポートする
2. THE I18n_System SHALL Next.jsのi18nルーティング機能を使用し、`/en/blog`、`/ja/blog`のようなロケールプレフィックス付きURLを提供する
3. THE Layout SHALL 言語切り替えUIをヘッダーに表示する
4. WHEN 読者が言語を切り替えた場合、THE I18n_System SHALL 現在のページの対応するロケールのURLに遷移する
5. THE I18n_System SHALL UIテキスト（ナビゲーション、フッター、ラベル等）の翻訳辞書を管理する
6. THE I18n_System SHALL ブログ記事コンテンツをLocale_Content_Directoryで管理し、`content/posts/en/`と`content/posts/ja/`にそれぞれの言語の記事を格納する
7. THE I18n_System SHALL 異なるLocale_Content_Directory内の同一スラッグのMDXファイルを同一記事のTranslation_Pairとして扱う
8. WHEN 同一スラッグのTranslation_Pairが他のロケールに存在する場合、THE Post_Detail_Page SHALL 他言語版への言語切り替えリンクを表示する
9. THE Post_List_Page SHALL 現在のロケールに対応するLocale_Content_Directoryの記事のみを表示する
10. WHEN ロケールプレフィックスなしのURLにアクセスした場合、THE I18n_System SHALL デフォルト言語（英語）にリダイレクトする
