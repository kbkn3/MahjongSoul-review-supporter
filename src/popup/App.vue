<template>
  <div class="relative wide bg-mjsoul-bg-blue">
    <div class="flex flex-row">
      <div class="pl-4 pt-1 text-3xl text-mjsoul-text-gold hudetext">Review Supporter</div>
      <div class="text-base pl-4 pt-4 text-mjsoul-text-gold hudetext">v 1.2.1</div>
      <div class="absolute top-4 right-4">
        <iconTrash class="cursor-pointer fill-gray-200" :width="20" :height="20" @click="openOption"></iconTrash>
      </div>
    </div>
    <div class="flex flex-wrap">
      <div class="w-full">
        <div class="mx-2">
          <div class="flex mb-4 px-1 min-w-0  break-words bg-mjsoul-fl-blue shadow-lg rounded-b-xl">
            <div class="w-3/5">
              <NagaList></NagaList>
            </div>
            <div class="w-2/5">
              <MjaiList></MjaiList>
              <RecipeList></RecipeList>
              <div class="template-box">
                <div class="flex flex-col py-4">
                  <a class="block text-base bg-mjsoul-bg-blue text-mjsoul-text-lightblue px-4 py-2 rounded-md my-2"
                  href="https://modern-jan.com/2022/07/19/mjrs/" target="_blank">{{ supportDevelopText[DisplayLang] }}</a>
                  <a class="block text-base bg-mjsoul-bg-blue text-mjsoul-text-lightblue px-4 py-2 rounded-md my-2"
                  href="https://github.com/kbkn3/MahjongSoul-review-supporter/issues"
                  target="_blank">Github</a>
                  <a class="block text-base bg-mjsoul-bg-blue text-mjsoul-text-lightblue px-4 py-2 rounded-md my-2"
                  href="https://twitter.com/kbkn3"
                  target="_blank">Twitter</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>

import { ref } from "vue";
import NagaList from "@/popup/NagaList.vue";
import MjaiList from "@/popup/MjaiList.vue";
import RecipeList from "@/popup/RecipeList.vue";
import iconTrash from "@/components/iconTrash.vue";
export default {
  components: {
    NagaList,
    MjaiList,
    RecipeList,
    iconTrash
  },
  setup() {
    //表示用言語の設定をlocal storageから呼び出す
    const DisplayLang = ref(0)
    chrome.storage.local.get("DisplayLang", (result) => {
      // join langs
      if (typeof result.DisplayLang !== "undefined") {
        DisplayLang.value = result.DisplayLang;
      }
    });
    // 日、英、中の順
    const supportDevelopText = ["開発を支援する", "Sponsor development", "支持开发"]

    const openTab = ref(1);
    const toggleTabs = (tabNumber) => {
      openTab.value = tabNumber;
    };

    const openOption = () => {
      chrome.tabs.create({
        url: 'options.html'
      });
    }
    return { openTab, toggleTabs, openOption, supportDevelopText, DisplayLang };
  },
};
</script>
