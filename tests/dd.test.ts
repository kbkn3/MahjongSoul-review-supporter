import { describe, test, expect } from "vitest";
import {
    KyokuState,
    createKyokuState,
    initKyoku,
    handleBaBei,
    handleDealTile,
    handleDiscardTile,
    handleChii,
    handlePon,
    handleDaiminkan,
    handleAnkan,
    handleShouminkan,
    handleLiuJu,
    handleNoTile,
    countpao,
} from "../src/lib/kyoku";
import { TSUMOGIRI } from "../src/lib/constants";

function createTestKyoku(overrides?: Partial<KyokuState>): KyokuState {
    return createKyokuState({
        nplayers: 4,
        round: [0, 0, 0],
        initscores: [25000, 25000, 25000, 25000],
        doras: [15],
        draws: [[], [], [], []],
        discards: [[], [], [], []],
        haipais: [[], [], [], []],
        poppedtile: 0,
        dealerseat: 0,
        ldseat: -1,
        nriichi: 0,
        nkan: 0,
        nowinds: [0, 0, 0, 0],
        nodrags: [0, 0, 0, 0],
        paowind: -1,
        paodrag: -1,
        ...overrides,
    });
}

describe("handleBaBei", () => {
    test("pushes kita marker to discards", () => {
        const kyoku = createTestKyoku();
        handleBaBei({ seat: 2 }, kyoku);
        expect(kyoku.discards[2]).toEqual(["f44"]);
    });

    test("does not affect other seats", () => {
        const kyoku = createTestKyoku();
        handleBaBei({ seat: 1 }, kyoku);
        expect(kyoku.discards[0]).toEqual([]);
        expect(kyoku.discards[2]).toEqual([]);
        expect(kyoku.discards[3]).toEqual([]);
    });
});

describe("handleDealTile", () => {
    test("pushes drawn tile to draws", () => {
        const kyoku = createTestKyoku();
        handleDealTile({ seat: 0, tile: "5m", doras: [] }, kyoku);
        // tm2t("5m") = 15
        expect(kyoku.draws[0]).toEqual([15]);
    });

    test("updates doras when new doras provided", () => {
        const kyoku = createTestKyoku({ doras: [15] });
        handleDealTile({ seat: 1, tile: "1p", doras: ["3s", "7z"] }, kyoku);
        // tm2t("3s") = 33, tm2t("7z") = 47
        expect(kyoku.doras).toEqual([33, 47]);
    });

    test("does not update doras when provided list is not longer", () => {
        const kyoku = createTestKyoku({ doras: [15, 25] });
        handleDealTile({ seat: 0, tile: "1m", doras: ["2m"] }, kyoku);
        expect(kyoku.doras).toEqual([15, 25]);
    });
});

describe("handleDiscardTile", () => {
    test("pushes normal discard tile", () => {
        const kyoku = createTestKyoku();
        handleDiscardTile({ seat: 1, tile: "3p", moqie: false, is_liqi: false }, kyoku);
        // tm2t("3p") = 23
        expect(kyoku.discards[1]).toEqual([23]);
    });

    test("pushes tsumogiri marker for moqie", () => {
        const kyoku = createTestKyoku();
        handleDiscardTile({ seat: 0, tile: "3p", moqie: true, is_liqi: false }, kyoku);
        expect(kyoku.discards[0]).toEqual([TSUMOGIRI]);
    });

    test("marks dealer first discard as tsumogiri when matches poppedtile", () => {
        const kyoku = createTestKyoku({ dealerseat: 0, poppedtile: 23 });
        handleDiscardTile({ seat: 0, tile: "3p", moqie: false, is_liqi: false }, kyoku);
        expect(kyoku.discards[0]).toEqual([TSUMOGIRI]);
    });

    test("does not mark as tsumogiri when dealer has prior discards", () => {
        const kyoku = createTestKyoku({ dealerseat: 0, poppedtile: 23 });
        kyoku.discards[0].push(11);
        handleDiscardTile({ seat: 0, tile: "3p", moqie: false, is_liqi: false }, kyoku);
        expect(kyoku.discards[0]).toEqual([11, 23]);
    });

    test("prefixes riichi declaration with r", () => {
        const kyoku = createTestKyoku();
        handleDiscardTile({ seat: 2, tile: "7s", moqie: false, is_liqi: true }, kyoku);
        // tm2t("7s") = 37
        expect(kyoku.discards[2]).toEqual(["r37"]);
        expect(kyoku.nriichi).toBe(1);
    });

    test("sets ldseat to discarder", () => {
        const kyoku = createTestKyoku();
        handleDiscardTile({ seat: 3, tile: "1m", moqie: false, is_liqi: false }, kyoku);
        expect(kyoku.ldseat).toBe(3);
    });

    test("updates doras when new doras provided", () => {
        const kyoku = createTestKyoku({ doras: [15] });
        handleDiscardTile({ seat: 0, tile: "1m", moqie: false, is_liqi: false, doras: ["2p", "3s"] }, kyoku);
        expect(kyoku.doras).toEqual([22, 33]);
    });
});

