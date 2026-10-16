/**
 * F1 — páginas in-scope montan SettingsPageShell (no SettingsLayout directo).
 */
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@shared/ui/page-shells", () => ({
  SettingsPageShell: ({
    children,
    sectionTitle,
  }: {
    children: ReactNode;
    sectionTitle?: string;
  }) => (
    <div data-testid="settings-page-shell" data-section={sectionTitle ?? ""}>
      {children}
    </div>
  ),
}));

vi.mock("../components/TenantLocationMasterDetail", () => ({
  TenantLocationMasterDetail: () => <div>locations-md</div>,
}));

vi.mock("../components/BillingServiceConceptMasterDetail", () => ({
  BillingServiceConceptMasterDetail: () => <div>concepts-md</div>,
}));

vi.mock("@features/dashboard", () => ({
  useDashboardLayout: () => ({}),
  DashboardCustomizePanel: () => null,
}));

import { TenantLocationsPage } from "./TenantLocationsPage";
import { BillingServiceConceptsPage } from "./BillingServiceConceptsPage";
import { DashboardLayoutsSettingsPage } from "./DashboardLayoutsSettingsPage";
import { tenantLocationsCopy } from "../copy/tenantLocationsCopy";
import { billingServiceConceptsCopy } from "../copy/billingServiceConceptsCopy";
import { dashboardCopy } from "@features/dashboard/presentation/copy/dashboardCopy";

describe("Settings shell pages (F1)", () => {
  it("Locations usa SettingsPageShell", () => {
    render(
      <MemoryRouter>
        <TenantLocationsPage />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("settings-page-shell")).toHaveAttribute(
      "data-section",
      tenantLocationsCopy.page.breadcrumb,
    );
  });

  it("Service concepts usa SettingsPageShell", () => {
    render(
      <MemoryRouter>
        <BillingServiceConceptsPage />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("settings-page-shell")).toHaveAttribute(
      "data-section",
      billingServiceConceptsCopy.page.title,
    );
  });

  it("Dashboard layouts usa SettingsPageShell (chrome F1)", () => {
    render(
      <MemoryRouter>
        <DashboardLayoutsSettingsPage />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("settings-page-shell")).toHaveAttribute(
      "data-section",
      dashboardCopy.customize.roleSettingsTitle,
    );
  });
});
