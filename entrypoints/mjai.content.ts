/**
 * mjai-reviewer（Akochan、Mortal）サイトのコンテンツスクリプト
 * 
 * 機能:
 * - 雀魂から送信された牌譜データをmjai-reviewerのフォームに自動入力
 * - 自動的に入力フィールドとセレクトボックスにデータを設定
 */

import { defineContentScript } from 'wxt/sandbox';
import { browser } from 'wxt/browser';

export default defineContentScript({
  matches: ['https://mjai.ekyu.moe/*'],
  main() {
    console.log('mjai-reviewer content script loaded');
    
    // ページ読み込み時にストレージからデータを取得してフォームに入力
    window.addEventListener("load", function () {
      browser.storage.local.get(["toMjaiData", "toMjaiData_no"]).then(function (data) {
        const data1 = data.toMjaiData;
        const data2 = data.toMjaiData_no;
        
        if (data1 && data1.length > 0) {
          // 入力フィールドにデータを設定
          const inputs = document.getElementsByTagName("input");
          if (inputs[1]) {
            inputs[1].value = data1;
          }
          
          // セレクトボックスでオプションを選択
          const selects = document.getElementsByTagName("select");
          if (selects[1] && selects[1].options[data2]) {
            selects[1].options[data2].selected = true;
          }
          
          // データを使用後にクリア
          browser.storage.local.set({ toMjaiData: "" });
          browser.storage.local.set({ toMjaiData_no: "" });
        }
      });
    });
  }
});