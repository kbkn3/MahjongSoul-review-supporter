import { ref, type Ref } from "vue";

type LangKey = "DisplayLang" | "MSLang";

// 言語/サーバー設定はどちらも0-2の3択。初回インストール時はbackgroundが文字列 "0" を書くため
// 数値化し、範囲外や壊れた値は既定(日本語/日本サーバー)に落とす。
export function useStoredLang(key: LangKey): Ref<number> {
    const lang = ref(0);
    chrome.storage.local.get(key, (result) => {
        const value = Number(result[key]);
        if (typeof result[key] !== "undefined" && Number.isInteger(value) && value >= 0 && value <= 2) {
            lang.value = value;
        }
    });
    return lang;
}
