import { extractTable, toSoulTable, toNagaHand, toNagaLog, parseKyokuResult, checkRonTileIsReachTile, fixScoreRonTileWasReachTile, getDrawsForSeat, getDiscardsForSeat, getScoreAndBonus } from "../src/lib/naga";
import type { KyokuResultAgari, KyokuResultDraw, AgariInfo } from "../src/lib/naga";

describe("extractTable", () => {
    test("bronze room", () => {
        expect(extractTable("銅の間南喰赤")).toBe("bronze");
    });

    test("silver room", () => {
        expect(extractTable("銀の間東喰赤")).toBe("silver");
    });

    test("gold room", () => {
        expect(extractTable("金の間南喰赤")).toBe("gold");
    });

    test("jade room", () => {
        expect(extractTable("玉の間南喰赤")).toBe("tama");
    });

    test("throne room", () => {
        expect(extractTable("王座の間南喰赤")).toBe("king");
    });

    test("friendly/tournament returns others", () => {
        expect(extractTable("友人戦南喰赤")).toBe("others");
        expect(extractTable("大会戦東喰赤")).toBe("others");
    });
});

describe("toSoulTable", () => {
    test("converts south game", () => {
        expect(toSoulTable("玉の間南喰赤")).toBe("玉の間四人南");
    });

    test("converts east game", () => {
        expect(toSoulTable("金の間東喰赤")).toBe("金の間四人東");
    });

    test("no change for non-matching", () => {
        expect(toSoulTable("友人戦")).toBe("友人戦");
    });
});

describe("toNagaHand", () => {
    test("converts prevalent wind yaku", () => {
        expect(toNagaHand("役牌:場風牌(1飜)", "東", "南")).toBe("場風 東(1飜)");
        expect(toNagaHand("役牌:場風牌(1飜)", "南", "西")).toBe("場風 南(1飜)");
    });

    test("converts seat wind yaku", () => {
        expect(toNagaHand("役牌:自風牌(1飜)", "東", "南")).toBe("自風 南(1飜)");
    });

    test("converts double riichi", () => {
        expect(toNagaHand("ダブル立直(2飜)", "東", "東")).toBe("両立直(2飜)");
    });

    test("returns other yaku unchanged", () => {
        expect(toNagaHand("立直(1飜)", "東", "東")).toBe("立直(1飜)");
        expect(toNagaHand("断幺九(1飜)", "南", "西")).toBe("断幺九(1飜)");
    });
});

describe("toNagaLog", () => {
    test("returns unchanged log when no agari (length < 3)", () => {
        const log = buildMinimalLog();
        log[16] = ["流局", [0, 0, 3000, 0]];
        const result = toNagaLog(log);
        expect(result[16]).toEqual(["流局", [0, 0, 3000, 0]]);
    });

    test("converts yaku names in agari log", () => {
        const log = buildMinimalLog();
        // East 1 kyoku (0), dealer is seat 0
        log[0] = [0, 0, 0];
        // log[16] format: ["和了", delta1, res1, delta2, res2, ...]
        // res = [winner, from, winner, score_string, yaku1, yaku2, ...]
        log[16] = [
            "和了",
            [8000, -8000, 0, 0],  // delta scores
            [0, 1, 0, "30符4飜満貫8000点", "役牌:場風牌(1飜)", "役牌:自風牌(1飜)", "断幺九(1飜)", "ドラ(1飜)"]
        ];
        const result = toNagaLog(log);
        // first 4 elements (seat info + score) unchanged, yaku names converted
        expect(result[16][2][4]).toBe("場風 東(1飜)");
        expect(result[16][2][5]).toBe("自風 東(1飜)");
        expect(result[16][2][6]).toBe("断幺九(1飜)");
        expect(result[16][2][7]).toBe("ドラ(1飜)");
    });
});

describe("checkRonTileIsReachTile", () => {
    test("returns true when last discard starts with r", () => {
        const log = buildRonLog({ lastDiscard: "r15", winnerDelta: 8000, loserDelta: -8000 });
        const agari = (parseKyokuResult(log[16]) as KyokuResultAgari).agaris[0];
        expect(checkRonTileIsReachTile(log, agari)).toBe(true);
    });

    test("returns false when last discard is not riichi", () => {
        const log = buildRonLog({ lastDiscard: 15, winnerDelta: 8000, loserDelta: -8000 });
        const agari = (parseKyokuResult(log[16]) as KyokuResultAgari).agaris[0];
        expect(checkRonTileIsReachTile(log, agari)).toBe(false);
    });

    test("returns false when point difference is even (double ron)", () => {
        const log = buildRonLog({ lastDiscard: "r15", winnerDelta: 8000, loserDelta: 8000 });
        const agari = (parseKyokuResult(log[16]) as KyokuResultAgari).agaris[0];
        expect(checkRonTileIsReachTile(log, agari)).toBe(false);
    });
});

