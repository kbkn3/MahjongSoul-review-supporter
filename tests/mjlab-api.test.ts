import {
  normalizeBaseUrl,
  isHttpsUrl,
  originPattern,
  buildReviewUrl,
  buildIngestPayload,
  postIngest,
  describeIngestError,
  MAJSOUL_PAIPU_URL_HEADS,
} from "../src/lib/mjlab-api";
import type { IngestResult } from "../src/lib/mjlab-api";
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
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
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
    expect(describeIngestError(r({ status: 422, error: "unsupported_format", detail: "3-player" }))).toContain("3-player");
    expect(describeIngestError(r({ status: 0, error: "permission_denied" }))).toContain("許可");
    expect(describeIngestError(r({ status: 0, error: "network" }))).toContain("接続");
  });
});
