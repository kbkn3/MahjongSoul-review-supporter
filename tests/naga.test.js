const { extractTable, toSoulTable, toNagaHand, toNagaLog, checkRonTileIsReachTile, fixScoreRonTileWasReachTile } = require("../src/lib/naga");

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
        const message = {
            log: [buildRonLog({ lastDiscard: "r15", winnerDelta: 8000, loserDelta: -8000 })]
        };
        expect(checkRonTileIsReachTile(message, 0, 1)).toBe(true);
    });

    test("returns false when last discard is not riichi", () => {
        const message = {
            log: [buildRonLog({ lastDiscard: 15, winnerDelta: 8000, loserDelta: -8000 })]
        };
        expect(checkRonTileIsReachTile(message, 0, 1)).toBe(false);
    });

    test("returns false when point difference is even (double ron)", () => {
        const message = {
            log: [buildRonLog({ lastDiscard: "r15", winnerDelta: 8000, loserDelta: 8000 })]
        };
        expect(checkRonTileIsReachTile(message, 0, 1)).toBe(false);
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

function buildRonLog({ lastDiscard, winnerDelta, loserDelta }) {
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
