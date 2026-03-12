/**
 * 卓名から卓種別を抽出する
 */
function extractTable(tableName: string): string {
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
function toSoulTable(tenhouTable: string): string {
    return tenhouTable.replace("南喰赤", "四人南").replace("東喰赤", "四人東");
}

/**
 * 役名をNAGAが解析可能な表記に変換する
 */
function toNagaHand(hand: string, prevalent: string, seat: string): string {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TenhouLog = any[];

interface AgariInfo {
    isTsumo: boolean;
    winnerSeat: number;
    loserSeat: number;
    deltas: number[];
}

interface KyokuResultAgari {
    type: "和了";
    agaris: AgariInfo[];
}

interface KyokuResultDraw {
    type: string;
    deltas: number[] | null;
}

type KyokuResult = KyokuResultAgari | KyokuResultDraw;

/**
 * tenhouログの局結果配列 (log[i][16]) を構造化する
 * 和了・流局共通のアクセスパターンを抽象化し、マジックインデックスを隠蔽する
 */
function parseKyokuResult(resultEntry: TenhouLog): KyokuResult {
    if (resultEntry[0] === "和了") {
        const agaris: AgariInfo[] = [];
        for (let t = 1; t + 1 < resultEntry.length; t += 2) {
            const seats = resultEntry[t + 1];
            agaris.push({
                isTsumo: seats[0] === seats[1],
                winnerSeat: seats[0],
                loserSeat: seats[1],
                // 元配列への参照を保持する。fixScoreRonTileWasReachTile がこの参照経由で message.log を書き換える
                deltas: resultEntry[t],
            });
        }
        return { type: "和了", agaris };
    }
    return { type: resultEntry[0], deltas: resultEntry[1] ?? null };
}

/**
 * logをNAGAが解析可能な形式に変換する
 */
function toNagaLog(soulLog: TenhouLog): TenhouLog {
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
            nagaLog[16][i + 1].slice(4).map((v: string) => toNagaHand(v, prevalent, seat))
        );
    }

    return nagaLog;
}

interface TenhouMessage {
    ver: string;
    ref: string;
    log: TenhouLog[];
    ratingc: string;
    rule: { disp: string; aka53: number; aka52: number; aka51: number };
    lobby: number;
    dan: string[];
    rate: string[];
    sx: string[];
    name: string[];
    sc: number[];
    title: [string, string];
}

interface GameMessage {
    log: TenhouLog[];
}

/**
 * リーチ宣言牌がロンの場合を判定
 */
function checkRonTileIsReachTile(logEntry: TenhouLog, agari: AgariInfo): boolean {
    const targetArray = getDiscardsForSeat(logEntry, agari.loserSeat);
    const targetPointEven = agari.deltas[agari.loserSeat] === agari.deltas[agari.winnerSeat];
    if (targetArray && !targetPointEven) {
        const lastElement = targetArray[targetArray.length - 1];
        return typeof lastElement === 'string' && lastElement.startsWith('r');
    }
    return false;
}

/**
 * リーチ宣言牌がロンになったときの差分を修正
 */
function fixScoreRonTileWasReachTile(message: GameMessage): void {
    for (let i = 0; i < message.log.length; i++) {
        const result = parseKyokuResult(message.log[i][16]);
        if (result.type !== "和了") continue;
        const { agaris } = result as KyokuResultAgari;
        for (let t = 0; t < agaris.length; t++) {
            const agari = agaris[t];
            if (!agari.isTsumo) {
                if (checkRonTileIsReachTile(message.log[i], agari)) {
                    agari.deltas[agari.winnerSeat] -= 1000;
                }
            }
        }
    }
}

// tenhouログのレイアウト: seat毎に [haipai, draws, discards] が3要素ずつ index 4 から並ぶ
function getDrawsForSeat(logEntry: TenhouLog, seat: number): TenhouLog {
    return logEntry[3 * seat + 5];
}

function getDiscardsForSeat(logEntry: TenhouLog, seat: number): TenhouLog {
    return logEntry[3 * seat + 6];
}

function getScoreAndBonus(sc: number[], seat: number): { score: number; bonus: number } {
    return { score: sc[2 * seat], bonus: sc[2 * seat + 1] };
}

export {
    extractTable,
    toSoulTable,
    toNagaHand,
    toNagaLog,
    parseKyokuResult,
    checkRonTileIsReachTile,
    fixScoreRonTileWasReachTile,
    getDrawsForSeat,
    getDiscardsForSeat,
    getScoreAndBonus,
};
export type { TenhouLog, TenhouMessage, GameMessage, AgariInfo, KyokuResult, KyokuResultAgari, KyokuResultDraw };
