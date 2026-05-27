import { RSR } from "@/lib/messages";
import { decodeGameRecord } from "@/lib/record-decode";
import { parse } from "@/content-scripts/dd";

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

    // bridgeから受けた生バイトをデコード・parseし、旧bridgeと同じ {message: tenhou} 形で
    // 再ブロードキャストする。これによりpopupの既存onMessageリスナ(Naga/Mjai/Recipe)を改修不要で活かす
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
        if (request?.type !== RSR.DECODE_RECORD) return false;
        try {
            const raw = Uint8Array.from(request.bytes as number[]);
            const decoded = decodeGameRecord(raw);
            const tenhou = parse(decoded);
            chrome.runtime.sendMessage({ message: tenhou });
            sendResponse({ ok: true });
        } catch (error) {
            console.error("decode record failed", error);
            sendResponse({ ok: false });
        }
        return false;
    });
});
