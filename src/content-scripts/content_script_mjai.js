window.addEventListener("load", function (event) {
  chrome.storage.local.get(["toMjaiData","toMjaiData_no"], function (data) {
    let data1 = data.toMjaiData;
    let data2 = data.toMjaiData_no;
    if (data1.length > 0) {
      document.getElementsByTagName("input")[0].value = data1;
      document.getElementsByTagName("select")[0].options[data2].selected = true;
      chrome.storage.local.set({ toMjaiData: "" });
      chrome.storage.local.set({ toMjaiData_no: "" });
    }
  });
});
