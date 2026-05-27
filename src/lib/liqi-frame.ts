import { lq } from "./liqi-schema";

export interface Unwrapped {
  name: string;
  data: Uint8Array;
}

// Wrapper{ name, data } をデコードし、name先頭の "." を除去して返す。
// name は ".lq.ResGameRecord" のような完全修飾名で、後続のクラス参照に渡すため先頭の "." を除く。
export function unwrapWrapper(bytes: Uint8Array): Unwrapped {
  const decoded = (lq as any).Wrapper.decode(bytes) as { name: string; data: Uint8Array };
  return {
    name: decoded.name.startsWith(".") ? decoded.name.slice(1) : decoded.name,
    data: decoded.data,
  };
}
