/**
 * テーマモード（ライト / ダーク）
 */
export type ThemeMode = "light" | "dark";

/**
 * Chrome Storage に保存するデータの型
 */
export interface StorageData {
  mode: ThemeMode;
  enabled: boolean;
}

/**
 * バックグラウンドスクリプト間のメッセージペイロード
 */
export interface MessagePayload {
  type: "TOGGLE_MODE" | "GET_MODE" | "APPLY_MODE";
  mode?: ThemeMode;
}
