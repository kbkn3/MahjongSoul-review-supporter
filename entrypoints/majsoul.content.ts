/**
 * Mahjong Soul 雀魂サイトのコンテンツスクリプト
 * 
 * 機能:
 * - 牌譜データの取得と変換
 * - NAGA分析ツールとの連携
 * - mjai-reviewer（Akochan、Mortal）との連携
 * - ポップアップUIとの通信
 */

import { defineContentScript } from 'wxt/sandbox';
import { browser } from 'wxt/browser';

export default defineContentScript({
  matches: [
    'https://game.mahjongsoul.com/*',
    'https://mahjongsoul.game.yo-star.com/*',
    'https://game.maj-soul.net/*',
    'https://game.maj-soul.com/*'
  ],
  async main() {
    console.log('Mahjong Soul content script loaded');
    
    // ブラウザネイティブAPIを使用してスクリプトを注入
    try {
      console.log('Injecting mahjong data parser script...');
      const script = document.createElement('script');
      script.src = browser.runtime.getURL('/mahjongDataParser.js');
      script.onload = () => {
        console.log('Page script injected successfully');
        script.remove();
      };
      script.onerror = () => {
        console.error('Failed to load page script');
      };
      (document.head || document.documentElement).appendChild(script);
    } catch (error) {
      console.error('Failed to inject page script:', error);
    }
    
    // ページからのメッセージを受信してデータを取得する関数
    const getGameDataFromPage = (): Promise<any> => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          window.removeEventListener('message', messageHandler);
          reject(new Error('Request timed out after 10 seconds'));
        }, 10000);

        const messageHandler = (event: MessageEvent) => {
          if (event.data && event.data.type === 'GAME_DATA_RESPONSE') {
            console.log('Received game data response:', event.data);
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            
            if (event.data.success) {
              console.log('Game data received successfully');
              resolve(event.data.data);
            } else {
              console.error('Error getting game data:', event.data.error);
              reject(new Error(event.data.error));
            }
          }
        };

        window.addEventListener('message', messageHandler);
        
        // ページにゲームデータを要求
        window.postMessage({ type: 'GET_GAME_DATA' }, '*');
      });
    };
    
    // ポップアップからのメッセージを受信
    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('Content script received:', request);
      console.log('Message type:', typeof request.message);
      console.log('Message value:', request.message);
      
      if (request.message == "tabNaga" || request.message == "tabMjai") {
        console.log('Processing game data request for:', request.message);
        console.log('=== FIXED VERSION CODE EXECUTING ===');
        
        // Promiseベースの実装でより安全な非同期処理
        getGameDataFromPage()
          .then(data => {
            console.log('Game data processing result:', data ? 'SUCCESS' : 'NULL');
            if (data) {
              console.log('Sending data to popup via runtime.sendMessage');
              console.log('Data structure:', {
                ver: data.ver,
                name: data.name,
                logLength: data.log?.length,
                hasNagaUrls: !!data.nagaUrls
              });
              
              // ポップアップに実際のデータを送信（NagaList.vueが期待する形式）
              browser.runtime.sendMessage({ message: data }).then((response) => {
                console.log('Runtime sendMessage response:', response);
              }).catch((error) => {
                console.error('Runtime sendMessage error:', error);
              });
              // tabs.sendMessageにはシンプルな成功メッセージのみ返す
              sendResponse({ status: 'success', message: 'Data sent via runtime.sendMessage' });
            } else {
              console.warn('No data to send to popup');
              sendResponse({ status: 'error', message: 'No data available' });
            }
          })
          .catch(error => {
            console.error('Failed to get game data:', error);
            sendResponse({ status: 'error', message: error.message });
          });
        
        return true; // 非同期レスポンスを示す
      } else {
        console.log('Unknown message received:', request.message);
        sendResponse(request.message);
        return false;
      }
    });

  },
});