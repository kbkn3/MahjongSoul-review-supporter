<template>
  <div class="template-box">
    <div class="template-title">Motal/Acochan</div>
    <div v-if="seki.length > 3">
      <div class="text-base font-semibold text-mjsoul-text-lightblue py-2">
        Which is your name?
      </div>

      <div v-for="n in (seki.length - 1)" :key="n">
        <button type="button" class="my-button my-1" @click="submitMjai(n)">{{ seki[n] }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive } from 'vue';
import { useStoredLang } from "@/composables/useStoredLang";

// 先頭のダミー要素でインデックスを1-basedにする（mjai側のselect optionインデックスと合わせるため）
const seki = reactive([""]);
let MjaiURLstring = "";

const MSLang = useStoredLang("MSLang");
const DisplayLang = useStoredLang("DisplayLang");

const url_head = [
  'https://game.mahjongsoul.com/?paipu=',
  'https://mahjongsoul.game.yo-star.com/?paipu=',
  'https://game.maj-soul.net/1/?paipu='
];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onMessageListener = (request: any) => {
  MjaiURLstring = url_head[MSLang.value] + request.message.ref;
  seki.push(...request.message.name);
};

onMounted(() => {
  chrome.runtime.onMessage.addListener(onMessageListener);
});

onUnmounted(() => {
  chrome.runtime.onMessage.removeListener(onMessageListener);
});
// DisplayLang(0:日本語 1:英語 2:中国語)に対応するmjaiのページ。想定外の値では英語版に落とす
const MJAI_URL_BY_LANG = [
  'https://mjai.ekyu.moe/ja.html',
  'https://mjai.ekyu.moe/',
  'https://mjai.ekyu.moe/zh-cn.html'
];

const submitMjai = (no: number) => {
  chrome.storage.local.set({ "toMjaiData": MjaiURLstring, "toMjaiData_no": no });
  chrome.tabs.create({
    url: MJAI_URL_BY_LANG[DisplayLang.value] ?? MJAI_URL_BY_LANG[1]
  });
};
</script>
