# liqi-proto バンドル削減と生成スクリプト統合 設計

**作成日:** 2026-05-28
**ブランチ前提:** `feature/unity-webgl-migration`(PR #31)で Unity WebGL 移行の取得→デコード→cfg→変換→転送経路が結線済み・E2E成功・133テスト pass。本設計はその直後のクリーンアップ。
**スコープ外:** 大規模牌譜の `data_url` 経路対応(現状の明示エラーを維持)。

---

## 背景

PR #31 で `liqi-proto.js`(pbjs 静的生成)を採用し MV3 CSP(eval禁止)を回避した。結果として:

- `src/assets/majsoul/liqi-proto.js` = **11.93 MB**(リポジトリ同梱)
- bridge content script バンドル(`bridge.js`)= **5.26 MB**(content script は雀魂ページ訪問のたびに毎回ロードされる)

`liqi.json` は 284 KB しかないが、pbjs static-module は約 1,300 のメッセージ型それぞれに `encode/decode/verify/fromObject/toObject/create` を全生成するため約 40 倍に膨張している。本番コードは `.decode()` しか呼んでいない(`src/lib/record-decode.ts`, `src/lib/liqi-frame.ts`)。

さらに `liqi-proto.js` の再生成は `gen-majsoul-assets.mjs` の外側で手動 `npx pbjs ...` 実行になっており、ファイル先頭コメントの手順を頼りに `--keep-case` を付け忘れる事故余地が残っている。

## 目標

1. **本番出荷バンドルから不要な encode/verify/convert/create を削除**してサイズを 61% 削減(11.93 → 4.67 MB 実測)、bridge.js も比例して縮小。
2. **`liqi-proto.js` の生成を `scripts/gen-majsoul-assets.mjs` に統合**し、最適フラグをスクリプトに焼き込んで `--keep-case` 付け忘れ事故を構造的に解消。
3. リポジトリへの生成物同梱方針は維持(再現性・オフラインビルド・スキーマ変化のレビュー時可視化のため)。

## 非目標

- 使用型(`ResGameRecord`/`GameDetailRecords`/`Wrapper`/各 `Record*`)だけに刈り込む追加最適化。理論上は数百 KB だが、依存型取りこぼし=実行時 decode 失敗のリスクと、スキーマ更新ごとの型リスト保守負担に見合わない。後日 nice-to-have。
- 動的 import による遅延ロード。MV3 content script の制約と複雑性に見合わない。
- `data_url` 経路の HTTP 取得実装。実物の大規模牌譜フィクスチャ未採取のため、別作業として後回し。

---

## 設計

### 変更1: pbjs 生成フラグを decode 専用に切替

新フラグ(実測 4.67 MB):

```
pbjs --keep-case --no-comments \
     --no-encode --no-verify --no-convert --no-create --no-delimited \
     -t static-module -w es6 \
     -o src/assets/majsoul/liqi-proto.js \
     src/assets/majsoul/liqi.json
```

**安全性根拠:** 本番コードで利用している protobuf static-module API は `Wrapper.decode` / `ResGameRecord.decode` / `GameDetailRecords.decode` および `messageType(...).decode` のみ。`src/` 全域で、メッセージクラスの `.encode(`, `.create(`, `.verify(`, `.fromObject(`, `.toObject(`, `.decodeDelimited(`, `.encodeDelimited(` の呼び出しは存在しない(`record-decode.ts` / `liqi-frame.ts` はいずれも `.decode()` のみ)。`background.ts:8` の `chrome.tabs.create` および liqi RPC の `Lobby.prototype.create*` メソッド名(static-module 内 RPC スタブ)は pbjs のメッセージ `create` API とは別物のため、grep 確認時には除外して読む必要がある。

### 変更2: 生成スクリプトへの pbjs ステップ統合

`scripts/gen-majsoul-assets.mjs` の末尾に Node 子プロセスで pbjs を呼ぶステップを追加する。`protobufjs-cli` は devDependencies に既に存在。

**キャッシュ挙動の明文化:** 既存スクリプトは `scripts/.cache/lqc.lqbin` が存在する場合、`liqi.json` と `lqc.lqbin` の CDN 取得を**両方**スキップする(17MB の再取得を避けるため)。したがって本 pbjs ステップは「**作業ツリー上の `src/assets/majsoul/liqi.json` を入力に `liqi-proto.js` を再生成する**」処理として定義される。最新 CDN から `liqi.json` も更新したい場合は `scripts/.cache/lqc.lqbin` を削除してから再実行する運用とする。force オプションの追加は本作業のスコープ外で、フラグ固定を優先する。

**pbjs バイナリの解決方針:** `npx` 経由は環境/PATH 依存で再現性が落ちるため、devDependencies の `protobufjs-cli` を `createRequire` で直接解決し、`process.execPath` から spawn する。

```javascript
// scripts/gen-majsoul-assets.mjs に追記
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pbjsPath = require.resolve("protobufjs-cli/bin/pbjs");

const pbjsArgs = [
  "--keep-case", "--no-comments",
  "--no-encode", "--no-verify", "--no-convert", "--no-create", "--no-delimited",
  "-t", "static-module", "-w", "es6",
  "-o", "src/assets/majsoul/liqi-proto.js",
  "src/assets/majsoul/liqi.json",
];
const result = spawnSync(process.execPath, [pbjsPath, ...pbjsArgs], { stdio: "inherit" });
if (result.status !== 0) {
  throw new Error(`pbjs failed with status ${result.status ?? result.signal}`);
}
```

`liqi-proto.js` 先頭の「再生成手順」コメントは「`npm run gen:assets`」に書き換える(古いコマンドを残すと再び手動実行する誘惑が生まれる)。

### 変更3: package.json に再生成スクリプトを追加

```json
"scripts": {
  "dev": "wxt",
  "build": "wxt build",
  "zip": "wxt zip",
  "test": "vitest run",
  "gen:assets": "node scripts/gen-majsoul-assets.mjs"
}
```

### 変更4: liqi-frame テストを decode 専用ビルドと両立する形に書き換え

`tests/liqi-frame.test.ts` は fixture 構築のために `Wrapper.encode(Wrapper.create(...))` を使っている。decode 専用ビルドでは `encode`/`create` が消えるためテストが壊れる。

対処: fixture 構築側だけ protobufjs reflection を使う(テストは Node 実行で eval 制約なし)。出荷コードの decode 専用パスとは独立。

```typescript
// tests/liqi-frame.test.ts (改修後の要点)
import protobuf from "protobufjs";
import liqiJson from "../src/assets/majsoul/liqi.json";
import { unwrapWrapper } from "../src/lib/liqi-frame";

const reflectRoot = protobuf.Root.fromJSON(liqiJson as protobuf.INamespace);
const Wrapper = reflectRoot.lookupType("lq.Wrapper");

it("Wrapper{name,data}を name(先頭 \".\" 除去)と data に分解する", () => {
  const encoded = Wrapper.encode(
    Wrapper.create({ name: ".lq.ResGameRecord", data: new Uint8Array([1, 2, 3]) })
  ).finish();
  const { name, data } = unwrapWrapper(encoded);
  expect(name).toBe("lq.ResGameRecord");
  expect(Array.from(data)).toEqual([1, 2, 3]);
});
```

`unwrapWrapper`(本番)は decode 専用の静的クラスを使い続ける。

### 変更5: 再生成と検証

1. `npm run gen:assets` を実行し `liqi-proto.js` を上書き(11.93 → 約 4.67 MB に縮む)。
2. `npx vitest run` で 133 テスト全 pass を確認(`tests/liqi-frame.test.ts` の修正含む)。
3. `npm run build` で `.output/chrome-mv3` 生成。`.output/chrome-mv3/content-scripts/bridge.js` のサイズが現状 5.26 MB 比で大幅減(目安 ~2 MB 台)であることを `ls -la`/`wc -c` で記録。

## ファイル変更一覧

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `scripts/gen-majsoul-assets.mjs` | 改修 | 末尾に pbjs spawn ステップ追加 |
| `package.json` | 改修 | `gen:assets` script 追加 |
| `src/assets/majsoul/liqi-proto.js` | 再生成 | decode 専用フラグで生成(サイズ激減) |
| `tests/liqi-frame.test.ts` | 改修 | fixture 構築を reflection ベースに |

`src/lib/record-decode.ts` `src/lib/liqi-frame.ts` `src/lib/liqi-schema.ts` 等の本番コードは無変更。

## 検証計画

- 単体: `npx vitest run` 133/133 pass(`liqi-frame.test.ts` 修正後)。特に `tests/record-decode.test.ts` の実牌譜 fixture が `RecordNewRound` / `RecordDiscardTile` / `RecordDealTile` を含む 1211 actions を従来通り decode できることを個別確認する(本変更で壊れた場合の最初の検出点になるため)。
- 生成物確認: `wc -c src/assets/majsoul/liqi-proto.js` でサイズ低下を記録。`rg '= function (encode|verify|fromObject|toObject|decodeDelimited|encodeDelimited)' src/assets/majsoul/liqi-proto.js` を実行し、不要 API が生成物に残っていないことを確認する(ヒット時は liqi RPC の `Lobby.prototype.create*` / `verify*` メソッド名は除外して読む)。
- API 存在確認: `lq.Wrapper.decode` / `lq.ResGameRecord.decode` / `lq.GameDetailRecords.decode` / 入れ子型例 `lq.RecordTake.TingPai.decode` の各メソッドが生成物に含まれることを `rg` で確認(`record-decode.ts` の `messageType()` が依存する namespace 構造の維持を実体で保証する)。
- ビルド: `npm run build` 成功、`.output/chrome-mv3/content-scripts/bridge.js` サイズ低下を記録。
- E2E: 雀魂で既知の牌譜を1件開き、NAGA/mjai 転送が PR #31 同等に動くことを手動確認(`data_url` 非対応牌譜以外)。

## リスク

- **pbjs 出力の互換性**: decode 専用フラグ後も `export const lq` / `lq.Wrapper.decode` / `lq.ResGameRecord.decode` / `lq.GameDetailRecords.decode` / 入れ子型例 `lq.RecordTake.TingPai.decode` が生成物に存在することを「検証計画」の API 存在確認で実体保証する。`record-decode.ts` の `messageType()` は `lq.` を除いた名前をドット分割してプロパティ参照するだけなので、static-module の namespace 構造が維持されれば互換性がある。万一いずれかが欠落していた場合は `--no-create` だけ外して再評価する(create は通常 decode と独立だが一部の内部参照で利用される版があれば検出される)。
- **テスト fixture の reflection 化**: vitest が `protobuf.Root.fromJSON` をロードする際に `liqi.json`(284 KB)を読むだけ。実行時間影響は無視できる。
- **`data_url` 経路の継続未対応**: 大規模牌譜を開いたユーザーには現状のエラーが表示される。本設計のスコープ外。

## 後続作業(本設計のスコープ外、別 spec)

- 大規模牌譜 `data_url` 経路の対応: background 委譲方式(host_permissions 追加 + 取得 → 既存 `GameDetailRecords` デコードに合流)。実物フィクスチャの採取が前提条件。
- CI 定期再生成 PR(週次でスキーマ差分検出)。運用が確立してから。
