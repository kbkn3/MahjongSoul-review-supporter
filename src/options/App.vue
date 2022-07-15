<template>
  <div class="m-5">
    <div class="text-2xl text-black m-2">Mahjong Soul Review Supporter Settings Page</div>
    <div class="flex flex-wrap">
      <div class="w-full">
        <div
          class="relative flex flex-col min-w-0 break-words bg-white w-full m-2 shadow-lg rounded"
        >
          <LangList></LangList>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import LangList from "@/options/LangList.vue";
export default {
  components: {
    LangList,
  },
  setup() {
    const openTab = ref(1);
    const toggleTabs = (tabNumber) => {
      openTab.value = tabNumber;
    };
    return { openTab, toggleTabs };
  },
};
</script>

<style>
.my-button {
  @apply py-2 px-4 bg-red-600 hover:bg-red-700 focus:ring-red-500 focus:ring-offset-indigo-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg;
}
.table-head-th > tr > *,
.table-body-td > tr > *,
.table-out-div > * {
  @apply px-5 py-1 text-left text-base;
}
</style>

