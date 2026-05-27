# 雀魂 Unity WebGL 移行対応 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 雀魂の Unity WebGL クライアント移行で消滅した `app`/`GameMgr`/`cfg`/`net` グローバル依存を、WebSocket フック + 自前 protobuf デコード + 静的 cfg テーブルへ置き換え、牌譜の NAGA/mjai レビュー転送機能を復旧する。

**Architecture:** MAIN world content script を `document_start` で注入し `window.WebSocket` をフックして liqi 通信を傍受、`fetchGameRecord` 応答（protobuf バイナリ）を最新1件キャッシュする。ユーザーが拡張ボタンを押すと、キャッシュした生バイトを bridge(ISOLATED) 経由で background へ送り、background が protobufjs + バンドルした liqi スキーマでデコードし、静的 cfg JSON で表示名を解決して既存の tenhou 形式 JSON を生成、popup へ返す。これにより取得・デコード・設定参照の3機能をすべて拡張内で自己完結させる。

**Tech Stack:** TypeScript, wxt 0.20, Vue 3, protobufjs (BSD-3-Clause), vitest。雀魂スキーマ(liqi.json)/マスタ(lqc.lqbin)は雀魂CDNから自前取得しデコード。GPL の MajsoulMax からはコードを一切コピーせず手法のみ参照。

---

## ライセンス順守（全タスク共通の制約）

- ❌ **MajsoulMax(GPL-3.0)/MajsoulMax-rs(GPL-3.0) のソースをコピーしない。** デコード手順は事実として参照し独立実装する。
- ⚠️ **AutoLiqi(ライセンス無し) の配布 proto/pb2/lqc.lqbin を同梱しない。** スキーマ・マスタは雀魂CDNから自前取得する。
- ✅ tensoul/mjsoul(MIT) は帰属表示すれば参照可。`protobufjs`(BSD-3-Clause) は Apache-2.0 互換。
- liqi.json / lqc.lqbin 本体は雀魂(Cat Food Studio/Yo-star)の専有資産。同梱スナップショットには出所コメントを付す。

---

## 設計上の決定（File Structure に反映）

新クライアントは `fetchGameRecord` を能動的に呼べない（`app.NetAgent` が無い）。代わりに**ユーザーが Unity クライアント内で牌譜を開いた際にゲーム自身が送受信する `fetchGameRecord` 応答を受動的に傍受**する。MAIN world はその最新応答を1件キャッシュし、拡張ボタン押下時にキャッシュを使う。

CORS 回避とロジック集約のため、**protobuf デコードと既存 `parse()` は background service worker で実行**する（`host_permissions` に雀魂CDNが含まれCORS不要）。MAIN world は「フックとキャッシュと中継」に徹し最小化する。

### ファイル構成

| ファイル | 役割 | 区分 |
|---|---|---|
| `src/entrypoints/main-world.content.ts` | WSフック・`fetchGameRecord`応答の傍受とキャッシュ・bridgeへ生バイト中継 | 全面改修 |
| `src/entrypoints/bridge.content.ts` | popup起点トリガの中継、MAIN worldの生バイトを background へ転送 | 改修 |
| `src/entrypoints/background.ts` | 生バイト受信→liqiデコード→`parse()`→tenhou JSON を popup へ返す | 改修 |
| `src/lib/liqi-frame.ts` | liqi フレーミング(type+index+Wrapper)のアンラップ。net 非依存 | 新規 |
| `src/lib/liqi-schema.ts` | バンドル liqi.json スナップショット読込 + protobufjs Root生成。任意でCDN更新 | 新規 |
| `src/lib/majsoul-cdn.ts` | version.json→resversion→liqi.json/lqc.lqbin のURL解決(ビルド時/更新時用) | 新規 |
| `src/lib/cfg.ts` | バンドル静的cfg JSON の読込と `lookup(table, id)` ヘルパ。cfg グローバル代替 | 新規 |
| `src/content-scripts/dd.ts` | `net`/`cfg` グローバル参照を引数注入(decoder, cfg)へリファクタ | 改修 |
| `src/assets/majsoul/liqi.json` | liqi スキーマのバンドルスナップショット(出所コメント付) | 新規(生成物) |
| `src/assets/majsoul/cfg/{fan,matchmode,level,character}.json` | 必要4テーブルの静的JSON | 新規(生成物) |
| `scripts/gen-majsoul-assets.mjs` | 雀魂CDNから liqi.json/lqc.lqbin を取得しデコードして上記JSONを生成するビルド時ツール | 新規 |
| `src/env.d.ts` | `app`/`GameMgr`/`cfg`/`net` グローバル宣言を削除 | 改修 |
| `tests/*` | 各層の単体テスト + 実録フィクスチャによる結合テスト | 新規 |

### メッセージフロー（新）

