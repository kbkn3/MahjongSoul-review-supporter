export default defineContentScript({
    matches: ["https://mjai.ekyu.moe/*"],
    main() {
        window.addEventListener("load", function () {
            chrome.storage.local.get(["toMjaiData", "toMjaiData_no"], function (data) {
                const data1 = data.toMjaiData as string | undefined;
                const data2 = data.toMjaiData_no as string | undefined;
                if (data1 && data1.length > 0) {
                    document.getElementsByTagName("input")[1].value = data1;
                    const idx = Number(data2);
                    const select = document.getElementsByTagName("select")[1];
                    if (Number.isInteger(idx) && select?.options?.[idx])
                        select.options[idx].selected = true;
                    chrome.storage.local.set({ toMjaiData: "", toMjaiData_no: "" });
                }
            });
        });
    }
});
