import { extractTable, toSoulTable, toNagaLog } from "./naga";
import type { TenhouMessage, TenhouLog } from "./naga";
import { POINTS, getPtEV } from "./points";
import type { Wind, RankedRoom } from "./points";

const EDITOR_URL_PREFIX = "https://tenhou.net/6/#json=";

/**
 * プレイヤー名に含まれるASCII特殊文字を全角に変換する
 * 天鳳ビューアでの表示崩れを防ぐため
 */
function sanitizePlayerNames(names: string[]): string[] {
    return names.map(name =>
        name.replace(/[!#<>"%&$*]/gi, (s: string) => String.fromCharCode(s.charCodeAt(0) + 0xFEE0))
    );
}

function createViewerUrls(soulJson: string, ruleMode: string): string[] {
    const soulPaifu: TenhouMessage = JSON.parse(soulJson);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ptEV: any;
    const wind: Wind = soulPaifu.rule.disp.includes('南') ? "south" : "east";
    const table = extractTable(soulPaifu.rule.disp);
    if (table === 'others') {
        if (ruleMode !== 'dani') {
            const pointArray = POINTS.others[ruleMode];
            ptEV = [pointArray, pointArray, pointArray, pointArray, 1];
        } else {
            ptEV = getPtEV(wind, soulPaifu.dan);
        }
    } else {
        ptEV = getPtEV(wind, soulPaifu.dan, table as RankedRoom);
    }

    const title = JSON.parse(JSON.stringify(soulPaifu.title));
    title[0] = toSoulTable(title[0]);

    const rule = JSON.parse(JSON.stringify(soulPaifu.rule));
    rule.disp = toSoulTable(rule.disp);

    return soulPaifu.log.map((v: TenhouLog) => (
        EDITOR_URL_PREFIX +
        JSON.stringify({
            title: [title, JSON.stringify(ptEV).slice(1, -1)],
            name: soulPaifu.name,
            rule: rule,
            log: [toNagaLog(v)],
        })
    ));
}

function soul2naga(results: TenhouMessage, ruleMode: string): string[] {
    const INDENT = " ".repeat(4);
    const soulJson = JSON.stringify(results, null, INDENT)
        .replace(new RegExp(`\n${INDENT}+`, 'g'), " ")
        .replace(/], \[/g, "],\n        [")
        .replace(/\n\s+]/g, " ]")
        .replace(/\n\s+},\n/g, " },\n");
    return createViewerUrls(soulJson, ruleMode);
}

export { EDITOR_URL_PREFIX, sanitizePlayerNames, createViewerUrls, soul2naga };
