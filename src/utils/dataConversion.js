// NagaList.vueから抽出したデータ変換関数群

/**
 * オブジェクトをディープコピーする。
 *
 * @param {Object} src コピー対象のオブジェクトを指定する。
 * @returns {Object} 複製したオブジェクトを返す。
 */
export function deepCopy(src) {
  // JSON文字列化してからオブジェクトに戻すことでディープコピーを実現する。
  return JSON.parse(JSON.stringify(src));
}

/**
 * 卓名を雀魂っぽく変換する。
 *
 * @param {String} tenhouTable 天鳳っぽい卓名を指定する。
 * @returns {String} 雀魂っぽい卓名を返す。
 */
export function toSoulTable(tenhouTable) {
  // 表記の好みの問題なので、必ずしも必要となる処理ではない。
  return tenhouTable.replace("南喰赤", "四人南").replace("東喰赤", "四人東");
}

/**
 * 役名をNAGAが解析可能な表記に変換する。
 *
 * @param {String} hand 和了役を指定する。
 * @param {String} prevalent 場風を指定する。
 * @param {String} seat 和了者の自風を指定する。
 * @returns {String} NAGAで解析可能な表記の役名を返す。
 */
export function toNagaHand(hand, prevalent, seat) {
  // 対応が必要な役が判明次第、随時追加する。
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
 * logをNAGAが解析可能な形式に変換する。
 *
 * @param {Array<Array>} soulLog 雀魂形式のlogを指定する。
 * @returns {Array<Array>} NAGAで解析可能な形式のlogを返す。
 */
export function toNagaLog(soulLog) {
  // 流局のデータは変換の必要がない。
  if (soulLog[16].length < 3) {
    return soulLog;
  }
  const nagaLog = deepCopy(soulLog);

  // 当該局の場風を算出する。
  //
  // 局を表す数字と意味:
  //     0 => 東1局, 1 => 東2局, ...
  const prevalent = ["東", "南", "西", "北"][Math.floor(nagaLog[0][0] / 4)];

  // 役名をNAGAが解析可能な表記に変換する。
  // ダブロン・トリロンに対応するため複数回繰り返す。
  for (let i = 1; i < nagaLog[16].length; i += 2) {
    // 当該局における和了者の自風を設定する。
    //
    // 算出方法:
    //     (和了者のプレイヤー番号 - 親の位置 + 4) % 4
    const seat = ["東", "南", "西", "北"][
      (nagaLog[16][i].indexOf(Math.max(...nagaLog[16][i])) -
        (nagaLog[0][0] % 4) +
        4) %
      4
    ];

    // 役名をNAGAが解析可能な表記に変換する。
    nagaLog[16][i + 1] = nagaLog[16][i + 1].slice(0, 4).concat(
      nagaLog[16][i + 1].slice(4).map((v) => toNagaHand(v, prevalent, seat))
    );
  }

  // 変換後のlogを返す。
  return nagaLog;
}

// 天鳳牌譜エディタのURLにおいて、牌譜データに先行する部分の文字列。
const EDITOR_URL_PREFIX = "https://tenhou.net/6/#json=";

/**
 * 雀魂の牌譜jsonを天鳳形式に変換
 * Based on: 雀魂の牌譜をNAGAに解析させる－完全版－ (https://lions.blue/07813) by ちぃといつ
 * Licensed under Apache License 2.0
 */
export function soul2naga(results) {
  const INDENT = " ".repeat(4);
  const soulJson = JSON.stringify(results, null, INDENT)
    .replace(new RegExp(`\n${INDENT}+`, 'g'), " ") //bring up log array items
    .replace(/], \[/g, "],\n        [") //bump nested lists back down
    .replace(/\n\s+]/g, " ]") //bring up isolated right brackets
    .replace(/\n\s+},\n/g, " },\n");
  const urls = createViewerUrls(soulJson);
  return urls;
}

