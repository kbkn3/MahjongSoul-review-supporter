# 槍槓ドラ欠落・同巡ポン曖昧性 対応 実装計画 (Issue #23 / #22)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Issue #23（槍槓発生時にドラ表示牌の枚数が欠落する）を、`doras` フィールドを持つ全 Record イベントからドラ表示牌を更新することで修正する。Issue #22（同巡同一牌ポンの変換ずれ）は tenhou/6 形式固有の曖昧性（上流 tensoul#14 で確定済み）であることを実牌譜で検証し、既知の制限としてドキュメント化する。

**Architecture:** 変換器（`src/lib/kyoku.ts` + `src/content-scripts/dd.ts`、tensoul 系譜）は現在 `RecordDealTile` / `RecordDiscardTile` の `doras` しか読まない。liqi スキーマ上は `RecordAnGangAddGang` / `RecordBaBei` / `RecordHule`（トップレベル + `HuleInfo.doras`）にも `doras` があり、槓の直後に和了（槍槓・嶺上開花）で局が終わると DealTile/DiscardTile が来ないためドラ更新が漏れる。ドラ更新を `updateDoras()` に共通化し全イベントで呼ぶ（Akagi の majsoul2mjai と同じ方式）。mjai-reviewer/convlog の `conv.rs` はドラ表示牌リストをフィードとして消費する（開局+1、暗槓=即時+1、大明槓=次打牌+1、加槓=次ツモ+1、**槍槓された加槓は消費しない**）ため、「雀魂レコードが実際に開示した表示牌を過不足なく `entry[2]` に入れる」ことが正となる。過剰分は convlog は無視するが、不足は `InsufficientDoraIndicators` エラーになる。

**Tech Stack:** TypeScript, vitest, wxt。参照実装: Equim-chan/mjai-reviewer `convlog/src/conv.rs`（ドラ消費規則・鳴き文字列仕様）、shinkuan/Akagi `majsoul2mjai.py`（全イベント doras チェック方式・手法のみ参照）。

## Global Constraints

- 変更は最小限に留め、既存の tensoul 系コードスタイル（4スペースインデント、`/* eslint-disable @typescript-eslint/no-explicit-any */` ブロック）に従う
- GPL の MajsoulMax / Akagi(AGPL) からコードをコピーしない（手法のみ独立実装）。tensoul(MIT) は帰属表示済みで参照可
- テスト: `npm test`（vitest run）。型チェック: `npm run build`
- tenhou 牌エンコード: `tm2t("3m")=13`, `"7p"=27`, `"1z"=41`, 赤5=51-53, ツモ切り=60

## 根本原因（調査結果の要約）

**Issue #23（槍槓ドラ欠落）:**
- `handleDealTile` / `handleDiscardTile` のみが `event.doras` を反映する（`src/lib/kyoku.ts:92-114`）
- liqi スキーマ（`src/assets/majsoul/liqi.json`）では `RecordAnGangAddGang`(id 6) / `RecordBaBei`(id 6) / `RecordHule`(トップレベル id 7 と `HuleInfo.doras` id 8) にも `doras` がある
- 槓の直後に局が和了で終わる（槍槓ロン・嶺上開花ツモ・カン後の打牌へのロン）と、以降に DealTile/DiscardTile が来ないため、`RecordAnGangAddGang.doras` / `RecordHule.doras` にしか載らない新ドラ表示牌が `entry[2]` から欠落する
- 上流 Equim-chan/tensoul、全フォーク（hidacow/unStatiK/Xerxes-2/b11p）、tensoul-py も同一実装で未修正（本プロジェクト固有の退行ではない）

**Issue #22（同巡ポン）:**
- 同一プレイヤーが同一牌を（間に他家の鳴きを挟んで）連続して手出しし、そのうち後の1枚がポンされた場合、tenhou/6 形式（プレイヤー別カラム形式）にはどちらの打牌が鳴かれたかを表す情報が存在しない
- 上流 tensoul#14 で「tensoul の出力は正しく、形式固有の曖昧性。天鳳ビューア/NAGA が誤再生する」と確定済み
- convlog はバックトラッキング（`conv.rs` の `BackTrack`、`confusing_nakis` テストデータ）で吸収するため、mjai.ekyu.moe（Mortal）経由のレビューは正しい。NAGA・天鳳ビューアは対処不能（外部クローズド実装）
- → 変換器側で修正可能なものではないため、実牌譜で「正しいが曖昧な出力」であることを検証し、既知の制限として明文化する

