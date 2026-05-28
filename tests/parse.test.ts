import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { decodeGameRecord } from "../src/lib/record-decode";
import { parse } from "../src/content-scripts/dd";

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
