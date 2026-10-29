import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import {
  PLATFORM_NOT_FOUND_COPY,
  PlatformNotFoundPage,
} from "./PlatformNotFoundPage";

describe("PlatformNotFoundPage", () => {
  it("stays in the console with one link back to /platform", () => {
    renderWithTheme(<PlatformNotFoundPage />, {
      route: ["/platform/billing/reconciliation"],
    });

    expect(screen.getByText(PLATFORM_NOT_FOUND_COPY.title)).toBeInTheDocument();
    expect(
      screen.getByText(PLATFORM_NOT_FOUND_COPY.description),
    ).toBeInTheDocument();
    const back = screen.getByRole("link", {
      name: PLATFORM_NOT_FOUND_COPY.action,
    });
    expect(back).toHaveAttribute("href", "/platform");
    expect(screen.queryByRole("link", { name: /dashboard/i })).toBeNull();
    expect(screen.queryByText(/Página no encontrada/i)).toBeNull();
  });
});
