# liqi-proto バンドル削減と生成スクリプト統合 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** pbjs static-module 出力を decode 専用フラグで再生成して `src/assets/majsoul/liqi-proto.js` を 11.93MB→約4.67MB(−61%)に縮め、生成手順を `scripts/gen-majsoul-assets.mjs` に統合して `--keep-case` 付け忘れ事故を構造的に解消する。

**Architecture:** (1) `tests/liqi-frame.test.ts` の fixture 構築を static-module の `Wrapper.encode/create` 依存から `protobufjs` reflection 依存に切り替え、decode 専用ビルドと両立させる。(2) `package.json` に `gen:assets` script を追加。(3) `scripts/gen-majsoul-assets.mjs` に pbjs を `createRequire` でローカル解決して spawn するステップ + 既存の日本語ヘッダコメント prepend 処理を統合。(4) `npm run gen:assets` で `liqi-proto.js` を再生成し、サイズ・必須 API 存在・実フィクスチャ decode・ビルドの各検証を順に通してコミット。

**Tech Stack:** Node.js (`scripts/gen-majsoul-assets.mjs` は ESM)、`protobufjs-cli`(devDep, pbjs バイナリ)、`protobufjs`(本番依存, reflection はテストでのみ使用)、vitest 0.x、wxt 0.20、Chrome MV3。

**スコープ:** 設計書 `docs/superpowers/specs/2026-05-28-liqi-proto-bundle-reduction-design.md` の変更1〜5を実装する。`data_url` 経路は本計画のスコープ外(現状の明示エラーを維持)。

---

## ファイル構造

| ファイル | 変更種別 | 役割 |
|---|---|---|
| `tests/liqi-frame.test.ts` | 改修(全置換) | `unwrapWrapper` の単体テスト。fixture バイト列を protobufjs reflection で生成し、decode 専用ビルドの static-module には依存させない |
| `package.json` | 改修 | `scripts.gen:assets` を追加 |
| `scripts/gen-majsoul-assets.mjs` | 追記 | 既存処理(CDN取得 → liqi.json/cfg JSON 生成)の末尾に「pbjs spawn → liqi-proto.js 生成 → ヘッダコメント prepend」を追加 |
| `src/assets/majsoul/liqi-proto.js` | 再生成(11.93MB→4.67MB) | decode 専用フラグで生成された pbjs static-module。本番コードがそのまま `import` する |

`src/lib/record-decode.ts` / `src/lib/liqi-frame.ts` / `src/lib/liqi-schema.ts` / `src/entrypoints/bridge.content.ts` などの本番コードは無変更。

---

## Task 1: liqi-frame テストを reflection ベースに書き換え

decode 専用 pbjs 出力は `Wrapper.encode` / `Wrapper.create` を含まない。先に fixture 構築を `protobufjs.Root.fromJSON(liqiJson)` ベースに切り替え、現行(encode/create を含む)ビルドでも書き換え後でも常に通る形にする。これを先に入れることで Task 4 の再生成時にテストが壊れない。

**Files:**
- Modify: `tests/liqi-frame.test.ts`(全面置換)

- [ ] **Step 1: 現行テストが通ることを記録(回帰の基準)**

Run: `npx vitest run tests/liqi-frame.test.ts`
Expected: PASS(1 test)

- [ ] **Step 2: テストを reflection ベースに書き換え**

```typescript
// tests/liqi-frame.test.ts (全面置換)
import { describe, it, expect } from "vitest";
import protobuf from "protobufjs";
import liqiJson from "../src/assets/majsoul/liqi.json";
import { unwrapWrapper } from "../src/lib/liqi-frame";

// fixture 構築は protobufjs reflection を使う(Node 実行のテストは MV3 CSP 制約を受けない)。
// 本番 unwrapWrapper は decode 専用 static-module に依存し続けるが、テストは reflection で
// バイト列を作るので、static-module から encode/create が消えても影響を受けない。
const reflectionRoot = protobuf.Root.fromJSON(liqiJson as protobuf.INamespace);
const Wrapper = reflectionRoot.lookupType("lq.Wrapper");

describe("unwrapWrapper", () => {
  it("Wrapper{name,data}をname(先頭の'.'除去)とdataに分解する", () => {
    const encoded = Wrapper.encode(
      Wrapper.create({ name: ".lq.ResGameRecord", data: new Uint8Array([1, 2, 3]) })
    ).finish();

    const { name, data } = unwrapWrapper(encoded);
    expect(name).toBe("lq.ResGameRecord");
    expect(Array.from(data)).toEqual([1, 2, 3]);
  });
});
```

