import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../opsTokens.css";
import {
  OpsAlert,
  OpsButton,
  OpsCheckbox,
  OpsCommand,
  OpsCommandEmpty,
  OpsCommandInput,
  OpsCommandItem,
  OpsCommandList,
  OpsPortalHost,
  OpsRadio,
  OpsRadioGroup,
  OpsSpinner,
  OpsSwitch,
  OpsTable,
  OpsTableBody,
  OpsTableCell,
  OpsTableEllipsis,
  OpsTablePrimary,
  OpsTableRow,
  OpsTableStatus,
} from "./index";

function OpsDemoShell({ children }: { children: ReactNode }) {
  return (
    <div className="platform-ops" data-ops-shell="true" data-testid="ops-demo">
      <OpsPortalHost>{children}</OpsPortalHost>
    </div>
  );
}

describe("Ops primitives F2 (Primer denso)", () => {
  it("exposes solid / outline / ghost / danger and loading on OpsButton", () => {
    render(
      <OpsDemoShell>
        <OpsButton variant="solid">Solid</OpsButton>
        <OpsButton variant="outline">Outline</OpsButton>
        <OpsButton variant="ghost">Ghost</OpsButton>
        <OpsButton variant="danger">Danger</OpsButton>
        <OpsButton variant="outline" loading>
          Guardando
        </OpsButton>
        <OpsButton variant="primary">Primary alias</OpsButton>
      </OpsDemoShell>,
    );

    expect(screen.getByRole("button", { name: "Solid" })).toHaveAttribute(
      "data-ops-button",
      "solid",
    );
    expect(screen.getByRole("button", { name: "Outline" })).toHaveAttribute(
      "data-ops-button",
      "outline",
    );
    expect(screen.getByRole("button", { name: "Ghost" })).toHaveAttribute(
      "data-ops-button",
      "ghost",
    );
    expect(screen.getByRole("button", { name: "Danger" })).toHaveAttribute(
      "data-ops-button",
      "danger",
    );
    expect(screen.getByRole("button", { name: "Primary alias" })).toHaveAttribute(
      "data-ops-button",
      "primary",
    );

    const loading = screen.getByRole("button", { name: /Guardando/ });
    expect(loading).toBeDisabled();
    expect(loading).toHaveAttribute("data-loading", "true");
    expect(loading).toHaveAttribute("aria-busy", "true");
    expect(loading.querySelector("[data-ops-spinner]")).toBeTruthy();
  });

  it("renders OpsAlert notice with dismiss", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <OpsDemoShell>
        <OpsAlert tone="notice" title="Aviso" onDismiss={onDismiss}>
          Banner notice
        </OpsAlert>
      </OpsDemoShell>,
    );

    const alert = screen.getByTestId("ops-alert");
    expect(alert).toHaveAttribute("data-tone", "notice");
    expect(alert).toHaveAttribute("role", "status");
    expect(screen.getByText("Aviso")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Descartar" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("exports checkbox, radio group, switch and spinner", async () => {
    const user = userEvent.setup();
    const onSwitch = vi.fn();
    render(
      <OpsDemoShell>
        <OpsCheckbox label="Acepto" />
        <OpsRadioGroup legend="Modo">
          <OpsRadio name="modo" value="a" label="A" defaultChecked />
          <OpsRadio name="modo" value="b" label="B" />
        </OpsRadioGroup>
        <OpsSwitch label="Auto" onCheckedChange={onSwitch} />
        <OpsSpinner variant="inline" size="sm" />
        <OpsSpinner variant="block" label="Bloque" />
      </OpsDemoShell>,
    );

    expect(screen.getByLabelText("Acepto")).toHaveAttribute("data-ops-checkbox", "");
    expect(screen.getByRole("group", { name: "Modo" })).toBeInTheDocument();
    expect(screen.getByLabelText("A")).toBeChecked();
    await user.click(screen.getByLabelText("B"));
    expect(screen.getByLabelText("B")).toBeChecked();

    const sw = screen.getByRole("switch", { name: "Auto" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    await user.click(sw);
    expect(onSwitch).toHaveBeenCalledWith(true);

    expect(screen.getByLabelText("Cargando")).toHaveAttribute(
      "data-ops-spinner",
      "inline",
    );
    expect(screen.getByLabelText("Bloque")).toHaveAttribute(
      "data-ops-spinner",
      "block",
    );
  });

  it("supports table status, primary meta and ellipsis", () => {
    render(
      <OpsDemoShell>
        <OpsTable>
          <OpsTableBody>
            <OpsTableRow>
              <OpsTableCell>
                <div className="ops-table-cell-lead">
                  <OpsTableStatus tone="ok" label="ok" />
                  <OpsTablePrimary title="deploy" meta="main" />
                </div>
              </OpsTableCell>
              <OpsTableCell>
                <OpsTableEllipsis />
              </OpsTableCell>
            </OpsTableRow>
          </OpsTableBody>
        </OpsTable>
      </OpsDemoShell>,
    );

    expect(screen.getByTitle("ok")).toHaveAttribute("data-ops-table-status", "ok");
    expect(screen.getByText("deploy")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Más acciones" })).toHaveAttribute(
      "data-ops-table-ellipsis",
      "",
    );
  });

  it("renders OpsCommand input list and empty", () => {
    render(
      <OpsDemoShell>
        <OpsCommand>
          <OpsCommandInput placeholder="Buscar…" />
          <OpsCommandList>
            <OpsCommandEmpty>Sin resultados</OpsCommandEmpty>
            <OpsCommandItem value="hoy">Hoy</OpsCommandItem>
          </OpsCommandList>
        </OpsCommand>
      </OpsDemoShell>,
    );

    expect(screen.getByTestId("ops-command")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Buscar…")).toBeInTheDocument();
    expect(screen.getByText("Hoy")).toBeInTheDocument();
  });
});