describe("fixScoreRonTileWasReachTile", () => {
    test("subtracts 1000 from winner score when ron on reach tile", () => {
        const message = {
            log: [buildRonLog({ lastDiscard: "r15", winnerDelta: 9000, loserDelta: -9000 })]
        };
        fixScoreRonTileWasReachTile(message);
        expect(message.log[0][16][1][0]).toBe(8000);
    });

    test("does not modify score for normal ron", () => {
        const message = {
            log: [buildRonLog({ lastDiscard: 15, winnerDelta: 8000, loserDelta: -8000 })]
        };
        fixScoreRonTileWasReachTile(message);
        expect(message.log[0][16][1][0]).toBe(8000);
    });

    test("does not modify score for tsumo", () => {
        const log = new Array(17).fill(null);
        log[0] = [0, 0, 0];
        log[16] = ["和了", [8000, -4000, -2000, -2000], [0, 0, 0]];
        const message = { log: [log] };
        fixScoreRonTileWasReachTile(message);
        expect(message.log[0][16][1][0]).toBe(8000);
    });
});

describe("fixScoreRonTileWasReachTile - edge cases", () => {
    test("does not modify non-agari rounds", () => {
        const message = { log: [buildMinimalLog()] };
        message.log[0][16] = ["流局", [0, 0, 0, 0]];
        const before = JSON.parse(JSON.stringify(message));
        fixScoreRonTileWasReachTile(message);
        expect(message).toEqual(before);
    });

    test("handles multiple rounds with mixed results", () => {
        const ronLog = buildRonLog({ lastDiscard: "r15", winnerDelta: 9000, loserDelta: -9000 });
        const ryukyokuLog = buildMinimalLog();
        ryukyokuLog[16] = ["流局", [0, 0, 0, 0]];
        const message = { log: [ronLog, ryukyokuLog] };
        fixScoreRonTileWasReachTile(message);
        expect(message.log[0][16][1][0]).toBe(8000);
        expect(message.log[1][16]).toEqual(["流局", [0, 0, 0, 0]]);
    });
});

describe("parseKyokuResult", () => {
    test("parses single tsumo agari", () => {
        const entry = ["和了", [8000, -4000, -2000, -2000], [0, 0, 0]];
        const result = parseKyokuResult(entry) as KyokuResultAgari;
        expect(result.type).toBe("和了");
        expect(result.agaris).toHaveLength(1);
        expect(result.agaris[0].isTsumo).toBe(true);
        expect(result.agaris[0].winnerSeat).toBe(0);
        expect(result.agaris[0].loserSeat).toBe(0);
        expect(result.agaris[0].deltas).toEqual([8000, -4000, -2000, -2000]);
    });

    test("parses single ron agari", () => {
        const entry = ["和了", [8000, -8000, 0, 0], [0, 1, 0]];
        const result = parseKyokuResult(entry) as KyokuResultAgari;
        expect(result.agaris).toHaveLength(1);
        expect(result.agaris[0].isTsumo).toBe(false);
        expect(result.agaris[0].winnerSeat).toBe(0);
        expect(result.agaris[0].loserSeat).toBe(1);
    });

    test("parses double ron", () => {
        const entry = [
            "和了",
            [8000, -8000, 0, 0], [0, 1, 0],
            [0, 0, 3000, -3000], [2, 3, 2],
        ];
        const result = parseKyokuResult(entry) as KyokuResultAgari;
        expect(result.agaris).toHaveLength(2);
        expect(result.agaris[0].winnerSeat).toBe(0);
        expect(result.agaris[0].loserSeat).toBe(1);
        expect(result.agaris[1].winnerSeat).toBe(2);
        expect(result.agaris[1].loserSeat).toBe(3);
    });

    test("parses ryuukyoku with deltas", () => {
        const entry = ["流局", [3000, -1000, -1000, -1000]];
        const result = parseKyokuResult(entry) as KyokuResultDraw;
        expect(result.type).toBe("流局");
        expect(result.deltas).toEqual([3000, -1000, -1000, -1000]);
    });

    test("parses ryuukyoku without deltas", () => {
        const entry = ["九種九牌"];
        const result = parseKyokuResult(entry) as KyokuResultDraw;
        expect(result.type).toBe("九種九牌");
        expect(result.deltas).toBeNull();
    });
});

