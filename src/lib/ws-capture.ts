// liqiフレーム: [type:1][index:2(LE)][Wrapper...]。
// fetchGameRecordのリクエストindexを記録し、同indexの応答(type 0x03)だけを牌譜として捕捉する。
// 最新フレーム無条件保持だとハートビート等を拾ってしまうため、index照合で応答を確実に対応付ける。
const FRAME_REQUEST = 0x02;
const FRAME_RESPONSE = 0x03;

// haystack中にneedle(ASCII)が現れるか。リクエストのWrapper.name(".lq.Lobby.fetchGameRecord")判定用。
export function containsAscii(haystack: Uint8Array, needle: string): boolean {
  const n = needle.length;
  if (n === 0 || haystack.length < n) return false;
  for (let i = 0; i + n <= haystack.length; i++) {
    let matched = true;
    for (let j = 0; j < n; j++) {
      if (haystack[i + j] !== needle.charCodeAt(j)) { matched = false; break; }
    }
    if (matched) return true;
  }
  return false;
}

// フレーム先頭の type 直後2バイト(LE)の index。
export function frameIndex(bytes: Uint8Array): number {
  return bytes[1] | (bytes[2] << 8);
}

export class GameRecordCapturer {
  private pendingIndex: number | null = null;
  private record: ArrayBuffer | null = null;

  // 送信フレームを観測。fetchGameRecordリクエストならそのindexを覚える。
  observeSend(data: Uint8Array): void {
    if (data.length < 3 || data[0] !== FRAME_REQUEST) return;
    // Wrapper.name 直後に来る data field tag(0x12)まで含めて完全一致させる。
    // 単に "fetchGameRecord" だけだと fetchGameRecordList / fetchGameRecordsDetail にも一致してしまい、
    // それらの応答(head フィールドを持たない別型)を捕捉して record-decode 側で "head missing" に至っていた。
    if (containsAscii(data, "fetchGameRecord\x12")) {
      this.pendingIndex = frameIndex(data);
    }
  }

  // 受信フレームを観測。覚えたindexと一致する応答(type 0x03)なら牌譜として保持する。
  observeRecv(buffer: ArrayBuffer): void {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 3 || bytes[0] !== FRAME_RESPONSE) return;
    if (this.pendingIndex !== null && frameIndex(bytes) === this.pendingIndex) {
      this.record = buffer;
      this.pendingIndex = null;
    }
  }

  latest(): ArrayBuffer | null {
    return this.record;
  }
}
