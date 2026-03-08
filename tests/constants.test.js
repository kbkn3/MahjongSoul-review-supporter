import { RUNES, JPNAME, RONAME, ENNAME, TSUMOGIRI, DAISANGEN, DAISUUSHI } from "../src/lib/constants";

describe("constants", () => {
    test("RUNES entries all have 3 language variants", () => {
        Object.entries(RUNES).forEach(([key, value]) => {
            expect(value).toHaveLength(3);
        });
    });

    test("RUNES contains all required keys", () => {
        const expectedKeys = [
            "mangan", "haneman", "baiman", "sanbaiman", "yakuman",
            "kazoeyakuman", "kiriagemangan",
            "agari", "ryuukyoku", "nagashimangan", "suukaikan",
            "sanchahou", "kyuushukyuuhai", "suufonrenda", "suuchariichi",
            "fu", "han", "points", "all", "pao",
            "tonpuu", "hanchan", "friendly", "tournament",
            "sanma", "red", "nored"
        ];
        expect(Object.keys(RUNES).sort()).toEqual(expectedKeys.sort());
    });

    test("RUNES representative values match dd.js originals", () => {
        expect(RUNES.agari[JPNAME]).toBe("和了");
        expect(RUNES.ryuukyoku[JPNAME]).toBe("流局");
        expect(RUNES.yakuman[JPNAME]).toBe("役満");
        expect(RUNES.mangan[ENNAME]).toBe("Mangan ");
        expect(RUNES.tournament[RONAME]).toBe("Tournament");
        expect(RUNES.nored[JPNAME]).toBe("");
        expect(RUNES.tonpuu[JPNAME]).toBe("東喰");
        expect(RUNES.hanchan[JPNAME]).toBe("南喰");
    });

    test("language indices are correct", () => {
        expect(JPNAME).toBe(0);
        expect(RONAME).toBe(1);
        expect(ENNAME).toBe(2);
    });

    test("TSUMOGIRI is 60", () => {
        expect(TSUMOGIRI).toBe(60);
    });

    test("sekinin barai yaku indices", () => {
        expect(DAISANGEN).toBe(37);
        expect(DAISUUSHI).toBe(50);
    });
});
