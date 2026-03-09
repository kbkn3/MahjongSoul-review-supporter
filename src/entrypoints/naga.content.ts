export default defineContentScript({
    matches: ["https://naga.dmv.nico/naga_report/order_form/"],
    main() {
        window.addEventListener("load", function () {
            chrome.storage.local.get(["toNagaData"], function (data) {
                const data1 = data.toNagaData as string | undefined;
                if (data1 && data1.length > 0) {
                    document.getElementsByTagName("button")[2].click();
                    setTimeout(function () {
                        document.getElementsByTagName("textarea")[0].innerText = data1;
                        document.getElementsByTagName("textarea")[0].value = data1;
                    }, 500);
                    chrome.storage.local.set({ toNagaData: "" });
                }
            });
        });
    }
});
