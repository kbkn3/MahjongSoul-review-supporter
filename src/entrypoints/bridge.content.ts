import { RSR, type ReviewMode } from "@/lib/messages";
import { decodeGameRecord } from "@/lib/record-decode";
import { parse } from "@/content-scripts/dd";

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

    // MAIN worldが返した生バイトを、この content script(ISOLATED world) でデコード・parseする。
    // protobufjs は new Function(eval相当) を使うため eval を禁じる MV3 の service worker(background)では動かない。
    // content script の isolated world はその CSP 制約を受けないのでここで処理する。
    // 結果は旧実装と同形の {message: tenhou} でブロードキャストし、popup の既存リスナ(Naga/Mjai/Recipe)が受け取る。
    window.addEventListener("message", (event) => {
      if (event.source !== window || event.origin !== location.origin) return;
      if (!event.data || event.data.direction !== RSR.RECORD) return;
      const { bytes } = event.data as { bytes: ArrayBuffer; mode: ReviewMode };
      try {
        const tenhou = parse(decodeGameRecord(new Uint8Array(bytes)));
        chrome.runtime.sendMessage({ message: tenhou });
      } catch (error) {
        console.error("decode/parse failed", error);
      }
    });
  },
});
