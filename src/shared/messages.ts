/**
 * Chrome Messaging API を用いたメッセージングユーティリティ
 */

import type { MessagePayload } from "./types";

/**
 * 拡張機能（バックグラウンドスクリプト）にメッセージを送信する
 */
export function sendMessage<T>(message: MessagePayload): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.error("[Light/Dark Toggle] Message error:", chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(response as T);
    });
  });
}

/**
 * メッセージ受信リスナーを登録する
 * 非同期処理を行う場合は callback 内で true を返すこと（sendResponse を保持するため）
 */
export function onMessage(
  callback: (
    message: MessagePayload,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => boolean | undefined | Promise<boolean | undefined>
): void {
  chrome.runtime.onMessage.addListener(
    (
      message: unknown,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => {
      // 型チェック: MessagePayload であることを検証
      if (!isMessagePayload(message)) {
        console.warn("[Light/Dark Toggle] Invalid message payload:", message);
        sendResponse(undefined);
        return false;
      }
      const result = callback(message, sender, sendResponse);
      // Promise の場合は true を返して sendResponse を保持（コールバック内で sendResponse を呼ぶこと）
      if (result instanceof Promise) {
        result.catch((err) => {
          console.error("[Light/Dark Toggle] Message handler error:", err);
          sendResponse(undefined);
        });
        return true;
      }
      return result ?? false;
    }
  );
}

/**
 * メッセージが MessagePayload 型かどうかを検証する
 */
function isMessagePayload(value: unknown): value is MessagePayload {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const obj = value as Record<string, unknown>;
  const validTypes = ["TOGGLE_MODE", "GET_MODE", "APPLY_MODE"];
  return (
    typeof obj.type === "string" &&
    validTypes.includes(obj.type) &&
    (obj.mode === undefined || obj.mode === "light" || obj.mode === "dark")
  );
}
