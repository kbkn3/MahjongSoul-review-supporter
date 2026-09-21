import { describe, it, expect } from "vitest";
import { cfgTables } from "../src/lib/cfg";

describe("cfgTables", () => {
  it("役名を引ける", () => {
    const tables = cfgTables();
    expect(tables.fan["1"].name_jp).toBe("門前清自摸和");
  });

  it("段位・部屋・キャラも引ける", () => {
    const t = cfgTables();
    expect(t.level["10101"].full_name_jp).toBe("初心★1");
    expect(t.matchmode["1"].room_name_jp).toBe("銅の間");
    expect(t.character["200001"].sex).toBe(1);
  });

  it("存在しないidはundefinedを返す", () => {
    expect(cfgTables().fan["999999"]).toBeUndefined();
  });
});
