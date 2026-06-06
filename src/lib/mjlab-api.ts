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
