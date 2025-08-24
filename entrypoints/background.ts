/**
 * バックグラウンドスクリプト（Service Worker）
 * 
 * 機能:
 * - 拡張機能のインストール時初期化
 * - 言語設定の初期化
 * - オプションページの自動表示
 */

import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';

export default defineBackground(() => {
  console.log('Background script started');
  
  // 拡張機能インストール時の処理
  browser.runtime.onInstalled.addListener(details => {
    if (details.reason === "install") {
      // 初期言語設定を登録
      browser.storage.local.set({
        MSLang: "0", // 日本語（雀魂 -じゃんたま-）
        DisplayLang: "0" // 日本語表示
      });
      
      // インストール時にオプションページを開く
      browser.tabs.create({
        url: 'options.html'
      });
    }
  });
});