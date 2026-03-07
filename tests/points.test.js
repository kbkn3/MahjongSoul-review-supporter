const { POINTS, DAN_TO_TABLE, getPtEV } = require("../src/lib/points");

describe("POINTS", () => {
    test("east/south each have 5 rooms", () => {
        expect(Object.keys(POINTS.east)).toEqual(["bronze", "silver", "gold", "tama", "king"]);
        expect(Object.keys(POINTS.south)).toEqual(["bronze", "silver", "gold", "tama", "king"]);
    });

    test("others has expected rules", () => {
        expect(Object.keys(POINTS.others).sort()).toEqual(["1020", "1030", "510", "515", "tenho"].sort());
    });

    test("point arrays have 4 elements", () => {
        for (const wind of ["east", "south"]) {
            for (const room of Object.values(POINTS[wind])) {
                for (const [dan, pts] of Object.entries(room)) {
                    expect(pts).toHaveLength(4);
                }
            }
        }
        for (const pts of Object.values(POINTS.others)) {
            expect(pts).toHaveLength(4);
        }
    });
});

describe("DAN_TO_TABLE", () => {
    test("maps all rank prefixes", () => {
        expect(DAN_TO_TABLE["初心"]).toBe("bronze");
        expect(DAN_TO_TABLE["雀士"]).toBe("silver");
        expect(DAN_TO_TABLE["雀傑"]).toBe("gold");
        expect(DAN_TO_TABLE["雀豪"]).toBe("tama");
        expect(DAN_TO_TABLE["雀聖"]).toBe("king");
    });
});

describe("getPtEV", () => {
    test("all konten east", () => {
        const dans = ["魂天Lv1", "魂天Lv2", "魂天Lv3", "魂天Lv4"];
        const result = getPtEV("east", dans);
        expect(result).toEqual([
            [0.6, 0.2, -0.2, -0.6],
            [0.6, 0.2, -0.2, -0.6],
            [0.6, 0.2, -0.2, -0.6],
            [0.6, 0.2, -0.2, -0.6],
            1
        ]);
    });

    test("all konten south", () => {
        const dans = ["魂天Lv1", "魂天Lv2", "魂天Lv3", "魂天Lv4"];
        const result = getPtEV("south", dans);
        expect(result).toEqual([
            [1.0, 0.4, -0.4, -1.0],
            [1.0, 0.4, -0.4, -1.0],
            [1.0, 0.4, -0.4, -1.0],
            [1.0, 0.4, -0.4, -1.0],
            1
        ]);
    });

    test("mixed konten and ranked with table", () => {
        const dans = ["魂天Lv1", "雀聖★1", "雀聖★2", "雀聖★3"];
        const result = getPtEV("east", dans, "king");
        expect(result[0]).toEqual([0.6, 0.3, -0.3, -0.6]);
        expect(result[1]).toEqual(POINTS.east.king["雀聖★1"]);
        expect(result[2]).toEqual(POINTS.east.king["雀聖★2"]);
        expect(result[3]).toEqual(POINTS.east.king["雀聖★3"]);
        expect(result[4]).toBe(1);
    });

    test("ranked without table derives from dan name", () => {
        const dans = ["雀豪★1", "雀豪★2", "雀豪★3", "雀聖★1"];
        const result = getPtEV("south", dans);
        expect(result[0]).toEqual(POINTS.south.tama["雀豪★1"]);
        expect(result[1]).toEqual(POINTS.south.tama["雀豪★2"]);
        expect(result[2]).toEqual(POINTS.south.tama["雀豪★3"]);
        expect(result[3]).toEqual(POINTS.south.king["雀聖★1"]);
        expect(result[4]).toBe(1);
    });

    test("individual konten in south uses same values as all-konten", () => {
        const dans = ["魂天Lv5", "雀聖★1", "雀聖★2", "雀聖★3"];
        const result = getPtEV("south", dans, "king");
        expect(result[0]).toEqual([1.0, 0.4, -0.4, -1.0]);
    });
});
