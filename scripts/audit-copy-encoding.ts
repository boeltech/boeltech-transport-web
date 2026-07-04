import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC_ROOT = join(process.cwd(), "src");
const EXTENSIONS = new Set([".ts", ".tsx"]);

/** Heurística del bug de sidebar: vocal sustituida por `+` en strings de UI. */
const MOJIBAKE_IN_UI_STRING =
  /(?:label|title|badge|placeholder|description)\s*:\s*["'`][^"'`]*[A-Za-záéíóúñÁÉÍÓÚÑ]\+[A-Za-záéíóúñÁÉÍÓÚÑ]/;

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      walk(fullPath, files);
    } else if (EXTENSIONS.has(entry.slice(entry.lastIndexOf(".")))) {
      files.push(fullPath);
    }
  }
  return files;
}

const violations: { file: string; line: number; text: string }[] = [];

for (const filePath of walk(SRC_ROOT)) {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    if (MOJIBAKE_IN_UI_STRING.test(line)) {
      violations.push({
        file: relative(process.cwd(), filePath),
        line: i + 1,
        text: line.trim(),
      });
    }
  }
}

if (violations.length > 0) {
  console.error("\nCopy encoding audit — FAIL\n");
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    ${v.text}\n`);
  }
  process.exit(1);
}

console.log("Copy encoding audit — OK (no mojibake in UI string props)");