```
popup ──chrome.tabs.sendMessage("tabNaga"/"tabMjai")──▶ bridge(ISOLATED)
bridge ──window.postMessage("rsr:get-record")──▶ main-world(MAIN)
main-world ──window.postMessage("rsr:record", {bytes, mode})──▶ bridge
bridge ──chrome.runtime.sendMessage({type:"decodeRecord", bytes, mode})──▶ background
background ──(liqiデコード→parse)──▶ sendResponse({tenhou})
bridge ──chrome.storage.local.set(toNagaData/toMjaiData) + tab open──▶ naga/mjai content script
```

メッセージ名は衝突回避のため `rsr:`(review-supporter) プレフィックスで統一する。

---

## Phase 1: WebSocket フック層と傍受（スキーマ不要・確実に実装可能）

### Task 1: メッセージ型定義の追加

**Files:**
- Create: `src/lib/messages.ts`
- Test: `tests/messages.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```typescript
// tests/messages.test.ts
import { describe, it, expect } from "vitest";
import { RSR } from "../src/lib/messages";

describe("RSR message constants", () => {
  it("defines namespaced message names", () => {
    expect(RSR.GET_RECORD).toBe("rsr:get-record");
    expect(RSR.RECORD).toBe("rsr:record");
    expect(RSR.DECODE_RECORD).toBe("rsr:decode-record");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/messages.test.ts`
Expected: FAIL（`Cannot find module '../src/lib/messages'`）

- [ ] **Step 3: 最小実装**

```typescript
// src/lib/messages.ts
export const RSR = {
  GET_RECORD: "rsr:get-record",
  RECORD: "rsr:record",
  DECODE_RECORD: "rsr:decode-record",
} as const;

export type ReviewMode = "naga" | "mjai";
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/messages.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/messages.ts tests/messages.test.ts
git commit -m "feat: RSRメッセージ定数を追加"
```

### Task 2: WebSocket フックユーティリティ（純粋関数）

`window.WebSocket` フックのうち、テスト可能な「どのフレームを記録すべきか」の判定と最新キャッシュ管理を純粋関数として切り出す。フレームの中身判定はまだ行わず「サイズが閾値以上の受信バイナリを候補として保持」する単純ロジックから始める（Phase 4でliqiデコードに置換）。

**Files:**
- Create: `src/lib/ws-capture.ts`
- Test: `tests/ws-capture.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```typescript
// tests/ws-capture.test.ts
import { describe, it, expect } from "vitest";
import { RecordCache } from "../src/lib/ws-capture";

describe("RecordCache", () => {
  it("最新の受信バイナリを保持する", () => {
    const cache = new RecordCache();
    const a = new Uint8Array([1, 2, 3]).buffer;
    const b = new Uint8Array([4, 5, 6, 7]).buffer;
    cache.offer(a);
    cache.offer(b);
    expect(cache.latest()).toBe(b);
  });

  it("ArrayBuffer以外は無視する", () => {
    const cache = new RecordCache();
    cache.offer("ignored" as unknown as ArrayBuffer);
    expect(cache.latest()).toBeNull();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/ws-capture.test.ts`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: 最小実装**

```typescript
// src/lib/ws-capture.ts
// liqiフレーム判定はPhase 4で導入する。現段階は最新の受信ArrayBufferを保持するだけ。
export class RecordCache {
  private buf: ArrayBuffer | null = null;

  offer(data: unknown): void {
    if (data instanceof ArrayBuffer) {
      this.buf = data;
    }
  }

  latest(): ArrayBuffer | null {
    return this.buf;
  }
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/ws-capture.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/ws-capture.ts tests/ws-capture.test.ts
git commit -m "feat: 受信フレームキャッシュRecordCacheを追加"
```

### Task 3: main-world.content.ts を WS フック方式へ全面改修

**Files:**
- Modify: `src/entrypoints/main-world.content.ts`（全面置換）

注: content script の DOM/WebSocket 挙動は vitest では検証困難なため、本タスクはブラウザ手動確認で検証する（Step 4）。ロジックの単体テストは Task 2 で済んでいる。

- [ ] **Step 1: 実装を全面置換**

```typescript
// src/entrypoints/main-world.content.ts
import { RecordCache } from "@/lib/ws-capture";
import { RSR, type ReviewMode } from "@/lib/messages";

export default defineContentScript({
  matches: [
    "https://game.mahjongsoul.com/*",
    "https://mahjongsoul.game.yo-star.com/*",
    "https://game.maj-soul.net/*",
    "https://game.maj-soul.com/*",
  ],
  world: "MAIN",
  runAt: "document_start", // Unityがソケットを開く前にフックを仕込む
  main() {
    const cache = new RecordCache();

    // WebSocket.prototype を差し替え、既存/新規ソケット双方の受信を捕捉する
    const NativeWebSocket = window.WebSocket;
    const origAddEventListener = NativeWebSocket.prototype.addEventListener;
    const proto = NativeWebSocket.prototype as WebSocket;
    const origSend = proto.send;
    proto.send = function (this: WebSocket, ...args: Parameters<WebSocket["send"]>) {
      // 最初のsendで対象ソケットを特定し受信リスナを一度だけ付与する
      if (!(this as { __rsrHooked?: boolean }).__rsrHooked) {
        (this as { __rsrHooked?: boolean }).__rsrHooked = true;
        origAddEventListener.call(this, "message", (ev: MessageEvent) => {
          const data = ev.data;
          if (data instanceof ArrayBuffer) {
            cache.offer(data);
          } else if (data instanceof Blob) {
            data.arrayBuffer().then((b) => cache.offer(b));
          }
        });
      }
      return origSend.apply(this, args);
    };

    // bridge からの要求でキャッシュした最新応答を返す
    window.addEventListener("message", (event) => {
      if (event.source !== window || !event.data) return;
      if (event.data.direction !== RSR.GET_RECORD) return;
      const mode = event.data.mode as ReviewMode;
      const bytes = cache.latest();
      if (!bytes) return;
      window.postMessage(
        { direction: RSR.RECORD, mode, bytes },
        window.location.origin
      );
    });
  },
});
```

- [ ] **Step 2: 型チェックが通ることを確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: ビルドが通ることを確認**

Run: `npm run build`
Expected: 成功（`.output/` 生成）

- [ ] **Step 4: ブラウザ手動確認**

`.output/chrome-mv3` を未パッケージ拡張として読み込み、雀魂で牌譜を1つ開く。DevTools の MAIN world コンソールで以下を実行し、キャッシュが効くことを確認:
```js
window.postMessage({ direction: "rsr:get-record", mode: "naga" }, location.origin);
```
別途 `window.addEventListener("message", e => e.data?.direction === "rsr:record" && console.log("got bytes", e.data.bytes.byteLength))` を仕込み、`got bytes <大きい数>`（約100KB級）が出ることを確認。
Expected: 牌譜を開いた後に要求すると大きな ArrayBuffer が返る。

- [ ] **Step 5: コミット**

```bash
git add src/entrypoints/main-world.content.ts
git commit -m "feat: main-worldをWebSocketフック方式に改修しapp.NetAgent依存を除去"
```

### Task 4: bridge.content.ts をトリガ中継方式へ改修

**Files:**
- Modify: `src/entrypoints/bridge.content.ts`（全面置換）

- [ ] **Step 1: 実装を全面置換**

```typescript
// src/entrypoints/bridge.content.ts
import { RSR, type ReviewMode } from "@/lib/messages";

export default defineContentScript({
  matches: [
    "https://game.mahjongsoul.com/*",
    "https://mahjongsoul.game.yo-star.com/*",
    "https://game.maj-soul.net/*",
    "https://game.maj-soul.com/*",
  ],
  main() {
    // popup起点のトリガを受け、MAIN worldへ最新record要求を投げる
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      const mode: ReviewMode | null =
        request.message === "tabNaga" ? "naga"
        : request.message === "tabMjai" ? "mjai"
        : null;
      if (mode) {
        window.postMessage({ direction: RSR.GET_RECORD, mode }, window.location.origin);
      }
      sendResponse(request.message);
      return false;
    });

    // MAIN worldが返した生バイトを background へ転送しデコードを依頼
    window.addEventListener("message", (event) => {
      if (event.source !== window || event.origin !== location.origin) return;
      if (!event.data || event.data.direction !== RSR.RECORD) return;
      const { bytes, mode } = event.data as { bytes: ArrayBuffer; mode: ReviewMode };
      chrome.runtime.sendMessage(
        { type: RSR.DECODE_RECORD, bytes: Array.from(new Uint8Array(bytes)), mode },
        (response) => {
          console.log("5." + (response?.ok ? "decoded" : "failed"));
        }
      );
    });
  },
});
```

注: `chrome.runtime.sendMessage` は構造化クローン可能だが ArrayBuffer は環境差があるため `Array.from(Uint8Array)` で数値配列化して送る。background側で `Uint8Array.from` で復元する。

- [ ] **Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/entrypoints/bridge.content.ts
git commit -m "feat: bridgeをトリガ中継+生バイト転送方式に改修"
```

---

## Phase 2: 実スキーマ取得とフィクスチャ確立（後続の全TDDの土台）

このフェーズで「実際の liqi.json」「実際の牌譜応答バイト列」「実際の lqc.lqbin」という具体物を確定させ、Phase 3-5 をそれらに対するTDDで進められるようにする。

### Task 5: 雀魂CDNアセット取得スクリプト

**Files:**
- Create: `scripts/gen-majsoul-assets.mjs`
- Create: `src/assets/majsoul/.gitkeep`

- [ ] **Step 1: スクリプトを作成**

```javascript
// scripts/gen-majsoul-assets.mjs
// 雀魂CDNから liqi.json と lqc.lqbin を取得して保存する。
// 出所: 雀魂(Cat Food Studio/Yo-star)の配布物。デコード結果のみ同梱する。
// 手法参照(コピーはしない): tensoul(MIT) のCDNバージョン解決。
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
await writeFile(
  "src/assets/majsoul/liqi.json",
  `${JSON.stringify(liqi)}\n`
);
await writeFile("scripts/.cache/lqc.lqbin", lqc); // 中間生成物。リポジトリには含めない
console.log(`version=${version} liqiPrefix=${liqiPrefix} lqcPrefix=${lqcPrefix}`);
console.log(`liqi.json fields: ${Object.keys(liqi).join(",")}`);
```

- [ ] **Step 2: スクリプトを実行し実アセットを取得**

Run:
```bash
mkdir -p scripts/.cache && node scripts/gen-majsoul-assets.mjs
```
Expected: `version=...` 行と `liqi.json fields: nested,...` のような出力。`src/assets/majsoul/liqi.json` と `scripts/.cache/lqc.lqbin` が生成される。

注: CDNホストが応答しない/国際版が必要な場合は `BASE` を `https://mahjongsoul.game.yo-star.com/...` 系へ切替える。失敗時はこのタスクで判明したURL/エラーを記録し、ホスト切替で再試行する。

- [ ] **Step 3: liqi.json をバンドル対象としてコミット（lqc.lqbin はコミットしない）**

`.gitignore` に `scripts/.cache/` を追記してから:
```bash
echo "scripts/.cache/" >> .gitignore
git add scripts/gen-majsoul-assets.mjs src/assets/majsoul/liqi.json .gitignore
git commit -m "chore: 雀魂CDNからliqi.jsonスナップショットを取得しバンドル"
```

### Task 6: 実録フィクスチャの保存

Phase 1 の手動確認で得た「牌譜を開いた時の生バイト(約100KB)」を base64 で保存し、後続デコードテストの入力にする。

**Files:**
- Create: `tests/fixtures/record-raw.base64.txt`
- Create: `tests/fixtures/README.md`

- [ ] **Step 1: フィクスチャを取得**

ブラウザ手動: 雀魂で既知の牌譜を開き、MAIN worldコンソールで以下を実行して base64 文字列を取得する（Task 3 のフック導入済み拡張をロードした状態）。
```js
window.addEventListener("message", (e) => {
  if (e.data?.direction === "rsr:record") {
    const u8 = new Uint8Array(e.data.bytes);
    let s = ""; u8.forEach((b) => (s += String.fromCharCode(b)));
    console.log(btoa(s)); // この出力をコピー
  }
});
window.postMessage({ direction: "rsr:get-record", mode: "naga" }, location.origin);
```

- [ ] **Step 2: フィクスチャと由来を保存**

取得した base64 を `tests/fixtures/record-raw.base64.txt` に貼る。`tests/fixtures/README.md` に次を記載:
```markdown
# テスト用フィクスチャ
- record-raw.base64.txt: 雀魂Unityクライアントで牌譜を開いた際の fetchGameRecord 応答(WebSocket受信生バイト)をbase64化したもの。出所は雀魂の通信データでテスト専用。再生成手順はTask 6参照。
- 対応する既知の値(uuid/対局者名)はデコードテストの期待値に使う。
```

- [ ] **Step 3: コミット**

```bash
git add tests/fixtures/record-raw.base64.txt tests/fixtures/README.md
git commit -m "test: 実録fetchGameRecord応答フィクスチャを追加"
```

---

## Phase 3: liqi フレーミングと protobuf デコード

### Task 7: liqi フレームのアンラップ（純粋関数）

liqi のメッセージ枠は概ね `[1byte type][2byte index(typeにより有無)] + Wrapper{ name, data }`。Wrapper の `name` 先頭4文字を除去して型名を得る。**この構造は事実として参照し、コードはMajsoulMaxからコピーしない。**

**Files:**
- Create: `src/lib/liqi-frame.ts`
- Test: `tests/liqi-frame.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

Task 5 で得た `liqi.json` を protobufjs で読み、Wrapper を1つ手で組んでアンラップできることを確認する。

```typescript
// tests/liqi-frame.test.ts
import { describe, it, expect } from "vitest";
import protobuf from "protobufjs";
import liqiJson from "../src/assets/majsoul/liqi.json";
import { unwrapWrapper } from "../src/lib/liqi-frame";

describe("unwrapWrapper", () => {
  it("Wrapper{name,data}をname(先頭4文字除去)とdataに分解する", () => {
    const root = protobuf.Root.fromJSON(liqiJson as protobuf.INamespace);
    const Wrapper = root.lookupType("lq.Wrapper");
    const encoded = Wrapper.encode(
      Wrapper.create({ name: ".lq.ResGameRecord", data: new Uint8Array([1, 2, 3]) })
    ).finish();

    const { name, data } = unwrapWrapper(root, encoded);
    expect(name).toBe("lq.ResGameRecord"); // 先頭の "." を除去
    expect(Array.from(data)).toEqual([1, 2, 3]);
  });
});
```

注: `lq.Wrapper` の正確な型名・package名は Task 5 で得た liqi.json の中身で確認すること。異なる場合はテストの型名を実値に合わせる。

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/liqi-frame.test.ts`
Expected: FAIL（`unwrapWrapper` 未定義）

- [ ] **Step 3: 最小実装**

```typescript
// src/lib/liqi-frame.ts
import type protobuf from "protobufjs";

export interface Unwrapped {
  name: string;
  data: Uint8Array;
}

// Wrapper{ name, data } をデコードし、name先頭の "." を除去して返す。
export function unwrapWrapper(root: protobuf.Root, bytes: Uint8Array): Unwrapped {
  const Wrapper = root.lookupType("lq.Wrapper");
  const decoded = Wrapper.decode(bytes) as unknown as { name: string; data: Uint8Array };
  return {
    name: decoded.name.startsWith(".") ? decoded.name.slice(1) : decoded.name,
    data: decoded.data,
  };
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/liqi-frame.test.ts`
Expected: PASS

- [ ] **Step 5: protobufjs を依存に追加してコミット**

```bash
npm install protobufjs
git add package.json package-lock.json src/lib/liqi-frame.ts tests/liqi-frame.test.ts
git commit -m "feat: liqi Wrapperアンラップを追加(protobufjs導入)"
```

### Task 8: 牌譜応答のデコード（実フィクスチャでTDD）

`fetchGameRecord` 応答 = liqi の枠で包まれた `ResGameRecord`。その `data` が `GameDetailRecords`(旧 `net.MessageWrapper.decodeMessage(record.data)` 相当)で、内部 `actions[].result` が各局イベントの Wrapper。

**Files:**
- Create: `src/lib/liqi-schema.ts`
- Create: `src/lib/record-decode.ts`
- Test: `tests/record-decode.test.ts`

- [ ] **Step 1: liqi-schema ローダを作成**

```typescript
// src/lib/liqi-schema.ts
import protobuf from "protobufjs";
import liqiJson from "@/assets/majsoul/liqi.json";

let cached: protobuf.Root | null = null;

export function liqiRoot(): protobuf.Root {
  if (!cached) {
    cached = protobuf.Root.fromJSON(liqiJson as protobuf.INamespace);
  }
  return cached;
}
```

- [ ] **Step 2: 失敗する結合テストを書く（実フィクスチャ）**

Task 6 のフィクスチャをデコードし、既知の対局者名（手動確認で控えた値）に一致することを確認する。期待値は実フィクスチャの中身で確定させる。

```typescript
// tests/record-decode.test.ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { decodeGameRecord } from "../src/lib/record-decode";

const rawB64 = readFileSync("tests/fixtures/record-raw.base64.txt", "utf8").trim();
const raw = Uint8Array.from(atob(rawB64), (c) => c.charCodeAt(0));

describe("decodeGameRecord", () => {
  it("実録フィクスチャから head と actions を取り出せる", () => {
    const rec = decodeGameRecord(raw);
    expect(rec.head).toBeDefined();
    expect(rec.head.uuid).toMatch(/.+/);
    expect(Array.isArray(rec.actions)).toBe(true);
    expect(rec.actions.length).toBeGreaterThan(0);
    // 期待値: フィクスチャ採取時に控えた実際の対局者名に置き換える
    // expect(rec.head.accounts[0].nickname).toBe("<実際の名前>");
  });
});
```

- [ ] **Step 3: テストが失敗することを確認**

Run: `npx vitest run tests/record-decode.test.ts`
Expected: FAIL（`decodeGameRecord` 未定義）

- [ ] **Step 4: 実装**

```typescript
// src/lib/record-decode.ts
import { liqiRoot } from "./liqi-schema";
import { unwrapWrapper } from "./liqi-frame";

export interface DecodedRecord {
  head: any; // liqiの RecordGame.head 相当
  actions: any[]; // 各 RecordXxx メッセージのデコード済みインスタンス
}

// fetchGameRecord応答(WebSocket受信生バイト)をデコードする。
// 1) 外枠Wrapperを剥がし ResGameRecord を得る
// 2) ResGameRecord.data(=GameDetailRecords) をデコード
// 3) actions[].result(各Wrapper) を再帰デコードして局イベント列にする
export function decodeGameRecord(raw: Uint8Array): DecodedRecord {
  const root = liqiRoot();

  // liqiの応答枠は [1byte type][2byte index] の後にWrapperが続く。
  // Task 6フィクスチャで実バイト先頭を確認し、必要なら以下のオフセットを調整する。
  const payload = stripFrameHeader(raw);
  const res = unwrapWrapper(root, payload); // name = "lq.ResGameRecord"
  const ResGameRecord = root.lookupType(res.name);
  const record = ResGameRecord.decode(res.data) as any;

  const head = record.head;
  const detail = record.data; // bytes: GameDetailRecords
  const GameDetailRecords = root.lookupType("lq.GameDetailRecords");
  const details = GameDetailRecords.decode(detail) as any;

  const actions: any[] = [];
  for (const a of details.actions ?? []) {
    if (a.result && a.result.length) {
      const inner = unwrapWrapper(root, a.result);
      actions.push(root.lookupType(inner.name).decode(inner.data));
    }
  }
  return { head, actions };
}

// 応答枠ヘッダを除去する。実フィクスチャの先頭バイトで形式を確定させること。
function stripFrameHeader(raw: Uint8Array): Uint8Array {
  // type=2(応答)の場合 [type:1][index:2] の3バイトを除去する想定。
  // 実値が異なればフィクスチャに合わせて調整する。
  return raw.subarray(3);
}
```

注: `ResGameRecord`/`GameDetailRecords`/`Wrapper`/`head`/`data` の正確な型名・フィールド名は Task 5 で取得した liqi.json に依存する。Step 2 のテストを実フィクスチャで回しながら、`root.lookupType` に渡す名前と `stripFrameHeader` のオフセットを実値で確定させる。旧 `dd.ts` が `record.head` / `record.data` / `net.MessageWrapper.decodeMessage(...).actions` / `e.result` を使っていた事実が型名特定の手がかりになる。

- [ ] **Step 5: テストが通るまで型名/オフセットを実値で調整し、PASSさせる**

Run: `npx vitest run tests/record-decode.test.ts`
Expected: PASS（実際の uuid/対局者名が取れる）

- [ ] **Step 6: コミット**

```bash
git add src/lib/liqi-schema.ts src/lib/record-decode.ts tests/record-decode.test.ts
git commit -m "feat: fetchGameRecord応答のliqiデコードを実装"
```

---

## Phase 4: cfg 静的テーブル

### Task 9: lqc.lqbin から必要4テーブルを抽出するスクリプト

`lqc.lqbin` を `ConfigTables` で開き、各 `SheetData.data[]`(bytes列) を `(table)_(sheet)` の型で個別デコードして JSON 化する。**デコード手順は事実として参照し MajsoulMax のコードはコピーしない。** config/sheets のスキーマは liqi.json 同様 CDN取得するか、必要4テーブル分の最小 .proto を自前定義する。

**Files:**
- Modify: `scripts/gen-majsoul-assets.mjs`（cfg抽出を追記）
- Create: `src/assets/majsoul/cfg/fan.json`
- Create: `src/assets/majsoul/cfg/matchmode.json`
- Create: `src/assets/majsoul/cfg/level.json`
- Create: `src/assets/majsoul/cfg/character.json`

- [ ] **Step 1: cfg/sheets スキーマの取得をスクリプトに追記**

Task 5 の `resversion` から config 系スキーマ(`res/config/...` のうち config.proto 相当の記述、または `lqc` を読むための定義)を解決する。雀魂は liqi.json に `lq.config` 名前空間として ConfigTables/SheetData を含む場合があるため、まず Task 5 の liqi.json 内に `lq.config.ConfigTables` が存在するか確認する:
```bash
node -e "const j=require('./src/assets/majsoul/liqi.json'); const has=(n)=>JSON.stringify(j).includes(n); console.log('ConfigTables', has('ConfigTables'), 'SheetData', has('SheetData'), 'FanFan', has('FanFan'));"
```
存在すれば liqi.json のスキーマで lqc をデコードできる。存在しなければ config/sheets スキーマを別途CDN取得（`resversion` の該当 prefix から）して取り込む。

- [ ] **Step 2: 抽出ロジックを追記**

```javascript
// scripts/gen-majsoul-assets.mjs に追記
import protobuf from "protobufjs";
import { readFile } from "node:fs/promises";

// liqi.json内にconfigスキーマがある前提。無ければconfig用Rootを別途生成すること。
const root = protobuf.Root.fromJSON(JSON.parse(await readFile("src/assets/majsoul/liqi.json", "utf8")));
const ConfigTables = root.lookupType("lq.config.ConfigTables");
const lqcBytes = new Uint8Array(await readFile("scripts/.cache/lqc.lqbin"));
const tables = ConfigTables.decode(lqcBytes);

const camel = (s) => s.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join("");
function sheetToMap(table, sheet, fields) {
  const sd = tables.datas.find((d) => d.table === table && d.sheet === sheet);
  const Msg = root.lookupType(`lq.config.${camel(`${table}_${sheet}`)}`);
  const map = {};
  for (const item of sd.data) {
    const rec = Msg.decode(item);
    const picked = {};
    for (const f of fields) picked[f] = rec[f];
    map[rec.id] = picked;
  }
  return map;
}

await writeFile("src/assets/majsoul/cfg/fan.json",
  `${JSON.stringify(sheetToMap("fan", "fan", ["name_jp", "name_en"]))}\n`);
await writeFile("src/assets/majsoul/cfg/matchmode.json",
  `${JSON.stringify(sheetToMap("desktop", "matchmode", ["room_name_jp", "room_name_en"]))}\n`);
await writeFile("src/assets/majsoul/cfg/level.json",
  `${JSON.stringify(sheetToMap("level_definition", "level_definition", ["full_name_jp", "full_name_en"]))}\n`);
await writeFile("src/assets/majsoul/cfg/character.json",
  `${JSON.stringify(sheetToMap("item_definition", "character", ["sex"]))}\n`);
```

注: 型名/フィールド名/`id` キー名は Task 5 の liqi.json 実値で確認すること。`lq.config` 名前空間でない場合は実際の名前空間に合わせる。

- [ ] **Step 3: 実行してJSON生成**

Run: `node scripts/gen-majsoul-assets.mjs`
Expected: `src/assets/majsoul/cfg/*.json` 4ファイル生成。各JSONが `{"<id>": {"name_jp": "...", ...}}` 形式であること。

- [ ] **Step 4: 生成物をコミット**

```bash
git add scripts/gen-majsoul-assets.mjs src/assets/majsoul/cfg/
git commit -m "feat: lqc.lqbinから役/部屋/段位/キャラの静的cfg JSONを生成"
```

### Task 10: cfg ルックアップヘルパ

**Files:**
- Create: `src/lib/cfg.ts`
- Test: `tests/cfg.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

```typescript
// tests/cfg.test.ts
import { describe, it, expect } from "vitest";
import { cfgTables } from "../src/lib/cfg";

describe("cfgTables", () => {
  it("役名を日本語/英語で引ける", () => {
    const tables = cfgTables();
    // 役id=1 は雀魂で「門前清自摸和」。生成JSONの実値で期待値を確定すること。
    const fan = tables.fan["1"];
    expect(fan.name_jp).toBeTruthy();
    expect(fan.name_en).toBeTruthy();
  });

  it("存在しないidはundefinedを返す", () => {
    expect(cfgTables().fan["999999"]).toBeUndefined();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/cfg.test.ts`
Expected: FAIL（モジュール未定義）

- [ ] **Step 3: 実装**

```typescript
// src/lib/cfg.ts
import fan from "@/assets/majsoul/cfg/fan.json";
import matchmode from "@/assets/majsoul/cfg/matchmode.json";
import level from "@/assets/majsoul/cfg/level.json";
import character from "@/assets/majsoul/cfg/character.json";

export interface CfgTables {
  fan: Record<string, { name_jp: string; name_en: string }>;
  matchmode: Record<string, { room_name_jp: string; room_name_en: string }>;
  level: Record<string, { full_name_jp: string; full_name_en: string }>;
  character: Record<string, { sex: number }>;
}

export function cfgTables(): CfgTables {
  return {
    fan: fan as CfgTables["fan"],
    matchmode: matchmode as CfgTables["matchmode"],
    level: level as CfgTables["level"],
    character: character as CfgTables["character"],
  };
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/cfg.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/cfg.ts tests/cfg.test.ts
git commit -m "feat: 静的cfgテーブルのルックアップヘルパを追加"
```

---

## Phase 5: parse() リファクタと結合

### Task 11: dd.ts を net/cfg グローバル非依存にリファクタ

`dd.ts` の `parse()` が参照する 2グローバルを引数注入へ変える。挙動を変えないことを既存フィクスチャ(`tests/replace_tests/`)で保証する。

**Files:**
- Modify: `src/content-scripts/dd.ts:295-337`（`parse` のシグネチャと内部参照）
- Modify: `src/content-scripts/dd.ts:300-301`（`net.MessageWrapper.decodeMessage` 除去）
- Modify: `src/content-scripts/dd.ts:154,237-282`（`cfg.*` 参照を注入テーブル経由へ）
- Test: `tests/dd.test.ts`（既存。回帰確認に使用）

- [ ] **Step 1: 既存テストの現状を確認**

Run: `npx vitest run tests/dd.test.ts`
Expected: 現状の `parse` がどう呼ばれているかを把握（既存テストが `net`/`cfg` をモックしているか確認）。

- [ ] **Step 2: parse のシグネチャを変更（decoder と cfg を注入）**

`net.MessageWrapper.decodeMessage(record.data).actions` への依存を除去し、デコード済み `actions` を受け取る形にする。`parse` は「デコード済み record + cfgテーブル」を入力にする純粋関数へ:

```typescript
// src/content-scripts/dd.ts （該当箇所を変更）
import { cfgTables, type CfgTables } from "@/lib/cfg";

// 変更前: function parse(record: any): TenhouResult { ... net.MessageWrapper... }
// 変更後:
function parse(record: { head: any; actions: any[] }, cfg: CfgTables = cfgTables()): TenhouResult {
  TSUMOLOSSOFF = false;
  const nplayers = record.head.result.players.length;
  const mjslog: any[] = record.actions; // 既にデコード済み(record-decode.tsが供給)

  const { ruledisp, lobby, nakas } = buildRuleDisplay(record, nplayers, cfg);
  // ...以降 buildRuleConfig/buildPlayerData/parsehule に cfg を引き回す
}
```

`cfg.fan.fan.map_[e.id].name_jp` → `cfg.fan[String(e.id)].name_jp`、`cfg.desktop.matchmode.map_[id]` → `cfg.matchmode[String(id)]`、`cfg.level_definition.level_definition.map_[id]` → `cfg.level[String(id)]`、`cfg.item_definition.character.map_[charid].sex` → `cfg.character[String(charid)].sex` に機械的に置換する。`parsehule`/`buildRuleDisplay`/`buildRuleConfig`/`buildPlayerData` に `cfg: CfgTables` 引数を追加して引き回す。

- [ ] **Step 3: env.d.ts から消えたグローバル宣言を削除**

```typescript
// src/env.d.ts （app/GameMgr/cfg/net の declare を削除）
declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    const component: DefineComponent<object, object, unknown>;
    export default component;
}
```

- [ ] **Step 4: 既存の置換テストを新シグネチャに合わせて回帰確認**

`tests/replace_tests/1.4.0/*.json` を「デコード済み record」相当へ変換して `parse` に渡すようテストを更新する（入力が生 protobuf でなくデコード済みオブジェクトになるため）。期待 `.md`/`.json` 出力は不変であることを確認。

Run: `npx vitest run tests/dd.test.ts`
Expected: PASS（出力が従来と一致）

- [ ] **Step 5: 型チェックとコミット**

```bash
npx tsc --noEmit
git add src/content-scripts/dd.ts src/env.d.ts tests/dd.test.ts
git commit -m "refactor: parse()をnet/cfgグローバル非依存にし注入式へ"
```

### Task 12: background でデコード→parse→popup返却を結線

**Files:**
- Modify: `src/entrypoints/background.ts`

- [ ] **Step 1: background にデコードハンドラを追加**

```typescript
// src/entrypoints/background.ts
import { RSR, type ReviewMode } from "@/lib/messages";
import { decodeGameRecord } from "@/lib/record-decode";
import { parse } from "@/content-scripts/dd";

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      chrome.storage.local.set({ MSLang: "0", DisplayLang: "0" });
      chrome.tabs.create({ url: "options.html" });
    }
  });

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request?.type === RSR.DECODE_RECORD) {
      try {
        const raw = Uint8Array.from(request.bytes as number[]);
        const decoded = decodeGameRecord(raw);
        const tenhou = parse(decoded);
        const mode = request.mode as ReviewMode;
        const key = mode === "naga" ? "toNagaData" : "toMjaiData";
        chrome.storage.local.set({ [key]: JSON.stringify(tenhou) });
        sendResponse({ ok: true });
      } catch (e) {
        console.error("decodeRecord failed", e);
        sendResponse({ ok: false, error: String(e) });
      }
      return true; // 非同期応答
    }
    return false;
  });
});
```

注: `dd.ts` は現状 content-scripts 配下だがロジックは純粋なので background から import 可能。`parse` の export を確認（`dd.ts:340` で `export { parse }` 済み）。`export default defineBackground` を import が必要なら `parse` の依存(`@/lib/*`)が background バンドルに含まれることを `npm run build` で確認する。

- [ ] **Step 2: 型チェックとビルド**

Run: `npx tsc --noEmit && npm run build`
Expected: エラーなし、`.output/` 生成

- [ ] **Step 3: コミット**

```bash
git add src/entrypoints/background.ts
git commit -m "feat: backgroundで生バイト→デコード→parse→storage格納を結線"
```

### Task 13: エンドツーエンド手動確認

**Files:** なし（手動検証）

- [ ] **Step 1: 拡張をロードし全フローを確認**

`npm run build` 後 `.output/chrome-mv3` を読込。雀魂で牌譜を開く→拡張ポップアップで NAGA 転送を実行。
Expected: `chrome.storage.local` の `toNagaData` に tenhou形式JSONが入り、NAGAの order_form タブにペーストされる（既存 `naga.content.ts` の挙動）。mjai 側も同様に確認。

- [ ] **Step 2: 既存の全テストを通す**

Run: `npx vitest run`
Expected: 全 PASS

- [ ] **Step 3: 確認結果を記録してコミット（ドキュメント更新があれば）**

```bash
# READMEのクレジットに protobufjs(BSD-3-Clause)・tensoul(MIT, 手法参照)・雀魂データ出所を追記
git add README.md
git commit -m "docs: 依存とデータ出所のクレジットを追記"
```

---

## 自己レビュー結果

- **仕様カバレッジ**: 取得(Task 3-4) / liqiデコード(Task 7-8) / cfg(Task 9-10) / parse非依存化(Task 11) / 結線(Task 12) / E2E(Task 13) を網羅。失った3依存(app/net/cfg)すべてに対応タスクあり。
- **スキーマ依存の不確実性**: liqi.json/lqc.lqbin の正確な型名・フィールド名・フレームオフセットは実物に依存するため、Phase 2(Task 5-6)で実アセットとフィクスチャを先に確定し、Phase 3-5 をそれに対するTDDで進める構成にした。型名は「実値で確認」と各タスクに明記。
- **型整合**: `ReviewMode`(messages.ts)、`CfgTables`(cfg.ts)、`DecodedRecord`(record-decode.ts) を後続タスクで一貫使用。`parse` の入力は Task 8 の `{head, actions}` 形に Task 11 で合わせた。
- **既知の調整ポイント**: Task 8 `stripFrameHeader` のオフセット、Task 9 の `lq.config` 名前空間有無は実アセットで要確定（各タスクに注記済み）。
```
