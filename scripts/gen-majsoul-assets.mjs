// scripts/gen-majsoul-assets.mjs
// 雀魂CDNから liqi.json と lqc.lqbin を取得して保存する。
// 出所: 雀魂(Cat Food Studio/Yo-star)の配布物。デコード結果のみ同梱する。
// 手法参照(コードはコピーしない): tensoul(MIT) のCDNバージョン解決。
import { writeFile, mkdir } from "node:fs/promises";

const BASE = "https://game.maj-soul.com/1";

const version = (await (await fetch(`${BASE}/version.json`)).json()).version;
const resversion = await (await fetch(`${BASE}/resversion${version}.json`)).json();

const liqiPrefix = resversion.res["res/proto/liqi.json"].prefix;
const lqcPrefix = resversion.res["res/config/lqc.lqbin"].prefix;

const liqi = await (await fetch(`${BASE}/${liqiPrefix}/res/proto/liqi.json`)).json();
const lqc = new Uint8Array(
  await (await fetch(`${BASE}/${lqcPrefix}/res/config/lqc.lqbin`)).arrayBuffer()
);

await mkdir("src/assets/majsoul", { recursive: true });
await writeFile("src/assets/majsoul/liqi.json", `${JSON.stringify(liqi)}\n`);
await mkdir("scripts/.cache", { recursive: true });
await writeFile("scripts/.cache/lqc.lqbin", lqc); // 中間生成物。リポジトリには含めない
console.log(`version=${version} liqiPrefix=${liqiPrefix} lqcPrefix=${lqcPrefix}`);
console.log(`liqi.json top-level keys: ${Object.keys(liqi).join(",")}`);
