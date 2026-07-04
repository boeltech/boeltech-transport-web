import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SRC_ROOT = join(process.cwd(), "src");
const EXTENSIONS = new Set([".ts", ".tsx"]);

/** Sheet con modal explícito true rompe interactividad de toasts (inert). */
const SHEET_MODAL_TRUE =
  /<Sheet\b[^>]*\bmodal=\{?\s*true\s*\}?|<SheetPrimitive\.Root\b[^>]*\bmodal=\{?\s*true\s*\}?/;

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
    if (SHEET_MODAL_TRUE.test(line)) {
      violations.push({
        file: relative(process.cwd(), filePath),
        line: i + 1,
        text: line.trim(),
      });
    }
  }
}

if (violations.length > 0) {
  console.error("audit:sheet-modal — <Sheet modal={true}> no permitido:\n");
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.text}`);
  }
  process.exit(1);
}

console.log("audit:sheet-modal — OK (sin Sheet modal={true} explícito)");
