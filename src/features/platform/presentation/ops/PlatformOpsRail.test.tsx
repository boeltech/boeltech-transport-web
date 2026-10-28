import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { opsCopy } from "./opsCopy";
import { PlatformOpsRail } from "./PlatformOpsRail";
import "./opsTokens.css";

vi.mock("../providers/PlatformAuthProvider", () => ({
  usePlatformAuth: () => ({
    user: {
      id: "u1",
      email: "owner@test.com",
      firstName: "Owner",
      lastName: "Test",
      platformRole: "platform_owner" as const,
      scope: "platform" as const,
      mfaEnabled: true,
    },
    logout: vi.fn(),
  }),
}));

describe("PlatformOpsRail (L1 BrandMark)", () => {
  it("uses OpsBrandMark and retires Ops badge", () => {
    renderWithTheme(
      <div className="platform-ops" data-ops-theme="dark">
        <PlatformOpsRail pathname="/platform" />
      </div>,
    );

    const brand = screen.getByTestId("ops-brand-mark");
    expect(brand).toHaveAttribute("data-ops-brand", "rail");
    expect(brand).toHaveTextContent(opsCopy.wordmark);
    expect(screen.queryByText(/^Ops$/)).not.toBeInTheDocument();
  });
});
