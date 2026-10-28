import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../opsTokens.css";
import {
  OpsBadge,
  OpsButton,
  OpsDialog,
  OpsDialogContent,
  OpsDialogDescription,
  OpsDialogFooter,
  OpsDialogHeader,
  OpsDialogTitle,
  OpsInput,
  OpsPanel,
  OpsPanelBody,
  OpsPanelHeader,
  OpsPanelTitle,
  OpsSheet,
  OpsSheetContent,
  OpsSheetDescription,
  OpsSheetHeader,
  OpsSheetTitle,
  OpsTable,
  OpsTableBody,
  OpsTableCell,
  OpsTableHead,
  OpsTableHeader,
  OpsTableRow,
  OpsPortalHost,
} from "./index";

function OpsDemoShell({ children }: { children: ReactNode }) {
  return (
    <div className="platform-ops" data-ops-shell="true" data-testid="ops-demo">
      <OpsPortalHost>{children}</OpsPortalHost>
    </div>
  );
}

describe("Ops UI kit (Ola 0)", () => {
  it("renders primitives under .platform-ops with ops tokens", () => {
    render(
      <OpsDemoShell>
        <OpsPanel>
          <OpsPanelHeader>
            <OpsPanelTitle>Demo panel</OpsPanelTitle>
          </OpsPanelHeader>
          <OpsPanelBody className="flex flex-wrap items-center gap-2">
            <OpsButton variant="primary">Primary</OpsButton>
            <OpsButton variant="ghost">Ghost</OpsButton>
            <OpsButton variant="danger">Danger</OpsButton>
            <OpsBadge tone="ok">Al día</OpsBadge>
            <OpsBadge tone="warn">Mora</OpsBadge>
            <OpsBadge tone="danger">Suspendido</OpsBadge>
            <OpsInput placeholder="Buscar…" aria-label="Demo input" />
          </OpsPanelBody>
        </OpsPanel>
        <OpsTable>
          <OpsTableHeader>
            <OpsTableRow>
              <OpsTableHead>Empresa</OpsTableHead>
              <OpsTableHead>Saldo</OpsTableHead>
            </OpsTableRow>
          </OpsTableHeader>
          <OpsTableBody>
            <OpsTableRow>
              <OpsTableCell>Acme</OpsTableCell>
              <OpsTableCell>$1,200</OpsTableCell>
            </OpsTableRow>
          </OpsTableBody>
        </OpsTable>
      </OpsDemoShell>,
    );

    const shell = screen.getByTestId("ops-demo");
    expect(shell).toHaveClass("platform-ops");
    expect(shell).toHaveAttribute("data-ops-shell", "true");
    expect(screen.getByTestId("ops-panel")).toBeInTheDocument();
    expect(screen.getByTestId("ops-section-rule")).toHaveTextContent("Demo panel");
    expect(screen.getByTestId("ops-table")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Primary" })).toHaveAttribute(
      "data-ops-button",
      "primary",
    );
    expect(screen.getByText("Al día")).toHaveAttribute("data-ops-badge", "ok");
    expect(screen.getByLabelText("Demo input")).toHaveAttribute(
      "data-ops-input",
      "",
    );
  });

  it("portals OpsSheet into #ops-portal-root under .platform-ops", async () => {
    const user = userEvent.setup();
    render(
      <OpsDemoShell>
        <OpsSheet open onOpenChange={() => undefined}>
          <OpsSheetContent>
            <OpsSheetHeader>
              <OpsSheetTitle>Sheet dark</OpsSheetTitle>
              <OpsSheetDescription>Portal ops</OpsSheetDescription>
            </OpsSheetHeader>
            <OpsButton variant="ghost">Cerrar demo</OpsButton>
          </OpsSheetContent>
        </OpsSheet>
      </OpsDemoShell>,
    );

    const content = await screen.findByTestId("ops-sheet-content");
    const portal = screen.getByTestId("ops-portal-root");
    expect(portal.contains(content)).toBe(true);
    expect(content.closest(".platform-ops")).toBeTruthy();
    expect(screen.getByText("Sheet dark")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cerrar demo" }));
  });

  it("portals OpsDialog (danger) into #ops-portal-root", async () => {
    render(
      <OpsDemoShell>
        <OpsDialog open onOpenChange={() => undefined}>
          <OpsDialogContent tone="danger">
            <OpsDialogHeader>
              <OpsDialogTitle>Suspender empresa</OpsDialogTitle>
              <OpsDialogDescription>
                Acción irreversible en consola Ops.
              </OpsDialogDescription>
            </OpsDialogHeader>
            <OpsDialogFooter>
              <OpsButton variant="danger">Confirmar</OpsButton>
            </OpsDialogFooter>
          </OpsDialogContent>
        </OpsDialog>
      </OpsDemoShell>,
    );

    const content = await screen.findByTestId("ops-dialog-content");
    expect(content).toHaveAttribute("data-tone", "danger");
    expect(screen.getByRole("heading", { name: "Suspender empresa" })).toHaveClass(
      "ops-type-title",
    );
    expect(screen.getByTestId("ops-portal-root").contains(content)).toBe(true);
  });
});
