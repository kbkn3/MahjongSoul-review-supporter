# Phase 2b: 雀魂牌譜の mj-lab 登録機能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ブラウザ拡張の popup から、現在表示中の雀魂牌譜（`TenhouMessage`）を mj-lab の `POST /api/reviews/ingest` に登録し、返った review を新規タブで開く。

**Architecture:** popup の新規 `MjlabList.vue` が NagaList とは別の `chrome.runtime.onMessage` リスナで非破壊な `TenhouMessage` を受け取り、`mjlab-api.ts` の純関数でリクエストを組み立て、background(service worker) 経由で fetch する。fetch・URL 組み立て・レスポンス正規化・エラーメッセージ生成は `mjlab-api.ts` の純ロジックに寄せ、vitest で検証する。Vue コンポーネントは既存リポジトリ同様ユニットテストせず手動検証する。

**Tech Stack:** WXT 0.20 / Vue 3 / TypeScript / vitest 4（`globals: true`）/ Chrome MV3（`chrome.permissions`, `chrome.runtime`, `chrome.storage.local`）

---

## File Structure

**新規**
- `src/lib/mjlab-api.ts` — 型定義＋純関数（URL/設定正規化、payload 組み立て、`postIngest`、エラーメッセージ生成）
- `tests/mjlab-api.test.ts` — `mjlab-api.ts` の純ロジックテスト
- `src/popup/MjlabList.vue` — 右列の登録カード
- `src/options/MjlabSettings.vue` — baseUrl / token 設定＋権限リクエスト

**変更**
- `src/lib/messages.ts` — `RSR.INGEST` 追加
- `tests/messages.test.ts` — `RSR.INGEST` の検証を追加
- `src/entrypoints/background.ts` — INGEST メッセージハンドラ追加
- `src/popup/App.vue` — 右列に `<MjlabList>` を配置
- `src/options/App.vue` — `<MjlabSettings>` を配置
- `wxt.config.ts` — `optional_host_permissions` 追加

**API 契約（mj-lab・確認済み・変更不可）**
- `POST {baseUrl}/api/reviews/ingest`、`Authorization: Bearer <token>`、`Content-Type: application/json`
- body: `{ source:"majsoul", payload:<TenhouMessage>, metadata:{externalUrl, externalId} }`
- 200 `{shareToken, reviewId, merged}` / 401 `{error:"unauthorized"}` / 403 `{error:"forbidden_origin"}` /
  409 `{error:"ambiguous_match", candidates:[{reviewId,shareToken,title}]}` / 413 `{error:"payload_too_large"}` /
  422 `{error:"unsupported_format", detail}` / 400 `{error:"invalid_json"|"unsupported_source"}`
- review 閲覧 URL: `{baseUrl}/review/{shareToken}`（単数 `review`）

---

## Task 1: messages.ts に INGEST メッセージ名を追加

**Files:**
- Modify: `src/lib/messages.ts`
- Test: `tests/messages.test.ts`

- [ ] **Step 1: 失敗するテストを追加**

`tests/messages.test.ts` の `describe` 内に追記:

```ts
  it("defines the ingest message name", () => {
    expect(RSR.INGEST).toBe("rsr:ingest");
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- tests/messages.test.ts`
Expected: FAIL（`RSR.INGEST` が undefined）

- [ ] **Step 3: 最小実装**

`src/lib/messages.ts` の `RSR` に 1 行追加:

```ts
export const RSR = {
  GET_RECORD: "rsr:get-record",
  RECORD: "rsr:record",
  DECODE_RECORD: "rsr:decode-record",
  INGEST: "rsr:ingest",
} as const;
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- tests/messages.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/messages.ts tests/messages.test.ts
git commit -m "feat: ingest用メッセージ名RSR.INGESTを追加"
```

---

## Task 2: mjlab-api.ts に型と URL/payload 純関数を実装

**Files:**
- Create: `src/lib/mjlab-api.ts`
- Test: `tests/mjlab-api.test.ts`

- [ ] **Step 1: 失敗するテストを作成**

`tests/mjlab-api.test.ts`:

