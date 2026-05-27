import { describe, it, expect } from "vitest";
import { lq } from "../src/lib/liqi-schema";
import { unwrapWrapper } from "../src/lib/liqi-frame";

describe("unwrapWrapper", () => {
  it("Wrapper{name,data}をname(先頭の'.'除去)とdataに分解する", () => {
    const Wrapper = (lq as any).Wrapper;
    const encoded = Wrapper.encode(
      Wrapper.create({ name: ".lq.ResGameRecord", data: new Uint8Array([1, 2, 3]) })
    ).finish();

    const { name, data } = unwrapWrapper(encoded);
    expect(name).toBe("lq.ResGameRecord"); // 先頭の "." を除去
    expect(Array.from(data)).toEqual([1, 2, 3]);
  });
});