describe("handleChii", () => {
    test("pushes chii naki to draws", () => {
        const kyoku = createTestKyoku();
        // chi format: "c" + tiles[2] + tiles[0] + tiles[1]
        handleChii({ seat: 1, tiles: ["3m", "4m", "5m"] }, kyoku);
        // tm2t: 3m=13, 4m=14, 5m=15
        // "c" + 15 + 13 + 14
        expect(kyoku.draws[1]).toEqual(["c151314"]);
    });
});

describe("handlePon", () => {
    test("pushes pon naki to draws from kamicha", () => {
        const kyoku = createTestKyoku({ ldseat: 0 });
        // pon from kamicha (seat0 -> seat1): relative = (1-0+3)%4 = 3... wait
        // relativeseating(seat0, seat1) = (seat0 - seat1 + 3) % 4
        // from kamicha: relativeseating(1, 0) = (1-0+3)%4 = 0
        handlePon({ seat: 1, tiles: ["5z", "5z", "5z"] }, kyoku);
        // tm2t("5z") = 45
        // worktiles = [45, 45, 45], pop -> [45, 45], idx=0
        // splice(0, 0, "p45") -> ["p45", 45, 45]
        expect(kyoku.draws[1]).toEqual(["p454545"]);
    });

    test("pushes pon naki to draws from toimen", () => {
        const kyoku = createTestKyoku({ ldseat: 0 });
        // relativeseating(2, 0) = (2-0+3)%4 = 1
        handlePon({ seat: 2, tiles: ["1p", "1p", "1p"] }, kyoku);
        // tm2t("1p") = 21, worktiles = [21, 21, 21], pop -> [21, 21], idx=1
        // splice(1, 0, "p21") -> [21, "p21", 21]
        expect(kyoku.draws[2]).toEqual(["21p2121"]);
    });
});

describe("handleDaiminkan", () => {
    test("pushes daiminkan naki and 0 to discards", () => {
        const kyoku = createTestKyoku({ ldseat: 0 });
        // relativeseating(1, 0) = 0, kamicha
        handleDaiminkan({ seat: 1, tiles: ["3s", "3s", "3s", "3s"] }, kyoku);
        // tm2t("3s") = 33, calltiles = [33, 33, 33, 33], pop -> [33, 33, 33]
        // idx=0, splice(0, 0, "m33") -> ["m33", 33, 33, 33]
        expect(kyoku.draws[1]).toEqual(["m33333333"]);
        expect(kyoku.discards[1]).toEqual([0]);
        expect(kyoku.nkan).toBe(1);
    });
});

describe("handleAnkan", () => {
    test("pushes ankan naki to discards", () => {
        const kyoku = createTestKyoku();
        kyoku.haipais[0] = [47, 47, 47];
        kyoku.draws[0] = [47];
        handleAnkan({ seat: 0, tiles: "7z" }, kyoku);
        // tm2t("7z") = 47, deaka(47) = 47
        // ankantiles from haipai: [47, 47, 47], from draws: [47] -> [47, 47, 47, 47]
        // pop -> 47, rest = [47, 47, 47]
        // push "474747a47"
        expect(kyoku.discards[0]).toEqual(["474747a47"]);
        expect(kyoku.nkan).toBe(1);
    });
});

