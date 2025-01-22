import type { PlasmoCSConfig } from "plasmo"
import type { PlasmoMessaging } from "@plasmohq/messaging";

export const config: PlasmoCSConfig = {
  matches: [
    "https://game.mahjongsoul.com/*",
    "https://mahjongsoul.game.yo-star.com/*",
    "https://game.maj-soul.net/*",
    "https://game.maj-soul.com/*",
  ]
}
console.log("fff")
// Popupからのメッセージを受け取るハンドラー
export const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("hhh")
  if (req.name !== "getPaifu") {
    return;
  }
  console.log("ddd")
  // Main Worldにメッセージを送信
  window.postMessage({ type: "FROM_POPUP_GET_PAIFU" }, "*");

  // Main Worldからの応答を待つ
  const response = await new Promise<{
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    mjsLog?: any[];
    error?: string;
    metadata?: {
      uuid: string;
      timestamp: number;
    }
  }>((resolve) => {
    const handler = (event) => {
      if (event.data.type === "FROM_PAGE_PAIFU_DATA") {
        window.removeEventListener("message", handler);
        resolve(event.data.data);
      }
    };
    window.addEventListener("message", handler);
  });

  if (response.error) {
    res.send({ error: response.error });
    return;
  }

  res.send({
    paifu: response.mjsLog,
    metadata: response.metadata
  });
};
