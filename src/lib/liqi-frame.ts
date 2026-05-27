import type protobuf from "protobufjs";

export interface Unwrapped {
  name: string;
  data: Uint8Array;
}

// Wrapper{ name, data } をデコードし、name先頭の "." を除去して返す。
// name は ".lq.ResGameRecord" のような完全修飾名で、後続の lookupType に渡すため先頭の "." を除く。
export function unwrapWrapper(root: protobuf.Root, bytes: Uint8Array): Unwrapped {
  const Wrapper = root.lookupType("lq.Wrapper");
  const decoded = Wrapper.decode(bytes) as unknown as { name: string; data: Uint8Array };
  return {
    name: decoded.name.startsWith(".") ? decoded.name.slice(1) : decoded.name,
    data: decoded.data,
  };
}
