<template>
  <div class="template-box">
    <div class="template-title">mj-lab</div>
    <div class="px-2 py-2">
      <p v-if="!configured" class="text-sm text-mjsoul-text-lightblue mb-2">
        オプションで mj-lab URL とトークンを設定してください。
        <a class="underline" href="#" @click.prevent="openOption">設定を開く</a>
      </p>
      <p v-else-if="!hasRef" class="text-sm text-mjsoul-text-lightblue mb-2">
        牌譜を読み込めていません。
      </p>
      <button
        type="button"
        class="my-button"
        :disabled="!canSubmit || busy"
        @click="submit"
      >
        {{ busy ? "送信中..." : "mj-labに登録" }}
      </button>
      <p v-if="statusMessage" class="text-sm text-mjsoul-text-lightblue mt-2 whitespace-pre-wrap">
        {{ statusMessage }}
      </p>
      <ul v-if="candidates.length" class="mt-2">
        <li v-for="candidate in candidates" :key="candidate.shareToken" class="my-1">
          <a class="underline text-mjsoul-text-lightblue" :href="candidate.url" target="_blank">
            {{ candidate.title }}
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { RSR } from "@/lib/messages";
import { buildIngestPayload, describeIngestError } from "@/lib/mjlab-api";
import type { IngestCandidate, IngestResult } from "@/lib/mjlab-api";
import type { TenhouMessage } from "@/lib/naga";

const baseUrl = ref("");
const token = ref("");
const msLang = ref(0);
// NagaList の onMessage リスナとは別に受け取り、破壊的変換前のクリーンな TenhouMessage を保持する。
const message = ref<TenhouMessage | null>(null);
const statusMessage = ref("");
const candidates = ref<IngestCandidate[]>([]);
const busy = ref(false);

chrome.storage.local.get(["mjlabBaseUrl", "mjlabToken", "MSLang"], (result) => {
  if (typeof result.mjlabBaseUrl === "string") baseUrl.value = result.mjlabBaseUrl;
  if (typeof result.mjlabToken === "string") token.value = result.mjlabToken;
  if (typeof result.MSLang !== "undefined") msLang.value = Number(result.MSLang);
});

const configured = computed(() => Boolean(baseUrl.value && token.value));
const hasRef = computed(() => Boolean(message.value?.ref));
const canSubmit = computed(() => configured.value && hasRef.value);

// NagaList などのリスナは受信した message を共有オブジェクトとしてインプレース変換する
// (fixScoreRonTileWasReachTile が message.log の点棒デルタを書き換える等)。
// setup 実行時に登録することで全 onMounted より先にこのリスナが走り、変換前の message を観測できる。
// さらに structuredClone でスナップショットを取り、以降の他リスナによる変換から隔離する。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onMessageListener = (request: any) => {
  if (request?.message && typeof request.message === "object" && "log" in request.message) {
    message.value = structuredClone(request.message) as TenhouMessage;
  }
};
chrome.runtime.onMessage.addListener(onMessageListener);

onUnmounted(() => {
  chrome.runtime.onMessage.removeListener(onMessageListener);
});

const openOption = () => {
  chrome.tabs.create({ url: "options.html" });
};

const submit = async () => {
  if (!message.value) return;
  busy.value = true;
  statusMessage.value = "";
  candidates.value = [];
  try {
    const payload = buildIngestPayload(message.value, msLang.value);
    const result: IngestResult = await chrome.runtime.sendMessage({
      type: RSR.INGEST,
      baseUrl: baseUrl.value,
      token: token.value,
      payload,
    });
    if (result.ok) {
      statusMessage.value = result.merged ? "登録しました（既存対局にマージ）。" : "登録しました。";
      chrome.tabs.create({ url: result.reviewUrl });
      return;
    }
    statusMessage.value = describeIngestError(result);
    if (result.candidates) candidates.value = result.candidates;
  } catch {
    statusMessage.value = "送信に失敗しました。拡張機能を再読み込みしてください。";
  } finally {
    busy.value = false;
  }
};
</script>
