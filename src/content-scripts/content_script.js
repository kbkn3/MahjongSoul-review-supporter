/**
 * Format and download in Ten-ho format
 * feature->Automatic login after screen transition, submitted to NAGA analysis
 */

/**
 * Format and download in Acochan Reviewer format
 * feature1->Automatic login after screen transition, submitted to Acochan analysis
 * feature2->Analyze in browser or locally?
 */

/**
 * Format and download in Stats format
 * feature->Display in text box
 */

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
