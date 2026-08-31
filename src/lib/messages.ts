export const RSR = {
  GET_RECORD: "rsr:get-record",
  RECORD: "rsr:record",
  DECODE_RECORD: "rsr:decode-record",
  INGEST: "rsr:ingest",
} as const;

export type ReviewMode = "naga" | "mjai";