- [ ] **Step 3: 書き換え後テストが通ることを確認**

Run: `npx vitest run tests/liqi-frame.test.ts`
Expected: PASS(1 test)

- [ ] **Step 4: 全テスト回帰確認**

Run: `npx vitest run`
Expected: 133/133 PASS(現状と同数)

- [ ] **Step 5: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 6: コミット**

```bash
git add tests/liqi-frame.test.ts
git commit -m "test: liqi-frame fixtureをprotobufjs reflectionで構築するよう変更"
```

---

## Task 2: package.json に gen:assets スクリプトを追加

機械的な変更。再生成手順を `npm run gen:assets` 一発に確定させる。

**Files:**
- Modify: `package.json`(`scripts` セクション)

- [ ] **Step 1: スクリプトを追加**

`package.json` の `scripts` セクションに `"gen:assets": "node scripts/gen-majsoul-assets.mjs"` を追加する。追加後の `scripts` は以下:

```json
"scripts": {
  "dev": "wxt",
  "build": "wxt build",
  "zip": "wxt zip",
  "test": "vitest run",
  "gen:assets": "node scripts/gen-majsoul-assets.mjs"
}
```

- [ ] **Step 2: スクリプトが見えることを確認**

Run: `npm run`
Expected: 出力に `gen:assets` が含まれる

- [ ] **Step 3: コミット**

```bash
git add package.json
git commit -m "chore: gen:assets npm scriptを追加"
```

---

## Task 3: gen-majsoul-assets.mjs に pbjs ステップを統合

pbjs を devDeps の `protobufjs-cli` から `createRequire` で直接解決し、`process.execPath` で spawn する。実行後に既存の日本語ヘッダコメントを liqi-proto.js 先頭に prepend する。**このタスクではスクリプトを変更するだけで実行はしない**(実行は Task 4 で検証込みで行う)。

**Files:**
- Modify: `scripts/gen-majsoul-assets.mjs`(末尾に追記)

- [ ] **Step 1: 既存スクリプトの末尾を確認**

Run: `tail -20 scripts/gen-majsoul-assets.mjs`
Expected: 既存の cfg JSON 書き出しループの最後で終わっていること(現状 202 行、最終処理は `await writeFile(\`${CFG_DIR}/${fileName}\`, ...)` のループ末)。

- [ ] **Step 2: import を追加**

ファイル先頭の `import { writeFile, mkdir, readFile, access } from "node:fs/promises";` の直後に以下2行を追加する:

```javascript
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
```

- [ ] **Step 3: ファイル末尾に pbjs 実行 + ヘッダ prepend ステップを追加**

スクリプトの末尾(cfg JSON 書き出しループの後)に以下のブロックを追加する:

```javascript
// ----------------------------------------------------------------------------
// pbjs static-module で src/assets/majsoul/liqi-proto.js を生成する。
//
// フラグは decode 専用に固定する: 本番コード(record-decode.ts/liqi-frame.ts)は
// .decode() しか呼ばないため encode/verify/convert/create/delimited は不要。
// このフラグ固定が「--keep-case 付け忘れによる camelCase 化事故」を構造的に防ぐ。
//
// pbjs バイナリは devDependencies の protobufjs-cli を createRequire で直接解決する。
// npx 経由は PATH/環境に依存して再現性が落ちるため使用しない。

const require = createRequire(import.meta.url);
const pbjsPath = require.resolve("protobufjs-cli/bin/pbjs");

const LIQI_PROTO_OUTPUT = "src/assets/majsoul/liqi-proto.js";
const pbjsArgs = [
  "--keep-case",
  "--no-comments",
  "--no-encode",
  "--no-verify",
  "--no-convert",
  "--no-create",
  "--no-delimited",
  "-t", "static-module",
  "-w", "es6",
  "-o", LIQI_PROTO_OUTPUT,
  "src/assets/majsoul/liqi.json",
];
const pbjsResult = spawnSync(process.execPath, [pbjsPath, ...pbjsArgs], {
  stdio: "inherit",
});
if (pbjsResult.status !== 0) {
  throw new Error(`pbjs failed with status ${pbjsResult.status ?? pbjsResult.signal}`);
}

// pbjs --no-comments は出所/再生成手順を含まないため、日本語ヘッダコメントを先頭に付与する。
// 編集者が個別フラグを手で叩いて再生成し --keep-case を落とす事故を防ぐため、再生成手順は
// npm run gen:assets だけを記載する(個別 pbjs コマンドは書かない)。
const HEADER_COMMENT = "// 自動生成物。出所: 雀魂 liqi.json (src/assets/majsoul/liqi.json)。再生成: npm run gen:assets。手動編集しない。\n";
const generated = await readFile(LIQI_PROTO_OUTPUT, "utf8");
await writeFile(LIQI_PROTO_OUTPUT, HEADER_COMMENT + generated);

console.log(`liqi-proto.js 生成完了: ${LIQI_PROTO_OUTPUT}`);
```

