<template>
  <div>
    <div class="text-xl font-semibold m-2">Language Setting / 言語設定</div>
    <form @submit.prevent="setLang" class="ml-4 items-end">
      <InputSelect
        label="Mahjong Soul Language Setting / 雀魂の言語設定"
        :options="options"
        v-model="MSLang"
        class="m-1"
      ></InputSelect>
      <InputSelect
        label="Languages displayed by this extension / 拡張機能で表示する言語"
        :options="options"
        v-model="DisplayLang"
        class="m-1"
      ></InputSelect>
      <div class="w-24 m-2">
        <button type="submit" class="my-button">Set</button>
      </div>
    </form>
    <div class="pt-2 text-base whitespace-pre-wrap">{{ messages }}</div>
  </div>
</template>

<script>
import { ref } from "vue";
import InputSelect from "@/options/InputSelect.vue";
export default {
  components: { InputSelect },
  setup() {
    const langList = {
      2: "Chinese",
      1: "English",
      0: "Japanese",
    };
    const options = Object.entries(langList).map(([key, value]) => ({
      key: value,
      value: key,
    }));
    const messages = ref("");
    const MSLang = ref(0);
    const DisplayLang = ref(0);
    
    // get storage.local lang
    chrome.storage.local.get("MSLang", (result) => {
      // join langs
      if (typeof result.MSLang !== "undefined") {
        MSLang.value = result.MSLang;
      }
    });
    chrome.storage.local.get("DisplayLang", (result) => {
      // join langs
      if (typeof result.DisplayLang !== "undefined") {
        DisplayLang.value = result.DisplayLang;
      }
    });

    const setLang = () => {
      // clear messages
      messages.value = "";
      console.log("MS"+MSLang.value);
      console.log("Dis"+DisplayLang.value);
      // set new lang
      chrome.storage.local.set({
        MSLang: MSLang.value,
        DisplayLang: DisplayLang.value
    });
    };

    return {
      options,
      messages,
      MSLang,
      DisplayLang,
      setLang,
    };
  },
};
</script>
