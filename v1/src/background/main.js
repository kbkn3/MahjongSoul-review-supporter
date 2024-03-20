
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason == "install") {
    // register langs
    chrome.storage.local.set({
      MSLang: "0",//ja
      DisplayLang: "0"//ja
    });
    chrome.tabs.create({
      url: 'options.html'
    });
  }
});
