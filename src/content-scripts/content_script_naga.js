window.addEventListener("load", function (event) {
  chrome.storage.local.get(["toNagaData"], function (data) {
    let data1 = data.toNagaData;
    if (data1.length > 0) {
      document.getElementsByTagName("button")[2].click();
      setTimeout(function () {
        document.getElementsByTagName("textarea")[0].innerText = data1;
        document.getElementsByTagName("textarea")[0].value = data1;
        alert(
          "If you have selected two or more games, type a space or enter in the text area and watch the text in the buttons update.\n２局以上選択している場合は、テキストエリアでスペースやエンターを入力してボタンの中の文字が更新されるのを確認してください。"
        );
      }, 500);
      chrome.storage.local.set({ toNagaData: "" });
    }
  });
});
