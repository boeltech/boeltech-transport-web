import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { billingSchemesCopy } from "../copy/billingSchemesCopy";

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
    description?: ReactNode;
  }) => (
    <div
      data-testid="settings-page-shell"
      data-section={sectionTitle ?? ""}
      data-title={title ?? ""}
    >
      <div data-testid="settings-page-description">{description}</div>
      {children}
    </div>
  ),
}));

vi.mock("../components/BillingSchemesCompactCard", () => ({
  BillingSchemesCompactCard: () => <div data-testid="billing-schemes-card" />,
}));

import { BillingSchemesPage } from "./BillingSchemesPage";

const copy = billingSchemesCopy.page;

describe("BillingSchemesPage (F4)", () => {
  it("monta SettingsPageShell con título patio y atajo a Correo del periodo", () => {
    render(
      <MemoryRouter>
        <BillingSchemesPage />
      </MemoryRouter>,
    );

    const shell = screen.getByTestId("settings-page-shell");
    expect(shell).toHaveAttribute("data-section", copy.title);
    expect(shell).toHaveAttribute("data-title", copy.title);
    expect(copy.title).toBe("Frecuencias de envío");

    expect(
      screen.getByRole("link", { name: copy.periodMailCta }),
    ).toHaveAttribute("href", copy.periodMailHref);

    expect(screen.getByTestId("billing-schemes-card")).toBeInTheDocument();
  });
});
