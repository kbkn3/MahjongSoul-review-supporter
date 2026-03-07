import { ref } from "vue";

export function useDisplayLang() {
    const DisplayLang = ref(0);
    chrome.storage.local.get("DisplayLang", (result) => {
        if (typeof result.DisplayLang !== "undefined") {
            DisplayLang.value = Number(result.DisplayLang);
        }
    });
    return DisplayLang;
}
