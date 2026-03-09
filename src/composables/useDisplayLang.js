import { ref } from "vue";

export function useDisplayLang() {
    const DisplayLang = ref(0);
    chrome.storage.local.get("DisplayLang", (result) => {
        if (typeof result.DisplayLang !== "undefined") {
            const lang = Number(result.DisplayLang);
            DisplayLang.value = Number.isInteger(lang) && lang >= 0 && lang <= 2 ? lang : 0;
        }
    });
    return DisplayLang;
}
