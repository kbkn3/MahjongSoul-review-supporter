import type { TenhouMessage } from "@/lib/naga";

// MjaiList.vue の url_head 配列と内容が重複しているが、これは意図的なフェーズ判断による。
// diff を最小限に抑えるため MjaiList.vue を今フェーズでは触らない方針にした。
// 将来的に一元管理へ整理するための候補。
// 雀魂サーバー(MSLang)別の paipu URL 接頭辞。
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

// baseUrl は設定保存時に isHttpsUrl / normalizeBaseUrl で検証・正規化済みであることが前提。
// そのため new URL() は例外を投げない。isHttpsUrl と異なり try/catch を省いている。
export function originPattern(baseUrl: string): string {
  return `${new URL(baseUrl).origin}/*`;
}

export function buildReviewUrl(baseUrl: string, shareToken: string): string {
  return `${normalizeBaseUrl(baseUrl)}/review/${shareToken}`;
}

// payload は message を参照で保持するため、呼び出し元は変更済みの TenhouMessage を渡すこと。
// ポップアップの mj-lab リスナーは NagaList の破壊的変換とは別にクリーンなコピーを保持して渡している。
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
