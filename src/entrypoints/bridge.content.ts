// src/entrypoints/bridge.content.ts
import { RSR, type ReviewMode } from "@/lib/messages";

export default defineContentScript({
  matches: [
    "https://game.mahjongsoul.com/*",
    "https://mahjongsoul.game.yo-star.com/*",
    "https://game.maj-soul.net/*",
    "https://game.maj-soul.com/*",
  ],
  main() {
    // popup起点のトリガを受け、MAIN worldへ最新record要求を投げる
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      const mode: ReviewMode | null =
        request.message === "tabNaga" ? "naga"
        : request.message === "tabMjai" ? "mjai"
        : null;
      if (mode) {
        window.postMessage({ direction: RSR.GET_RECORD, mode }, window.location.origin);
      }
      sendResponse(request.message);
      return false;
    });

    // MAIN worldが返した生バイトを background へ転送しデコードを依頼
    window.addEventListener("message", (event) => {
      if (event.source !== window || event.origin !== location.origin) return;
      if (!event.data || event.data.direction !== RSR.RECORD) return;
      const { bytes, mode } = event.data as { bytes: ArrayBuffer; mode: ReviewMode };
      chrome.runtime.sendMessage(
        { type: RSR.DECODE_RECORD, bytes: Array.from(new Uint8Array(bytes)), mode },
        (response) => {
          console.log("5." + (response?.ok ? "decoded" : "failed"));
        }
      );
    });
  },
});