---

### Task 1: 実牌譜での仮説検証（要ユーザー協力・並行実施可）

**Files:**
- 参照: `src/content-scripts/dd.ts:22`（`VERBOSELOG`）
- 作成（検証後に任意でコミット）: `tests/fixtures/record-chankan.base64.txt`

**Interfaces:**
- Produces: Issue #23 の牌譜（東3局）で `doras` がどのイベントに載るかの確定情報。Task 5 の統合テスト期待値の裏付け

このタスクはコード修正の前提仮説「新ドラ表示牌が `RecordAnGangAddGang.doras` / `RecordHule.doras` にのみ載るケースがある」を実データで確定する。雀魂ログインが必要なためユーザー協力必須。Task 2-4 の実装自体は仮説の真偽に依存せず安全（スキーマに存在するフィールドを反映するだけ）なので、並行して進めてよい。

- [ ] **Step 1: VERBOSELOG を一時的に有効化**

`src/content-scripts/dd.ts:22` を一時変更（コミットしない）:

```ts
    const VERBOSELOG = true; //dump mjs records to output - will make the file too large for tenhou.net/5 viewer
```

- [ ] **Step 2: 問題の牌譜を拡張で取得**

`npm run dev` でブラウザ起動し、雀魂で以下を開いて拡張の変換を実行:
- Issue #23: `jmklmu-1vqxv6z0-z1e0-66c8-gkkg-morlupnnxwts_a443379267_2`（東3局）
- Issue #22: `jmklnt-2tr265xz-z316-6ig6-i9ea-prkjvwrmpqps_a424478017_2`（親5巡目）

出力 JSON の `mjslog` / `mjsrecordtypes` を保存する。

- [ ] **Step 3: 東3局のイベント列を確認**

確認事項:
1. `RecordAnGangAddGang`(type 2, 加槓) の `doras` の中身（新表示牌を含むか）
2. 直後の `RecordHule` のトップレベル `doras` と `hules[].doras` の中身
3. 局中の全イベントの `doras` 出現位置（`mjsrecordtypes` と突き合わせ）

期待（仮説 H1）: 現行コードが読まないイベントにのみ新表示牌が載っており、`entry[2]` の長さがゲーム内表示より短い。

- [ ] **Step 4: Issue #22 の該当局で出力が「正しいが曖昧」であることを確認**

`mjslog` のグローバル順序（打牌→ポン→打牌→ポン）と、変換後 tenhou/6 の該当セルを突き合わせ、牌・鳴き文字列（`p` 位置 = 0:上家/2:対面/4:下家）自体は正しいことを確認する。convlog の鳴き仕様は `mjai-reviewer/convlog/src/conv.rs:516-562` を正とする。

- [ ] **Step 5: VERBOSELOG を戻し、検証結果を Issue #23/#22 にコメント**

`VERBOSELOG = false` に戻す。検証で判明した実イベント列を Task 5 の統合テストの期待値に反映する（仮説と異なる場合は Task 5 のフィクスチャを実データに合わせて修正）。

---

### Task 2: `updateDoras()` 共通ヘルパの抽出（挙動不変のリファクタ）

**Files:**
- Modify: `src/lib/kyoku.ts:92-114`
- Test: `tests/dd.test.ts`

**Interfaces:**
- Produces: `export function updateDoras(doras: string[] | undefined, kyoku: KyokuState): void` — イベントの `doras`（雀魂牌文字列配列）が現在の `kyoku.doras` より長いときだけ tenhou 数値に変換して置き換える。Task 3・4 が使用

- [ ] **Step 1: 失敗するテストを書く**

