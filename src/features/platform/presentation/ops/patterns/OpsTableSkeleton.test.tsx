/// <reference types="node" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "../opsTokens.css";
import { OpsTableSkeleton } from "./OpsTableSkeleton";

describe("OpsTableSkeleton", () => {
  it("renders static row bars announced with aria-busy", () => {
    render(
      <div className="platform-ops">
        <OpsTableSkeleton rows={3} />
      </div>,
    );

    const skeleton = screen.getByTestId("ops-table-skeleton");
    expect(skeleton).toHaveAttribute("aria-busy", "true");
    expect(skeleton.querySelectorAll(".ops-table-skeleton-bar")).toHaveLength(3);
    expect(skeleton.querySelector("[class*='pulse']")).toBeNull();
    expect(skeleton.querySelector("[class*='shimmer']")).toBeNull();
  });

  it("does not animate the bar rule", () => {
    const css = readFileSync(
      resolve(
        process.cwd(),
        "src/features/platform/presentation/ops/opsTokens.css",
      ),
      "utf8",
    );
    const block = css.match(/\.ops-table-skeleton-bar\s*\{[^}]+\}/);
    expect(block?.[0]).toContain("animation: none");
    expect(block?.[0]).not.toMatch(/pulse|shimmer/);
  });
});
