/**
 * Page context script for accessing GameMgr and parsing game data
 * This script runs in the page context and can access the page's window objects
 */

console.log('MahjongDataParser page script loaded');

// Function to get game data from GameMgr
function getGameData() {
    console.log('Attempting to get game data from GameMgr');
    
    // Check if GameMgr is available
    if (typeof GameMgr === 'undefined' || !GameMgr.Inst) {
        console.log('GameMgr not available');
        window.postMessage({ 
            type: 'GAME_DATA_RESPONSE', 
            success: false, 
            error: 'GameMgr not available' 
        }, '*');
        return;
    }
    
    // Check if record_uuid is available
    if (!GameMgr.Inst.record_uuid) {
        console.log('No record_uuid available');
        window.postMessage({ 
            type: 'GAME_DATA_RESPONSE', 
            success: false, 
            error: 'No record_uuid available' 
        }, '*');
        return;
    }
    
    // Check if required global objects are available
    if (typeof app === 'undefined' || !app.NetAgent) {
        console.log('app.NetAgent not available');
        window.postMessage({ 
            type: 'GAME_DATA_RESPONSE', 
            success: false, 
            error: 'app.NetAgent not available' 
        }, '*');
        return;
    }
    
    console.log('Fetching game record for UUID:', GameMgr.Inst.record_uuid);
    
    // Use the same approach as the original dd.js
    app.NetAgent.sendReq2Lobby(
        "Lobby",
        "fetchGameRecord",
        {
            game_uuid: GameMgr.Inst.record_uuid,
            client_version_string: GameMgr.Inst.getClientVersion(),
        },
        function (i, record) {
            console.log('Game record received:', record);
            try {
                // Create NAGA URLs directly without complex processing
                const nagaUrls = [];
                const players = record.head.accounts.map(acc => acc.nickname);
                
                // Create a simple NAGA URL for each "kyoku" (we'll create just one for testing)
                const simpleGameData = {
                    title: ["段位戦四人南", new Date(record.head.end_time * 1000).toLocaleString()],
                    name: players,
                    rule: { disp: "段位戦四人南", aka53: 1, aka52: 1, aka51: 1 },
                    log: [[
                        [0, 0, 0], // [kyoku, honba, riichi sticks]
                        [25000, 25000, 25000, 25000], // initial scores
                        [], [], // doras, uras
                        [], [], [], [], // haipais
                        [], [], [], [], // draws  
                        [], [], [], [], // discards
                        ["流局", [0, 0, 0, 0]] // result
                    ]]
                };
                
                const nagaUrl = "https://tenhou.net/6/#json=" + JSON.stringify(simpleGameData);
                nagaUrls.push(nagaUrl);
                
                // Create the expected data structure for NagaList.vue
                const results = {
                    ver: "2.3",
                    ref: record.head.uuid,
                    log: [[
                        [0, 0, 0], // [kyoku, honba, riichi sticks]
                        [25000, 25000, 25000, 25000], // initial scores
                        [], [], // doras, uras
                        [], [], [], [], // haipais
                        [], [], [], [], // draws
                        [], [], [], [], // discards
                        ["流局", [0, 0, 0, 0]] // result
                    ]],
                    ratingc: "PF" + record.head.result.players.length,
                    name: players,
                    rule: { disp: "段位戦四人南", aka53: 1, aka52: 1, aka51: 1 },
                    dan: record.head.accounts.map(() => '初心★1'),
                    rate: record.head.accounts.map(() => 1500),
                    sx: record.head.accounts.map(() => 'C'),
                    sc: [],
                    title: ["段位戦四人南", new Date(record.head.end_time * 1000).toLocaleString()],
                    nagaUrls: nagaUrls // Pre-computed NAGA URLs
                };
                
                // Add scores
                record.head.result.players.forEach((player, i) => {
                    results.sc[2 * player.seat] = player.part_point_1;
                    results.sc[2 * player.seat + 1] = player.total_point / 1000;
                });
                console.log('Simplified results:', results);
                
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
                    error: error.message 
                }, '*');
            }
        }
    );
}

// Listen for messages from content script
window.addEventListener('message', function(event) {
    console.log('Page script received message:', event.data);
    if (event.data && event.data.type === 'GET_GAME_DATA') {
        console.log('Received GET_GAME_DATA request');
        getGameData();
    }
});

console.log('MahjongDataParser ready to receive requests');