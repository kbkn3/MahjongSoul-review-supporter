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
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { useDisplayLang } from "@/composables/useDisplayLang";

// 先頭のダミー要素でインデックスを1-basedにする（mjai側のselect optionインデックスと合わせるため）
const seki = reactive([""]);
let MjaiURLstring = "";

const MSLang = ref(0);
chrome.storage.local.get("MSLang", (result) => {
  if (typeof result.MSLang !== "undefined") {
    MSLang.value = result.MSLang as number;
  }
});
const DisplayLang = useDisplayLang();

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
console.log(DisplayLang.value)
const submitMjai = (no: number) => {
  chrome.storage.local.set({ "toMjaiData": MjaiURLstring });
  chrome.storage.local.set({ "toMjaiData_no": no });
  let urlLang: string;
  if (DisplayLang.value === 0) {
    urlLang = 'https://mjai.ekyu.moe/ja.html'
  } else if (DisplayLang.value === 1) {
    urlLang = 'https://mjai.ekyu.moe/'
  } else if (DisplayLang.value === 2) {
    urlLang = 'https://mjai.ekyu.moe/zh-cn.html'
  } else {
    urlLang = 'https://mjai.ekyu.moe/'
  }
  console.log(urlLang)
  chrome.tabs.create({
    url: urlLang
  });
};
</script>
