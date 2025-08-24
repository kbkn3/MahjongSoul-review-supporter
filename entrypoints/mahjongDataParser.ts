/**
 * Page context script for accessing GameMgr and parsing game data
 * This script runs in the page context and can access the page's window objects
 * WXT unlisted script - injected into MAIN world
 */

import { defineUnlistedScript } from 'wxt/utils/define-unlisted-script';
import { generatelog, getPlayerDan, getPlayerRate, getPlayerSex, getRuleDisplay } from '../utils/mahjongDataParser';
import { toSoulTable } from '../utils/dataConversion.js';

// Type definitions
interface Rule {
  disp: string;
  aka53: number;
  aka52: number;
  aka51: number;
}

interface SoulPaifuLike {
  rule: Rule;
  dan: string[];
  log: any[];
}

interface GameResults {
  ver: string;
  ref: string;
  log: any[];
  ratingc: string;
  name: string[];
  rule: Rule;
  dan: string[];
  rate: number[];
  sx: string[];
  sc: number[];
  title: (string | string[])[];
  nagaUrls?: string[];
}

type TableType = 'bronze' | 'silver' | 'gold' | 'tama' | 'king' | 'others';
type WindType = 'east' | 'south';

// 段位ごとのポイント配分（NAGA分析用ptEV計算）
const POINTS = {
  east: {
    bronze: {
      "初心★1": [25, 10, -5, -15],
      "初心★2": [25, 10, -5, -15],
      "初心★3": [25, 10, -5, -15],
      "雀士★1": [25, 10, -5, -25],
      "雀士★2": [25, 10, -5, -35],
      "雀士★3": [25, 10, -5, -45]
    },
    silver: {
      "雀士★1": [35, 15, -5, -25],
      "雀士★2": [35, 15, -5, -35],
      "雀士★3": [35, 15, -5, -45],
      "雀傑★1": [35, 15, -5, -55],
      "雀傑★2": [35, 15, -5, -65],
      "雀傑★3": [35, 15, -5, -75]
    },
    gold: {
      "雀傑★1": [55, 25, -5, -55],
      "雀傑★2": [55, 25, -5, -65],
      "雀傑★3": [55, 25, -5, -75],
      "雀豪★1": [55, 25, -5, -95],
      "雀豪★2": [55, 25, -5, -105],
      "雀豪★3": [55, 25, -5, -115]
    },
    tama: {
      "雀豪★1": [70, 35, -5, -95],
      "雀豪★2": [70, 35, -5, -105],
      "雀豪★3": [70, 35, -5, -115],
      "雀聖★1": [70, 35, -5, -125],
      "雀聖★2": [70, 35, -5, -135],
      "雀聖★3": [70, 35, -5, -145]
    },
    king: {
      "雀聖★1": [75, 35, -5, -125],
      "雀聖★2": [75, 35, -5, -135],
      "雀聖★3": [75, 35, -5, -145],
    }
  },
  south: {
    bronze: {
      "初心★1": [35, 15, -5, -15],
      "初心★2": [35, 15, -5, -15],
      "初心★3": [35, 15, -5, -15],
      "雀士★1": [35, 15, -5, -35],
      "雀士★2": [35, 15, -5, -55],
      "雀士★3": [35, 15, -5, -75]
    },
    silver: {
      "雀士★1": [55, 25, -5, -35],
      "雀士★2": [55, 25, -5, -55],
      "雀士★3": [55, 25, -5, -75],
      "雀傑★1": [55, 25, -5, -95],
      "雀傑★2": [55, 25, -5, -115],
      "雀傑★3": [55, 25, -5, -135]
    },
    gold: {
      "雀傑★1": [95, 45, -5, -95],
      "雀傑★2": [95, 45, -5, -115],
      "雀傑★3": [95, 45, -5, -135],
      "雀豪★1": [95, 45, -5, -180],
      "雀豪★2": [95, 45, -5, -195],
      "雀豪★3": [95, 45, -5, -210]
    },
    tama: {
      "雀豪★1": [125, 60, -5, -180],
      "雀豪★2": [125, 60, -5, -195],
      "雀豪★3": [125, 60, -5, -210],
      "雀聖★1": [125, 60, -5, -225],
      "雀聖★2": [125, 60, -5, -240],
      "雀聖★3": [125, 60, -5, -255]
    },
    king: {
      "雀聖★1": [135, 65, -5, -225],
      "雀聖★2": [135, 65, -5, -240],
      "雀聖★3": [135, 65, -5, -255],
    }
  }
};

