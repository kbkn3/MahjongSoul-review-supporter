<template>
  <div class="min-h-full">
    <div class="text-lg font-semibold text-mjsoul-text-lightblue mb-3">mjai-reviewer</div>

    <div class="text-base font-semibold text-mjsoul-text-lightblue">
      1.Press "Get URL" button
    </div>
    <div class="w-36">
      <button type="button" class="my-button" @click="getMjai">Get URL</button>
    </div>
    <div v-if="seki.length>3">
      <div class="text-base font-semibold text-mjsoul-text-lightblue">
        2.Which is your name?
      </div>

      <div v-for="n in 4" :key="n">
        <button type="button" class="my-button m-2" @click="submitMjai(n)">{{ seki[(n)] }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive,ref } from 'vue';


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
      'https://mahjongsoul.game.yo-star.com/?paipu='
    ];

    const getMjai = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { message: 'tabNaga' }, (content) => {
          if (!content) {
            alert('Cannot Get! Try Reload First!');
            return;
          }
          chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            MjaiURLstring = url_head[MSLang] + request.message.ref;
            seki.push(...request.message.name);
            console.log(seki);
          });
        });
      });
    }

    const submitMjai = (no) => {
      chrome.storage.local.set({ "toMjaiData": MjaiURLstring });
      chrome.storage.local.set({ "toMjaiData_no": no });
      chrome.tabs.create({
        url: 'https://mjai.ekyu.moe/'
      });
    }

    return {
      seki,
      getMjai,
      submitMjai
    };
  },
};
</script>
