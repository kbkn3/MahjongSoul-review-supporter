chrome.runtime.onInstalled.addListener(e=>{e.reason==="install"&&(chrome.storage.local.set({MSLang:"0",DisplayLang:"0"}),chrome.tabs.create({url:"options.html"}))});
