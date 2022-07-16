window.addEventListener("load", function (event) {
  chrome.storage.local.get(["toNagaData"], function (data) {
    let data1 = data.toNagaData;
    if (data1.length > 0) {
      document.getElementsByTagName("button")[2].click();
      setTimeout(function () {
        document.getElementsByTagName("textarea")[0].innerText = data1;
        document.getElementsByTagName("textarea")[0].value = data1;
      }, 500);
      chrome.storage.local.set({ toNagaData: "" });
    }
  });
});
