<template>
  <div class="relative wide bg-mjsoul-bg-blue">
  <div class="flex flex-row">
    <div class="pl-4 pt-1 text-3xl text-mjsoul-text-gold hudetext">Review Supporter</div>
    <div class="text-base pl-4 pt-4 text-mjsoul-text-gold hudetext">v 1.1.1</div>
    <div class="absolute top-4 right-4"><iconTrash
                class="cursor-pointer fill-gray-200"
                :width="20"
                :height="20"
                @click="openOption"
              ></iconTrash></div>
  </div>
    <div class="flex flex-wrap">
      <div class="w-full">
        <!-- <ul class="flex mx-2 list-none flex-wrap pt-3 flex-row">
          <li
            class="-mb-px last:mr-0 mr-2 flex-auto text-center cursor-pointer"
          >
            <a
              class="text-sm font-bold uppercase px-5 py-3 shadow-lg rounded-t-xl block leading-normal text-gray-200 hudetext"
              @click="toggleTabs(1)"
              :class="{
                'bg-gradient-to-b from-mjsoul-grad-light-blue via-mjsoul-grad-middle-blue to-black': openTab !== 1,
                'bg-gradient-to-b from-mjsoul-grad-light-blue to-mjsoul-fl-blue': openTab === 1,
              }"
            >
              NAGA
            </a>
          </li>
          <li
            class="-mb-px last:mr-0 mr-2 flex-auto text-center cursor-pointer"
          >
            <a
              class="text-sm font-bold uppercase px-5 py-3 shadow-lg rounded block leading-normal text-gray-200 hudetext"
              @click="toggleTabs(2)"
              :class="{
                'bg-gradient-to-b from-mjsoul-grad-light-blue via-mjsoul-grad-middle-blue to-black': openTab !== 2,
                'bg-gradient-to-b from-mjsoul-grad-light-blue to-mjsoul-fl-blue': openTab === 2,
              }"
            >
              mjai
            </a>
          </li>
          <li
            class="-mb-px mr-0 flex-auto text-center cursor-pointer"
          >
            <a
              class="text-sm font-bold uppercase px-5 py-3 shadow-lg rounded block leading-normal text-gray-200 hudetext"
              @click="toggleTabs(3)"
              :class="{
                'bg-gradient-to-b from-mjsoul-grad-light-blue via-mjsoul-grad-middle-blue to-black': openTab !== 3,
                'bg-gradient-to-b from-mjsoul-grad-light-blue to-mjsoul-fl-blue': openTab === 3,
              }"
            >
              Score CSV
            </a>
          </li>
        </ul> -->
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
.my-button {
  @apply py-1 px-2 bg-red-600 hover:bg-red-700 focus:ring-red-500 focus:ring-offset-indigo-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg;
}
.template-box {
  @apply border border-mjsoul-text-gold rounded-lg m-1 px-2
}
.template-title {
  @apply text-xl font-semibold text-mjsoul-text-lightblue pt-2
}
.table-head-th > tr > *,
.table-body-td > tr > *,
.table-out-div > * {
  @apply px-5 py-1 text-left text-base;
}

</style>

