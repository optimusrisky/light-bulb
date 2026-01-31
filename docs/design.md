# ライト/ダークモード切り替え Chrome拡張機能 設計書

## 1. 概要

Web上のどの画面でも、拡張機能のボタンを押下することでライトモードとダークモードを切り替えられるGoogle Chrome拡張機能。

### 目的
- ユーザーが任意のWebサイトでダークモードを適用できるようにする
- シンプルな操作でライト/ダークモードを切り替え可能にする
- 設定を保持し、次回アクセス時も適用される

## 2. 機能要件

### 2.1 基本機能
- ✅ 拡張機能のアイコンボタンをクリックでライト/ダークモードを切り替え
- ✅ 現在のモード状態を視覚的に表示（アイコンやポップアップで）
- ✅ モード設定をブラウザのストレージに保存
- ✅ ページリロード後も設定を維持
- ✅ すべてのWebサイトで動作

### 2.2 動作仕様
- **ブラウザのネイティブな`color-scheme`プロパティを使用**
- 拡張機能独自のCSSは適用しない（ブラウザのネイティブ機能のみを使用）
- ダークモード適用時：`document.documentElement.style.colorScheme = 'dark'`を設定
  - ブラウザが自動的にUI要素（スクロールバー、フォームコントロール、選択範囲など）をダークモードに変更
  - サイトが`prefers-color-scheme`メディアクエリに対応している場合、自動的にダークモードスタイルが適用される
- ライトモード適用時：`document.documentElement.style.colorScheme = 'light'`を設定
  - ブラウザが自動的にUI要素をライトモードに変更
  - サイトが`prefers-color-scheme`メディアクエリに対応している場合、自動的にライトモードスタイルが適用される
- 拡張機能の設定は、ブラウザのシステム設定（`prefers-color-scheme`）を上書きする

## 3. 技術仕様

### 3.1 使用技術
- **Manifest V3**（Chrome拡張機能の最新仕様）
- **React 18+**（ポップアップUIの構築）
- **TypeScript 5+**（型安全性の確保）
- **Vite**（ビルドツール、開発サーバー）
- **Biome**（リンター・フォーマッター）
- **CSS Modules / Tailwind CSS**（スタイリング、オプション）
- **Chrome Storage API**（設定の永続化）
- **Content Scripts**（Webページへの`color-scheme`プロパティ設定）
- **@types/chrome**（Chrome拡張機能APIの型定義）

### 3.2 アーキテクチャ
```
┌─────────────────┐
│  Extension Icon │ ← ユーザーがクリック
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Background.js  │ ← モード状態を管理
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Content Script  │ ← ページにスタイルを注入
└─────────────────┘
```

## 4. ファイル構成

```
light-bulb/
├── public/
│   ├── manifest.json      # 拡張機能の設定ファイル（ビルド時にdistにコピー）
│   └── icons/             # アイコン画像
│       ├── icon16.png
│       ├── icon48.png
│       ├── icon128.png
│       ├── icon-light.png # ライトモード時のアイコン
│       └── icon-dark.png  # ダークモード時のアイコン
├── src/
│   ├── popup/             # ポップアップUI（React）
│   │   ├── Popup.tsx      # ポップアップのメインコンポーネント
│   │   ├── Popup.css      # ポップアップのスタイル
│   │   └── index.tsx      # エントリーポイント
│   ├── background/        # バックグラウンドスクリプト
│   │   ├── background.ts  # バックグラウンドスクリプト
│   │   └── types.ts       # 型定義
│   ├── content/           # コンテンツスクリプト
│   │   └── content.ts    # コンテンツスクリプト（ページに注入）
│   │                       # 注意: CSSファイルは不要（ブラウザのネイティブ機能のみ使用）
│   ├── shared/            # 共通コード
│   │   ├── types.ts       # 共通型定義
│   │   ├── storage.ts    # ストレージ操作のユーティリティ
│   │   └── messages.ts   # メッセージングのユーティリティ
│   └── vite-env.d.ts      # Viteの型定義
├── dist/                  # ビルド出力先（gitignoreに追加）
├── node_modules/          # 依存パッケージ
├── .gitignore
├── biome.json             # Biome設定
├── package.json           # 依存関係とスクリプト
├── tsconfig.json          # TypeScript設定
├── vite.config.ts         # Vite設定
└── README.md              # プロジェクト説明
```

