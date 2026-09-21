<template>
  <div>
    <div class="text-xl font-semibold m-2">Language Setting / 言語設定</div>
    <form @submit.prevent="setLang" class="ml-4 items-end">
      <InputSelect
        label="Mahjong Soul Sever Setting / 雀魂のサーバー設定"
        :options="options_server"
        v-model="MSLang"
        class="m-1"
      >
      </InputSelect>
      <ul class="m-2 list-disc">
        <li>雀魂 -じゃんたま-：日本語(game.mahjongsoul.com)</li>
        <li>Mahjong Soul: English/中文(繁體)/한국어 (mahjongsoul.game.yo-star.com)</li>
        <li>雀魂麻将：中文 (game.maj-soul.com/game.maj-soul.net)</li>
      </ul>
      <InputSelect
        label="Languages displayed by this extension / 拡張機能で表示する言語"
        :options="options"
        v-model="DisplayLang"
        class="m-1"
      ></InputSelect>
      <div class="w-24 m-2">
        <button type="submit" class="my-button py-2 px-4">Set</button>
      </div>
    </form>
    <div class="pt-2 text-base whitespace-pre-wrap">{{ messages }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import InputSelect from "@/options/InputSelect.vue";
import { useStoredLang } from "@/composables/useStoredLang";

const langList: Record<string, string> = {
  2: "Chinese",
  1: "English",
  0: "Japanese",
};
const options = Object.entries(langList).map(([key, value]) => ({
  key: value,
  value: key,
}));

const ServerList: Record<string, string> = {
  2: "雀魂麻将",
  1: "Mahjong Soul",
  0: "雀魂 -じゃんたま-",
};
const options_server = Object.entries(ServerList).map(([key, value]) => ({
  key: value,
  value: key,
}));

const messages = ref("");
const MSLang = useStoredLang("MSLang");
const DisplayLang = useStoredLang("DisplayLang");

const setLang = () => {
  messages.value = "";
  chrome.storage.local.set({
    MSLang: MSLang.value,
    DisplayLang: DisplayLang.value
  });
};
</script>