- [ ] **Step 4: node の構文チェック(実行はしない)**

Run: `node --check scripts/gen-majsoul-assets.mjs`
Expected: エラーなし(空の正常終了)

- [ ] **Step 5: コミット**

```bash
git add scripts/gen-majsoul-assets.mjs
git commit -m "feat: gen-majsoul-assetsにpbjs(decode専用)ステップを統合"
```

---

## Task 4: liqi-proto.js を再生成して全検証を通す

設計書の検証計画を順に実行する。サイズ低下・不要 API 不在・必須 API 存在・実フィクスチャ decode・全テスト・本番ビルドのいずれかが落ちたら原因を特定して修正する。

**Files:**
- Regenerate: `src/assets/majsoul/liqi-proto.js`

- [ ] **Step 1: 変更前サイズを記録(比較の基準)**

Run: `wc -c src/assets/majsoul/liqi-proto.js`
Expected: `11926357 src/assets/majsoul/liqi-proto.js`(現状約 11.93 MB)

- [ ] **Step 2: 再生成を実行**

Run: `npm run gen:assets`
Expected: 出力末尾に `liqi-proto.js 生成完了: src/assets/majsoul/liqi-proto.js`。`scripts/.cache/lqc.lqbin` がキャッシュ済みなら CDN 取得はスキップされる(`lqc.lqbin はキャッシュ済み...` のログが出る)。

- [ ] **Step 3: サイズ低下を確認**

Run: `wc -c src/assets/majsoul/liqi-proto.js`
Expected: 約 `4672806`(±数 KB 程度の揺らぎは許容)。11.93 MB → 4.67 MB(−61%)に縮んでいること。明らかに違う場合(例えば変化なし)は Task 3 の追記内容を見直す。

- [ ] **Step 4: 先頭ヘッダコメントが付いていることを確認**

Run: `head -3 src/assets/majsoul/liqi-proto.js`
Expected: 1 行目が `// 自動生成物。出所: 雀魂 liqi.json (src/assets/majsoul/liqi.json)。再生成: npm run gen:assets。手動編集しない。`、2 行目が `/*eslint-disable ...*/`、3 行目が `import $protobuf from "protobufjs/minimal.js";`

- [ ] **Step 5: 不要 API が生成物に残っていないことを確認**

Run: `rg '= function (encode|verify|fromObject|toObject|decodeDelimited|encodeDelimited)' src/assets/majsoul/liqi-proto.js`
Expected: ヒットなし(ステータスコード 1)。万一ヒットした場合、メッセージクラスの `.encode` / `.verify` / `.fromObject` / `.toObject` / `.decodeDelimited` / `.encodeDelimited` のいずれかが生成されている=フラグ抜けがある。Task 3 の `pbjsArgs` を確認する。
注: `Lobby.prototype.createXxx` / `verifyXxx` のような RPC メソッド名は別物(`Object.defineProperty(...)` 形式で生成される)。本 grep パターンは `= function (encode|...)` 形でメソッド代入のみを拾うので、RPC スタブはヒットしない。

- [ ] **Step 6: 必須 API が生成物に存在することを確認(record-decode.ts の依存)**

