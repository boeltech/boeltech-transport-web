import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";
import { PlatformPageShell } from "./PlatformPageShell";

const pagesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../pages",
);

describe("PlatformPageShell (D3)", () => {
  it("renders title for content inside PlatformShell", () => {
    render(
      <PlatformPageShell title="Empresas" description="Listado">
        <div data-testid="child">ok</div>
      </PlatformPageShell>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Empresas" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Listado")).toBeInTheDocument();
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("platform pages never import SettingsPageShell", () => {
    // Kept for PlatformGlobalCatalogsPage (isla SAT Conform bajo shell Ops).
    const pageFiles = ["PlatformGlobalCatalogsPage.tsx"];

    for (const file of pageFiles) {
      const source = readFileSync(join(pagesDir, file), "utf8");
      expect(source, file).not.toMatch(/SettingsPageShell/);
    }
  });
});