`tests/dd.test.ts` の import に `updateDoras` を追加し、`describe("handleDealTile")` の直前に追加:

```ts
describe("updateDoras", () => {
    test("現在より長いdorasのみ置き換える", () => {
        const kyoku = createTestKyoku({ doras: [15] });
        updateDoras(["5m", "2p"], kyoku);
        expect(kyoku.doras).toEqual([15, 22]);
    });

    test("同じ長さ以下は無視する", () => {
        const kyoku = createTestKyoku({ doras: [15] });
        updateDoras(["1m"], kyoku);
        expect(kyoku.doras).toEqual([15]);
    });

    test("undefinedは無視する", () => {
        const kyoku = createTestKyoku({ doras: [15] });
        updateDoras(undefined, kyoku);
        expect(kyoku.doras).toEqual([15]);
    });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- tests/dd.test.ts`
Expected: FAIL（`updateDoras` が未 export）

- [ ] **Step 3: 実装（共通化）**

`src/lib/kyoku.ts` の `handleBaBei` の直前に追加し、`handleDealTile` / `handleDiscardTile` の重複ロジックを置き換える:

```ts
export function updateDoras(doras: string[] | undefined, kyoku: KyokuState): void {
    if (doras && doras.length > kyoku.doras.length)
        kyoku.doras = doras.map((f: string) => tm2t(f));
}
```

```ts
export function handleDealTile(event: { seat: number; tile: string; doras?: string[] }, kyoku: KyokuState): void {
    updateDoras(event.doras, kyoku);
    kyoku.draws[event.seat].push(tm2t(event.tile));
}
```

`handleDiscardTile` 末尾の 2 行（`if (event.doras && ...) kyoku.doras = ...`）も `updateDoras(event.doras, kyoku);` に置き換える。

- [ ] **Step 4: 全テストが通ることを確認**

Run: `npm test`
Expected: PASS（既存テスト含め全緑）

- [ ] **Step 5: コミット**

```bash
git add src/lib/kyoku.ts tests/dd.test.ts
git commit -m "refactor: ドラ表示牌の更新をupdateDorasに共通化"
```

---

### Task 3: 暗槓・加槓・北抜きイベントの doras 反映

**Files:**
- Modify: `src/lib/kyoku.ts`（`handleBaBei` / `handleAnkan` / `handleShouminkan`）
- Test: `tests/dd.test.ts`

**Interfaces:**
- Consumes: Task 2 の `updateDoras`
- Produces: `handleAnkan(event: { seat: number; tiles: string; doras?: string[] }, ...)` / `handleShouminkan(同)` / `handleBaBei(event: { seat: number; doras?: string[] }, ...)`。`dd.ts` は `e` をそのまま渡しているため呼び出し側の変更は不要

- [ ] **Step 1: 失敗するテストを書く**

`tests/dd.test.ts` の `handleAnkan` / `handleShouminkan` の既存 describe に追加:

```ts
    test("event.dorasで新ドラ表示牌を反映する (issue #23)", () => {
        const kyoku = createTestKyoku({ doras: [15] });
        kyoku.haipais[2] = [22, 22, 22, 22];
        handleAnkan({ seat: 2, tiles: "2p", doras: ["5m", "1s"] }, kyoku);
        expect(kyoku.doras).toEqual([15, 31]);
    });
```

```ts
    test("event.dorasで新ドラ表示牌を反映する (issue #23)", () => {
        const kyoku = createTestKyoku({ doras: [15] });
        kyoku.draws[1] = ["p414141"];
        handleShouminkan({ seat: 1, tiles: "1z", doras: ["5m", "1s"] }, kyoku);
        expect(kyoku.doras).toEqual([15, 31]);
        expect(kyoku.discards[1]).toEqual(["k41414141"]);
    });
```

`handleBaBei` の describe に追加:

```ts
    test("event.dorasで新ドラ表示牌を反映する", () => {
        const kyoku = createTestKyoku({ doras: [15] });
        handleBaBei({ seat: 2, doras: ["5m", "1s"] }, kyoku);
        expect(kyoku.doras).toEqual([15, 31]);
    });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- tests/dd.test.ts`
