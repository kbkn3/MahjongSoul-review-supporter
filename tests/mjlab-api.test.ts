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
    expect(payload.metadata.externalUrl).toBe(`${MAJSOUL_PAIPU_URL_HEADS[1]}uuid-1`);
    expect(payload.payload.ref).toBe("uuid-1");
  });

  it("falls back to the first url head for unknown msLang", () => {
    const payload = buildIngestPayload(baseMessage("uuid-2"), 9);
    expect(payload.metadata.externalUrl).toBe(`${MAJSOUL_PAIPU_URL_HEADS[0]}uuid-2`);
  });
});