```ts
import {
  normalizeBaseUrl,
  isHttpsUrl,
  originPattern,
  buildReviewUrl,
  buildIngestPayload,
  MAJSOUL_PAIPU_URL_HEADS,
} from "../src/lib/mjlab-api";
import type { TenhouMessage } from "../src/lib/naga";

const baseMessage = (ref: string): TenhouMessage =>
  ({
    ver: "2.3",
    ref,
    log: [],
    ratingc: "",
    rule: { disp: "玉の間四人南", aka53: 1, aka52: 1, aka51: 1 },
    lobby: 0,
    dan: [],
    rate: [],
    sx: [],
    name: ["A", "B", "C", "D"],
    sc: [],
    title: ["", ""],
  }) as TenhouMessage;

describe("normalizeBaseUrl", () => {
  it("trims and strips trailing slashes", () => {
    expect(normalizeBaseUrl("  https://mj.example.com/  ")).toBe("https://mj.example.com");
    expect(normalizeBaseUrl("https://mj.example.com///")).toBe("https://mj.example.com");
  });
});

describe("isHttpsUrl", () => {
  it("accepts https only", () => {
    expect(isHttpsUrl("https://mj.example.com")).toBe(true);
    expect(isHttpsUrl("http://mj.example.com")).toBe(false);
    expect(isHttpsUrl("not a url")).toBe(false);
  });
});

describe("originPattern", () => {
  it("returns an origin match pattern", () => {
    expect(originPattern("https://mj.example.com/sub/")).toBe("https://mj.example.com/*");
  });
});

describe("buildReviewUrl", () => {
  it("builds the singular review viewer url", () => {
    expect(buildReviewUrl("https://mj.example.com/", "tok-123")).toBe(
      "https://mj.example.com/review/tok-123",
    );
  });
});

describe("buildIngestPayload", () => {
  it("builds externalUrl/externalId from msLang and ref", () => {
    const payload = buildIngestPayload(baseMessage("uuid-1"), 1);
    expect(payload.source).toBe("majsoul");
    expect(payload.metadata.externalId).toBe("uuid-1");
    expect(payload.metadata.externalUrl).toBe(
      `${MAJSOUL_PAIPU_URL_HEADS[1]}uuid-1`,
    );
    expect(payload.payload.ref).toBe("uuid-1");
  });

  it("falls back to the first url head for unknown msLang", () => {
    const payload = buildIngestPayload(baseMessage("uuid-2"), 9);
    expect(payload.metadata.externalUrl).toBe(`${MAJSOUL_PAIPU_URL_HEADS[0]}uuid-2`);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- tests/mjlab-api.test.ts`
Expected: FAIL（モジュール未作成）

- [ ] **Step 3: 最小実装**

`src/lib/mjlab-api.ts`:

