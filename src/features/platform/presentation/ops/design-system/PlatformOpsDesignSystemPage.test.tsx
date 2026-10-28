import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { renderWithTheme } from "@/test/renderWithTheme";
import { opsCopy } from "../opsCopy";
import { OpsPortalHost } from "../ui";
import "../opsTokens.css";
import { PlatformOpsDesignSystemPage } from "./PlatformOpsDesignSystemPage";
import { PlatformOpsRail } from "../PlatformOpsRail";

const authState = vi.hoisted(() => ({
  platformRole: "platform_owner" as "platform_owner" | "platform_support",
  consoleV1: true,
}));

vi.mock("../platformConsoleV1", () => ({
  isPlatformConsoleV1Enabled: () => authState.consoleV1,
}));

vi.mock("../../providers/PlatformAuthProvider", () => ({
  usePlatformAuth: () => ({
    user: {
      id: "u1",
      email: "owner@test.com",
      firstName: "Owner",
      lastName: "Test",
      platformRole: authState.platformRole,
    },
    token: "at",
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

function OpsWrap({ children }: { children: ReactNode }) {
  return (
    <div className="platform-ops" data-ops-shell="true" data-ops-theme="dark">
      <OpsPortalHost>{children}</OpsPortalHost>
    </div>
  );
}

describe("PlatformOpsDesignSystemPage", () => {
  it("renders Marca by default, preview light/dark, no ThemeCycle ERP", async () => {
    authState.platformRole = "platform_owner";
    authState.consoleV1 = true;
    const user = userEvent.setup();

    renderWithTheme(
      <OpsWrap>
        <PlatformOpsDesignSystemPage />
      </OpsWrap>,
      { route: ["/platform/design-system"] },
    );

    expect(
      screen.getByTestId("platform-ops-design-system"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: opsCopy.designSystem.brand }),
    ).toBeInTheDocument();
    expect(screen.getByText(opsCopy.designSystem.badge)).toBeInTheDocument();
    expect(screen.getByTestId("ops-ds-brand")).toBeInTheDocument();
    expect(screen.getByTestId("ops-ds-preview-switch")).toBeInTheDocument();
    expect(screen.getByTestId("ops-ds-preview-root")).toHaveAttribute(
      "data-ops-theme",
      "light",
    );
    expect(screen.queryByText(/ThemeCycle/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /ciclo de tema|theme cycle/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByTestId("ops-ds-preview-dark"));
    expect(screen.getByTestId("ops-ds-preview-root")).toHaveAttribute(
      "data-ops-theme",
      "dark",
    );

    await user.click(screen.getByTestId("ops-ds-nav-typography"));
    expect(screen.getByTestId("ops-ds-typography")).toBeInTheDocument();
    expect(screen.queryByTestId("ops-ds-brand")).not.toBeInTheDocument();
  });

  it("shows brand wordmark and motif yes/no rows", async () => {
    authState.platformRole = "platform_owner";
    authState.consoleV1 = true;

    renderWithTheme(
      <OpsWrap>
        <PlatformOpsDesignSystemPage />
      </OpsWrap>,
      { route: ["/platform/design-system"] },
    );

    const brand = screen.getByTestId("ops-ds-brand");
    const marks = within(brand).getAllByTestId("ops-brand-mark");
    expect(marks.length).toBeGreaterThanOrEqual(2);
    expect(marks[0]).toHaveTextContent(opsCopy.wordmark);
    expect(within(brand).getAllByText(opsCopy.monogram).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByTestId("ops-ds-motif-m1")).toBeInTheDocument();
    expect(screen.getByTestId("ops-ds-motif-m5")).toBeInTheDocument();
    expect(screen.getByTestId("ops-ds-motif-m6")).toBeInTheDocument();
  });

  it("contrast section shows dual themes with measured ratios (not Pass hardcoded)", async () => {
    authState.platformRole = "platform_owner";
    authState.consoleV1 = true;
    const user = userEvent.setup();

    renderWithTheme(
      <OpsWrap>
        <PlatformOpsDesignSystemPage />
      </OpsWrap>,
      { route: ["/platform/design-system"] },
    );

    await user.click(screen.getByTestId("ops-ds-nav-contrast"));
    expect(screen.getByTestId("ops-ds-contrast")).toBeInTheDocument();
    expect(screen.getByTestId("ops-ds-contrast-light")).toBeInTheDocument();
    expect(screen.getByTestId("ops-ds-contrast-dark")).toBeInTheDocument();
    expect(screen.queryByTestId("ops-ds-preview-root")).not.toBeInTheDocument();

    const pair = screen.getByTestId(
      "ops-ds-contrast-pair-light-ops-fg-ops-bg",
    );
    expect(pair).toHaveAttribute("data-ops-contrast-pass", "true");
    const ratio = Number(pair.getAttribute("data-ops-contrast-ratio"));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(within(pair).queryByText(/^Pass$/i)).not.toBeInTheDocument();
    expect(within(pair).getByText(/AA \d+\.\d+:1/)).toBeInTheDocument();
  });

  it("shows ledger, quota, roles and example codes inside the preview", async () => {
    authState.platformRole = "platform_owner";
    authState.consoleV1 = true;
    const user = userEvent.setup();

    renderWithTheme(
      <OpsWrap>
        <PlatformOpsDesignSystemPage />
      </OpsWrap>,
      { route: ["/platform/design-system"] },
    );

    await user.click(screen.getByTestId("ops-ds-nav-patterns"));

    const preview = screen.getByTestId("ops-ds-preview-root");
    expect(preview).toHaveAttribute("data-ops-theme", "light");

    const ledgers = within(preview).getAllByTestId("ops-health-ledger");
    expect(ledgers).toHaveLength(2);
    const scores = within(preview).getAllByTestId("ops-health-score");
    expect(scores.map((node) => node.textContent)).toEqual(
      expect.arrayContaining(["40", "—"]),
    );
    expect(preview.querySelectorAll(".ops-health-signal")).toHaveLength(5);
    expect(preview.querySelector(".ops-health-signal .ops-quota-track")).toBeNull();

    const quotas = within(preview).getAllByTestId("ops-quota-line");
    const fills = quotas
      .map((node) => node.querySelector("[data-ops-quota-fill]")?.getAttribute("data-ops-quota-fill"))
      .filter(Boolean);
    expect(fills).toEqual(["lime", "ink", "warn", "danger"]);
    const branches = quotas.filter(
      (node) => node.getAttribute("data-ops-quota-kind") === "branches",
    );
    expect(branches).toHaveLength(2);
    expect(
      branches.filter((node) => node.getAttribute("data-ops-tick") === "danger"),
    ).toHaveLength(1);
    expect(
      quotas.some((node) => node.getAttribute("data-ops-quota-kind") === "history"),
    ).toBe(true);
    expect(within(preview).getByTestId("ops-ds-quota")).not.toHaveTextContent(
      /precio|\$|MXN/i,
    );

    const marks = within(preview).getAllByTestId("ops-operator-mark");
    expect(marks.map((node) => node.getAttribute("data-ops-role"))).toEqual([
      "platform_owner",
      "platform_support",
    ]);
    expect(within(preview).getByText(opsCopy.secrets.example)).toBeInTheDocument();
    expect(within(preview).getByText("DEMO-0001")).toBeInTheDocument();
    expect(within(preview).getByText("DEMO-0002")).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "CTA demo" }),
    ).not.toBeInTheDocument();
    expect(
      within(preview).getByRole("button", {
        name: opsCopy.hub.primary.registerPayment,
      }),
    ).toBeInTheDocument();
    const support = within(preview).getByTestId("ops-ds-hub-support");
    expect(within(support).queryByRole("button")).not.toBeInTheDocument();
    expect(within(support).getByRole("status")).toHaveTextContent(
      opsCopy.tenants.readOnly,
    );

    await user.click(screen.getByTestId("ops-ds-preview-dark"));
    const darkPreview = screen.getByTestId("ops-ds-preview-root");
    expect(darkPreview).toHaveAttribute("data-ops-theme", "dark");
    expect(within(darkPreview).getAllByTestId("ops-health-ledger")).toHaveLength(2);
    expect(within(darkPreview).getAllByTestId("ops-quota-line").length).toBeGreaterThan(0);
    expect(within(darkPreview).getAllByTestId("ops-operator-mark")).toHaveLength(2);
    expect(
      within(darkPreview).getByText(opsCopy.secrets.example),
    ).toBeInTheDocument();
  });

  it("shows the static table skeleton and a disabled primary", async () => {
    authState.platformRole = "platform_owner";
    authState.consoleV1 = true;
    const user = userEvent.setup();

    renderWithTheme(
      <OpsWrap>
        <PlatformOpsDesignSystemPage />
      </OpsWrap>,
      { route: ["/platform/design-system"] },
    );

    await user.click(screen.getByTestId("ops-ds-nav-components"));
    const preview = screen.getByTestId("ops-ds-preview-root");
    const skeleton = within(preview).getByTestId("ops-table-skeleton");
    expect(skeleton).toHaveAttribute("aria-busy", "true");
    expect(skeleton.querySelectorAll(".ops-table-skeleton-bar").length).toBeGreaterThan(0);
    expect(skeleton.className).not.toMatch(/animate|pulse|shimmer/);

    const disabledPrimary = within(preview).getByRole("button", {
      name: "Primary disabled",
    });
    expect(disabledPrimary).toBeDisabled();
    expect(disabledPrimary).toHaveAttribute("data-ops-button", "primary");

    await user.click(screen.getByTestId("ops-ds-nav-color"));
    const color = screen.getByTestId("ops-ds-preview-root");
    expect(within(color).getByText("--ops-skeleton")).toBeInTheDocument();
    expect(
      within(color).getByText("Marca de carga. No es texto y no anima."),
    ).toBeInTheDocument();
  });

  it("redirects when flag is OFF", () => {
    authState.platformRole = "platform_owner";
    authState.consoleV1 = false;

    renderWithTheme(
      <Routes>
        <Route
          path="/platform/design-system"
          element={
            <OpsWrap>
              <PlatformOpsDesignSystemPage />
            </OpsWrap>
          }
        />
        <Route path="/platform" element={<div data-testid="hoy">hoy</div>} />
      </Routes>,
      { route: ["/platform/design-system"] },
    );

    expect(screen.getByTestId("hoy")).toBeInTheDocument();
    expect(
      screen.queryByTestId("platform-ops-design-system"),
    ).not.toBeInTheDocument();
  });

  it("redirects platform_support away from the page", () => {
    authState.platformRole = "platform_support";
    authState.consoleV1 = true;

    renderWithTheme(
      <Routes>
        <Route
          path="/platform/design-system"
          element={
            <OpsWrap>
              <PlatformOpsDesignSystemPage />
            </OpsWrap>
          }
        />
        <Route path="/platform" element={<div data-testid="hoy">hoy</div>} />
      </Routes>,
      { route: ["/platform/design-system"] },
    );

    expect(screen.getByTestId("hoy")).toBeInTheDocument();
  });
});

describe("PlatformOpsRail design-system link", () => {
  it("shows Design System link for owner and hides for support", () => {
    authState.platformRole = "platform_owner";
    authState.consoleV1 = true;

    const { unmount } = renderWithTheme(
      <OpsWrap>
        <PlatformOpsRail pathname="/platform" />
      </OpsWrap>,
      { route: ["/platform"] },
    );

    expect(screen.getByTestId("ops-nav-design-system")).toHaveAttribute(
      "href",
      "/platform/design-system",
    );
    expect(
      screen.getByRole("link", {
        name: opsCopy.nav.designSystem,
        hidden: true,
      }),
    ).toBeInTheDocument();

    unmount();
    authState.platformRole = "platform_support";

    renderWithTheme(
      <OpsWrap>
        <PlatformOpsRail pathname="/platform" />
      </OpsWrap>,
      { route: ["/platform"] },
    );

    expect(
      screen.queryByTestId("ops-nav-design-system"),
    ).not.toBeInTheDocument();
  });
});