Expected: FAIL（`doras` が型に無い / `kyoku.doras` が `[15]` のまま）

- [ ] **Step 3: 実装**

各ハンドラのシグネチャに `doras?: string[]` を追加し、先頭で `updateDoras` を呼ぶ:

```ts
export function handleBaBei(event: { seat: number; doras?: string[] }, kyoku: KyokuState): void {
    updateDoras(event.doras, kyoku);
    kyoku.discards[event.seat].push("f44");
}
```

```ts
export function handleAnkan(event: { seat: number; tiles: string; doras?: string[] }, kyoku: KyokuState): void {
    updateDoras(event.doras, kyoku);
    let til: number = tm2t(event.tiles);
    // ...既存処理は変更しない
```

```ts
export function handleShouminkan(event: { seat: number; tiles: string; doras?: string[] }, kyoku: KyokuState): void {
    updateDoras(event.doras, kyoku);
    const til: number = tm2t(event.tiles);
    // ...既存処理は変更しない
```

補足: `RecordChiPengGang`（チー/ポン/大明槓）と `RecordLiuJu` には liqi スキーマ上 `doras` フィールドが無いため対象外。

- [ ] **Step 4: 全テストが通ることを確認**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/kyoku.ts tests/dd.test.ts
git commit -m "fix: 暗槓・加槓・北抜きイベントのdorasを反映 (issue #23)"
```

---

### Task 4: RecordHule の doras 反映

**Files:**
- Modify: `src/content-scripts/dd.ts:204-217`（`generatelog` の `RecordHule` case）と import（`../lib/kyoku` から `updateDoras` を追加）

**Interfaces:**
- Consumes: Task 2 の `updateDoras`
- Produces: 槍槓・嶺上開花など「槓→和了」で局が終わる場合も、和了イベントに載る表示牌リストが `dumpKyoku` 前に `kyoku.doras` へ反映される

- [ ] **Step 1: 実装**

`dd.ts` の import に `updateDoras` を追加し、`RecordHule` case を次のように変更:

```ts
                case "RecordHule":
                    {
                        // 槓直後の和了(槍槓・嶺上)ではDealTile/DiscardTileが来ないため、
                        // 和了イベント側のdorasを反映しないと新ドラ表示牌が欠落する
                        updateDoras(e.doras, kyoku);
                        const agari: any[] = [];
                        let ura: number[] = [];
                        e.hules.forEach((f: any) => {
                            updateDoras(f.doras, kyoku);
                            if (ura.length < (f.li_doras ? f.li_doras.length : 0))
                                ura = f.li_doras.map((g: string) => tm2t(g));
                            agari.push(parsehule(f, kyoku, cfg));
                        });
                        const entry = dumpKyoku(kyoku, ura);
                        entry.push([RUNES.agari[JPNAME]].concat(agari.flat()));
                        log.push(entry);
                        return;
                    }