describe("handleShouminkan", () => {
    test("converts pon naki to shouminkan in discards", () => {
        const kyoku = createTestKyoku();
        kyoku.draws[0] = ["p454545"];
        handleShouminkan({ seat: 0, tiles: "5z" }, kyoku);
        // tm2t("5z") = 45
        // finds pon naki containing "p45", replaces p with "k45"
        expect(kyoku.discards[0]).toEqual(["k45454545"]);
        expect(kyoku.nkan).toBe(1);
    });
});

describe("handleLiuJu", () => {
    test("returns kyuushukyuuhai entry for type 1", () => {
        const kyoku = createTestKyoku();
        const entry = handleLiuJu({ type: 1 }, kyoku);
        expect(entry[entry.length - 1]).toEqual(["九種九牌"]);
    });

    test("returns suufonrenda entry for type 2", () => {
        const kyoku = createTestKyoku();
        const entry = handleLiuJu({ type: 2 }, kyoku);
        expect(entry[entry.length - 1]).toEqual(["四風連打"]);
    });

    test("returns suuchariichi for 4 riichi", () => {
        const kyoku = createTestKyoku({ nriichi: 4 });
        const entry = handleLiuJu({ type: 0 }, kyoku);
        expect(entry[entry.length - 1]).toEqual(["四家立直"]);
    });

    test("returns suukaikan for 4+ kans", () => {
        const kyoku = createTestKyoku({ nkan: 4 });
        const entry = handleLiuJu({ type: 0 }, kyoku);
        expect(entry[entry.length - 1]).toEqual(["四開槓"]);
    });

    test("returns sanchahou as default", () => {
        const kyoku = createTestKyoku();
        const entry = handleLiuJu({ type: 0 }, kyoku);
        expect(entry[entry.length - 1]).toEqual(["三家和"]);
    });
});

describe("handleNoTile", () => {
    test("returns ryuukyoku entry with zero deltas", () => {
        const kyoku = createTestKyoku();
        const entry = handleNoTile({ scores: [], liujumanguan: false }, kyoku);
        expect(entry[entry.length - 1]).toEqual(["流局", [0, 0, 0, 0]]);
    });

    test("returns ryuukyoku entry with delta scores", () => {
        const kyoku = createTestKyoku();
        const event = {
            scores: [{ delta_scores: [3000, -1000, -1000, -1000] }],
            liujumanguan: false,
        };
        const entry = handleNoTile(event, kyoku);
        expect(entry[entry.length - 1]).toEqual(["流局", [3000, -1000, -1000, -1000]]);
    });

    test("returns nagashimangan entry when liujumanguan is true", () => {
        const kyoku = createTestKyoku();
        const event = {
            scores: [{ delta_scores: [8000, -2000, -4000, -2000] }],
            liujumanguan: true,
        };
        const entry = handleNoTile(event, kyoku);
        expect(entry[entry.length - 1]).toEqual(["流し満貫", [8000, -2000, -4000, -2000]]);
    });
});

describe("countpao", () => {
    test("increments wind counter and sets paowind on 4th wind pon", () => {
        const kyoku = createTestKyoku({ nowinds: [0, 0, 3, 0] });
        // tm2t("1z") = 41 (east wind)
        countpao(41, 2, 1, kyoku);
        expect(kyoku.nowinds[2]).toBe(4);
        expect(kyoku.paowind).toBe(1);
    });

    test("increments wind counter without setting paowind before 4th", () => {
        const kyoku = createTestKyoku({ nowinds: [0, 0, 2, 0] });
        countpao(41, 2, 1, kyoku);
        expect(kyoku.nowinds[2]).toBe(3);
        expect(kyoku.paowind).toBe(-1);
    });

    test("increments dragon counter and sets paodrag on 3rd dragon pon", () => {
        const kyoku = createTestKyoku({ nodrags: [2, 0, 0, 0] });
        // tm2t("5z") = 45 (hatsu)
        countpao(45, 0, 3, kyoku);
        expect(kyoku.nodrags[0]).toBe(3);
        expect(kyoku.paodrag).toBe(3);
    });

    test("does not modify counters for non-honor tiles", () => {
        const kyoku = createTestKyoku();
        countpao(15, 0, 1, kyoku);
        expect(kyoku.nowinds[0]).toBe(0);
        expect(kyoku.nodrags[0]).toBe(0);
    });
});

