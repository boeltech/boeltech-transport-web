import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "../opsTokens.css";
import { OpsLifecycleSeal } from "./OpsLifecycleSeal";
import { OpsPlanSeal } from "./OpsPlanSeal";

describe("OpsLifecycleSeal", () => {
  it("prints the stage word and keeps trial off the semaphore", () => {
    render(
      <div className="platform-ops">
        <OpsLifecycleSeal tone="ok">Activa</OpsLifecycleSeal>
        <OpsLifecycleSeal tone="warn">Cobro pendiente</OpsLifecycleSeal>
        <OpsLifecycleSeal tone="danger">Suspendida</OpsLifecycleSeal>
        <OpsLifecycleSeal tone="trial">En prueba</OpsLifecycleSeal>
      </div>,
    );

    expect(screen.getByText("Activa")).toHaveAttribute("data-tone", "ok");
    expect(screen.getByText("Cobro pendiente")).toHaveAttribute(
      "data-tone",
      "warn",
    );
    expect(screen.getByText("Suspendida")).toHaveAttribute(
      "data-tone",
      "danger",
    );
    const trial = screen.getByText("En prueba");
    expect(trial).toHaveAttribute("data-tone", "trial");
    expect(trial.className).not.toMatch(/ops-text-lime|ops-badge-ok/);
  });
});

describe("OpsPlanSeal", () => {
  it("shows the plan code in mono and a dash when missing", () => {
    render(
      <div className="platform-ops">
        <OpsPlanSeal name="Control" />
        <OpsPlanSeal name={null} />
      </div>,
    );

    expect(screen.getByText("Control")).toHaveClass("ops-plan-seal");
    expect(screen.getByText("—")).toHaveAttribute("data-empty", "true");
  });

  it("prints code when present and keeps the name otherwise", () => {
    render(
      <div className="platform-ops">
        <OpsPlanSeal code="CTRL" name="Control" />
        <OpsPlanSeal name="Ruta" />
      </div>,
    );

    expect(screen.getByText("CTRL")).toBeInTheDocument();
    expect(screen.queryByText("Control")).not.toBeInTheDocument();
    expect(screen.getByText("Ruta")).toBeInTheDocument();
  });
});