```

- [ ] **Step 2: 全テストが通ることを確認（実フィクスチャ回帰）**

Run: `npm test`
Expected: PASS。特に `tests/parse.test.ts` の実録フィクスチャ end-to-end が全緑であること（通常局では `e.doras` は既存 `kyoku.doras` と同長以下なので挙動不変）。

- [ ] **Step 3: コミット**

```bash
git add src/content-scripts/dd.ts
git commit -m "fix: RecordHuleのdorasを反映し槍槓・嶺上和了時のドラ欠落を修正 (issue #23)"
```

（このタスク単体の自動テストは Task 5 の統合テストが担う。分割しているのは Task 5 のフィクスチャが Task 1 の実データ確認結果で調整されうるため。）

---

### Task 5: 槍槓局の統合テスト（合成レコードで decode 後の parse を検証）

**Files:**
- Test: `tests/parse.test.ts`（describe を追加）

**Interfaces:**
- Consumes: `parse(record, cfg)`（`src/content-scripts/dd.ts`）、`cfgTables()`（`src/lib/cfg.ts`）
- Produces: 「加槓 doras → 槍槓ロン」で `entry[2]`（ドラ表示牌リスト）に新表示牌が含まれる回帰テスト

注意: 合成レコードの `doras` の載せ方は仮説 H1 に基づく。Task 1 の実データ確認で異なる載り方（例: `RecordHule.doras` のみ）が判明した場合、フィクスチャをそれに合わせて修正すること（アサーションは同じ）。

- [ ] **Step 1: 失敗するテストを書く**

`tests/parse.test.ts` に追加:

```ts
import { cfgTables } from "../src/lib/cfg";
import type { DecodedRecord } from "../src/lib/record-decode";

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
            { name: "RecordAnGangAddGang", data: { seat: 1, type: 2, tiles: "1z", doras: ["3m", "7p"] } },
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
```

- [ ] **Step 2: 修正前コードで失敗することを確認**

Run: `npm test -- tests/parse.test.ts`
Expected: 1つ目のテストが Task 3・4 未適用の状態では `[13]`（欠落）で FAIL することを `git stash` で確認してもよい。Task 3・4 適用済みなら PASS。

- [ ] **Step 3: 全テストが通ることを確認**

Run: `npm test && npm run build`
Expected: PASS / 型エラーなし

- [ ] **Step 4: コミット**

```bash
git add tests/parse.test.ts
git commit -m "test: 槍槓局の合成レコードでドラ表示牌の反映を検証 (issue #23)"
```

---

### Task 6: Issue #22 を既知の制限としてドキュメント化

**Files:**
- Modify: `README.md`（「既知の制限」節を追加。無ければ末尾近くの適切な位置）

**Interfaces:**
- Consumes: Task 1 Step 4 の検証結果

- [ ] **Step 1: README に既知の制限を追記**

```markdown
## 既知の制限

### 同巡に同一牌が複数回切られた場合のポンの再生ずれ (Issue #22)

同一プレイヤーが同じ牌を（間に他家の鳴きを挟んで）連続して手出しし、その後の1枚が
ポンされた対局では、天鳳/6形式（プレイヤー別カラム形式）の仕様上「どちらの打牌が
鳴かれたか」を表現できません（上流 [tensoul#14](https://github.com/Equim-chan/tensoul/issues/14)
で形式固有の制限として確認済み）。このため天鳳ビューアや NAGA では該当局の進行が
実際と異なって再生されることがあります。変換された牌譜データ自体は正しく、
[mjai-reviewer](https://github.com/Equim-chan/mjai-reviewer)（Mortal）はバックトラッキングで
正しく解釈するため、レビュー結果には影響しません。
```

- [ ] **Step 2: Issue #22 / #23 へのコメント文案を作成しユーザーに提示**

- #22: 上記の調査結果（tensoul#14 と同根、形式固有、Mortal レビューは正しい）を報告し、既知の制限として README に記載した旨 + クローズ提案
- #23: 修正内容（doras を読むイベントの拡充）とリリース予定バージョンを報告

- [ ] **Step 3: コミット**

```bash
git add README.md
git commit -m "docs: 同巡同一牌ポンの再生ずれをtenhou/6形式の既知の制限として記載 (issue #22)"
```

---

## 将来オプション（本計画のスコープ外）

- **majsoul→mjai 直接変換**: 雀魂レコードは全イベントのグローバル順序を持つため、tenhou/6 を経由せず convlog の mjai Event 形式（`convlog/src/mjai.rs`）へ直接変換すれば Issue #22 の曖昧性が原理的に消える。ただし mjai を直接受け取る導線（mjai.ekyu.moe は tenhou/6 入力）が現状無いため、効果はローカル Mortal 利用者に限られる
- **鳴き牌位置の `froms` ベース化**: `handlePon` / `handleDaiminkan` / `handleChii` は「鳴いた牌が `tiles` 末尾（チーは [2]）」を仮定している。Akagi 同様 `froms` から鳴き牌を特定する方が頑健だが、現時点で実害の報告は無い
- **同巡ポン曖昧局の検出と警告表示**: 変換時に「同一席の同一牌の複数回手出し + 他家のポン」を検出し popup で注意喚起する
