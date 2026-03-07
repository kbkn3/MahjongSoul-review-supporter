const { RUNES, JPNAME, RONAME, ENNAME, TSUMOGIRI, DAISANGEN, DAISUUSHI } = require("../src/lib/constants");

describe("constants", () => {
    test("RUNES entries all have 3 language variants", () => {
        Object.entries(RUNES).forEach(([key, value]) => {
            expect(value).toHaveLength(3);
        });
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