function createViewerUrls(soulJson) {
  // 雀魂の牌譜JSONをオブジェクトに変換する。
  const soulPaifu = JSON.parse(soulJson);
  
  // 東風/東南判定
  const wind = soulPaifu.rule.disp.includes('南') ? "south" : "east";
  // 卓名
  const table = extractTable(soulPaifu.rule.disp);
  
  // 段位戦以外の牌譜の場合のデフォルト処理
  // 実際の実装では Rule.value を外部から受け取る必要がある
  let ptEV;
  if (table === 'others') {
    ptEV = getRankFitPtEV(wind, soulPaifu);
  } else {
    ptEV = getRankPtEV(wind, table, soulPaifu);
  }
  
  // title内の卓名を雀魂っぽく変換する。
  const title = deepCopy(soulPaifu.title);
  title[0] = toSoulTable(title[0]);

  // rule内の卓名を雀魂っぽく変換する。
  const rule = deepCopy(soulPaifu.rule);
  rule.disp = toSoulTable(rule.disp);

  // logを局ごとのデータに分割し、牌譜エディタのURL群として返す。
  return soulPaifu.log.map((v) => (
    EDITOR_URL_PREFIX +
    JSON.stringify({
      title: [title, JSON.stringify(ptEV).slice(1, -1)],
      name: soulPaifu.name,
      rule: rule,
      log: [toNagaLog(v)],
    })
  ));
}

function getRankPtEV(wind, table, soulPaifu) {
  let ptEV;
  // 頂上決戦判定（魂天のみの試合）
  if (wind === "east" && soulPaifu.dan.every(dan => dan.match(/魂天Lv\d+/))) {
    ptEV = [[0.6, 0.2, -0.2, -0.6], [0.6, 0.2, -0.2, -0.6], [0.6, 0.2, -0.2, -0.6], [0.6, 0.2, -0.2, -0.6], 1];
  } else if (wind === "south" && soulPaifu.dan.every(dan => dan.match(/魂天Lv\d+/))) {
    ptEV = [[1.0, 0.4, -0.4, -1.0], [1.0, 0.4, -0.4, -1.0], [1.0, 0.4, -0.4, -1.0], [1.0, 0.4, -0.4, -1.0], 1];
  } else {
    ptEV = soulPaifu.dan.map(
      (dan) => {
        if (wind === "east" && dan.match(/魂天Lv\d+/)) {
          return [0.6, 0.3, -0.3, -0.6];
        }
        if (wind === "south" && dan.match(/魂天Lv\d+/)) {
          return [1.0, 0.4, -0.4, -1.0];
        }
        return POINTS[wind][table][dan];
      }
    );
    ptEV.push(1);
  }
  return ptEV;
}

function getRankFitPtEV(wind, soulPaifu) {
  let ptEV;
  // 頂上決戦判定（魂天のみの試合）
  if (wind === "east" && soulPaifu.dan.every(dan => dan.match(/魂天Lv\d+/))) {
    ptEV = [[0.6, 0.2, -0.2, -0.6], [0.6, 0.2, -0.2, -0.6], [0.6, 0.2, -0.2, -0.6], [0.6, 0.2, -0.2, -0.6], 1];
  } else if (wind === "south" && soulPaifu.dan.every(dan => dan.match(/魂天Lv\d+/))) {
    ptEV = [[1.0, 0.4, -0.4, -1.0], [1.0, 0.4, -0.4, -1.0], [1.0, 0.4, -0.4, -1.0], [1.0, 0.4, -0.4, -1.0], 1];
  } else {
    // 頂上決戦でない場合は適正な卓で判定をする
    ptEV = soulPaifu.dan.map(
      (dan) => {
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
            fitTable = "bronze"; // デフォルト
        }
        return POINTS[wind][fitTable][dan];
      }
    );
    ptEV.push(1);
  }
  return ptEV;
}

// 卓名変換
export function extractTable(tableName) {
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

// 段位ごとのポイント配分
export const POINTS = {
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
  },
  others: {
    1030: [50, 10, -10, -30],
    1020: [40, 10, -10, -20],
    515: [35, 5, -5, -15],
    510: [30, 5, -5, -10],
    tenho: [90, 45, 0, -135],
  }
};