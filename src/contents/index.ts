import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: [
    "https://game.mahjongsoul.com/*",
    "https://mahjongsoul.game.yo-star.com/*",
    "https://game.maj-soul.net/*",
    "https://game.maj-soul.com/*"
  ],
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  sendResponse(request.message);
  if (request.message == "tabNaga") {
    window.postMessage(
      { direction: "from-page-script", message: "Message from the page" },
      "*"
    );
  }
  if (request.message == "tabMjai") {
    window.postMessage(
      { direction: "from-page-script_uuid", message: "Message from the page_uuid" },
      "*"
    );
  }
});

window.addEventListener("message", function (event) {
  if (event.data && event.data.direction == "from-page") {
    console.log(event.data.message);
    chrome.runtime.sendMessage(
      { message: event.data.message },
      function (response) {
        console.log("5." + response);
      }
    );
  }
});
