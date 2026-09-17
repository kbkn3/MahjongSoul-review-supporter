// src 配下の .css で定義したカスタムクラス(Tailwind の @layer components 等)が
// .vue / .ts / .html のどこからも参照されていないかを検出する。
// Tailwind v4 のユーティリティクラスは使用箇所から自動生成されるため対象外
// (CSS ソースに定義そのものが存在しない)。対象はこのプロジェクトが自分で
// 定義した名前付きクラスのみ。
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

function walk(dir, extensions) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...walk(fullPath, extensions));
    } else if (extensions.some((ext) => entry.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractDefinedClasses(cssFiles) {
  const defined = new Map();
  for (const file of cssFiles) {
    const stripped = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const [, selectorBlock] of stripped.matchAll(/([^{}]+)\{/g)) {
      // @import url(...); のような ; で終わる at-rule が直前にあると
      // url() の中身までセレクタとして拾ってしまうため、最後の ; 以降だけを見る
      const selectorText = selectorBlock.split(";").pop();
      for (const [, className] of selectorText.matchAll(/\.([a-zA-Z_][a-zA-Z0-9_-]*)/g)) {
        if (!defined.has(className)) defined.set(className, file);
      }
    }
  }
  return defined;
}

const cssFiles = walk(SRC_DIR, [".css"]);
const usageFiles = walk(SRC_DIR, [".vue", ".ts", ".html"]);
const usageText = usageFiles.map((file) => readFileSync(file, "utf8")).join("\n");

// \b は - を単語境界とみなし、未使用の .btn が btn-primary の出現で使用扱いになるため、
// クラス名に使える文字(英数字・_・-)を境界の外側として明示的に否定する
const unused = [...extractDefinedClasses(cssFiles)].filter(
  ([className]) => !new RegExp(`(?<![\\w-])${className}(?![\\w-])`).test(usageText),
);

if (unused.length === 0) {
  console.log("未使用のカスタムCSSクラスは見つかりませんでした。");
  process.exit(0);
}

console.log(`未使用のカスタムCSSクラス (${unused.length}件):`);
for (const [className, file] of unused) {
  console.log(`  .${className}  (${path.relative(process.cwd(), file)})`);
}
process.exit(1);