```ts
import type { TenhouMessage } from "@/lib/naga";

// MjaiList.vue の url_head と同形式。雀魂サーバー(MSLang)別の paipu URL 接頭辞。
export const MAJSOUL_PAIPU_URL_HEADS = [
  "https://game.mahjongsoul.com/?paipu=",
  "https://mahjongsoul.game.yo-star.com/?paipu=",
  "https://game.maj-soul.net/1/?paipu=",
] as const;

export interface IngestMetadata {
  externalUrl: string;
  externalId: string;
}

export interface IngestPayload {
  source: "majsoul";
  payload: TenhouMessage;
  metadata: IngestMetadata;
}

export function normalizeBaseUrl(input: string): string {
  return input.trim().replace(/\/+$/, "");
}

export function isHttpsUrl(input: string): boolean {
  try {
    return new URL(input).protocol === "https:";
  } catch {
    return false;
  }
}

export function originPattern(baseUrl: string): string {
  return `${new URL(baseUrl).origin}/*`;
}

export function buildReviewUrl(baseUrl: string, shareToken: string): string {
  return `${normalizeBaseUrl(baseUrl)}/review/${shareToken}`;
}

export function buildIngestPayload(message: TenhouMessage, msLang: number): IngestPayload {
  const head = MAJSOUL_PAIPU_URL_HEADS[msLang] ?? MAJSOUL_PAIPU_URL_HEADS[0];
  return {
    source: "majsoul",
    payload: message,
    metadata: {
      externalUrl: head + message.ref,
      externalId: message.ref,
    },
  };
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- tests/mjlab-api.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/mjlab-api.ts tests/mjlab-api.test.ts
git commit -m "feat: mjlab-apiのURL/payload組み立て純関数を追加"
```

---

## Task 3: postIngest（fetch＋レスポンス正規化）と describeIngestError を実装

**Files:**
- Modify: `src/lib/mjlab-api.ts`
- Test: `tests/mjlab-api.test.ts`

- [ ] **Step 1: 失敗するテストを追加**

`tests/mjlab-api.test.ts` の末尾に追記:

```ts
import { postIngest, describeIngestError } from "../src/lib/mjlab-api";
import type { IngestResult } from "../src/lib/mjlab-api";

const okPayload = buildIngestPayload(baseMessage("uuid-1"), 0);

const mockFetch = (status: number, json: unknown) => {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(json),
  } as Response);
  vi.stubGlobal("fetch", fn);
  return fn;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("postIngest", () => {
  it("posts to the ingest endpoint with bearer auth", async () => {
    const fetchMock = mockFetch(200, { shareToken: "tok-1", reviewId: 7, merged: false });
    await postIngest("https://mj.example.com/", "secret", okPayload);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://mj.example.com/api/reviews/ingest",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer secret",
        }),
      }),
    );
  });

  it("normalizes a 200 response into a review url", async () => {
    mockFetch(200, { shareToken: "tok-1", reviewId: 7, merged: true });
    const result = await postIngest("https://mj.example.com", "secret", okPayload);
    expect(result).toEqual({
      ok: true,
      reviewUrl: "https://mj.example.com/review/tok-1",
      reviewId: 7,
      merged: true,
    });
  });

  it("normalizes a 401 error", async () => {
    mockFetch(401, { error: "unauthorized" });
    const result = await postIngest("https://mj.example.com", "secret", okPayload);
    expect(result).toEqual({ ok: false, status: 401, error: "unauthorized" });
  });

  it("attaches review urls to 409 candidates", async () => {
    mockFetch(409, {
      error: "ambiguous_match",
      candidates: [{ reviewId: 1, shareToken: "a", title: "東1局" }],
    });
    const result = await postIngest("https://mj.example.com", "secret", okPayload);
    expect(result).toMatchObject({
      ok: false,
      status: 409,
      error: "ambiguous_match",
      candidates: [
        { reviewId: 1, shareToken: "a", title: "東1局", url: "https://mj.example.com/review/a" },
      ],
    });
  });

  it("keeps the detail of a 422 error", async () => {
    mockFetch(422, { error: "unsupported_format", detail: "3-player" });
    const result = await postIngest("https://mj.example.com", "secret", okPayload);
    expect(result).toMatchObject({ ok: false, status: 422, detail: "3-player" });
  });

  it("returns a network error when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    const result = await postIngest("https://mj.example.com", "secret", okPayload);
    expect(result).toEqual({ ok: false, status: 0, error: "network" });
  });
});

describe("describeIngestError", () => {
  it("maps known statuses to Japanese messages", () => {
    const r = (over: Partial<Extract<IngestResult, { ok: false }>>): IngestResult => ({
      ok: false,
      status: 0,
      error: "x",
      ...over,
    });
    expect(describeIngestError(r({ status: 401, error: "unauthorized" }))).toContain("トークン");
    expect(describeIngestError(r({ status: 403, error: "forbidden_origin" }))).toContain("拡張");
    expect(describeIngestError(r({ status: 413, error: "payload_too_large" }))).toContain("サイズ");
    expect(describeIngestError(r({ status: 422, error: "unsupported_format", detail: "3-player" }))).toContain(
      "3-player",
    );
    expect(describeIngestError(r({ status: 0, error: "permission_denied" }))).toContain("許可");
    expect(describeIngestError(r({ status: 0, error: "network" }))).toContain("接続");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test -- tests/mjlab-api.test.ts`
Expected: FAIL（`postIngest` / `describeIngestError` 未定義）

- [ ] **Step 3: 最小実装**

`src/lib/mjlab-api.ts` に追記:

```ts
export interface IngestCandidate {
  reviewId: number;
  shareToken: string;
  title: string;
  url: string;
}

export type IngestResult =
  | { ok: true; reviewUrl: string; reviewId: number; merged: boolean }
  | {
      ok: false;
      status: number;
      error: string;
      detail?: string;
      candidates?: IngestCandidate[];
    };

export async function postIngest(
  baseUrl: string,
  token: string,
  payload: IngestPayload,
): Promise<IngestResult> {
  const endpoint = `${normalizeBaseUrl(baseUrl)}/api/reviews/ingest`;
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, status: 0, error: "network" };
  }

  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (response.ok) {
    return {
      ok: true,
      reviewUrl: buildReviewUrl(baseUrl, json.shareToken as string),
      reviewId: json.reviewId as number,
      merged: Boolean(json.merged),
    };
  }

  const candidates = Array.isArray(json.candidates)
    ? (json.candidates as { reviewId: number; shareToken: string; title: string }[]).map((c) => ({
        ...c,
        url: buildReviewUrl(baseUrl, c.shareToken),
      }))
    : undefined;

  return {
    ok: false,
    status: response.status,
    error: (json.error as string) ?? "unknown",
    detail: json.detail as string | undefined,
    candidates,
  };
}

export function describeIngestError(result: Extract<IngestResult, { ok: false }>): string {
  if (result.error === "permission_denied") {
    return "mj-lab へのアクセスが許可されていません。オプションで mj-lab URL を保存し直してください。";
  }
  if (result.error === "network" || result.status === 0) {
    return "mj-lab に接続できませんでした。URL・接続状態、または拡張IDが MJLAB_ALLOWED_ORIGINS に未登録でないか確認してください。";
  }
  switch (result.status) {
    case 401:
      return "ingest トークンが不正です。オプションを確認してください。";
    case 403:
      return "この拡張IDが mj-lab 側で許可されていません（MJLAB_ALLOWED_ORIGINS）。";
    case 409:
      return "同一スコアの別対局候補が見つかりました。下の候補から選んでください。";
    case 413:
      return "牌譜のサイズが上限を超えています。";
    case 422:
      return `未対応の形式です。${result.detail ?? ""}`.trim();
    default:
      return `登録に失敗しました（${result.status} ${result.error}）。`;
  }
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test -- tests/mjlab-api.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/mjlab-api.ts tests/mjlab-api.test.ts
git commit -m "feat: postIngestとエラーメッセージ生成を追加"
```

---

## Task 4: background に INGEST ハンドラを追加

**Files:**
- Modify: `src/entrypoints/background.ts`

このタスクは `chrome.permissions` / `chrome.runtime` を使うため既存方針どおりユニットテストせず、Task 8 の手動検証で確認する。

- [ ] **Step 1: 実装**

`src/entrypoints/background.ts` を以下に置き換える:

```ts
import { RSR } from "@/lib/messages";
import {
  originPattern,
  postIngest,
  type IngestPayload,
  type IngestResult,
} from "@/lib/mjlab-api";

interface IngestMessage {
  type: typeof RSR.INGEST;
  baseUrl: string;
  token: string;
  payload: IngestPayload;
}

async function handleIngest(message: IngestMessage): Promise<IngestResult> {
  // optional_host_permissions は拡張全体に付与されるが、設定したホストが未許可なら
  // fetch する前に明示エラーを返し、オプションでの許可取得へ誘導する。
  const granted = await chrome.permissions.contains({
    origins: [originPattern(message.baseUrl)],
  });
  if (!granted) {
    return { ok: false, status: 0, error: "permission_denied" };
  }
  return postIngest(message.baseUrl, message.token, message.payload);
}

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      chrome.storage.local.set({
        MSLang: "0",
        DisplayLang: "0",
      });
      chrome.tabs.create({
        url: "options.html",
      });
    }
  });

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request?.type !== RSR.INGEST) return false;
    handleIngest(request as IngestMessage).then(sendResponse);
    return true; // 非同期 sendResponse のためチャネルを開いたままにする
  });
});
```

- [ ] **Step 2: 型チェック/ビルドが通ることを確認**

Run: `npx tsc --noEmit && npm test`
Expected: 型エラーなし、既存テスト全 PASS

- [ ] **Step 3: コミット**

```bash
git add src/entrypoints/background.ts
git commit -m "feat: backgroundにingest中継ハンドラを追加"
```

---

## Task 5: wxt.config.ts に optional_host_permissions を追加

**Files:**
- Modify: `wxt.config.ts`

- [ ] **Step 1: 実装**

`wxt.config.ts` の `manifest` 内、`host_permissions` の直後に追記:

```ts
        host_permissions: [
            "https://game.mahjongsoul.com/*",
            "https://mahjongsoul.game.yo-star.com/*",
            "https://game.maj-soul.net/*",
            "https://game.maj-soul.com/*",
            "https://naga.dmv.nico/naga_report/order_form/",
            "https://mjai.ekyu.moe/",
        ],
        optional_host_permissions: ["https://*/*"],
