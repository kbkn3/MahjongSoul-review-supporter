/**
 * Page context script for accessing GameMgr and parsing game data
 * This script runs in the page context and can access the page's window objects
 * WXT unlisted script - injected into MAIN world
 */

import { defineUnlistedScript } from 'wxt/sandbox';
import { generatelog, getPlayerDan, getPlayerRate, getPlayerSex, getRuleDisplay } from '../utils/mahjongDataParser';

export default defineUnlistedScript(() => {
  console.log('=== MahjongDataParser page script loaded ===');
  console.log('Current URL:', window.location.href);
  console.log('GameMgr available:', typeof (globalThis as any).GameMgr !== 'undefined');
  console.log('app available:', typeof (globalThis as any).app !== 'undefined');
  console.log('net available:', typeof (globalThis as any).net !== 'undefined');

  // Function to get game data from GameMgr
  function getGameData() {
    console.log('=== getGameData called ===');
    console.log('Attempting to get game data from GameMgr');
    console.log('GameMgr type:', typeof (globalThis as any).GameMgr);
    console.log('GameMgr.Inst available:', !!(globalThis as any).GameMgr?.Inst);
    console.log('record_uuid:', (globalThis as any).GameMgr?.Inst?.record_uuid);
    
    // Check if GameMgr is available
    if (typeof (globalThis as any).GameMgr === 'undefined' || !(globalThis as any).GameMgr.Inst) {
      console.log('GameMgr not available');
      window.postMessage({ 
        type: 'GAME_DATA_RESPONSE', 
        success: false, 
        error: 'GameMgr not available' 
      }, '*');
      return;
    }
    
    // Check if record_uuid is available
    if (!(globalThis as any).GameMgr.Inst.record_uuid) {
      console.log('No record_uuid available');
      window.postMessage({ 
        type: 'GAME_DATA_RESPONSE', 
        success: false, 
        error: 'No record_uuid available' 
      }, '*');
      return;
    }
    
    // Check if required global objects are available
    if (typeof (globalThis as any).app === 'undefined' || !(globalThis as any).app.NetAgent) {
      console.log('app.NetAgent not available');
      window.postMessage({ 
        type: 'GAME_DATA_RESPONSE', 
        success: false, 
        error: 'app.NetAgent not available' 
      }, '*');
      return;
    }
    
    const GameMgr = (globalThis as any).GameMgr;
    const app = (globalThis as any).app;
    
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
          const net = (globalThis as any).net;
          if (!net || !net.MessageWrapper) {
            throw new Error('net.MessageWrapper not available');
          }
          
          // Decode actual game data
          let mjslog = [];
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
          const mode = config.category || 1;
          const meta = config.meta || {};
          
          // Get global config for proper conversion
          const cfg = (globalThis as any).cfg;
          
          // Create rule object with proper display name
          const rule: any = {
            disp: getRuleDisplay(record, cfg),
            aka53: meta.mode_id === 2 ? 0 : 1,
            aka52: meta.mode_id === 2 ? 0 : 1, 
            aka51: meta.mode_id === 2 ? 0 : 1
          };
          
          // Build complete log from mjslog data
          let log = [];
          if (mjslog.length > 0) {
            // Use complete conversion from mjslog to tenhou format
            log = generatelog(mjslog);
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
          
          // Create title based on game mode
          const title = [
            rule.disp,
            new Date(record.head.end_time * 1000).toLocaleString()
          ];
          
          // Extract player information using proper conversion functions
          const dan = getPlayerDan(record, cfg);
          const rate = getPlayerRate(record);
          const sx = getPlayerSex(record, cfg);
          
          // Build results object
          const results = {
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
          const nagaUrls = log.map((kyokuLog: any) => {
            const gameData = {
              title: title,
              name: players,
              rule: rule,
              log: [kyokuLog]
            };
            return "https://tenhou.net/6/#json=" + encodeURIComponent(JSON.stringify(gameData));
          });
          
          results['nagaUrls'] = nagaUrls;
          
          console.log('Processed results:', results);
          
          // Send the data back to the content script
          window.postMessage({ 
            type: 'GAME_DATA_RESPONSE', 
            success: true, 
            data: results 
          }, '*');
        } catch (error: any) {
          console.error('Error processing game data:', error);
          window.postMessage({ 
            type: 'GAME_DATA_RESPONSE', 
            success: false, 
            error: error.message 
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