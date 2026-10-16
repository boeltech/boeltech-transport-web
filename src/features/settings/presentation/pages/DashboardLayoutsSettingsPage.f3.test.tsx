/**
 * F3 — Dashboard layouts: SettingsPageShell + title/description desde copy;
 * flujo rol → editar (panel cerrado por defecto).
 */
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("@shared/ui/page-shells", () => ({
  SettingsPageShell: ({
    children,
    sectionTitle,
    title,
    description,
  }: {
    children: ReactNode;
    sectionTitle?: string;
    title?: string;
    description?: string;
  }) => (
    <div
      data-testid="settings-page-shell"
      data-section={sectionTitle ?? ""}
      data-title={typeof title === "string" ? title : ""}
      data-description={typeof description === "string" ? description : ""}
    >
      {children}
    </div>
  ),
}));

vi.mock("@features/dashboard", () => ({
  useDashboardLayout: () => ({}),
  DashboardCustomizePanel: ({ open }: { open: boolean }) => (
    <div data-testid="dashboard-customize-panel" data-open={String(open)} />
  ),
}));

import { DashboardLayoutsSettingsPage } from "./DashboardLayoutsSettingsPage";
import { dashboardCopy } from "@features/dashboard/presentation/copy/dashboardCopy";

const copy = dashboardCopy.customize;

describe("DashboardLayoutsSettingsPage (F3)", () => {
  it("usa SettingsPageShell con title y description desde copy", () => {
    render(
      <MemoryRouter>
        <DashboardLayoutsSettingsPage />
      </MemoryRouter>,
    );

    const shell = screen.getByTestId("settings-page-shell");
    expect(shell).toHaveAttribute("data-section", copy.roleSettingsTitle);
    expect(shell).toHaveAttribute("data-title", copy.roleSettingsTitle);
    expect(shell).toHaveAttribute(
      "data-description",
      copy.roleSettingsDescription,
    );
  });

  it("no muestra prosa hardcode de guardado de widgets", () => {
    render(
      <MemoryRouter>
        <DashboardLayoutsSettingsPage />
      </MemoryRouter>,
    );

    expect(
      screen.queryByText(/Los cambios se guardan al mover/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/hereda este default si no tiene override/i),
    ).not.toBeInTheDocument();
  });

  it("mantiene el panel cerrado hasta Editar widgets del rol", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <DashboardLayoutsSettingsPage />
      </MemoryRouter>,
    );

    const panel = screen.getByTestId("dashboard-customize-panel");
    expect(panel).toHaveAttribute("data-open", "false");

    await user.click(
      screen.getByRole("button", { name: copy.editRoleLayout }),
    );
    expect(panel).toHaveAttribute("data-open", "true");
  });

  it("expone selector de rol, pasos y CTA de edición desde copy", () => {
    render(
      <MemoryRouter>
        <DashboardLayoutsSettingsPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(copy.selectRole)).toBeInTheDocument();
    expect(screen.getByText(copy.roleSettingsSteps)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.editRoleLayout }),
    ).toBeInTheDocument();
  });
});
