import fan from "../assets/majsoul/cfg/fan.json";
import matchmode from "../assets/majsoul/cfg/matchmode.json";
import level from "../assets/majsoul/cfg/level.json";
import character from "../assets/majsoul/cfg/character.json";

export interface CfgTables {
  fan: Record<string, { name_jp: string }>;
  matchmode: Record<string, { room_name_jp: string }>;
  level: Record<string, { full_name_jp: string }>;
  character: Record<string, { sex: number }>;
}

export const cfgTables: CfgTables = {
  fan: fan as CfgTables["fan"],
  matchmode: matchmode as CfgTables["matchmode"],
  level: level as CfgTables["level"],
  character: character as CfgTables["character"],
};
