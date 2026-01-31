# light-bulb

**Web上のどの画面でもライト/ダークモードを切り替えられる Chrome 拡張機能**（Light/Dark Mode Toggle）のプロジェクトです。

## 概要

任意の Web サイトで、拡張機能のアイコン（またはポップアップ）からワンクリックでライトモードとダークモードを切り替えられます。設定はブラウザのストレージに保存され、ページをリロードしたり次回アクセスしたりしても維持されます。

### 主な特徴

- **シンプルな操作** — アイコンクリックでポップアップを開き、そこでモードを切り替え
- **すべてのサイトで動作** — `<all_urls>` に対応したコンテンツスクリプトで全ページに適用
- **ブラウザネイティブの `color-scheme` を利用** — 独自の CSS を注入せず、`document.documentElement.style.colorScheme` を `'light'` / `'dark'` に設定するだけ
  - スクロールバー・フォームコントロール・選択範囲などがブラウザ標準でダーク/ライトに
  - サイトが `prefers-color-scheme` に対応していれば、そのスタイルが自動で切り替わる
- **設定の永続化** — Chrome Storage API でモードを保存し、新規タブやリロード後も同じ設定を適用

### 技術スタック（設計）

| 項目 | 技術 |
|------|------|
| 拡張機能仕様 | Manifest V3 |
| ポップアップ UI | React 18+ |
| 言語・型 | TypeScript 5+ |
| ビルド | Vite |
| コード品質 | Biome（Lint / Format） |
| 設定保存 | Chrome Storage API |
| ページへの反映 | Content Script（`color-scheme` の設定のみ） |

### アーキテクチャ（概要）

```
Extension Icon（クリック）
    → Background（Service Worker）：モード状態の管理・ストレージ・アイコン更新
    → Content Script：各タブの document に color-scheme を設定
```

ポップアップは React で実装し、現在のモード表示と切り替えボタンを提供します。

## ドキュメント

- **[design.md](./docs/design.md)** — 機能要件・技術仕様・ファイル構成・UI/UX・実装フローなど設計の詳細
- **[development-todos.md](./docs/development-todos.md)** — フェーズ別の開発 TODO（環境構築〜実装・テスト）
- **[manifest-guide.md](./docs/manifest-guide.md)** — `manifest.json` の各項目の解説（Manifest V3 向け）

## 開発・ビルド（予定）

設計・TODO に従い、次のようなスクリプトを想定しています。

- `npm run dev` — 開発モード（watch ビルドなど）
- `npm run build` — 本番用ビルド（出力先: `dist/`）
- `npm run lint` / `npm run format` — Biome による Lint・フォーマット

実際のセットアップ手順は [development-todos.md](./docs/development-todos.md) のフェーズ1を参照してください。

## ライセンス

（未定）
