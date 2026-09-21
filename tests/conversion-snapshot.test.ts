import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { decodeGameRecord } from "../src/lib/record-decode";
import { parse } from "../src/content-scripts/dd";
import { sanitizePlayerNames, soul2naga } from "../src/lib/viewer";
import { fixScoreRonTileWasReachTile } from "../src/lib/naga";
import { getPtEV } from "../src/lib/points";

// 変換経路全体の出力を丸ごと固定する。個々の関数のテストと違い、簡素化やリファクタで
// 牌譜の中身が1バイトでも変われば落ちることが目的。意図した変更なら vitest -u で更新する。
const raw = Uint8Array.from(
    Buffer.from(fs.readFileSync("tests/fixtures/record-raw.base64.txt", "utf8").trim(), "base64")
);

describe("decode→parse の出力全体", () => {
    it("実牌譜がtenhou形式に変換される", async () => {
        await expect(JSON.stringify(parse(decodeGameRecord(raw)), null, 2))
            .toMatchFileSnapshot("./snapshots/parse.txt");
    });
});

describe("NAGA向けURL生成", () => {
    const dir = path.resolve(__dirname, "replace_tests", "1.3.1");
    const fileNames = fs.readdirSync(dir).filter(name => name.endsWith(".json")).sort();
    // 順位点の指定は段位戦と固定値5種。卓種別の解決経路が分岐するのでルール全種を通す
    const ruleModes = ["dani", "1030", "1020", "515", "510", "tenho"];

    it.each(fileNames)("%s", async (fileName) => {
        const outputs: string[] = [];
        for (const ruleMode of ruleModes) {
            // 前処理は入力を書き換えるため、ルールごとに読み直す
            const message = JSON.parse(fs.readFileSync(path.join(dir, fileName), "utf-8"));
            fixScoreRonTileWasReachTile(message);
            message.name = sanitizePlayerNames(message.name);
            outputs.push(`## ${ruleMode}`, ...soul2naga(message, ruleMode));
        }
        await expect(outputs.join("\n"))
            .toMatchFileSnapshot(`./snapshots/urls-${fileName.replace(/\.json$/, "")}.txt`);
    });

    it("段位ポイント期待値の全組み合わせ", async () => {
        const dans = ["初心★1", "雀士★3", "雀傑★2", "雀豪★1", "雀聖★3", "魂天Lv3", "未知の段位", ""];
        const rows: string[] = [];
        for (const wind of ["east", "south"] as const) {
            for (const table of ["bronze", "silver", "gold", "tama", "king", null] as const) {
                for (const dan of dans) {
                    rows.push(`${wind}\t${table}\t${dan}\t${JSON.stringify(getPtEV(wind, [dan, dan, dan, dan], table))}`);
                }
            }
        }
        await expect(rows.join("\n")).toMatchFileSnapshot("./snapshots/ptev.txt");
    });
});
