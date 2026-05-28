import { describe, it, expect } from "vitest";
import { GameRecordCapturer, containsAscii, frameIndex } from "../src/lib/ws-capture";

// Wrapper の wire format に沿ったリクエストフレームを作る。
// [type=0x02][index_lo][index_hi][name field 0x0a][name_len][name bytes][data field 0x12][data_len=0]。
// fetchGameRecord と fetchGameRecordList のように prefix が共通する RPC を区別できる形にする必要があるため、
// name 直後の data field tag(0x12)まで含めた実フレーム相当のバイト列を組む。
function makeRequest(index: number, methodName: string | null = "fetchGameRecord"): Uint8Array {
  const header = [0x02, index & 0xff, (index >> 8) & 0xff];
  if (methodName === null) return new Uint8Array([...header, 0x12, 0x00]);
  const nameBytes: number[] = [];
  for (let i = 0; i < methodName.length; i++) nameBytes.push(methodName.charCodeAt(i));
  return new Uint8Array([...header, 0x0a, methodName.length, ...nameBytes, 0x12, 0x00]);
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
    capturer.observeSend(makeRequest(42, "heartbeat"));
    capturer.observeRecv(makeResponse(42));
    expect(capturer.latest()).toBeNull();
  });

  // fetchGameRecordList / fetchGameRecordsDetail は wire name に "fetchGameRecord" を含むが
  // レスポンス型(ResGameRecordList 等)が異なり head フィールドを持たないため、
  // これらの応答を捕捉してしまうと record-decode 側で "head missing" となる。
  it("fetchGameRecordList リクエスト後の応答は捕捉しない", () => {
    const capturer = new GameRecordCapturer();
    capturer.observeSend(makeRequest(42, "fetchGameRecordList"));
    capturer.observeRecv(makeResponse(42));
    expect(capturer.latest()).toBeNull();
  });

  it("fetchGameRecordsDetail リクエスト後の応答は捕捉しない", () => {
    const capturer = new GameRecordCapturer();
    capturer.observeSend(makeRequest(42, "fetchGameRecordsDetail"));
    capturer.observeRecv(makeResponse(42));
    expect(capturer.latest()).toBeNull();
  });

  // 他人の牌譜閲覧時に発生していた、fetchGameRecord 応答取得後に
  // fetchGameRecordsDetail 等の応答で this.record が上書きされる事象の回帰防止。
  it("fetchGameRecord 応答取得後に来る別RPC応答で上書きされない", () => {
    const capturer = new GameRecordCapturer();
    capturer.observeSend(makeRequest(10, "fetchGameRecord"));
    const recordResponse = makeResponse(10);
    capturer.observeRecv(recordResponse);
    capturer.observeSend(makeRequest(11, "fetchGameRecordsDetail"));
    capturer.observeRecv(makeResponse(11));
    expect(capturer.latest()).toBe(recordResponse);
  });
});