## 5. 実装の流れ

### 5.1 初期化フロー
1. 拡張機能がインストールされる
2. `background.ts`（Service Worker）が起動し、ストレージから設定を読み込む
3. 各タブが開かれた際、`content.ts`が注入される
4. `content.ts`が現在のモード設定を確認し、適用する
5. ポップアップが開かれた際、Reactアプリがマウントされ、現在の状態を表示

### 5.2 モード切り替えフロー
1. ユーザーが拡張機能アイコンをクリック
2. ポップアップ（React）が表示される
3. ユーザーがポップアップ内の切り替えボタンをクリック
4. `background.ts`が現在のモードを取得
5. モードを反転（ライト→ダーク、ダーク→ライト）
6. ストレージに新しいモードを保存
7. すべてのアクティブなタブにメッセージを送信
8. 各タブの`content.ts`がメッセージを受信
9. ページの`document.documentElement.style.colorScheme`を設定（`'dark'`または`'light'`）
   - ブラウザが自動的にUI要素（スクロールバー、フォームコントロールなど）をダーク/ライトモードに変更
   - サイトが`prefers-color-scheme`に対応している場合、自動的に適切なスタイルが適用される
10. アイコンを更新
11. ポップアップのUIを更新（Reactの状態管理）

### 5.3 新規タブ開封時のフロー
1. 新しいタブが開かれる
2. `content.ts`が自動的に注入される（`document_start`で実行）
3. `background.ts`から現在のモード設定を取得
4. 設定に応じて`document.documentElement.style.colorScheme`を設定
   - ブラウザが自動的にUI要素をダーク/ライトモードに変更
   - サイトが`prefers-color-scheme`に対応している場合、自動的に適切なスタイルが適用される

## 6. UI/UX設計

### 6.1 アイコンデザイン
- **ライトモード時**: 明るい背景のアイコン（例：白背景に電球）
- **ダークモード時**: 暗い背景のアイコン（例：黒背景に電球）
- クリック時にアニメーション（オプション）

### 6.2 ポップアップ（React）
- Reactコンポーネントで構築
- 現在のモードを視覚的に表示（アイコン、テキスト）
- 切り替えボタン（トグルスイッチ形式）
- アニメーション効果（トランジション）
- 設定オプション（将来的な拡張用）

### 6.3 スタイル適用方法

**ブラウザのネイティブな`color-scheme`プロパティのみを使用**

- `document.documentElement.style.colorScheme = 'dark'`を設定（ダークモード時）
- `document.documentElement.style.colorScheme = 'light'`を設定（ライトモード時）
- または`<meta name="color-scheme" content="dark|light">`を注入（`document_start`で実行する場合）
- **拡張機能独自のCSSは適用しない**（ブラウザのネイティブ機能のみを使用）

**動作:**
- ブラウザのネイティブなUI要素（スクロールバー、フォームコントロール、選択範囲など）が自動的にダーク/ライトモードになる
- サイトが`prefers-color-scheme`メディアクエリに対応している場合、自動的に適切なスタイルが適用される
- サイトが`prefers-color-scheme`に対応していない場合でも、ブラウザのUI要素はダーク/ライトモードになる

**メリット:**
- パフォーマンスが良い（ブラウザネイティブ機能のみを使用）
- 互換性が高い
- サイトの既存スタイルを壊さない
- 実装がシンプル（CSSファイル不要）

## 7. 技術的な詳細

### 7.1 開発環境セットアップ

#### package.json の主要な依存関係
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.268",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@biomejs/biome": "^1.9.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vite-plugin-web-extension": "^4.1.0"
  }
}
```

#### Biome設定（biome.json）
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  }
}
```

#### Vite設定（vite.config.ts）
- マルチエントリーポイントの設定（popup, background, content）
- Chrome拡張機能用のビルド設定
- TypeScriptのサポート