Run:
```bash
rg -n 'lq\.Wrapper = |Wrapper\.decode = function|lq\.ResGameRecord = |ResGameRecord\.decode = function|lq\.GameDetailRecords = |GameDetailRecords\.decode = function|RecordNewRound\.decode = function|RecordDiscardTile\.decode = function|RecordDealTile\.decode = function' src/assets/majsoul/liqi-proto.js
```
Expected: 各パターンに最低1ヒット。`Wrapper`/`ResGameRecord`/`GameDetailRecords` の namespace 定義と各 `.decode` 関数定義、および実フィクスチャに出てくる代表的な `Record*` イベントクラスの `.decode` が存在すること。欠落があれば設計書のリスク欄に従い `--no-create` を一旦外して再生成し挙動を再評価する。

- [ ] **Step 7: 単体テストで実フィクスチャ decode が通ることを確認**

Run: `npx vitest run tests/record-decode.test.ts tests/liqi-frame.test.ts`
Expected: PASS。`tests/record-decode.test.ts` の実牌譜 decode が `uuid="260520-a9ac4630-6d4c-49e4-8f72-93d5d6080eee"` と 4 nicknames、`actions.length === 1211`、先頭 3 actions `RecordNewRound` / `RecordDiscardTile` / `RecordDealTile` を従来通り取り出せること。

- [ ] **Step 8: 全テスト pass**

Run: `npx vitest run`
Expected: 133/133 PASS

- [ ] **Step 9: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 10: 本番ビルドが通ることを確認**

Run: `npm run build`
Expected: 成功し `.output/chrome-mv3/` が生成される。

- [ ] **Step 11: bridge.js のサイズ低下を確認**

Run: `wc -c .output/chrome-mv3/content-scripts/bridge.js`
Expected: 現状の 5.26 MB(約 5520000 bytes)から大幅減。本番 bundler の minify 効果込みでおおむね 2 MB 台に低下する想定(明確な低下が見られなければ Task 3 の追記内容と本タスクの再生成結果を確認)。実測値を後続コミットメッセージに残せるよう記録する。

- [ ] **Step 12: コミット**

```bash
git add src/assets/majsoul/liqi-proto.js
git commit -m "chore: liqi-proto.jsをdecode専用フラグで再生成(11.93MB→4.67MB)"
```

---

## Task 5: E2E 手動確認

実機 Chrome で既知の牌譜を 1 件開き、NAGA / mjai 転送が PR #31 同等に動くことを確認する。生成された static-module に decode 関数が欠落していれば実機で初めて顕在化するため、最終チェックとして必須。

**Files:** なし(手動検証のみ)

- [ ] **Step 1: 拡張をロード**

`.output/chrome-mv3` を Chrome に未パッケージ拡張として読み込み直す(既にロード済みなら「リロード」)。

- [ ] **Step 2: 牌譜を開いて NAGA 転送を実行**

雀魂で `data_url` 経路ではない既知の対局(`data` フィールドで返るもの。`tests/fixtures/record-raw.base64.txt` 採取時と同じ規模感)を 1 件開き、拡張ポップアップから NAGA 転送ボタンを押す。

Expected: PR #31 と同じく `chrome.storage.local.toNagaData` に tenhou 形式 JSON が書き込まれ、NAGA の order_form タブにペーストされる。バックグラウンドコンソール / bridge コンソールに decode 例外が出ていないこと。

- [ ] **Step 3: mjai 転送も実行**

同じ牌譜のまま mjai 転送ボタンを押す。

Expected: `toMjaiData` 経由で mjai レビューフローが PR #31 と同じく動くこと。

- [ ] **Step 4: 確認結果を記録**

問題なければ追加コミット不要。`data_url` 経路の牌譜では従来通り `"game record provided via data_url is not supported yet"` のエラーが出ることも合わせて確認する(挙動変化が無いことの確認、エラーメッセージ自体は本計画では変更しない)。

---

## 完了条件

- すべてのタスクの全 Step が ✅
- `src/assets/majsoul/liqi-proto.js` が約 4.67 MB(decode 専用フラグ反映)
- `npm run gen:assets` 一発で再生成できる(個別 pbjs 手動実行は不要)
- 133 テスト全 pass、`npm run build` 成功
- `.output/chrome-mv3/content-scripts/bridge.js` のサイズが現状比で大幅減少
- 実機 E2E で NAGA / mjai 転送が PR #31 同等に動作
