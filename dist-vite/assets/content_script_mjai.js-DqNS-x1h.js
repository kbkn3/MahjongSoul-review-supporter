(function(){window.addEventListener("load",function(){chrome.storage.local.get(["toMjaiData","toMjaiData_no"],function(t){let a=t.toMjaiData,e=t.toMjaiData_no;a.length>0&&(document.getElementsByTagName("input")[1].value=a,document.getElementsByTagName("select")[1].options[e].selected=!0,chrome.storage.local.set({toMjaiData:""}),chrome.storage.local.set({toMjaiData_no:""}))})});
})()