### 7.2 manifest.json
```json
{
  "manifest_version": 3,
  "name": "Light/Dark Mode Toggle",
  "version": "1.0.0",
  "description": "Web上のどの画面でもライト/ダークモードを切り替え",
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_start",
      "all_frames": false
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "web_accessible_resources": []
}
```

#### manifest.jsonのフィールド説明

**icons（拡張機能のアイコン）**
- 拡張機能全体のアイコンを定義するフィールド
- Chrome拡張機能の管理画面（`chrome://extensions/`）で表示される
- Chrome Web Storeでの表示にも使用される
- 推奨サイズ: 16x16, 48x48, 128x128（ピクセル）
- 128x128は必須（Chrome Web Store公開時に必要）

**action.default_icon（ツールバーアイコン）**
- ブラウザのツールバーに表示されるアイコン
- ユーザーがクリックするアイコン
- 動的に変更可能（`chrome.action.setIcon()`で変更）
- サイズ: 16x16, 19x19, 38x38, 48x48, 128x128（推奨）

**違い**
- `icons`: 拡張機能全体のアイコン（管理画面、Web Store）
- `action.default_icon`: ツールバーに表示されるアイコン（ユーザーが操作するアイコン）
- 通常は同じアイコンを使用するが、`action.default_icon`は動的に変更可能

#### manifest.jsonのベストプラクティス
- **host_permissions**: `<all_urls>`を明示的に記載（Manifest V3の要件）
- **content_security_policy**: 拡張機能ページ用のCSPを設定（セキュリティ強化）
- **all_frames**: `false`に設定してメインフレームのみに注入（パフォーマンス向上）
- **web_accessible_resources**: 外部からアクセス可能なリソースを明示（必要に応じて）
- **icons**: 128x128は必須、PNG形式を推奨

### 7.3 TypeScript型定義

#### ストレージ構造（shared/types.ts）
```typescript
export type ThemeMode = "light" | "dark";

export interface StorageData {
  mode: ThemeMode;
  enabled: boolean;
}

export interface MessagePayload {
  type: "TOGGLE_MODE" | "GET_MODE" | "APPLY_MODE";
  mode?: ThemeMode;
}
```

#### Chrome API型定義
- `@types/chrome`パッケージを使用
- Chrome拡張機能APIの型安全性を確保

### 7.4 ストレージ構造
```typescript
{
  mode: "dark" | "light",  // 現在のモード
  enabled: true | false     // 拡張機能が有効かどうか
}
```

### 7.5 メッセージング
- `background.ts` ↔ `content.ts`: Chrome Messages APIを使用
- `popup.tsx` ↔ `background.ts`: ポップアップとバックグラウンドの通信
- メッセージタイプ（型安全）:
  - `TOGGLE_MODE`: モード切り替え
  - `GET_MODE`: 現在のモード取得
  - `APPLY_MODE`: モード適用

#### メッセージングユーティリティ（shared/messages.ts）
```typescript
export const sendMessage = async <T>(
  message: MessagePayload
): Promise<T> => {
  try {
    const response = await chrome.runtime.sendMessage(message);
    if (chrome.runtime.lastError) {
      throw new Error(chrome.runtime.lastError.message);
    }
    return response as T;
  } catch (error) {
    console.error("Failed to send message:", error);
    throw error;
  }
};

export const onMessage = (
  callback: (message: MessagePayload, sender: chrome.runtime.MessageSender, sendResponse: (response?: unknown) => void) => boolean | void
): void => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const result = callback(message, sender, sendResponse);
    // 非同期処理の場合はtrueを返す
    return result === true || result === undefined;
  });
};
```

#### メッセージングのベストプラクティス
- **エラーハンドリング**: `chrome.runtime.lastError`をチェック
- **非同期処理**: 非同期処理がある場合は`true`を返して`sendResponse`を保持
- **型安全性**: メッセージの型を厳密に定義

### 7.6 Reactコンポーネント構造

