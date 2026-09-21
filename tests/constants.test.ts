import { RUNES, TSUMOGIRI, DAISANGEN, DAISUUSHI } from "../src/lib/constants";

describe("constants", () => {
    test("RUNES contains all required keys", () => {
        const expectedKeys = [
            "mangan", "haneman", "baiman", "sanbaiman", "yakuman",
            "kazoeyakuman",
            "agari", "ryuukyoku", "nagashimangan", "suukaikan",
            "sanchahou", "kyuushukyuuhai", "suufonrenda", "suuchariichi",
            "fu", "han", "points", "all", "pao",
            "tonpuu", "hanchan", "friendly", "tournament",
            "sanma", "red"
        ];
        expect(Object.keys(RUNES).sort()).toEqual(expectedKeys.sort());
    });

    test("RUNES representative values match dd.js originals", () => {
        expect(RUNES.agari).toBe("和了");
        expect(RUNES.ryuukyoku).toBe("流局");
        expect(RUNES.yakuman).toBe("役満");
        expect(RUNES.tonpuu).toBe("東喰");
        expect(RUNES.hanchan).toBe("南喰");
    });

    test("TSUMOGIRI is 60", () => {
        expect(TSUMOGIRI).toBe(60);
    });

    test("sekinin barai yaku indices", () => {
        expect(DAISANGEN).toBe(37);
        expect(DAISUUSHI).toBe(50);
    });
});
