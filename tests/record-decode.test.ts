import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { decodeGameRecord } from "../src/lib/record-decode";

const base64 = readFileSync("tests/fixtures/record-raw.base64.txt", "utf8").trim();
const raw = Uint8Array.from(Buffer.from(base64, "base64"));

describe("decodeGameRecord (real fixture)", () => {
  it("head と actions を取り出せる", () => {
    const record = decodeGameRecord(raw);
    expect(typeof record.head.uuid).toBe("string");
    expect(record.head.uuid).toBe("260520-a9ac4630-6d4c-49e4-8f72-93d5d6080eee");
    expect(record.head.accounts.map((account: { nickname: string }) => account.nickname)).toEqual([
      "神楽めあ0w0",
      "kbkn3",
      "でぃすく。。。",
      "バイト先の鳥",
    ]);
    expect(record.actions.length).toBe(1211);
    expect(record.actions[0].name).toBe("RecordNewRound");
    expect(record.actions.slice(0, 3).map((action) => action.name)).toEqual([
      "RecordNewRound",
      "RecordDiscardTile",
      "RecordDealTile",
    ]);
  });
});
