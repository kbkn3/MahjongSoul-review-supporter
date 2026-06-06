<template>
  <div class="m-2">
    <div class="text-xl font-semibold m-2">mj-lab Settings / mj-lab 連携設定</div>
    <form @submit.prevent="save" class="ml-4">
      <label class="block m-1 text-base text-gray-700">
        mj-lab ベースURL (https)
        <input
          v-model="baseUrl"
          type="url"
          placeholder="https://mj-lab.example.com"
          class="block w-96 py-2 px-3 border border-gray-300 bg-white rounded-md"
        />
      </label>
      <label class="block m-1 text-base text-gray-700">
        ingest トークン
        <input
          v-model="token"
          type="password"
          class="block w-96 py-2 px-3 border border-gray-300 bg-white rounded-md"
        />
      </label>
      <div class="w-24 m-2">
        <button type="submit" class="my-button py-2 px-4">Set</button>
      </div>
    </form>
    <div class="pt-2 text-base whitespace-pre-wrap ml-4">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { isHttpsUrl, normalizeBaseUrl, originPattern } from "@/lib/mjlab-api";

const baseUrl = ref("");
const token = ref("");
const message = ref("");

chrome.storage.local.get(["mjlabBaseUrl", "mjlabToken"], (result) => {
  if (typeof result.mjlabBaseUrl === "string") baseUrl.value = result.mjlabBaseUrl;
  if (typeof result.mjlabToken === "string") token.value = result.mjlabToken;
});

const save = async () => {
  message.value = "";
  const normalized = normalizeBaseUrl(baseUrl.value);
  if (!isHttpsUrl(normalized)) {
    message.value = "https のURLを入力してください。";
    return;
  }
  const granted = await chrome.permissions.request({ origins: [originPattern(normalized)] });
  if (!granted) {
    message.value = "mj-lab ホストへのアクセス許可が必要です。";
    return;
  }
  chrome.storage.local.set({ mjlabBaseUrl: normalized, mjlabToken: token.value.trim() });
  baseUrl.value = normalized;
  message.value = "保存しました。";
};
</script>
