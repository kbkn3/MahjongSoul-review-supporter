/**
 * 卓名から卓種別を抽出する
 */
function extractTable(tableName) {
    if (tableName.includes('銅')) return 'bronze';
    if (tableName.includes('銀')) return 'silver';
    if (tableName.includes('金')) return 'gold';
    if (tableName.includes('玉')) return 'tama';
    if (tableName.includes('王座')) return 'king';
    return 'others';
}

/**
 * 天鳳っぽい卓名を雀魂っぽく変換する
 */
function toSoulTable(tenhouTable) {
    return tenhouTable.replace("南喰赤", "四人南").replace("東喰赤", "四人東");
}

/**
 * 役名をNAGAが解析可能な表記に変換する
 */
function toNagaHand(hand, prevalent, seat) {
    switch (hand) {
        case "役牌:場風牌(1飜)":
            return `場風 ${prevalent}(1飜)`;
        case "役牌:自風牌(1飜)":
            return `自風 ${seat}(1飜)`;
        case "ダブル立直(2飜)":
            return "両立直(2飜)";
        default:
            return hand;
    }
}

/**
 * logをNAGAが解析可能な形式に変換する
 */
function toNagaLog(soulLog) {
    if (soulLog[16].length < 3) {
        return soulLog;
    }
    const nagaLog = JSON.parse(JSON.stringify(soulLog));

    const prevalent = ["東", "南", "西", "北"][Math.floor(nagaLog[0][0] / 4)];

    for (let i = 1; i < nagaLog[16].length; i += 2) {
        const seat = ["東", "南", "西", "北"][
            (nagaLog[16][i].indexOf(Math.max(...nagaLog[16][i])) -
                (nagaLog[0][0] % 4) +
                4) %
            4
        ];
        nagaLog[16][i + 1] = nagaLog[16][i + 1].slice(0, 4).concat(
            nagaLog[16][i + 1].slice(4).map((v) => toNagaHand(v, prevalent, seat))
        );
    }

    return nagaLog;
}

/**
 * リーチ宣言牌がロンの場合を判定
 */
function checkRonTileIsReachTile(message, i, t) {
    const targetArray = message.log[i][message.log[i][16][2 * t][1] * 3 + 6];
    const targetPointEven = message.log[i][16][2 * t - 1][message.log[i][16][2 * t][1]] === message.log[i][16][2 * t - 1][message.log[i][16][2 * t][0]];
    if (targetArray && !targetPointEven) {
        const lastElement = targetArray[targetArray.length - 1];
        return typeof lastElement === 'string' && lastElement.startsWith('r');
    }
    return false;
}

/**
 * リーチ宣言牌がロンになったときの差分を修正
 */
function fixScoreRonTileWasReachTile(message) {
    for (let i = 0; i < message.log.length; i++) {
        if (message.log[i][16][0] === "和了") {
            for (let t = 1; t < ~~(message.log[i][16].length / 2) + 1; t++) {
                if (message.log[i][16][2 * t][0] !== message.log[i][16][2 * t][1]) {
                    if (checkRonTileIsReachTile(message, i, t)) {
                        message.log[i][16][2 * t - 1][message.log[i][16][2 * t][0]] -= 1000;
                    }
                }
            }
        }
    }
}

export {
    extractTable,
    toSoulTable,
    toNagaHand,
    toNagaLog,
    checkRonTileIsReachTile,
    fixScoreRonTileWasReachTile,
};
