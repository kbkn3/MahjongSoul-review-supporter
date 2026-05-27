import { describe, it, expect } from "vitest";
import protobuf from "protobufjs";
import liqiJson from "../src/assets/majsoul/liqi.json";
import { unwrapWrapper } from "../src/lib/liqi-frame";

describe("unwrapWrapper", () => {
  it("Wrapper{name,data}をname(先頭の'.'除去)とdataに分解する", () => {
    const root = protobuf.Root.fromJSON(liqiJson as protobuf.INamespace);
    const Wrapper = root.lookupType("lq.Wrapper");
    const encoded = Wrapper.encode(
      Wrapper.create({ name: ".lq.ResGameRecord", data: new Uint8Array([1, 2, 3]) })
    ).finish();

    const { name, data } = unwrapWrapper(root, encoded);
    expect(name).toBe("lq.ResGameRecord"); // 先頭の "." を除去
    expect(Array.from(data)).toEqual([1, 2, 3]);
  });
});