// 卓名抽出関数
function extractTable(tableName: string): TableType {
  if (tableName.includes('銅')) {
    return 'bronze';
  }
  if (tableName.includes('銀')) {
    return 'silver';
  }
  if (tableName.includes('金')) {
    return 'gold';
  }
  if (tableName.includes('玉')) {
    return 'tama';
  }
  if (tableName.includes('王座')) {
    return 'king';
  }
  return 'others';
}

// 段位戦ptEV計算
function getRankPtEV(wind: WindType, table: TableType, soulPaifu: SoulPaifuLike): (number[] | number)[] {
  let ptEV: (number[] | number)[];
  // 頂上決戦判定（魂天のみの試合）
  if (wind === "east" && soulPaifu.dan.every((dan: string) => dan.match(/魂天Lv\d+/))) {
    ptEV = [[0.6, 0.2, -0.2, -0.6], [0.6, 0.2, -0.2, -0.6], [0.6, 0.2, -0.2, -0.6], [0.6, 0.2, -0.2, -0.6], 1];
  } else if (wind === "south" && soulPaifu.dan.every((dan: string) => dan.match(/魂天Lv\d+/))) {
    ptEV = [[1.0, 0.4, -0.4, -1.0], [1.0, 0.4, -0.4, -1.0], [1.0, 0.4, -0.4, -1.0], [1.0, 0.4, -0.4, -1.0], 1];
  } else {
    ptEV = soulPaifu.dan.map((dan: string) => {
      if (wind === "east" && dan.match(/魂天Lv\d+/)) {
        return [0.6, 0.3, -0.3, -0.6];
      }
      if (wind === "south" && dan.match(/魂天Lv\d+/)) {
        return [1.0, 0.4, -0.4, -1.0];
      }
      // Handle 'others' table type by defaulting to bronze
      const validTable = table === 'others' ? 'bronze' : table;
      return POINTS[wind][validTable as keyof typeof POINTS[WindType]][dan as keyof typeof POINTS[WindType][keyof typeof POINTS[WindType]]] || [0, 0, 0, 0];
    });
    ptEV.push(1);
  }
  return ptEV;
}

// 適正卓ptEV計算
function getRankFitPtEV(wind: WindType, soulPaifu: SoulPaifuLike): (number[] | number)[] {
  let ptEV: (number[] | number)[];
  // 頂上決戦判定（魂天のみの試合）
  if (wind === "east" && soulPaifu.dan.every((dan: string) => dan.match(/魂天Lv\d+/))) {
    ptEV = [[0.6, 0.2, -0.2, -0.6], [0.6, 0.2, -0.2, -0.6], [0.6, 0.2, -0.2, -0.6], [0.6, 0.2, -0.2, -0.6], 1];
  } else if (wind === "south" && soulPaifu.dan.every((dan: string) => dan.match(/魂天Lv\d+/))) {
    ptEV = [[1.0, 0.4, -0.4, -1.0], [1.0, 0.4, -0.4, -1.0], [1.0, 0.4, -0.4, -1.0], [1.0, 0.4, -0.4, -1.0], 1];
  } else {
    // 頂上決戦でない場合は適正な卓で判定をする
    ptEV = soulPaifu.dan.map((dan: string) => {
      if (wind === "east" && dan.match(/魂天Lv\d+/)) {
        return [0.6, 0.3, -0.3, -0.6];
      }
      if (wind === "south" && dan.match(/魂天Lv\d+/)) {
        return [1.0, 0.4, -0.4, -1.0];
      }
      let fitTable;
      switch (true) {
        case dan.startsWith("初心"):
          fitTable = "bronze";
          break;
        case dan.startsWith("雀士"):
          fitTable = "silver";
          break;
        case dan.startsWith("雀傑"):
          fitTable = "gold";
          break;
        case dan.startsWith("雀豪"):
          fitTable = "tama";
          break;
        case dan.startsWith("雀聖"):
          fitTable = "king";
          break;
        default:
          fitTable = "bronze";
          break;
      }
      return POINTS[wind][fitTable as keyof typeof POINTS[WindType]][dan as keyof typeof POINTS[WindType][keyof typeof POINTS[WindType]]] || [0, 0, 0, 0];
    });
    ptEV.push(1);
  }
  return ptEV;
}

