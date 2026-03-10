import fs from "fs";
import path from "path";
import { sanitizePlayerNames, soul2naga, EDITOR_URL_PREFIX } from "../src/lib/viewer";
import { fixScoreRonTileWasReachTile, toNagaLog } from "../src/lib/naga";

const REPLACE_TESTS_DIR = path.resolve(__dirname, "replace_tests");

function loadTestCase(version: string, name: string) {
    const jsonPath = path.join(REPLACE_TESTS_DIR, version, `${name}.json`);
    const mdPath = path.join(REPLACE_TESTS_DIR, version, `${name}.md`);
    const input = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const expectedUrls = fs.readFileSync(mdPath, "utf-8").trimEnd().split("\n");
    return { input, expectedUrls };
}

function applyPreprocessing(message: { name: string[]; log: unknown[] }) {
    fixScoreRonTileWasReachTile(message as any);
    message.name = sanitizePlayerNames(message.name);
}

describe("soul2naga - 実データ変換", () => {
    // 1.3.1: 生データ（soul2nagaの入力フォーマット）
    // 1.4.0: 変換済みデータ（title/ruleが変換済み+nagaUrls付き）のためsoul2nagaの対象外
    const testCases = [
        { version: "1.3.1", name: "9tiles" },
        { version: "1.3.1", name: "kazoe_yakuman" },
        { version: "1.3.1", name: "riichi_sengen_ron" },
        { version: "1.3.1", name: "url_encode_replace" },
    ];

    test.each(testCases)("$version/$name", ({ version, name }) => {
        const { input, expectedUrls } = loadTestCase(version, name);
        applyPreprocessing(input);
        const result = soul2naga(input, "dani");
        expect(result).toHaveLength(expectedUrls.length);
        result.forEach((url: string, i: number) => {
            expect(url).toBe(expectedUrls[i]);
        });
    });
});

describe("sanitizePlayerNames", () => {
    test("ASCII特殊文字を全角に変換する", () => {
        const input = ['Player!1', 'Name#2', '<Tag>', 'A"B', 'C%D', 'E&F', 'G$H', 'I*J'];
        const result = sanitizePlayerNames(input);
        expect(result).toEqual([
            'Player！1', 'Name＃2', '＜Tag＞', 'A＂B', 'C％D', 'E＆F', 'G＄H', 'I＊J',
        ]);
    });

    test("特殊文字を含まない名前はそのまま返す", () => {
        const input = ['たろう', 'Player1', '花子'];
        const result = sanitizePlayerNames(input);
        expect(result).toEqual(['たろう', 'Player1', '花子']);
    });

    test("空配列を返す", () => {
        expect(sanitizePlayerNames([])).toEqual([]);
    });
});

describe("toNagaLog - 実データ変換の冪等性", () => {
    // 1.4.0は変換済みデータ。toNagaLogが変換済みlogに対して冪等であることを検証する
    const testCases = [
        { version: "1.4.0", name: "9tiles" },
        { version: "1.4.0", name: "kazoe_yakuman" },
        { version: "1.4.0", name: "riichi_sengen_ron" },
        { version: "1.4.0", name: "url_encode_replace" },
    ];

    test.each(testCases)("$version/$name", ({ version, name }) => {
        const { input } = loadTestCase(version, name);
        input.log.forEach((log: unknown[], i: number) => {
            const before = JSON.parse(JSON.stringify(log));
            const result = toNagaLog(log);
            expect(result).toEqual(before);
        });
    });
});
