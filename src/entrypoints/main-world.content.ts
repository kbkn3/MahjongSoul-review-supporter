import { GameRecordCapturer } from "@/lib/ws-capture";
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
    const capturer = new GameRecordCapturer();

    // WebSocket.prototype を差し替え、既存/新規ソケット双方の送受信を捕捉する
    const NativeWebSocket = window.WebSocket;
    const origAddEventListener = NativeWebSocket.prototype.addEventListener;
    const proto = NativeWebSocket.prototype as WebSocket;
    const origSend = proto.send;
    proto.send = function (this: WebSocket, ...args: Parameters<WebSocket["send"]>) {
      // 送信フレームから fetchGameRecord リクエストの index を拾う
      toUint8(args[0], (bytes) => capturer.observeSend(bytes));
      // 最初のsendで対象ソケットを特定し受信リスナを一度だけ付与する
      if (!(this as { __rsrHooked?: boolean }).__rsrHooked) {
        (this as { __rsrHooked?: boolean }).__rsrHooked = true;
        origAddEventListener.call(this, "message", ((ev: MessageEvent) => {
          const data = ev.data;
          if (data instanceof ArrayBuffer) capturer.observeRecv(data);
          else if (data instanceof Blob) data.arrayBuffer().then((b) => capturer.observeRecv(b));
        }) as EventListener);
      }
      return origSend.apply(this, args);
    };

    // bridgeからの要求で、捕捉済みの fetchGameRecord 応答を返す
    window.addEventListener("message", (event) => {
      if (event.source !== window || !event.data) return;
      if (event.data.direction !== RSR.GET_RECORD) return;
      const mode = event.data.mode as ReviewMode;
      const bytes = capturer.latest();
      if (!bytes) return;
      window.postMessage({ direction: RSR.RECORD, mode, bytes }, window.location.origin);
    });
  },
});

// WebSocket.send の引数を Uint8Array にして use に渡す。Blobは非同期だが、
// リクエスト送信→応答到着には往復があるため index 記録は応答処理に間に合う。
function toUint8(data: unknown, use: (bytes: Uint8Array) => void): void {
  if (typeof data === "string") return;
  if (data instanceof ArrayBuffer) {
    use(new Uint8Array(data));
  } else if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView;
    use(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
  } else if (data instanceof Blob) {
    data.arrayBuffer().then((b) => use(new Uint8Array(b)));
  }
}
