/**
 * Smoke dark — sección design system Mapas + embeds.
 */
import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { MapsEmbedsSection } from "@/pages/design-system/sections/MapsEmbedsSection";
import {
  expectNoRawTailwindColors,
  renderWithTheme,
} from "@/test/renderWithTheme";

describe("maps embeds dark smoke", () => {
  it("renders maps section in dark without raw palette classes", () => {
    const { container } = renderWithTheme(<MapsEmbedsSection />, {
      resolvedTheme: "dark",
    });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(screen.getByText(/Mapbox — estilos por tema/i)).toBeInTheDocument();
    expect(screen.getByText(/resolvedTheme: dark/i)).toBeInTheDocument();
    expectNoRawTailwindColors(container);
  });
});
