import type { PlasmoCSConfig } from "plasmo"

import parse from "./dd.mjs"

export const config: PlasmoCSConfig = {
  matches: [
    "https://game.mahjongsoul.com/*",
    "https://mahjongsoul.game.yo-star.com/*",
    "https://game.maj-soul.net/*",
    "https://game.maj-soul.com/*"
  ],
  world: "MAIN"
}

declare namespace app {
  export const NetAgent: any
}

declare namespace GameMgr {
  export const Inst: any
}
window.addEventListener("message", function (event) {
  if (
      event.source == window &&
      event.data &&
      event.data.direction == "from-page-script"
  ) {
      console.log(
          '2.Content script received message: "' + event.data.message + '"'
      );
      GetTenholog();
  }
});

function GetTenholog() {
  app.NetAgent.sendReq2Lobby(
    "Lobby",
    "fetchGameRecord",
    {
      game_uuid: GameMgr.Inst.record_uuid,
      client_version_string: GameMgr.Inst.getClientVersion()
    }, // anon edit 2
    function (i: any, record: any) {
      const results = parse(record)
      window.postMessage({ direction: "from-page", message: results }, "*");
    }
  )
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("tabNaga")
  switch (message.name) {
    case "tabNaga":
      console.log("tabNaga")
      app.NetAgent.sendReq2Lobby(
        "Lobby",
        "fetchGameRecord",
        {
          game_uuid: GameMgr.Inst.record_uuid,
          client_version_string: GameMgr.Inst.getClientVersion()
        }, // anon edit 2
        function (i: any, record: any) {
          const results = parse(record)
          sendResponse(results)
        }
      )
      break
  }
  return true
})
