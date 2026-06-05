# Phase 2b: 雀魂牌譜の mj-lab 登録機能 設計書

- 作成日: 2026-06-06
- 対象リポジトリ: `MahjongSoul-review-supporter`（ブラウザ拡張）
- 参照: `mj-lab` の設計書 `docs/superpowers/specs/2026-06-02-paifu-ai-review-ingestion-design.md`（§8.1/§8.3 が本フェーズ）
- 前提: mj-lab 側の ingest API（`POST /api/reviews/ingest`）は実装済み・main にマージ済み

## 1. 目的

ブラウザ拡張から、現在表示中の雀魂牌譜（`TenhouMessage`）と paipu URL/ref を
mj-lab の ingest API に POST して登録する。これにより「雀魂 → mj-lab → AI評価ビューア」が
ブラウザ操作だけで一気通貫に動く。

## 2. mj-lab ingest API 契約（合わせる側・変更不可）

- エンドポイント: `POST /api/reviews/ingest`
- ヘッダ: `Authorization: Bearer <MJLAB_INGEST_TOKEN>`, `Content-Type: application/json`
- ボディ:
  ```json
  {
    "source": "majsoul",
    "payload": "<TenhouMessage>",
    "metadata": { "externalUrl": "...", "externalId": "..." }
  }
  ```
  - `payload` は拡張が保持する `TenhouMessage`（`name: string[]`, `log: TenhouLog[]`, `rule:{disp}` 等）。
    mj-lab は `name`/`names` 両対応・天鳳→mjai 変換を内部で行う。展開済み JSON をそのまま送る。
  - `metadata.externalUrl` = 雀魂 paipu URL（許可ホスト: `game.mahjongsoul.com` /
    `mahjongsoul.game.yo-star.com` / `game.maj-soul.net` のみ。https 必須）
  - `metadata.externalId` = paipu の ref（UUID）
- レスポンス:
  - 200 `{ shareToken, reviewId, merged }`
  - 401 unauthorized / 403 forbidden_origin / 409 ambiguous_match（候補一覧）/
    413 payload_too_large / 422 unsupported_format（3人麻雀・西入・不正形式）
- CORS: サーバーは Origin を `MJLAB_ALLOWED_ORIGINS`（カンマ区切り allowlist）と照合し、不一致なら 403。
  拡張 background fetch の Origin は `chrome-extension://<id>` になるため、mj-lab デプロイ側の
  `MJLAB_ALLOWED_ORIGINS` にその拡張 ID を登録する必要がある（§7）。

## 3. アーキテクチャ / データフロー

```
popup (MjlabList.vue)
  ├─ onMessage で クリーンな TenhouMessage を受信（NagaList とは別リスナ、構造化複製で非破壊）
  ├─ chrome.storage.local から mjlabBaseUrl / mjlabToken / MSLang を取得
  └─「mj-labに登録」クリック
       └─ chrome.runtime.sendMessage({ type: RSR.INGEST, ... }) ─▶ background
                                                                      │
background (service worker)                                           ▼
  ├─ chrome.permissions.contains で baseUrl origin の付与を確認（無ければ permission_denied）
  ├─ mjlab-api.ts: POST {baseUrl}/api/reviews/ingest
  │     headers: Authorization: Bearer <token>, Content-Type: application/json
  │     body: { source:"majsoul", payload:<TenhouMessage>, metadata:{externalUrl, externalId} }
  └─ 結果（200/401/403/409/413/422/ネットワーク）を sendResponse で popup へ返す
                                                                      │
popup ◀────────────────────────────────────────────────────────────┘
  ├─ 200 → review URL を chrome.tabs.create で新規タブ
  └─ エラー → ステータス別の日本語メッセージ（409 は候補リンク一覧）
```

### 非破壊な payload 取得

NagaList は受信した message に対し `fixScoreRonTileWasReachTile`（NAGA向けスコア補正）と
`sanitizePlayerNames` を**破壊的に適用**する。mj-lab には素の `TenhouMessage` を送りたいため、
MjlabList は**独自の `chrome.runtime.onMessage` リスナ**を持つ。chrome のメッセージは
リスナごとに構造化複製されるため、NagaList の書き換えとは独立したクリーンなコピーを得られる。

### fetch 経路

`optional_host_permissions` は拡張全体に付与されるため popup 直送信も技術的には可能だが、
登録成功で新規タブを開いた瞬間に popup が閉じて後処理が逃げるリスクを避けるため、
fetch は **background(service worker) 経由**とする（mj-lab 設計書 §8.3 準拠）。

## 4. 新規／変更ファイル

### 新規

- `src/lib/mjlab-api.ts` — API クライアント（リクエスト組み立て・Bearer 付与・レスポンス正規化）。
  純ロジックは vitest 対象。
- `src/popup/MjlabList.vue` — 右列の登録カード（onMessage リスナ、ボタン、状態/エラー表示）。
- `src/options/MjlabSettings.vue` — baseUrl / token 設定 ＋ 権限リクエスト UI。

### 変更

- `src/lib/messages.ts` — `RSR.INGEST` と ingest リクエスト/レスポンスの型定義を追加。
- `src/entrypoints/background.ts` — `onMessage` で INGEST を受け `mjlab-api.ts` の fetch を実行する
  ハンドラを追加。
- `src/popup/App.vue` — 右列に `<MjlabList>` を配置。
- `src/options/App.vue` — `<MjlabSettings>` を配置。
- `wxt.config.ts` — `optional_host_permissions: ["https://*/*"]` を追加。安定した拡張 ID のため
  manifest `key` 固定も検討（§7）。

