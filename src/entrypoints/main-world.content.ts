import { RecordCache } from "@/lib/ws-capture";
import { RSR, type ReviewMode } from "@/lib/messages";

export default defineContentScript({
  matches: [
    "https://game.mahjongsoul.com/*",
    "https://mahjongsoul.game.yo-star.com/*",
    "https://game.maj-soul.net/*",
    "https://game.maj-soul.com/*",
  ],
  world: "MAIN",
  runAt: "document_start", // Unityがソケットを開く前にフックを仕込む
  main() {
    const cache = new RecordCache();

    // WebSocket.prototype を差し替え、既存/新規ソケット双方の受信を捕捉する
    const NativeWebSocket = window.WebSocket;
    const origAddEventListener = NativeWebSocket.prototype.addEventListener;
    const proto = NativeWebSocket.prototype as WebSocket;
    const origSend = proto.send;
    proto.send = function (this: WebSocket, ...args: Parameters<WebSocket["send"]>) {
      // 最初のsendで対象ソケットを特定し受信リスナを一度だけ付与する
      if (!(this as { __rsrHooked?: boolean }).__rsrHooked) {
        (this as { __rsrHooked?: boolean }).__rsrHooked = true;
        origAddEventListener.call(this, "message", ((ev: MessageEvent) => {
          const data = ev.data;
          if (data instanceof ArrayBuffer) {
            cache.offer(data);
          } else if (data instanceof Blob) {
            data.arrayBuffer().then((b) => cache.offer(b));
          }
        }) as EventListener);
      }
      return origSend.apply(this, args);
    };

    // bridge からの要求でキャッシュした最新応答を返す
    window.addEventListener("message", (event) => {
      if (event.source !== window || !event.data) return;
      if (event.data.direction !== RSR.GET_RECORD) return;
      const mode = event.data.mode as ReviewMode;
      const bytes = cache.latest();
      if (!bytes) return;
      window.postMessage(
        { direction: RSR.RECORD, mode, bytes },
        window.location.origin
      );
    });
  },
});
