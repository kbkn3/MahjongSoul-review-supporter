import { RSR } from "@/lib/messages";
import {
  originPattern,
  postIngest,
  type IngestPayload,
  type IngestResult,
} from "@/lib/mjlab-api";

interface IngestMessage {
  type: typeof RSR.INGEST;
  baseUrl: string;
  token: string;
  payload: IngestPayload;
}

async function handleIngest(message: IngestMessage): Promise<IngestResult> {
  // optional_host_permissions は拡張全体に付与されるが、設定したホストが未許可なら
  // fetch する前に明示エラーを返し、オプションでの許可取得へ誘導する。
  const granted = await chrome.permissions.contains({
    origins: [originPattern(message.baseUrl)],
  });
  if (!granted) {
    return { ok: false, status: 0, error: "permission_denied" };
  }
  return postIngest(message.baseUrl, message.token, message.payload);
}

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      chrome.storage.local.set({
        MSLang: "0",
        DisplayLang: "0",
      });
      chrome.tabs.create({
        url: "options.html",
      });
    }
  });

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request?.type !== RSR.INGEST) return false;
    handleIngest(request as IngestMessage).then(sendResponse);
    return true; // 非同期 sendResponse のためチャネルを開いたままにする
  });
});
