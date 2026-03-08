import { tm2t, deaka, makeaka, tlround, padRight, relativeseating } from "../src/lib/tile";

describe("tm2t", () => {
    test("man tiles", () => {
        expect(tm2t("1m")).toBe(11);
        expect(tm2t("5m")).toBe(15);
        expect(tm2t("9m")).toBe(19);
    });

    test("pin tiles", () => {
        expect(tm2t("1p")).toBe(21);
        expect(tm2t("5p")).toBe(25);
        expect(tm2t("9p")).toBe(29);
    });

    test("sou tiles", () => {
        expect(tm2t("1s")).toBe(31);
        expect(tm2t("5s")).toBe(35);
        expect(tm2t("9s")).toBe(39);
    });

    test("honor tiles", () => {
        expect(tm2t("1z")).toBe(41); // east
        expect(tm2t("2z")).toBe(42); // south
        expect(tm2t("3z")).toBe(43); // west
        expect(tm2t("4z")).toBe(44); // north
        expect(tm2t("5z")).toBe(45); // haku
        expect(tm2t("6z")).toBe(46); // hatsu
        expect(tm2t("7z")).toBe(47); // chun
    });

    test("aka (red five) tiles", () => {
        expect(tm2t("0m")).toBe(51); // aka 5man
        expect(tm2t("0p")).toBe(52); // aka 5pin
        expect(tm2t("0s")).toBe(53); // aka 5sou
    });
});

describe("deaka", () => {
    test("converts aka to normal tile", () => {
        expect(deaka(51)).toBe(15); // aka 5man -> 5man
        expect(deaka(52)).toBe(25); // aka 5pin -> 5pin
        expect(deaka(53)).toBe(35); // aka 5sou -> 5sou
    });

    test("returns non-aka tiles unchanged", () => {
        expect(deaka(11)).toBe(11);
        expect(deaka(15)).toBe(15);
        expect(deaka(41)).toBe(41);
        expect(deaka(47)).toBe(47);
    });
});

describe("makeaka", () => {
    test("converts normal five to aka", () => {
        expect(makeaka(15)).toBe(51); // 5man -> aka 5man
        expect(makeaka(25)).toBe(52); // 5pin -> aka 5pin
        expect(makeaka(35)).toBe(53); // 5sou -> aka 5sou
    });

    test("returns non-five tiles unchanged", () => {
        expect(makeaka(11)).toBe(11);
        expect(makeaka(19)).toBe(19);
        expect(makeaka(41)).toBe(41);
    });

    test("haku (45) is not converted because it is an honor tile", () => {
        expect(makeaka(45)).toBe(45);
    });
});

describe("tlround", () => {
    test("returns 0 when tsumolossoff is false", () => {
        expect(tlround(false, 1234)).toBe(0);
        expect(tlround(false, 0)).toBe(0);
    });

    test("rounds up to nearest hundred when tsumolossoff is true", () => {
        expect(tlround(true, 100)).toBe(100);
        expect(tlround(true, 101)).toBe(200);
        expect(tlround(true, 1950)).toBe(2000);
        expect(tlround(true, 2000)).toBe(2000);
    });

    test("handles zero", () => {
        expect(tlround(true, 0)).toBe(0);
    });
});

describe("padRight", () => {
    test("pads array to specified length", () => {
        expect(padRight([1, 2], 4, 0)).toEqual([1, 2, 0, 0]);
    });

    test("does not modify array already at length", () => {
        expect(padRight([1, 2, 3, 4], 4, 0)).toEqual([1, 2, 3, 4]);
    });

    test("does not modify array longer than length", () => {
        expect(padRight([1, 2, 3, 4, 5], 4, 0)).toEqual([1, 2, 3, 4, 5]);
    });

    test("mutates the original array", () => {
        const arr = [1];
        padRight(arr, 3, 0);
        expect(arr).toEqual([1, 0, 0]);
    });
});

describe("relativeseating", () => {
    test("kamicha (left)", () => {
        expect(relativeseating(1, 0)).toBe(0);
        expect(relativeseating(0, 3)).toBe(0);
    });

    test("toimen (across)", () => {
        expect(relativeseating(2, 0)).toBe(1);
        expect(relativeseating(0, 2)).toBe(1);
    });

    test("shimocha (right)", () => {
        expect(relativeseating(3, 0)).toBe(2);
        expect(relativeseating(0, 1)).toBe(2);
    });
});
