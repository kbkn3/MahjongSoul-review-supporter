import protobuf from "protobufjs";
import liqiJson from "../assets/majsoul/liqi.json";

let cached: protobuf.Root | null = null;

export function liqiRoot(): protobuf.Root {
  if (!cached) cached = protobuf.Root.fromJSON(liqiJson as protobuf.INamespace);
  return cached;
}
