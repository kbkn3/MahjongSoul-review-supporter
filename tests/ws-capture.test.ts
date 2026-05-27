import { describe, it, expect } from "vitest";
import { GameRecordCapturer, containsAscii, frameIndex } from "../src/lib/ws-capture";

// "fetchGameRecord" のASCIIバイト列を任意位置に埋め込んだリクエストフレームを作る。
function makeRequest(index: number, includeName = true): Uint8Array {
  const name = includeName ? "fetchGameRecord" : "heartbeat";
  const bytes = [0x02, index & 0xff, (index >> 8) & 0xff, 0x0a];
  for (let i = 0; i < name.length; i++) bytes.push(name.charCodeAt(i));
  return new Uint8Array(bytes);
}

function makeResponse(index: number, type = 0x03): ArrayBuffer {
  return new Uint8Array([type, index & 0xff, (index >> 8) & 0xff, 0x12, 0x00]).buffer;
}

describe("containsAscii", () => {
  it("ASCII部分文字列を含むと真", () => {
    const data = new Uint8Array([0, 1, ...Array.from("abc").map((c) => c.charCodeAt(0)), 9]);
    expect(containsAscii(data, "abc")).toBe(true);
  });

  it("含まないと偽", () => {
    const data = new Uint8Array([0, 1, 2, 3]);
    expect(containsAscii(data, "abc")).toBe(false);
  });

  it("空needleは偽", () => {
    expect(containsAscii(new Uint8Array([1, 2, 3]), "")).toBe(false);
  });
});

describe("frameIndex", () => {
  it("type直後2バイトをLEで解釈する", () => {
    expect(frameIndex(new Uint8Array([0x03, 0x2a, 0x00]))).toBe(42);
    expect(frameIndex(new Uint8Array([0x03, 0x01, 0x01]))).toBe(257);
  });
});

describe("GameRecordCapturer", () => {
  it("リクエストと同indexの応答を捕捉する", () => {
    const capturer = new GameRecordCapturer();
    capturer.observeSend(makeRequest(42));
    const response = makeResponse(42);
    capturer.observeRecv(response);
    expect(capturer.latest()).toBe(response);
  });

  it("index不一致の応答は無視する", () => {
    const capturer = new GameRecordCapturer();
    capturer.observeSend(makeRequest(42));
    capturer.observeRecv(makeResponse(99));
    expect(capturer.latest()).toBeNull();
  });

  it("type 0x03 でないフレームは無視する", () => {
    const capturer = new GameRecordCapturer();
    capturer.observeSend(makeRequest(42));
    capturer.observeRecv(makeResponse(42, 0x01)); // ハートビート相当
    capturer.observeRecv(new Uint8Array([0x01]).buffer); // 短いフレーム
    expect(capturer.latest()).toBeNull();
  });

  it("fetchGameRecord以外のリクエスト後の応答は捕捉しない", () => {
    const capturer = new GameRecordCapturer();
    capturer.observeSend(makeRequest(42, false));
    capturer.observeRecv(makeResponse(42));
    expect(capturer.latest()).toBeNull();
  });
});
