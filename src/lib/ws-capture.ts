// liqiフレーム判定はPhase 4で導入する。現段階は最新の受信ArrayBufferを保持するだけ。
export class RecordCache {
  private buf: ArrayBuffer | null = null;

  offer(data: unknown): void {
    if (data instanceof ArrayBuffer) {
      this.buf = data;
    }
  }

  latest(): ArrayBuffer | null {
    return this.buf;
  }
}
