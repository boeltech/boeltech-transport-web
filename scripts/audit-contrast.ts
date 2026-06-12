import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONTRAST_PAIRS } from "../src/shared/ui/theme/contrastPairs";
import {
  auditContrastPairs,
  parseCssTokenBlocks,
} from "../src/shared/ui/theme/contrastCompute";

const themeArg = process.argv.find((arg) => arg.startsWith("--theme="));
const theme = themeArg?.split("=")[1] === "light" ? "light" : "dark";

const cssPath = resolve(process.cwd(), "src/app/styles/index.css");
const css = readFileSync(cssPath, "utf8");
const blocks = parseCssTokenBlocks(css);
const tokens = theme === "dark" ? blocks.dark : blocks.light;
const results = auditContrastPairs(tokens, CONTRAST_PAIRS);

const failures = results.filter((result) => !result.pass);

console.log(`\nWCAG contrast audit (${theme} mode) — ${CONTRAST_PAIRS.length} pairs\n`);
console.log(
  "Pair".padEnd(28) +
    "Ratio".padStart(8) +
    "Min".padStart(8) +
    "  Status",
);
console.log("-".repeat(56));

for (const result of results) {
  const name = result.pair.label ?? `${result.pair.fg}/${result.pair.bg}`;
  const status = result.pass ? "PASS" : "FAIL";
  console.log(
    name.padEnd(28) +
      result.ratio.toFixed(2).padStart(8) +
      result.pair.min.toFixed(1).padStart(8) +
      `  ${status}`,
  );
}

if (failures.length > 0) {
  console.log(`\n${failures.length} pair(s) below WCAG AA threshold:\n`);
  for (const failure of failures) {
    console.log(
      `  - ${failure.pair.fg} on ${failure.pair.bg}: ${failure.ratio.toFixed(2)}:1 (need ${failure.pair.min}:1)`,
    );
    console.log(`    fg: ${failure.fgValue}`);
    console.log(`    bg: ${failure.bgValue}`);
  }
  process.exit(1);
}

console.log("\nAll pairs pass WCAG AA.\n");
