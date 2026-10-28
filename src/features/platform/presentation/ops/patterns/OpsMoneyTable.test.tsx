import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "../opsTokens.css";
import { opsCopy } from "../opsCopy";
import {
  OpsArStatusBadge,
  OpsArStatusCluster,
  OpsAutoChargeBadge,
  OpsMoneyAmount,
  OpsMoneyTable,
  OpsMoneyTableBody,
  OpsMoneyTableCell,
  OpsMoneyTableHead,
  OpsMoneyTableHeader,
  OpsMoneyTableRow,
} from "./OpsMoneyTable";

describe("OpsMoneyTable (L2 M3)", () => {
  it("renders dense money table without ERP Card / Badge", () => {
    const { container } = render(
      <div className="platform-ops">
        <OpsMoneyTable>
          <OpsMoneyTableHeader>
            <OpsMoneyTableRow>
              <OpsMoneyTableHead>Mes</OpsMoneyTableHead>
              <OpsMoneyTableHead>Estado</OpsMoneyTableHead>
            </OpsMoneyTableRow>
          </OpsMoneyTableHeader>
          <OpsMoneyTableBody>
            <OpsMoneyTableRow>
              <OpsMoneyTableCell>2026-07</OpsMoneyTableCell>
              <OpsMoneyTableCell>
                <OpsArStatusCluster
                  status="paid"
                  origin="auto_period_issue"
                  chargeKind="charged"
                />
              </OpsMoneyTableCell>
            </OpsMoneyTableRow>
          </OpsMoneyTableBody>
        </OpsMoneyTable>
      </div>,
    );

    expect(screen.getByTestId("ops-money-table")).toBeInTheDocument();
    expect(container.querySelector(".bg-card")).toBeNull();
    expect(container.querySelector("[data-ops-badge]")).toBeTruthy();
    expect(screen.getByText("Pagado")).toHaveAttribute(
      "data-ops-ar-status",
      "paid",
    );
    expect(screen.getByText("Auto-emitido")).toHaveAttribute(
      "data-ops-ar-origin",
      "auto",
    );
    expect(screen.queryByText("Cobrado")).not.toBeInTheDocument();
  });

  it("renders mono amount right-aligned with muted MXN", () => {
    render(
      <div className="platform-ops">
        <OpsMoneyAmount cents={1240000} />
      </div>,
    );

    const amount = screen.getByTestId("ops-money-amount");
    expect(amount).toHaveClass("ops-money-amount");
    expect(amount.querySelector(".ops-font-mono")).toBeTruthy();
    expect(screen.getByText(opsCopy.money.currency)).toHaveClass(
      "ops-money-currency",
    );
    expect(screen.getByText(opsCopy.money.currency)).toHaveClass(
      "ops-text-muted",
    );
  });

  it("prints zero in ink and a dash when the amount is missing", () => {
    render(
      <div className="platform-ops">
        <OpsMoneyAmount cents={0} />
        <OpsMoneyAmount cents={null} />
      </div>,
    );

    const amounts = screen.getAllByTestId("ops-money-amount");
    expect(amounts[0]).toHaveAttribute("data-zero", "true");
    expect(amounts[0].querySelector(".ops-text")).toHaveTextContent(/0[.,]00/);
    expect(amounts[0]).not.toHaveClass("ops-text-muted");
    expect(amounts[1]).toHaveClass("ops-text-muted");
    expect(amounts[1]).toHaveTextContent("—");
  });

  it("reads an open charge in ink and keeps a single auto-charge signal", () => {
    render(
      <div className="platform-ops">
        <OpsArStatusBadge status="open" />
        <OpsArStatusBadge status="draft" />
        <OpsArStatusBadge status="void" />
        <OpsArStatusCluster status="open" chargeKind="charged" />
        <OpsAutoChargeBadge kind="processing" />
        <OpsArStatusCluster
          status="paid"
          chargeKind="charged"
        />
      </div>,
    );

    const openBadges = screen.getAllByText("Pendiente");
    for (const badge of openBadges) {
      expect(badge).toHaveAttribute("data-ops-badge", "default");
      expect(badge).not.toHaveAttribute("data-ops-tick");
    }
    expect(screen.getByText("Borrador")).toHaveAttribute("data-ops-badge", "muted");
    expect(screen.getByText("Anulado")).toHaveAttribute("data-ops-badge", "muted");
    expect(screen.getAllByText("Cobrado")).toHaveLength(1);
    expect(screen.getByText("Cobrado")).toHaveAttribute("data-ops-ar-charge", "charged");
    expect(screen.getByText("Procesando")).toHaveAttribute("data-ops-badge", "default");
    expect(screen.queryByText(/Atrasad/)).not.toBeInTheDocument();
  });
});
