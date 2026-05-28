import { describe, it, expect } from "vitest";
import protobuf from "protobufjs";
import liqiJson from "../src/assets/majsoul/liqi.json";
import { unwrapWrapper } from "../src/lib/liqi-frame";

// fixture 構築は protobufjs reflection を使う(Node 実行のテストは MV3 CSP 制約を受けない)。
// 本番 unwrapWrapper は decode 専用 static-module に依存し続けるが、テストは reflection で
// バイト列を作るので、static-module から encode/create が消えても影響を受けない。
const reflectionRoot = protobuf.Root.fromJSON(liqiJson as protobuf.INamespace);
const Wrapper = reflectionRoot.lookupType("lq.Wrapper");

describe("unwrapWrapper", () => {
  it("Wrapper{name,data}をname(先頭の'.'除去)とdataに分解する", () => {
    const encoded = Wrapper.encode(
      Wrapper.create({ name: ".lq.ResGameRecord", data: new Uint8Array([1, 2, 3]) })
    ).finish();

    const { name, data } = unwrapWrapper(encoded);
    expect(name).toBe("lq.ResGameRecord");
    expect(Array.from(data)).toEqual([1, 2, 3]);
  });
});
