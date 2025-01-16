<template>
  <div class="template-box">
    <div class="template-title">Motal/Acochan</div>
    <div v-if="seki.length > 3">
      <div class="text-base font-semibold text-mjsoul-text-lightblue py-2">
        Which is your name?
      </div>

      <div v-for="n in 4" :key="n">
        <button type="button" class="my-button my-1" @click="submitMjai(n)">{{ seki[(n)] }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue';


export default {

  setup() {
    let seki = reactive([""]);
    let MjaiURLstring = "";

    const MSLang = ref(0);
    chrome.storage.local.get("MSLang", (result) => {
      // join langs
      if (typeof result.MSLang !== "undefined") {
        MSLang.value = result.MSLang;
      }
    });
    //表示用言語の設定をlocal storageから呼び出す
    const DisplayLang = ref(0)
    chrome.storage.local.get("DisplayLang", (result) => {
      // join langs
      if (typeof result.DisplayLang !== "undefined") {
        DisplayLang.value = Number(result.DisplayLang);
      }
    });

    const url_head = [
      'https://game.mahjongsoul.com/?paipu=',
      'https://mahjongsoul.game.yo-star.com/?paipu=',
      'https://game.maj-soul.net/1/?paipu='
    ];
    // eslint-disable-next-line no-unused-vars
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      MjaiURLstring = url_head[MSLang.value] + request.message.ref;
      seki.push(...request.message.name);
    });
    console.log(DisplayLang.value)
    const submitMjai = (no) => {
      chrome.storage.local.set({ "toMjaiData": MjaiURLstring });
      chrome.storage.local.set({ "toMjaiData_no": no });
      let urlLang;
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
    }

    return {
      seki,
      // getMjai,
      submitMjai
    };
  },
};
</script>
