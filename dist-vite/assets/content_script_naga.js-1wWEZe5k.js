(function(){window.addEventListener("load",function(){chrome.storage.local.get(["toNagaData"],function(e){let t=e.toNagaData;t.length>0&&(document.getElementsByTagName("button")[2].click(),setTimeout(function(){document.getElementsByTagName("textarea")[0].innerText=t,document.getElementsByTagName("textarea")[0].value=t},500),chrome.storage.local.set({toNagaData:""}))})});
})()