describe("initKyoku", () => {
    function createLeaf(overrides?: Record<string, unknown>) {
        return {
            chang: 0,
            ju: 0,
            ben: 0,
            liqibang: 0,
            scores: [25000, 25000, 25000, 25000],
            doras: ["5m"],
            tiles0: ["1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m", "9m", "1p", "2p", "3p", "4p"],
            tiles1: ["1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s", "1z", "2z", "3z", "4z"],
            tiles2: ["5p", "6p", "7p", "8p", "9p", "1m", "2m", "3m", "4m", "5m", "6m", "7m", "8m"],
            tiles3: ["1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p", "1s", "2s", "3s", "4s"],
            ...overrides,
        };
    }

    test("returns a new KyokuState", () => {
        const leaf = createLeaf();
        const kyoku = initKyoku(leaf);
        expect(kyoku.nplayers).toBe(4);
    });

    test("sets round from chang, ju, ben, liqibang", () => {
        const leaf = createLeaf({ chang: 1, ju: 2, ben: 3, liqibang: 1 });
        // round = [4*1+2, 3, 1] = [6, 3, 1]
        const kyoku = initKyoku(leaf);
        expect(kyoku.round).toEqual([6, 3, 1]);
    });

    test("pads initscores to length 4 for sanma", () => {
        const leaf = createLeaf({ scores: [35000, 35000, 35000] });
        const kyoku = initKyoku(leaf);
        expect(kyoku.initscores).toHaveLength(4);
        expect(kyoku.initscores[3]).toBe(0);
    });

    test("converts doras from mjs tile strings", () => {
        const leaf = createLeaf({ doras: ["5m", "3p"] });
        const kyoku = initKyoku(leaf);
        // tm2t("5m")=15, tm2t("3p")=23
        expect(kyoku.doras).toEqual([15, 23]);
    });

    test("handles single dora field", () => {
        const leaf = createLeaf();
        // @ts-expect-error testing legacy single dora field
        leaf.dora = "7z";
        const kyoku = initKyoku(leaf);
        // tm2t("7z")=47
        expect(kyoku.doras).toEqual([47]);
    });

    test("pops last tile from dealer haipai into draws", () => {
        const leaf = createLeaf({ ju: 0 });
        const kyoku = initKyoku(leaf);
        // dealer seat=0, tiles0 has 13 tiles, last is "4p"=24
        // haipais[0] should have 12 tiles, draws[0] should have [24]
        expect(kyoku.haipais[0]).toHaveLength(12);
        expect(kyoku.draws[0]).toEqual([24]);
        expect(kyoku.poppedtile).toBe(24);
    });

    test("sets dealerseat from ju", () => {
        const leaf = createLeaf({ ju: 2 });
        const kyoku = initKyoku(leaf);
        expect(kyoku.dealerseat).toBe(2);
        expect(kyoku.draws[2]).toHaveLength(1);
    });

    test("initializes pao tracking fields", () => {
        const leaf = createLeaf();
        const kyoku = initKyoku(leaf);
        expect(kyoku.ldseat).toBe(-1);
        expect(kyoku.nriichi).toBe(0);
        expect(kyoku.nkan).toBe(0);
        expect(kyoku.nowinds).toEqual([0, 0, 0, 0]);
        expect(kyoku.nodrags).toEqual([0, 0, 0, 0]);
        expect(kyoku.paowind).toBe(-1);
        expect(kyoku.paodrag).toBe(-1);
    });

    test("initializes empty draws and discards for all seats", () => {
        const leaf = createLeaf({ ju: 0 });
        const kyoku = initKyoku(leaf);
        // seat 0 has the popped tile draw, others empty
        expect(kyoku.draws[1]).toEqual([]);
        expect(kyoku.draws[2]).toEqual([]);
        expect(kyoku.draws[3]).toEqual([]);
        expect(kyoku.discards).toEqual([[], [], [], []]);
    });
});