describe("toNagaLog - immutability", () => {
    test("does not mutate the input log", () => {
        const log = buildMinimalLog();
        log[0] = [0, 0, 0];
        log[16] = [
            "和了",
            [8000, -8000, 0, 0],
            [0, 1, 0, "30符4飜満貫8000点", "役牌:場風牌(1飜)"]
        ];
        const before = JSON.parse(JSON.stringify(log));
        toNagaLog(log);
        expect(log).toEqual(before);
    });
});

describe("getDrawsForSeat", () => {
    test("returns draws array for each seat", () => {
        const log = buildMinimalLog();
        log[5] = [11, 12, 13];
        log[8] = [21, 22];
        log[11] = [31];
        log[14] = [41, 42, 43, 44];
        expect(getDrawsForSeat(log, 0)).toEqual([11, 12, 13]);
        expect(getDrawsForSeat(log, 1)).toEqual([21, 22]);
        expect(getDrawsForSeat(log, 2)).toEqual([31]);
        expect(getDrawsForSeat(log, 3)).toEqual([41, 42, 43, 44]);
    });
});

describe("getDiscardsForSeat", () => {
    test("returns discards array for each seat", () => {
        const log = buildMinimalLog();
        log[6] = [11, "r12"];
        log[9] = [21];
        log[12] = [31, 32, 33];
        log[15] = [41, 42];
        expect(getDiscardsForSeat(log, 0)).toEqual([11, "r12"]);
        expect(getDiscardsForSeat(log, 1)).toEqual([21]);
        expect(getDiscardsForSeat(log, 2)).toEqual([31, 32, 33]);
        expect(getDiscardsForSeat(log, 3)).toEqual([41, 42]);
    });
});

describe("getScoreAndBonus", () => {
    test("returns score and bonus for each seat", () => {
        const sc = [25000, 15.0, 30000, 45.0, 20000, -15.0, 25000, -45.0];
        expect(getScoreAndBonus(sc, 0)).toEqual({ score: 25000, bonus: 15.0 });
        expect(getScoreAndBonus(sc, 1)).toEqual({ score: 30000, bonus: 45.0 });
        expect(getScoreAndBonus(sc, 2)).toEqual({ score: 20000, bonus: -15.0 });
        expect(getScoreAndBonus(sc, 3)).toEqual({ score: 25000, bonus: -45.0 });
    });
});

// --- helpers ---

function buildMinimalLog() {
    // 17 elements: [0]=round_info, [1]=scores, [2]=doras, [3]=uras,
    // [4-15]=haipai/draws/discards for 4 players, [16]=result
    const log = new Array(17).fill(null);
    log[0] = [0, 0, 0];
    log[1] = [25000, 25000, 25000, 25000];
    log[2] = [15];
    log[3] = [];
    for (let i = 4; i <= 15; i++) log[i] = [];
    log[16] = [];
    return log;
}

function buildRonLog({ lastDiscard, winnerDelta, loserDelta }: { lastDiscard: string | number; winnerDelta: number; loserDelta: number }) {
    // winner=seat0, loser=seat1, ron
    const log = new Array(17).fill(null);
    log[0] = [0, 0, 0];
    log[1] = [25000, 25000, 25000, 25000];
    log[2] = [15];
    log[3] = [];
    // seat0: haipai=[4], draws=[5], discards=[6]
    log[4] = []; log[5] = []; log[6] = [];
    // seat1: haipai=[7], draws=[8], discards=[9]
    log[7] = []; log[8] = []; log[9] = [11, 12, lastDiscard];
    // seat2,3
    log[10] = []; log[11] = []; log[12] = [];
    log[13] = []; log[14] = []; log[15] = [];
    // result: ron from seat1 to seat0
    log[16] = [
        "和了",
        [winnerDelta, loserDelta, 0, 0],  // delta
        [0, 1, 0]                          // [winner, from, winner]
    ];
    return log;
}
