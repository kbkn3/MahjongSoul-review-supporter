// scripts/gen-majsoul-assets.mjs
// 雀魂CDNから liqi.json と lqc.lqbin を取得して保存する。
// 出所: 雀魂(Cat Food Studio/Yo-star)の配布物。デコード結果のみ同梱する。
// 手法参照(コードはコピーしない): tensoul(MIT) のCDNバージョン解決。
import { writeFile, mkdir, readFile, access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import protobuf from "protobufjs";

const BASE = "https://game.maj-soul.com/1";
const LQC_CACHE = "scripts/.cache/lqc.lqbin";

// lqc.lqbin が既に取得済みならCDNアクセスを省略する(17MBの再取得を避ける)。
let lqcCached = false;
try {
  await access(LQC_CACHE);
  lqcCached = true;
} catch {
  lqcCached = false;
}

if (!lqcCached) {
  const version = (await (await fetch(`${BASE}/version.json`)).json()).version;
  const resversion = await (await fetch(`${BASE}/resversion${version}.json`)).json();

  const liqiPrefix = resversion.res["res/proto/liqi.json"].prefix;
  const lqcPrefix = resversion.res["res/config/lqc.lqbin"].prefix;

  const liqi = await (await fetch(`${BASE}/${liqiPrefix}/res/proto/liqi.json`)).json();
  const lqc = new Uint8Array(
    await (await fetch(`${BASE}/${lqcPrefix}/res/config/lqc.lqbin`)).arrayBuffer()
  );

  await mkdir("src/assets/majsoul", { recursive: true });
  await writeFile("src/assets/majsoul/liqi.json", `${JSON.stringify(liqi)}\n`);
  await mkdir("scripts/.cache", { recursive: true });
  await writeFile(LQC_CACHE, lqc); // 中間生成物。リポジトリには含めない
  console.log(`version=${version} liqiPrefix=${liqiPrefix} lqcPrefix=${lqcPrefix}`);
  console.log(`liqi.json top-level keys: ${Object.keys(liqi).join(",")}`);
} else {
  console.log(`lqc.lqbin はキャッシュ済み(${LQC_CACHE})。CDN取得をスキップする`);
}

// ----------------------------------------------------------------------------
// lqc.lqbin から役/部屋/段位/キャラの静的cfg JSONを生成する。
//
// lqc.lqbin は lq.config.ConfigTables(自己記述的なマスタデータ集約)で、内部に
//   - schemas: 各テーブル/シートのフィールド定義(field_name/pb_type/出現順)
//   - datas:   各シートのデータ行(repeated bytes, 各要素が1レコードのprotobuf)
// を持つ。データ行のprotobufフィールド番号は schemas のフィールド出現順(1始まり)に
// 一致するため、schemas からシートごとに動的Typeを構築して各行をデコードする。
//
// wire構造(フィールド番号)は scripts/.cache/lqc.lqbin を実際にデコードして検証した
// 相互運用上の事実のみを利用する。外部実装のコード/protoファイルは流用しない。
const lqcBuffer = new Uint8Array(await readFile(LQC_CACHE));

const configRoot = protobuf.Root.fromJSON({
  nested: {
    lq: {
      nested: {
        config: {
          nested: {
            Field: {
              fields: {
                field_name: { type: "string", id: 1 },
                pb_index: { type: "uint32", id: 2 },
                pb_type: { type: "string", id: 3 },
                pb_label: { type: "uint32", id: 4 },
              },
            },
            SheetDescriptor: {
              fields: {
                name: { type: "string", id: 1 },
                fields: { rule: "repeated", type: "Field", id: 3 },
              },
            },
            TableSchema: {
              fields: {
                table: { type: "string", id: 1 },
                sheets: { rule: "repeated", type: "SheetDescriptor", id: 2 },
              },
            },
            SheetData: {
              fields: {
                table: { type: "string", id: 1 },
                sheet: { type: "string", id: 2 },
                data: { rule: "repeated", type: "bytes", id: 3 },
              },
            },
            ConfigTables: {
              fields: {
                version: { type: "string", id: 1 },
                schemas: { rule: "repeated", type: "TableSchema", id: 3 },
                datas: { rule: "repeated", type: "SheetData", id: 4 },
              },
            },
          },
        },
      },
    },
  },
});

const ConfigTables = configRoot.lookupType("lq.config.ConfigTables");
const configTables = ConfigTables.toObject(ConfigTables.decode(lqcBuffer), {
  defaults: true,
  arrays: true,
});

const WANTED_SHEETS = [
  "fan/fan",
  "desktop/matchmode",
  "level_definition/level_definition",
  "item_definition/character",
];
const presentSheets = new Set(
  configTables.datas.map((data) => `${data.table}/${data.sheet}`)
);
console.log(
  `ConfigTables version=${configTables.version} schemas=${configTables.schemas.length} datas=${configTables.datas.length}`
);
for (const key of WANTED_SHEETS) {
  if (!presentSheets.has(key)) {
    throw new Error(`lqc.lqbin に必要シート ${key} が存在しない`);
  }
}
console.log(`対象4シートを確認: ${WANTED_SHEETS.join(", ")}`);

// schemas の pb_type を protobufjs のスカラー型へ写像する。未知型は string 扱い。
const PB_TYPE_TO_PROTO = {
  uint32: "uint32",
  int32: "int32",
  sint32: "sint32",
  uint64: "uint64",
  int64: "int64",
  sint64: "sint64",
  float: "float",
  double: "double",
  bool: "bool",
  string: "string",
};

// schemas から動的Typeを作り、対象シートの全レコードをデコードして返す。
function decodeSheet(table, sheet) {
  const tableSchema = configTables.schemas.find((schema) => schema.table === table);
  const descriptor = tableSchema?.sheets.find((sheetDef) => sheetDef.name === sheet);
  if (!descriptor) {
    throw new Error(`schema が見つからない: ${table}/${sheet}`);
  }
  const fields = {};
  descriptor.fields.forEach((field, index) => {
    fields[field.field_name] = {
      type: PB_TYPE_TO_PROTO[field.pb_type] ?? "string",
      id: index + 1, // データ行のフィールド番号はフィールド出現順(1始まり)に一致する
    };
  });
  const RowType = protobuf.Type.fromJSON(`Row_${table}_${sheet}`, { fields });
  const sheetData = configTables.datas.find(
    (data) => data.table === table && data.sheet === sheet
  );
  return sheetData.data.map((row) =>
    RowType.toObject(RowType.decode(row), { defaults: true })
  );
}

// id をキーに、指定フィールドだけを抜き出した { id: {...} } を作る。
function buildLookup(rows, mapRow) {
  const lookup = {};
  for (const row of rows) {
    lookup[row.id] = mapRow(row);
  }
  return lookup;
}

const cfg = {
  fan: buildLookup(decodeSheet("fan", "fan"), (row) => ({
    name_jp: row.name_jp,
    name_en: row.name_en,
  })),
  matchmode: buildLookup(decodeSheet("desktop", "matchmode"), (row) => ({
    room_name_jp: row.room_name_jp,
    room_name_en: row.room_name_en,
  })),
  level: buildLookup(
    decodeSheet("level_definition", "level_definition"),
    (row) => ({ full_name_jp: row.full_name_jp, full_name_en: row.full_name_en })
  ),
  character: buildLookup(decodeSheet("item_definition", "character"), (row) => ({
    sex: row.sex,
  })),
};

const CFG_DIR = "src/assets/majsoul/cfg";
await mkdir(CFG_DIR, { recursive: true });
const cfgFiles = {
  "fan.json": cfg.fan,
  "matchmode.json": cfg.matchmode,
  "level.json": cfg.level,
  "character.json": cfg.character,
};
for (const [fileName, data] of Object.entries(cfgFiles)) {
  await writeFile(`${CFG_DIR}/${fileName}`, `${JSON.stringify(data)}\n`);
  console.log(`${fileName}: ${Object.keys(data).length} 件`);
}

// ----------------------------------------------------------------------------
// pbjs static-module で src/assets/majsoul/liqi-proto.js を生成する。
//
// フラグは decode 専用に固定する: 本番コード(record-decode.ts/liqi-frame.ts)は
// .decode() しか呼ばないため encode/verify/convert/create/delimited は不要。
// このフラグ固定が「--keep-case 付け忘れによる camelCase 化事故」を構造的に防ぐ。
//
// pbjs バイナリは devDependencies の protobufjs-cli を createRequire で直接解決する。
// npx 経由は PATH/環境に依存して再現性が落ちるため使用しない。

const require = createRequire(import.meta.url);
const pbjsPath = require.resolve("protobufjs-cli/bin/pbjs");

const LIQI_PROTO_OUTPUT = "src/assets/majsoul/liqi-proto.js";
const pbjsArgs = [
  "--keep-case",
  "--no-comments",
  "--no-encode",
  "--no-verify",
  "--no-convert",
  "--no-create",
  "--no-delimited",
  "-t", "static-module",
  "-w", "es6",
  "-o", LIQI_PROTO_OUTPUT,
  "src/assets/majsoul/liqi.json",
];
const pbjsResult = spawnSync(process.execPath, [pbjsPath, ...pbjsArgs], {
  stdio: "inherit",
});
if (pbjsResult.status !== 0) {
  throw new Error(`pbjs failed with status ${pbjsResult.status ?? pbjsResult.signal}`);
}

// pbjs --no-comments は出所/再生成手順を含まないため、日本語ヘッダコメントを先頭に付与する。
// 編集者が個別フラグを手で叩いて再生成し --keep-case を落とす事故を防ぐため、再生成手順は
// npm run gen:assets だけを記載する(個別 pbjs コマンドは書かない)。
const HEADER_COMMENT = "// 自動生成物。出所: 雀魂 liqi.json (src/assets/majsoul/liqi.json)。再生成: npm run gen:assets。手動編集しない。\n";
const generated = await readFile(LIQI_PROTO_OUTPUT, "utf8");
await writeFile(LIQI_PROTO_OUTPUT, HEADER_COMMENT + generated);

console.log(`liqi-proto.js 生成完了: ${LIQI_PROTO_OUTPUT}`);
