import { lq } from "./liqi-schema";
import { unwrapWrapper } from "./liqi-frame";

// name は liqi のメッセージ名(先頭 "lq." を除いたもの, 例 "RecordDiscardTile")。
// pbjs 静的生成クラスはコンストラクタ名が型名にならない場合があるため、
// 後続の parse() が型で分岐できるよう型名を明示的に保持する。
interface DecodedAction {
  name: string;
  data: any;
}

export interface DecodedRecord {
  head: any;
  actions: DecodedAction[];
}

export function decodeGameRecord(raw: Uint8Array): DecodedRecord {
  const namespace = lq as any;
  // フレームヘッダ: type(1バイト) + index(2バイト)。応答生バイト先頭3バイトを除去すると Wrapper 本体になる。
  const payload = raw.subarray(3);
  // 外側 Wrapper は name が空で data に ResGameRecord をエンコードして持つため、型を明示してデコードする。
  const outer = unwrapWrapper(payload);
  const response = namespace.ResGameRecord.decode(outer.data);
  if (!response.head) {
    throw new Error("not a fetchGameRecord response (head missing)");
  }
  if (!response.data || response.data.length === 0) {
    // 大規模牌譜は data ではなく data_url(HTTP取得)で返ることがある。未対応。
    throw new Error("game record provided via data_url is not supported yet");
  }
  const head = response.head;
  // ResGameRecord.data は ".lq.GameDetailRecords" 名の Wrapper。中身を取り出してからデコードする。
  const detailWrapper = unwrapWrapper(response.data);
  const detail = namespace.GameDetailRecords.decode(detailWrapper.data);

  // 新クライアントは records[] の各要素が、旧版は actions[].result が Wrapper でラップされた局イベント。
  const wrapped: Uint8Array[] = detail.records && detail.records.length
    ? detail.records
    : (detail.actions ?? [])
      .map((action: { result?: Uint8Array }) => action.result)
      .filter((result: Uint8Array | undefined): result is Uint8Array => !!result && result.length > 0);

  const actions: DecodedAction[] = wrapped.map((record) => {
    const inner = unwrapWrapper(record);
    return {
      name: inner.name.replace(/^lq\./, ""),
      data: messageType(namespace, inner.name).decode(inner.data),
    };
  });
  return { head, actions };
}

// 完全修飾名("lq.RecordDiscardTile" や入れ子の "lq.Foo.Bar")からクラスをドット分割で辿る。
// reflection の lookupType は eval 経由で CSP に抵触するため使えない。
function messageType(namespace: any, qualifiedName: string): any {
  const segments = qualifiedName.replace(/^lq\./, "").split(".");
  let current = namespace;
  for (const segment of segments) {
    current = current[segment];
    if (!current) throw new Error(`unknown liqi message type: ${qualifiedName}`);
  }
  return current;
}
