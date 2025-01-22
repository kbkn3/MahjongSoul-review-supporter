import type { PlasmoCSConfig } from "plasmo";
import type { GameRecord } from "~types/paifu";
import { parse } from "./dd";

export const config: PlasmoCSConfig = {
  matches: [
    "https://game.mahjongsoul.com/*",
    "https://mahjongsoul.game.yo-star.com/*",
    "https://game.maj-soul.net/*",
    "https://game.maj-soul.com/*",
  ],
  world: "MAIN"
}

declare global {
  const GameMgr: {
    Inst: {
      record_uuid: string;
      getClientVersion: () => string;
    }
  };
  const app: {
    NetAgent: {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      sendReq2Lobby: (type: string, command: string, data: any, callback: (err: any, res: any) => void) => void;
    }
  };
  const net: {
    MessageWrapper: {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      decodeMessage: (data: ArrayBuffer) => any;
    }
  };
}

console.log("ggg")

// Content Scriptで実行される関数
window.addEventListener("message", async (event) => {
  if (event.data.type === "FROM_POPUP_GET_PAIFU") {
    console.log("eee")
    // Main Worldで直接実行
    const uuid = GameMgr.Inst.record_uuid;
    if (!uuid) {
      window.postMessage({ type: "FROM_PAGE_PAIFU_DATA", data: { error: "No paifu data available" } }, "*");
      return;
    }

    app.NetAgent.sendReq2Lobby(
      "Lobby",
      "fetchGameRecord",
      {
        game_uuid: uuid,
        client_version_string: GameMgr.Inst.getClientVersion(),
      },
      (_, record: GameRecord) => {
        const results = parse(record);

        window.postMessage({
          type: "FROM_PAGE_PAIFU_DATA",
          data: {
            results,
            metadata: {
              uuid: record.head.uuid,
              timestamp: record.head.end_time,
            }
          }
        }, "*");
      }
    );
  }
});