#### Popup.tsx
```typescript
import { useState, useEffect } from "react";
import { ThemeMode } from "../shared/types";
import { getMode, toggleMode } from "../shared/storage";

export const Popup: React.FC = () => {
  const [mode, setMode] = useState<ThemeMode>("light");
  
  useEffect(() => {
    // 初期状態を取得
    getMode().then(setMode);
  }, []);
  
  const handleToggle = async () => {
    const newMode = await toggleMode();
    setMode(newMode);
  };
  
  return (
    <div className="popup-container">
      <h2>テーマ切り替え</h2>
      <button onClick={handleToggle}>
        {mode === "dark" ? "ライトモード" : "ダークモード"}
      </button>
    </div>
  );
};
```

### 7.7 ダークモードスタイルの実装

**ブラウザのネイティブな`color-scheme`プロパティのみを使用（CSSファイル不要）**

**content.tsでの実装:**
```typescript
// ダークモードを適用
function applyDarkMode() {
  document.documentElement.style.colorScheme = 'dark';
}

// ライトモードを適用
function applyLightMode() {
  document.documentElement.style.colorScheme = 'light';
}

// モード切り替え
function toggleMode(mode: ThemeMode) {
  if (mode === 'dark') {
    applyDarkMode();
  } else {
    applyLightMode();
  }
}
```

**または、metaタグを注入（document_startで実行する場合）:**
```typescript
function applyColorScheme(mode: 'dark' | 'light') {
  // 既存のmetaタグを削除
  const existingMeta = document.querySelector('meta[name="color-scheme"]');
  if (existingMeta) {
    existingMeta.remove();
  }
  
  // 新しいmetaタグを追加
  const meta = document.createElement('meta');
  meta.name = 'color-scheme';
  meta.content = mode;
  document.head.appendChild(meta);
}
```

**動作の仕組み:**
1. `color-scheme`プロパティを設定すると、ブラウザが自動的にUI要素（スクロールバー、フォームコントロール、選択範囲など）をダーク/ライトモードに変更
2. サイトが`prefers-color-scheme`メディアクエリに対応している場合、`@media (prefers-color-scheme: dark)`のスタイルが自動的に適用される
3. サイトが`prefers-color-scheme`に対応していない場合でも、ブラウザのUI要素はダーク/ライトモードになる

**メリット:**
- パフォーマンスが良い（ブラウザネイティブ機能のみを使用）
- 互換性が高い
- サイトの既存スタイルを壊さない
- 実装がシンプル（CSSファイル不要）
- メンテナンスが容易

**注意:**
- サイトが`prefers-color-scheme`に対応していない場合、コンテンツの色は変更されない（ブラウザのUI要素のみ変更される）
- これは意図的な設計で、サイトの既存スタイルを尊重するため

## 8. 実装の注意点

### 8.1 ビルドと開発
- Viteを使用して開発サーバーでホットリロード
- 本番ビルド時は`dist`フォルダに出力
- Chrome拡張機能として`dist`フォルダを読み込む
- Biomeでコード品質を維持（lint、format）

### 8.2 TypeScriptの活用
- すべてのスクリプトをTypeScriptで記述
- 型定義を活用してバグを防止
- `@types/chrome`でChrome APIの型安全性を確保

### 8.3 Reactの使用
- ポップアップUIのみReactを使用
- Content ScriptとBackground ScriptはVanilla TypeScript
- Reactのバンドルサイズを最小限に（必要に応じて最適化）

### 8.4 パフォーマンス
- `color-scheme`プロパティの設定のみで、非常に軽量
- ブラウザのネイティブ機能を使用するため、パフォーマンスへの影響が最小限
- 不要なDOM操作を避ける（`color-scheme`プロパティの設定のみ）
- メッセージングは最小限に
- Reactコンポーネントの再レンダリングを最適化

### 8.5 互換性
- すべてのWebサイトで動作する（`color-scheme`プロパティは標準的なCSSプロパティ）
- 既存のスタイルを壊さない（拡張機能独自のCSSは適用しない）
- サイトが`prefers-color-scheme`メディアクエリに対応している場合、自動的に適切なスタイルが適用される
- サイトが`prefers-color-scheme`に対応していない場合でも、ブラウザのUI要素（スクロールバー、フォームコントロールなど）はダーク/ライトモードになる

### 8.6 セキュリティ
- Content Security Policy (CSP) に準拠
- 外部リソースへのアクセスを制限
- ユーザーデータの収集は行わない
- `eval()`や`new Function()`などの動的コード実行を避ける
- 外部スクリプトの読み込みを禁止（CSPで制御）

