<template>
  <div class="relative wide bg-mjsoul-bg-blue">
  <div class="flex flex-row">
    <div class="pl-4 pt-1 text-3xl text-mjsoul-text-gold hudetext">Review Supporter</div>
    <div class="text-base pl-4 pt-4 text-mjsoul-text-gold hudetext">v 1.1.3</div>
    <div class="absolute top-4 right-4"><iconTrash
                class="cursor-pointer fill-gray-200"
                :width="20"
                :height="20"
                @click="openOption"
              ></iconTrash></div>
  </div>
    <div class="flex flex-wrap">
      <div class="w-full">
        <div class="mx-2" >
          <div
            class="flex mb-4 px-1 min-w-0  break-words bg-mjsoul-fl-blue shadow-lg rounded-b-xl"
          >
                <div class="w-3/5">
                  <NagaList></NagaList>
                </div>
                <div class="w-2/5">
                  <MjaiList></MjaiList>
                  <RecipeList></RecipeList>
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
    const openTab = ref(1);
    const toggleTabs = (tabNumber) => {
      openTab.value = tabNumber;
    };
    
    const openOption = () =>{
      chrome.tabs.create({
        url: 'options.html'
      });
    }
    return { openTab, toggleTabs,openOption };
  },
};
</script>

<style>

</style>