```

- [ ] **Step 2: ビルドが通ることを確認**

Run: `npm run build`
Expected: SUCCESS（`.output/` 生成、エラーなし）

- [ ] **Step 3: コミット**

```bash
git add wxt.config.ts
git commit -m "feat: mj-lab任意URL向けにoptional_host_permissionsを追加"
```

---

## Task 6: オプション画面に MjlabSettings を追加

**Files:**
- Create: `src/options/MjlabSettings.vue`
- Modify: `src/options/App.vue`

`chrome.*` を使う Vue コンポーネントのため手動検証（Task 8）で確認する。

- [ ] **Step 1: MjlabSettings.vue を作成**

`src/options/MjlabSettings.vue`:

```vue
<template>
  <div class="m-2">
    <div class="text-xl font-semibold m-2">mj-lab Settings / mj-lab 連携設定</div>
    <form @submit.prevent="save" class="ml-4">
      <label class="block m-1 text-base text-gray-700">
        mj-lab ベースURL (https)
        <input
          v-model="baseUrl"
          type="url"
          placeholder="https://mj-lab.example.com"
          class="block w-96 py-2 px-3 border border-gray-300 bg-white rounded-md"
        />
      </label>
      <label class="block m-1 text-base text-gray-700">
        ingest トークン
        <input
          v-model="token"
          type="password"
          class="block w-96 py-2 px-3 border border-gray-300 bg-white rounded-md"
        />
      </label>
      <div class="w-24 m-2">
        <button type="submit" class="my-button py-2 px-4">Set</button>
      </div>
    </form>
    <div class="pt-2 text-base whitespace-pre-wrap ml-4">{{ message }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { isHttpsUrl, normalizeBaseUrl, originPattern } from "@/lib/mjlab-api";

const baseUrl = ref("");
const token = ref("");
const message = ref("");

chrome.storage.local.get(["mjlabBaseUrl", "mjlabToken"], (result) => {
  if (typeof result.mjlabBaseUrl === "string") baseUrl.value = result.mjlabBaseUrl;
  if (typeof result.mjlabToken === "string") token.value = result.mjlabToken;
});

const save = async () => {
  message.value = "";
  const normalized = normalizeBaseUrl(baseUrl.value);
  if (!isHttpsUrl(normalized)) {
    message.value = "https のURLを入力してください。";
    return;
  }
  const granted = await chrome.permissions.request({ origins: [originPattern(normalized)] });
  if (!granted) {
    message.value = "mj-lab ホストへのアクセス許可が必要です。";
    return;
  }
  chrome.storage.local.set({ mjlabBaseUrl: normalized, mjlabToken: token.value.trim() });
  baseUrl.value = normalized;
  message.value = "保存しました。";
};
</script>
```

- [ ] **Step 2: options/App.vue に組み込む**

`src/options/App.vue` を以下に変更（`MjlabSettings` を import し、LangList のカードの下にカードを追加）:

```vue
<template>
  <div class="m-5">
    <div class="text-2xl text-black m-2">Mahjong Soul Review Supporter Settings Page</div>
    <div class="flex flex-wrap">
      <div class="w-full">
        <div
          class="relative flex flex-col min-w-0 break-words bg-white w-full m-2 shadow-lg rounded-sm"
        >
          <LangList></LangList>
        </div>
        <div
          class="relative flex flex-col min-w-0 break-words bg-white w-full m-2 shadow-lg rounded-sm"
        >
          <MjlabSettings></MjlabSettings>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LangList from "@/options/LangList.vue";
import MjlabSettings from "@/options/MjlabSettings.vue";
</script>
```

- [ ] **Step 3: 型チェック/ビルドが通ることを確認**

Run: `npx tsc --noEmit && npm run build`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/options/MjlabSettings.vue src/options/App.vue
git commit -m "feat: オプションにmj-lab URL/トークン設定を追加"
```

---

## Task 7: popup に MjlabList カードを追加

**Files:**
- Create: `src/popup/MjlabList.vue`
- Modify: `src/popup/App.vue`

`chrome.*` を使う Vue コンポーネントのため手動検証（Task 8）で確認する。

- [ ] **Step 1: MjlabList.vue を作成**

`src/popup/MjlabList.vue`:

```vue
<template>
  <div class="template-box">
    <div class="template-title">mj-lab</div>
    <div class="px-2 py-2">
      <p v-if="!configured" class="text-sm text-mjsoul-text-lightblue mb-2">
        オプションで mj-lab URL とトークンを設定してください。
        <a class="underline" href="#" @click.prevent="openOption">設定を開く</a>
      </p>
      <p v-else-if="!hasRef" class="text-sm text-mjsoul-text-lightblue mb-2">
        牌譜を読み込めていません。
      </p>
      <button
        type="button"
        class="my-button"
        :disabled="!canSubmit || busy"
        @click="submit"
      >
        {{ busy ? "送信中..." : "mj-labに登録" }}
      </button>
      <p v-if="statusMessage" class="text-sm text-mjsoul-text-lightblue mt-2 whitespace-pre-wrap">
        {{ statusMessage }}
      </p>
      <ul v-if="candidates.length" class="mt-2">
        <li v-for="candidate in candidates" :key="candidate.shareToken" class="my-1">
          <a class="underline text-mjsoul-text-lightblue" :href="candidate.url" target="_blank">
            {{ candidate.title }}
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RSR } from "@/lib/messages";
import { buildIngestPayload, describeIngestError } from "@/lib/mjlab-api";
import type { IngestCandidate, IngestResult } from "@/lib/mjlab-api";
import type { TenhouMessage } from "@/lib/naga";

const baseUrl = ref("");
const token = ref("");
const msLang = ref(0);
// NagaList の onMessage リスナとは別に受け取り、破壊的変換前のクリーンな TenhouMessage を保持する。
const message = ref<TenhouMessage | null>(null);
const statusMessage = ref("");
const candidates = ref<IngestCandidate[]>([]);
const busy = ref(false);

chrome.storage.local.get(["mjlabBaseUrl", "mjlabToken", "MSLang"], (result) => {
  if (typeof result.mjlabBaseUrl === "string") baseUrl.value = result.mjlabBaseUrl;
  if (typeof result.mjlabToken === "string") token.value = result.mjlabToken;
  if (typeof result.MSLang !== "undefined") msLang.value = Number(result.MSLang);
});

const configured = computed(() => Boolean(baseUrl.value && token.value));
const hasRef = computed(() => Boolean(message.value?.ref));
const canSubmit = computed(() => configured.value && hasRef.value);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onMessageListener = (request: any) => {
  if (request?.message && typeof request.message === "object" && "log" in request.message) {
    message.value = request.message as TenhouMessage;
  }
};

onMounted(() => {
  chrome.runtime.onMessage.addListener(onMessageListener);
});

onUnmounted(() => {
  chrome.runtime.onMessage.removeListener(onMessageListener);
});

const openOption = () => {
  chrome.tabs.create({ url: "options.html" });
};

const submit = async () => {
  if (!message.value) return;
  busy.value = true;
  statusMessage.value = "";
  candidates.value = [];
  const payload = buildIngestPayload(message.value, msLang.value);
  const result: IngestResult = await chrome.runtime.sendMessage({
    type: RSR.INGEST,
    baseUrl: baseUrl.value,
    token: token.value,
    payload,
  });
  busy.value = false;
  if (result.ok) {
    statusMessage.value = result.merged ? "登録しました（既存対局にマージ）。" : "登録しました。";
    chrome.tabs.create({ url: result.reviewUrl });
    return;
  }
  statusMessage.value = describeIngestError(result);
  if (result.candidates) candidates.value = result.candidates;
};
</script>
```

- [ ] **Step 2: popup/App.vue に組み込む**

`src/popup/App.vue` の右列、`<MjaiList></MjaiList>` の直後に 1 行追加し、script に import を追加する。

テンプレート（右列 `w-2/5` 内）:

```html
            <div class="w-2/5">
              <MjaiList></MjaiList>
              <MjlabList></MjlabList>
              <RecipeList></RecipeList>
```

script（import 追加）:

```ts
import MjaiList from "@/popup/MjaiList.vue";
import MjlabList from "@/popup/MjlabList.vue";
import RecipeList from "@/popup/RecipeList.vue";
```

- [ ] **Step 3: 型チェック/ビルドが通ることを確認**

Run: `npx tsc --noEmit && npm run build`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/popup/MjlabList.vue src/popup/App.vue
git commit -m "feat: popupにmj-lab登録カードを追加"
```

---

## Task 8: 全体ビルドと手動 E2E 検証

**Files:** なし（検証のみ）

- [ ] **Step 1: 全テスト・型チェック・ビルド**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: 全 PASS、型エラーなし、ビルド成功

- [ ] **Step 2: ローカル mj-lab と接続して手動検証**

手順:
1. `npm run dev` で拡張をロード。chrome://extensions で拡張 ID を確認。
2. mj-lab の `.dev.vars` の `MJLAB_ALLOWED_ORIGINS` に `chrome-extension://<id>` を追加し、`MJLAB_INGEST_TOKEN` を確認。mj-lab をローカル起動。
3. 拡張オプションで mj-lab ベースURL（例 `http://localhost:8787` を https 運用しているならその URL）とトークンを保存し、権限ダイアログを許可。
   - 注: optional_host_permissions は `https://*/*`。localhost を http で検証する場合は §未確定事項のとおり、検証用にデプロイ済み https URL を使うか、ローカルを https 化する。
4. 雀魂の牌譜ページを開き popup を起動 → mj-lab カードの「mj-labに登録」をクリック。
5. 新規タブで `{baseUrl}/review/{shareToken}` が開くことを確認。

確認観点:
- 未設定時: ボタンが無効＋設定誘導が表示される。
- 401（トークン誤り）/ 422（3人麻雀牌譜）/ 409（同卓連戦の別半荘）で日本語メッセージと候補リンクが出る。

- [ ] **Step 3: 最終コミット（必要なら）**

検証で修正が出た場合のみ該当ファイルを修正・コミットする。

---

## Self-Review メモ

- **Spec coverage**: §4 データフロー→Task 7/4、§5 メッセージ型→Task 1/2/3、§6 権限→Task 4/5/6、§7 運用→Task 8、§8 エラーUX→Task 3(describeIngestError)/Task 7、§9 設定→Task 6、§10 テスト→Task 2/3。全カバー。
- **review URL**: 単数 `/review/{shareToken}`（mj-lab `app/routes.ts` 確認済み）。spec §5/§12 の不確定を解消。
- **403/CORS**: background(SW) は host_permissions 付与ホストへの fetch で CORS 緩和され実ステータスを読めるため、403 マッピングは到達可能。純粋な接続失敗のみ status 0/network。
- **型整合**: `IngestPayload`/`IngestResult`/`IngestCandidate` は Task 2/3 で定義し Task 4/7 で同名参照。`describeIngestError` は `Extract<IngestResult,{ok:false}>` を受ける。
- **既知の軽微**: `MAJSOUL_PAIPU_URL_HEADS` は MjaiList.vue の `url_head` と内容重複。MjaiList の変更は本フェーズのスコープ外（差分最小）とし、将来共通化候補とする。
