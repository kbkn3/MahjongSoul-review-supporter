export default defineBackground(() => {
    chrome.runtime.onInstalled.addListener(details => {
        if (details.reason === "install") {
            chrome.storage.local.set({
                MSLang: "0",
                DisplayLang: "0"
            });
            chrome.tabs.create({
                url: "options.html"
            });
        }
    });
});
