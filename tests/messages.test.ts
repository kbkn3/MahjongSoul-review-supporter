import { describe, it, expect } from "vitest";
import { RSR } from "../src/lib/messages";

describe("RSR message constants", () => {
  it("defines namespaced message names", () => {
    expect(RSR.GET_RECORD).toBe("rsr:get-record");
    expect(RSR.RECORD).toBe("rsr:record");
    expect(RSR.DECODE_RECORD).toBe("rsr:decode-record");
  });
});
