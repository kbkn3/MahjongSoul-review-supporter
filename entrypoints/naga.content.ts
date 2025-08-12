/**
 * NAGA分析サイトのコンテンツスクリプト
 * 
 * 機能:
 * - 雀魂から送信された牌譜データをNAGAのフォームに自動入力
 * - 自動的にテキストエリアにデータを設定
 */

import { defineContentScript } from 'wxt/sandbox';
import { browser } from 'wxt/browser';

export default defineContentScript({
  matches: ['https://naga.dmv.nico/naga_report/order_form/'],
  main() {
    console.log('NAGA content script loaded');
    
    // ページ読み込み時にストレージからデータを取得してフォームに入力
    window.addEventListener("load", function () {
      browser.storage.local.get(["toNagaData"]).then(function (data) {
        let data1 = data.toNagaData;
        if (data1 && data1.length > 0) {
          // NAGAサイトのボタンをクリック（分析フォームを開く）
          const buttons = document.getElementsByTagName("button");
          if (buttons[2]) {
            buttons[2].click();
          }
          
          // 少し待ってからテキストエリアにデータを設定
          setTimeout(function () {
            const textareas = document.getElementsByTagName("textarea");
            if (textareas[0]) {
              textareas[0].innerText = data1;
              textareas[0].value = data1;
            }
          }, 500);
          
          // データを使用後にクリア
          browser.storage.local.set({ toNagaData: "" });
        }
      });
    });
  }
});