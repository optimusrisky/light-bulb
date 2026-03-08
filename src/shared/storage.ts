/**
 * Chrome Storage API を用いたストレージ操作ユーティリティ
 */

import type { StorageData, ThemeMode } from "./types";

/** ストレージに保存するキー */
const STORAGE_KEY = "theme";

/** 初回起動時のデフォルト値 */
const DEFAULT_STORAGE_DATA: StorageData = {
  mode: "light",
  enabled: true,
};

/**
 * 現在のモードを取得する
 */
export async function getMode(): Promise<ThemeMode> {
  const data = await getStorageData();
  return data.mode;
}

/**
 * ストレージデータ全体を取得する
 */
export async function getStorageData(): Promise<StorageData> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      if (chrome.runtime.lastError) {
        console.error("[Light/Dark Toggle] Storage get error:", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }
      const data = result[STORAGE_KEY] as StorageData | undefined;
      resolve(data ?? { ...DEFAULT_STORAGE_DATA });
    });
  });
}

/**
 * モードを設定する
 */
export async function setMode(mode: ThemeMode): Promise<void> {
  const data = await getStorageData();
  await setStorageData({ ...data, mode });
}

/**
 * モードを切り替える（light ↔ dark）
 */
export async function toggleMode(): Promise<ThemeMode> {
  const data = await getStorageData();
  const newMode: ThemeMode = data.mode === "light" ? "dark" : "light";
  await setStorageData({ ...data, mode: newMode });
  return newMode;
}

/**
 * ストレージデータを設定する
 */
export async function setStorageData(data: StorageData): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
      if (chrome.runtime.lastError) {
        console.error("[Light/Dark Toggle] Storage set error:", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }
      resolve();
    });
  });
}