// ptEV計算メイン関数
function calculatePtEV(soulPaifu: SoulPaifuLike, rule: Rule): (number[] | number)[] {
  // 東風/東南判定
  const wind = rule.disp.includes('南') ? "south" : "east";
  // 卓名
  const table = extractTable(rule.disp);
  
  let ptEV;
  
  // 段位戦以外の牌譜の場合
  if (table === 'others') {
    // 現在は段位戦配分を基本とする（将来的にはルール設定対応）
    ptEV = getRankFitPtEV(wind, soulPaifu);
  } else {
    ptEV = getRankPtEV(wind, table, soulPaifu);
  }
  
  return ptEV;
}

export default defineUnlistedScript(() => {
  console.log('=== MahjongDataParser page script loaded ===');
  console.log('Current URL:', window.location.href);
  // @ts-expect-error accessing global window object for Mahjong Soul
  console.log('GameMgr available:', typeof window.GameMgr !== 'undefined');
  // @ts-expect-error accessing global window object for Mahjong Soul
  console.log('app available:', typeof window.app !== 'undefined');
  // @ts-expect-error accessing global window object for Mahjong Soul
  console.log('net available:', typeof window.net !== 'undefined');

  // Function to get game data from GameMgr
  function getGameData() {
    console.log('=== getGameData called ===');
    console.log('Attempting to get game data from GameMgr');
    // @ts-expect-error accessing global window object for Mahjong Soul
    console.log('GameMgr type:', typeof window.GameMgr);
    // @ts-expect-error accessing global window object for Mahjong Soul
    console.log('GameMgr.Inst available:', !!window.GameMgr?.Inst);
    // @ts-expect-error accessing global window object for Mahjong Soul
    console.log('record_uuid:', window.GameMgr?.Inst?.record_uuid);
    // @ts-expect-error accessing global window object for Mahjong Soul
    console.log('cfg available:', typeof window.cfg !== 'undefined');
    // @ts-expect-error accessing global window object for Mahjong Soul  
    console.log('cfg.fan available:', !!window.cfg?.fan);
    
    // Check if GameMgr is available
    // @ts-expect-error accessing global window object for Mahjong Soul
    if (typeof window.GameMgr === 'undefined' || !window.GameMgr.Inst) {
      console.log('GameMgr not available');
      window.postMessage({ 
        type: 'GAME_DATA_RESPONSE', 
        success: false, 
        error: 'GameMgr not available' 
      }, '*');
      return;
    }
    
    // Check if record_uuid is available
    // @ts-expect-error accessing global window object for Mahjong Soul
    if (!window.GameMgr.Inst.record_uuid) {
      console.log('No record_uuid available');
      window.postMessage({ 
        type: 'GAME_DATA_RESPONSE', 
        success: false, 
        error: 'No record_uuid available' 
      }, '*');
      return;
    }
    
    // Check if required global objects are available
    // @ts-expect-error accessing global window object for Mahjong Soul
    if (typeof window.app === 'undefined' || !window.app.NetAgent) {
      console.log('app.NetAgent not available');
      window.postMessage({ 
        type: 'GAME_DATA_RESPONSE', 
        success: false, 
        error: 'app.NetAgent not available' 
      }, '*');
      return;
    }
    
    // @ts-expect-error accessing global window object for Mahjong Soul
    const GameMgr = window.GameMgr;
    // @ts-expect-error accessing global window object for Mahjong Soul
    const app = window.app;
    
    console.log('Fetching game record for UUID:', GameMgr.Inst.record_uuid);
    
    // Use the same approach as the original dd.js
    app.NetAgent.sendReq2Lobby(
      "Lobby",
      "fetchGameRecord",
      {
        game_uuid: GameMgr.Inst.record_uuid,
        client_version_string: GameMgr.Inst.getClientVersion(),
      },
      function (i: any, record: any) {
        console.log('Game record received:', record);
        try {
          // Get global net object for decoding
          // @ts-expect-error accessing global window object for Mahjong Soul
          const net = window.net;
          if (!net || !net.MessageWrapper) {
            throw new Error('net.MessageWrapper not available');
          }
          
          // Decode actual game data
          const mjslog: any[] = [];
          if (record.data) {
            try {
              const mjsact = net.MessageWrapper.decodeMessage(record.data).actions;
              mjsact.forEach((e: any) => { 
                if (e.result && e.result.length !== 0) {
                  mjslog.push(net.MessageWrapper.decodeMessage(e.result));
                }
              });
              console.log('Decoded game actions:', mjslog.length, 'actions');
            } catch (decodeError) {
              console.warn('Failed to decode game data, using simplified format:', decodeError);
              // Fall back to simplified format if decode fails
            }
          }
          
          // Extract player information with correct seat mapping
          const players = new Array(4).fill('');
          const nplayers = record.head.result.players.length;
          
          // Map players by seat number (same as dd.js implementation)
          record.head.accounts.forEach((acc: any) => {
            players[acc.seat] = acc.nickname;
          });
          
          // Clean up for sanma (3-player)
          if (3 === nplayers) {
            players[3] = '';
          }
          
          // Determine game mode and rules
          const config = record.head.config;
          const meta = config.meta || {};
          
          // Get global config for proper conversion
          // @ts-expect-error accessing global window object for Mahjong Soul
          const cfg = window.cfg;
          
          // Create rule object with proper display name
          const rawRuleDisplay = getRuleDisplay(record, cfg);
          const ruleDisplay = toSoulTable(rawRuleDisplay);
          
          // 赤ドラ判定ロジック（mode_idによる判定は不正確なため修正）
          // 通常は赤ドラあり、特定のモード（段位戦の特定ルールなど）のみ赤ドラなし
          const hasRedDora = !ruleDisplay.includes('赤なし') && !ruleDisplay.includes('No Red') && meta.mode_id !== 0;
          
          const rule = {
            disp: ruleDisplay,
            aka53: hasRedDora ? 1 : 0,
            aka52: hasRedDora ? 1 : 0, 
            aka51: hasRedDora ? 1 : 0
          };
          
          // Build complete log from mjslog data
          let log: any[] = [];
          if (mjslog.length > 0) {
            // Use complete conversion from mjslog to tenhou format
            log = generatelog(mjslog, cfg);
          }
          
          // Fallback if no log data available
          if (log.length === 0) {
            log = [[
              [0, 0, 0], // [kyoku, honba, riichi sticks]
              [25000, 25000, 25000, 25000], // initial scores
              [], [], // doras, uras
              [], [], [], [], // haipais
              [], [], [], [], // draws  
              [], [], [], [], // discards
              ["流局", [0, 0, 0, 0]] // result
            ]];
          }
          
          // Extract player information using proper conversion functions
          const dan = getPlayerDan(record, cfg);
          const rate = getPlayerRate(record);
          const sx = getPlayerSex(record, cfg);
          
          // Create soulPaifu-like object for ptEV calculation
          const soulPaifuLike = {
            rule: rule,
            dan: dan,
            log: log
          };
          
          // Calculate ptEV for NAGA analysis
          const ptEV = calculatePtEV(soulPaifuLike, rule);
          console.log("Calculated ptEV:", ptEV);
          
          // Create title with ptEV information (matching develop branch format)
          const baseTitle = [
            rule.disp,
            new Date(record.head.end_time * 1000).toLocaleString()
          ];
          const title = [baseTitle, JSON.stringify(ptEV).slice(1, -1)];
          
          // Build results object
          const results: GameResults = {
            ver: "2.3",
            ref: record.head.uuid,
            log: log,
            ratingc: "PF" + nplayers,
            name: players,
            rule: rule,
            dan: dan,
            rate: rate,
            sx: sx,
            sc: [] as number[],
            title: title
          };
          
          // Add final scores
          record.head.result.players.forEach((player: any) => {
            results.sc[2 * player.seat] = player.part_point_1;
            results.sc[2 * player.seat + 1] = player.total_point / 1000;
          });
          
          // Generate NAGA URLs for each kyoku
          const nagaUrls = log.map((kyokuLog) => {
            const gameData = {
              title: title,
              name: players,
              rule: rule,
              log: [kyokuLog]
            };
            return "https://tenhou.net/6/#json=" + encodeURIComponent(JSON.stringify(gameData));
          });
          
          results.nagaUrls = nagaUrls;
          
          console.log('Processed results:', results);
          
          // Send the data back to the content script
          window.postMessage({ 
            type: 'GAME_DATA_RESPONSE', 
            success: true, 
            data: results 
          }, '*');
        } catch (error) {
          console.error('Error processing game data:', error);
          window.postMessage({ 
            type: 'GAME_DATA_RESPONSE', 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
          }, '*');
        }
      }
    );
  }

  // Listen for messages from content script
  window.addEventListener('message', function(event) {
    // Only process and log our specific messages to avoid noise from React DevTools, etc.
    if (event.data && event.data.type === 'GET_GAME_DATA') {
      console.log('=== MahjongDataParser: Received GET_GAME_DATA request ===');
      getGameData();
    }
    // Ignore all other messages (React DevTools, other extensions, etc.) silently
  });

  console.log('MahjongDataParser ready to receive requests');
});