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
