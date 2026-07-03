import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { decodeGameRecord } from "../src/lib/record-decode";
import { parse } from "../src/content-scripts/dd";
import { cfgTables } from "../src/lib/cfg";
import type { DecodedRecord } from "../src/lib/record-decode";

// 実録fetchGameRecord応答を decode → parse まで通し、取得・デコード・cfg解決・牌譜変換の
// 全チェーンが実データで成立することを保証する(ブラウザ非依存の回帰テスト)。
const base64 = readFileSync("tests/fixtures/record-raw.base64.txt", "utf8").trim();
const raw = Uint8Array.from(Buffer.from(base64, "base64"));

describe("parse (real fixture end-to-end)", () => {
  it("decode→parseでtenhou形式を生成できる", () => {
    const result = parse(decodeGameRecord(raw));

    expect(result.ver).toBe("2.3");
    expect(result.ref).toBe("260520-a9ac4630-6d4c-49e4-8f72-93d5d6080eee");
    expect(result.ratingc).toBe("PF4");
    // name は席順(name[seat])で格納される
    expect(result.name).toEqual(["でぃすく。。。", "バイト先の鳥", "kbkn3", "神楽めあ0w0"]);

    // 局ログが生成されている(generatelogがaction.nameで正しく分岐できている)
    expect(Array.isArray(result.log)).toBe(true);
    expect(result.log.length).toBeGreaterThan(0);

    // cfgルックアップ(段位/性別)が全員分undefinedを出さず解決できている
    expect(result.dan.filter((d: string) => d.length > 0)).toHaveLength(4);
    expect(result.sx.every((s: string) => ["F", "M", "C"].includes(s))).toBe(true);
  });

  it("立直×和了局で裏ドラ表示牌が出力される (regression: 7670c153)", () => {
    const result = parse(decodeGameRecord(raw));
    const uraIndicators = result.log.map((kyoku: any[]) => kyoku[3] as number[]);
    const populated = uraIndicators
      .map((u: number[], i: number) => ({ i, u }))
      .filter(({ u }: { u: number[] }) => u.length > 0);

    expect(populated.length).toBe(4);
    expect(uraIndicators[1]).toEqual([18]);
    expect(uraIndicators[5]).toEqual([44]);
    expect(uraIndicators[6]).toEqual([44]);
    expect(uraIndicators[9]).toEqual([36]);
  });
});

// 加槓に槍槓ロンが掛かる合成レコード。局が「槓→和了」で終わるため
// DealTile/DiscardTile経由のドラ更新が発生しない(issue #23の再現形)。
function chankanRecord(): DecodedRecord {
    const tiles = (n: number, t: string) => new Array(n).fill(t);
    return {
        head: {
            uuid: "synthetic-chankan",
            end_time: 0,
            accounts: [],
            result: {
                players: [0, 1, 2, 3].map(seat => ({ seat, part_point_1: 25000, total_point: 0 })),
            },
            config: {
                meta: { mode_id: 0, room_id: 1234, contest_uid: 0 },
                mode: { mode: 1, detail_rule: { dora_count: 3, have_zimosun: false } },
            },
        },
        actions: [
            { name: "RecordNewRound", data: {
                chang: 0, ju: 0, ben: 0, liqibang: 0, dora: "3m",
                scores: [25000, 25000, 25000, 25000],
                tiles0: [...tiles(13, "1m"), "1z"],
                tiles1: [...tiles(11, "2m"), "1z", "1z"],
                tiles2: tiles(13, "3s"),
                tiles3: tiles(13, "7p"),
            } },
            { name: "RecordDiscardTile", data: { seat: 0, tile: "1z", moqie: true, is_liqi: false } },
            { name: "RecordChiPengGang", data: { seat: 1, type: 1, tiles: ["1z", "1z", "1z"], froms: [1, 1, 0] } },
            { name: "RecordDiscardTile", data: { seat: 1, tile: "2m", moqie: false, is_liqi: false } },
            { name: "RecordDealTile", data: { seat: 2, tile: "9s" } },
            { name: "RecordDiscardTile", data: { seat: 2, tile: "9s", moqie: true, is_liqi: false } },
            { name: "RecordDealTile", data: { seat: 3, tile: "9p" } },
            { name: "RecordDiscardTile", data: { seat: 3, tile: "9p", moqie: true, is_liqi: false } },
            { name: "RecordDealTile", data: { seat: 0, tile: "4m" } },
            { name: "RecordDiscardTile", data: { seat: 0, tile: "4m", moqie: true, is_liqi: false } },
            { name: "RecordDealTile", data: { seat: 1, tile: "1z" } },
            // 槍槓で流れる加槓はkan自体が不成立となり新ドラは公開されないため、
            // このイベントにdorasは載らない(H1ではなくH2: RecordHule.dorasのみ)
            { name: "RecordAnGangAddGang", data: { seat: 1, type: 2, tiles: "1z" } },
            { name: "RecordHule", data: {
                doras: ["3m", "7p"],
                hules: [{
                    seat: 2, zimo: false, qinjia: false, liqi: false, yiman: false,
                    count: 1, fu: 40, point_rong: 1300,
                    fans: [{ id: 3, val: 1 }],
                    hand: [], ming: [], hu_tile: "1z",
                    doras: ["3m", "7p"], li_doras: [],
                }],
            } },
        ],
    } as unknown as DecodedRecord;
}

describe("parse (槍槓の合成レコード)", () => {
    it("槓→和了で終わる局でも新ドラ表示牌がentry[2]に反映される (issue #23)", () => {
        const result = parse(chankanRecord(), cfgTables());
        const kyokuEntry = result.log[0];
        expect(kyokuEntry[2]).toEqual([13, 27]); // 3m, 7p
    });

    it("加槓がkとしてdiscardsに、槍槓ロンの放銃者が加槓者になる", () => {
        const result = parse(chankanRecord(), cfgTables());
        const kyokuEntry = result.log[0];
        expect(kyokuEntry[4 + 3 * 1 + 2]).toContain("k41414141"); // seat1のdiscards
        const agari = kyokuEntry[16][2]; // [和了者, 放銃者, 包]
        expect(agari[0]).toBe(2);
        expect(agari[1]).toBe(1);
    });
});
