# 要件定義書

## はじめに

個別ブログ記事ページの末尾に、前の記事・次の記事へ移動するためのナビゲーションボタンを追加する機能。記事は日付順（新しい順）でソートされ、ナビゲーションは同一ロケール内の記事間で遷移する。各ボタンには遷移先の記事タイトルを表示し、タイトルが長い場合は省略記号（...）で切り詰める。

## 用語集

- **Navigation_Component**: 個別記事ページの末尾に表示される、前後の記事へのリンクを含むUIコンポーネント
- **Post_List**: 同一ロケール内の全ブログ記事を日付降順でソートしたリスト
- **Current_Post**: ユーザーが現在閲覧しているブログ記事
- **Previous_Post**: Post_List上でCurrent_Postの1つ後（古い記事）に位置する記事
- **Next_Post**: Post_List上でCurrent_Postの1つ前（新しい記事）に位置する記事
- **Content_Loader**: MDXファイルからブログ記事を読み込むモジュール（ローカル/GitHub対応）
- **Truncation**: 表示領域に収まらないタイトルテキストを省略記号（...）で切り詰める処理

## 要件

### 要件 1: 前後記事の取得

**ユーザーストーリー:** ブログ読者として、現在の記事の前後の記事情報を取得したい。それにより、記事間をスムーズに移動できるようになる。

#### 受け入れ基準

1. WHEN ユーザーがブログ記事ページを表示した時、THE Content_Loader SHALL 同一ロケール内の全記事を日付降順で取得し、Current_Postの前後の記事を特定する
2. WHEN Current_Postがpost_Listの最後の記事（最も古い記事）である時、THE Content_Loader SHALL Previous_Postとしてnullを返す
3. WHEN Current_PostがPost_Listの最初の記事（最も新しい記事）である時、THE Content_Loader SHALL Next_Postとしてnullを返す
4. THE Content_Loader SHALL Previous_PostおよびNext_Postとして、記事のslugとtitleを返す

### 要件 2: ナビゲーションコンポーネントの表示

**ユーザーストーリー:** ブログ読者として、記事の末尾にナビゲーションボタンを見たい。それにより、前後の記事へ簡単に移動できるようになる。

#### 受け入れ基準

1. WHEN ブログ記事ページが表示された時、THE Navigation_Component SHALL 記事本文の直後に表示される
2. WHEN Previous_Postが存在する時、THE Navigation_Component SHALL 左側に「前の記事」リンクとPrevious_Postのタイトルを表示する
3. WHEN Next_Postが存在する時、THE Navigation_Component SHALL 右側に「次の記事」リンクとNext_Postのタイトルを表示する
4. WHEN Previous_Postが存在しない時、THE Navigation_Component SHALL 左側の「前の記事」リンクを表示しない
5. WHEN Next_Postが存在しない時、THE Navigation_Component SHALL 右側の「次の記事」リンクを表示しない
6. WHEN Previous_PostとNext_Postの両方が存在しない時、THE Navigation_Component SHALL ナビゲーション領域全体を表示しない

### 要件 3: タイトルの切り詰め表示

**ユーザーストーリー:** ブログ読者として、長いタイトルがレイアウトを崩さずに表示されてほしい。それにより、ナビゲーション領域が常に整った見た目を保てる。

#### 受け入れ基準

1. THE Navigation_Component SHALL 記事タイトルを1行で表示する
2. WHEN タイトルのテキストが表示領域の幅を超える時、THE Navigation_Component SHALL テキストを省略記号（...）で切り詰めて表示する
3. THE Navigation_Component SHALL CSSのtext-overflowプロパティを使用してTruncationを実現する

### 要件 4: ナビゲーションリンクの遷移

**ユーザーストーリー:** ブログ読者として、ナビゲーションボタンをクリックして前後の記事に移動したい。それにより、記事一覧に戻らずに連続して記事を読める。

#### 受け入れ基準

1. WHEN ユーザーが「前の記事」リンクをクリックした時、THE Navigation_Component SHALL Previous_Postのブログ記事ページ（`/{locale}/blog/{slug}`）へ遷移する
2. WHEN ユーザーが「次の記事」リンクをクリックした時、THE Navigation_Component SHALL Next_Postのブログ記事ページ（`/{locale}/blog/{slug}`）へ遷移する
3. THE Navigation_Component SHALL Next.jsのLinkコンポーネントを使用してクライアントサイドナビゲーションを実現する

### 要件 5: 多言語対応

**ユーザーストーリー:** ブログ読者として、ナビゲーションのラベルが閲覧中の言語で表示されてほしい。それにより、一貫した言語体験が得られる。

#### 受け入れ基準

1. THE Navigation_Component SHALL 「前の記事」「次の記事」のラベルテキストを現在のロケールの辞書から取得して表示する
2. THE Navigation_Component SHALL 同一ロケール内の記事のみをナビゲーション対象とする

### 要件 6: レスポンシブデザイン

**ユーザーストーリー:** ブログ読者として、モバイルでもデスクトップでもナビゲーションを快適に使いたい。それにより、どのデバイスでも記事間を移動できる。

#### 受け入れ基準

1. THE Navigation_Component SHALL モバイル画面幅（640px未満）で前の記事と次の記事を縦に積み重ねて表示する
2. THE Navigation_Component SHALL デスクトップ画面幅（640px以上）で前の記事と次の記事を横に並べて表示する
