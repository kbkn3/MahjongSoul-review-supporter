<template>
  <div class="template-box">
    <div class="template-title">Motal/Acochan</div>
    <div v-if="seki.length>3">
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



    const url_head = [
      'https://game.mahjongsoul.com/?paipu=',
      'https://mahjongsoul.game.yo-star.com/?paipu=',
      'https://game.maj-soul.net/1/?paipu='
    ];
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      MjaiURLstring = url_head[MSLang.value] + request.message.ref;
      console.log(seki.value);
      seki.push(...request.message.name);
    });


    const submitMjai = (no) => {
      chrome.storage.local.set({ "toMjaiData": MjaiURLstring });
      chrome.storage.local.set({ "toMjaiData_no": no });
      chrome.tabs.create({
        url: 'https://mjai.ekyu.moe/'
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