### 8.7 Service Workerのライフサイクル
- Service Workerはアイドル時に自動的に停止する可能性がある
- 状態は`chrome.storage`に保存し、起動時に復元する
- 長時間実行が必要な処理は`chrome.alarms`を使用
- イベントリスナーは同期的に登録する必要がある

### 8.8 エラーハンドリング
- すべての非同期操作（ストレージ、メッセージング）でエラーハンドリングを実装
- ユーザーに分かりやすいエラーメッセージを表示
- ログ出力は開発時のみ有効化（本番では最小限に）

### 8.9 アイコンの動的更新
- `chrome.action.setIcon()`でアイコンを動的に更新
- モード切り替え時にアイコンも更新して視覚的フィードバックを提供
- アイコンパスは相対パスまたはImageDataオブジェクトを使用

## 9. 今後の拡張機能（オプション）

- カスタムカラーテーマの設定
- 特定のサイトを除外リストに追加
- 自動切り替え（時間帯による）
- アニメーション効果
- より細かいスタイル調整オプション

## 10. 開発ワークフロー

### 10.1 セットアップ
```bash
npm install
```

### 10.2 開発
```bash
npm run dev        # 開発モード（ホットリロード）
npm run build      # 本番ビルド
npm run lint       # Biomeでlintチェック
npm run format     # Biomeでフォーマット
```

### 10.3 Chrome拡張機能の読み込み
1. Chromeで`chrome://extensions/`を開く
2. 「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `dist`フォルダを選択

## 11. Chrome拡張機能開発のベストプラクティス

### 11.1 最小権限の原則
- 必要な権限のみを要求（`storage`と`activeTab`で十分）
- `host_permissions`は`<all_urls>`を使用（全サイト対応のため必要）
- 将来的に権限を追加する場合は、ユーザーに明確な説明を提供

### 11.2 パフォーマンス最適化
- Content Scriptは必要最小限のコードのみを注入
- スタイル注入は軽量に保つ（CSSファイルを使用）
- Reactバンドルサイズを最適化（必要に応じてコード分割）
- Service Workerは軽量に保ち、アイドル時に停止可能にする

### 11.3 セキュリティ
- CSPを適切に設定（`script-src 'self'`など）
- 外部リソースへのアクセスを制限
- ユーザー入力の検証とサニタイゼーション
- ストレージデータの暗号化（必要に応じて）

### 11.4 ユーザー体験
- エラーメッセージを分かりやすく表示
- ローディング状態を適切に表示
- アニメーションやトランジションで視覚的フィードバックを提供
- アクセシビリティを考慮（キーボード操作、スクリーンリーダー対応）

### 11.5 コード品質
- TypeScriptで型安全性を確保
- Biomeでコード品質を維持
- エラーハンドリングを適切に実装
- コメントとドキュメントを充実させる

### 11.6 Manifest V3の要件遵守
- Service Workerを使用（Background Pageは非推奨）
- `chrome.storage`を使用（`localStorage`は使用不可）
- `fetch()`を使用（`XMLHttpRequest`は非推奨）
- イベントリスナーを同期的に登録
- リモートコードの実行を避ける

## 12. テスト項目

- [ ] アイコンクリックでポップアップが表示される
- [ ] ポップアップ内のボタンでモード切り替えが動作する
- [ ] 設定がストレージに保存される
- [ ] ページリロード後も設定が維持される
- [ ] 複数のタブで同時に動作する
- [ ] 様々なWebサイトで正常に動作する
- [ ] パフォーマンスへの影響が少ない
- [ ] TypeScriptの型チェックが通る
- [ ] Biomeのlintチェックが通る
- [ ] Reactコンポーネントが正常に動作する
- [ ] Service Workerが正常に動作する（アイドル時の停止・復帰）
- [ ] エラーハンドリングが適切に実装されている
- [ ] CSPに準拠している
- [ ] アイコンの動的更新が動作する
- [ ] メッセージングのエラーハンドリングが動作する

---

**作成日**: 2026年1月28日  
**バージョン**: 1.0.0
