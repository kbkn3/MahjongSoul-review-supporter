window.addEventListener("DOMContentLoaded", function (event) {
  chrome.storage.local.get(["toMjaiData", "toMjaiData_no"], function (data) {
    let data1 = data.toMjaiData;
    let data2 = data.toMjaiData_no;
    if (data1.length > 0) {
      document.getElementsByTagName("input")[1].value = data1;
      document.getElementsByTagName("select")[1].options[data2].selected = true;
      // document.querySelector("#log-url > p > input").value = data1;
      // var selectBox = document.querySelector("#player-id > select");
      // if (selectBox) {
      //   // 設定したい値を指定
      //   selectBox.value = 0;
      // }
      chrome.storage.local.set({ toMjaiData: "" });
      chrome.storage.local.set({ toMjaiData_no: "" });
    }
  });
});
