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
