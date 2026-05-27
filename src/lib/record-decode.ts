import { liqiRoot } from "./liqi-schema";
import { unwrapWrapper } from "./liqi-frame";

// name は liqi のメッセージ名(先頭 "lq." を除いたもの, 例 "RecordDiscardTile")。
// protobufjs の reflection デコードでは constructor.name が型名にならないため、
// 後続の parse() が型で分岐できるよう型名を明示的に保持する。
export interface DecodedAction {
  name: string;
  data: any;
}

export interface DecodedRecord {
  head: any;
  actions: DecodedAction[];
}

export function decodeGameRecord(raw: Uint8Array): DecodedRecord {
  const root = liqiRoot();
  const payload = stripFrameHeader(raw);
  // 外側 Wrapper は name が空で data に ResGameRecord をエンコードして持つため、型を明示してデコードする。
  const outer = unwrapWrapper(root, payload);
  const response = root.lookupType("lq.ResGameRecord").decode(outer.data) as any;
  const head = response.head;
  // ResGameRecord.data は ".lq.GameDetailRecords" 名の Wrapper。中身を取り出してからデコードする。
  const detailWrapper = unwrapWrapper(root, response.data);
  const detail = root.lookupType("lq.GameDetailRecords").decode(detailWrapper.data) as any;

  const actions: DecodedAction[] = [];
  const records: Uint8Array[] = detail.records && detail.records.length ? detail.records : [];
  if (records.length) {
    // 新クライアント: records[] の各要素が Wrapper でラップされた局イベント。
    for (const record of records) {
      const inner = unwrapWrapper(root, record);
      actions.push({
        name: inner.name.replace(/^lq\./, ""),
        data: root.lookupType(inner.name).decode(inner.data),
      });
    }
  } else {
    // 旧版: actions[].result に Wrapper が入る。
    for (const action of detail.actions ?? []) {
      if (action.result && action.result.length) {
        const inner = unwrapWrapper(root, action.result);
        actions.push({
          name: inner.name.replace(/^lq\./, ""),
          data: root.lookupType(inner.name).decode(inner.data),
        });
      }
    }
  }
  return { head, actions };
}

// フレームヘッダ: type(1バイト) + index(2バイト)。応答生バイト先頭3バイトを除去すると Wrapper 本体になる。
function stripFrameHeader(raw: Uint8Array): Uint8Array {
  return raw.subarray(3);
}
