import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "../opsTokens.css";
import { OpsKpiStrip } from "./OpsKpiStrip";

function OpsShell({ children }: { children: ReactNode }) {
  return (
    <div className="platform-ops" data-ops-shell="true" data-ops-theme="light">
      {children}
    </div>
  );
}

describe("OpsKpiStrip (M6 · Mando acero)", () => {
  it("renders four cells with labels, values and captions", () => {
    render(
      <OpsShell>
        <OpsKpiStrip
          cells={[
            {
              id: "mora",
              label: "Mora abierta",
              value: "$36.6k",
              caption: "4 empresas · cobro pendiente",
              tone: "warn",
            },
            {
              id: "suspended",
              label: "Suspendidos",
              value: 2,
              caption: "Acceso cortado",
              tone: "danger",
            },
            {
              id: "activation",
              label: "Activación",
              value: 3,
              caption: "Admin pendiente",
            },
            {
              id: "trial",
              label: "Trial",
              value: 5,
              caption: "≤ 7 días restantes",
            },
          ]}
        />
      </OpsShell>,
    );

    const strip = screen.getByTestId("ops-kpi-strip");
    expect(strip).toHaveAttribute("role", "group");
    expect(strip).toHaveAttribute("aria-label", "Indicadores");
    expect(screen.getByText("Mora abierta")).toBeInTheDocument();
    expect(screen.getByTestId("ops-kpi-value-mora")).toHaveAttribute(
      "data-tone",
      "warn",
    );
    expect(screen.getByTestId("ops-kpi-value-suspended")).toHaveAttribute(
      "data-tone",
      "danger",
    );
    expect(screen.getByTestId("ops-kpi-value-activation")).not.toHaveAttribute(
      "data-tone",
    );
    expect(screen.getByText("≤ 7 días restantes")).toBeInTheDocument();
  });
});