## 5. メッセージング & API クライアント契約

`messages.ts` に追加:

```ts
RSR.INGEST = "rsr:ingest"

interface IngestRequest {
  type: typeof RSR.INGEST;
  baseUrl: string;       // 末尾スラッシュ正規化済み
  token: string;
  payload: TenhouMessage;
  metadata: { externalUrl: string; externalId: string };
}

// background → popup
type IngestResult =
  | { ok: true; status: 200; reviewUrl: string; reviewId: number; merged: boolean }
  | { ok: false; status: 401 | 403 | 409 | 413 | 422 | number; error: string;
      detail?: string;
      candidates?: { reviewId: number; shareToken: string; title: string; url: string }[] }
  | { ok: false; status: 0; error: "network" | "permission_denied" }; // fetch失敗 / 権限なし
```

`mjlab-api.ts`:

- `buildIngestRequest(message, msLang)` → `{ payload, metadata }`
  - `externalUrl = urlHead[msLang] + message.ref`（MjaiList と同じ `url_head` 配列）
  - `externalId = message.ref`
  - `message.ref` が空のときは登録不可（呼び出し側でボタン無効化/警告）。純ロジック・テスト対象。
- `postIngest(request)` → fetch 実行、レスポンス JSON を `IngestResult` に正規化。
  - review URL は `shareToken` から構築する。構築規約（例 `{baseUrl}/reviews/{shareToken}`）は
    実装時に mj-lab のビューア URL 規約を確認して確定する。

## 6. host_permissions & 権限フロー

- `wxt.config.ts`: `optional_host_permissions: ["https://*/*"]`（既定権限は最小のまま）。
- `MjlabSettings.vue`: baseUrl 保存時に `chrome.permissions.request({ origins: [originPattern(baseUrl)] })`
  を呼び、許可されたら保存。拒否時は保存せず警告。
- background は fetch 前に `chrome.permissions.contains` で確認 → 無ければ `permission_denied` を返し、
  popup が「オプションで権限を許可してください」と案内。

## 7. CORS / 拡張 ID 調整 & ローカル検証手順（運用ノート）

- 拡張 background fetch の Origin は `chrome-extension://<id>`。mj-lab デプロイ側
  `MJLAB_ALLOWED_ORIGINS` にその ID を登録しないと 403。
- dev/prod で ID が変わるため、`wxt.config.ts` に固定 manifest `key` を設定して**安定した拡張 ID を
  固定**することを推奨（dev ID を mj-lab の `.dev.vars` に登録できる）。
- ローカル検証手順:
  1. 拡張を `pnpm dev`（または `npm run dev`）でロード。
  2. chrome://extensions で拡張 ID を確認。
  3. mj-lab の `.dev.vars` の `MJLAB_ALLOWED_ORIGINS` に `chrome-extension://<id>` を追加。
  4. mj-lab の `MJLAB_INGEST_TOKEN` を拡張オプションに設定、mj-lab baseUrl も設定。
  5. 雀魂牌譜ページで popup を開き「mj-labに登録」→ 新規タブで review が開くことを確認。

## 8. エラー UX マッピング（MjlabList カード内）

| status | 表示 |
| --- | --- |
| 200 | 新規タブで review を開く（カードに「登録しました」） |
| 401 | 「ingest トークンが不正です。オプションを確認してください」 |
| 403 | 「この拡張 ID が mj-lab 側で許可されていません（MJLAB_ALLOWED_ORIGINS）」 |
| 409 | 「同一スコアの別対局候補があります」＋候補 review をクリックで開けるリンク一覧 |
| 413 | 「牌譜サイズが上限を超えています」 |
| 422 | 「未対応の形式です」＋ サーバーの `detail`（3人麻雀・西入等）を表示 |
| 0 / network | 「mj-lab に接続できませんでした」/「権限が許可されていません」 |

## 9. オプション設定（chrome.storage.local）

- `mjlabBaseUrl: string`、`mjlabToken: string` を保存。
- 既存 `LangList` と同じフォーム様式（テキスト入力）。token は password 型 input。
- 保存時にトリム・末尾スラッシュ正規化・`https:` 検証。
- 未設定なら MjlabList の登録ボタンを `disabled`＋「オプションで設定してください」リンクを表示。

## 10. テスト方針（vitest）

- `tests/mjlab-api.test.ts`:
  - `buildIngestRequest`: externalUrl/externalId 組み立て、MSLang 別ドメイン、ref 空時の挙動。
  - `postIngest`: fetch をモックし 200/401/409/422/network の各分岐でレスポンス正規化を検証。
  - URL/トークン正規化（末尾スラッシュ・トリム・https 検証）。
- Vue コンポーネントは既存リポジトリにコンポーネントテストが無いため、純ロジックを
  `mjlab-api.ts` に寄せてそこをテストする（既存パターン踏襲）。

## 11. スコープ外（YAGNI）

- NAGA content script 連携（Phase 3）、外部リンク UI（mj-lab 側 Phase 3）、自動マージ。
- 雀魂以外のソース、バッチ登録。

## 12. 未確定事項

- review URL 構築規約（`{baseUrl}/reviews/{shareToken}` か否か）。実装時に mj-lab のビューア
  ルーティングを確認して確定する。
- manifest `key` 固定の要否（dev/prod の拡張 ID 安定化）。ローカル検証の利便とトレードオフ。
