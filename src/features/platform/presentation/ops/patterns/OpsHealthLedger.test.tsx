import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "../opsTokens.css";
import { OpsHealthLedger } from "./OpsHealthLedger";

const signals = [
  { key: "fiscal", name: "Fiscal", value: 80, weightLabel: "20%" },
  { key: "payment", name: "Pago", value: 55, weightLabel: "20%" },
  { key: "adoption", name: "Adopción", value: 10, weightLabel: "20%" },
  { key: "fleet", name: "Flota", value: 90, weightLabel: "20%" },
  { key: "engagement", name: "Engagement", value: 40, weightLabel: "20%" },
] as const;

function renderLedger(score: number | null, asOfLabel: string | null = "Actualizado hoy") {
  return render(
    <div className="platform-ops">
      <OpsHealthLedger
        score={score}
        asOfLabel={asOfLabel}
        pendingLabel="Sin score aún (primer refresh pendiente)."
        signals={signals}
      />
    </div>,
  );
}

describe("OpsHealthLedger", () => {
  it("reads a null score as an em dash, not as risk", () => {
    renderLedger(null);
    const score = screen.getByTestId("ops-health-score");
    expect(score).toHaveTextContent("—");
    expect(score).toHaveClass("ops-text-muted");
    expect(score).toHaveAttribute("data-ops-health-tone", "muted");
  });

  it("tones only the number at 40 and 70", () => {
    const { rerender } = renderLedger(39);
    expect(screen.getByTestId("ops-health-score")).toHaveAttribute(
      "data-ops-health-tone",
      "danger",
    );

    rerender(
      <div className="platform-ops">
        <OpsHealthLedger
          score={40}
          asOfLabel="Actualizado hoy"
          pendingLabel="Sin score aún (primer refresh pendiente)."
          signals={signals}
        />
      </div>,
    );
    expect(screen.getByTestId("ops-health-score")).toHaveAttribute(
      "data-ops-health-tone",
      "warn",
    );

    rerender(
      <div className="platform-ops">
        <OpsHealthLedger
          score={69}
          asOfLabel="Actualizado hoy"
          pendingLabel="Sin score aún (primer refresh pendiente)."
          signals={signals}
        />
      </div>,
    );
    expect(screen.getByTestId("ops-health-score")).toHaveAttribute(
      "data-ops-health-tone",
      "warn",
    );

    rerender(
      <div className="platform-ops">
        <OpsHealthLedger
          score={70}
          asOfLabel="Actualizado hoy"
          pendingLabel="Sin score aún (primer refresh pendiente)."
          signals={signals}
        />
      </div>,
    );
    expect(screen.getByTestId("ops-health-score")).toHaveClass("ops-text-ok");
    expect(screen.getByTestId("ops-health-score")).not.toHaveClass("ops-text-lime");
  });

  it("lists five signals without color or a bar", () => {
    const { container } = renderLedger(82);
    const rows = container.querySelectorAll(".ops-health-signal");
    expect(rows).toHaveLength(5);
    for (const row of rows) {
      expect(row).not.toHaveAttribute("data-ops-tick");
      expect(row.className).not.toMatch(/lime|ops-text-ok|ops-text-warn|ops-text-danger/);
      expect(row.querySelector(".ops-health-signal-value")).toHaveClass(
        "ops-health-signal-value",
      );
      expect(row.querySelector(".ops-health-signal-weight")).toHaveClass(
        "ops-health-signal-weight",
      );
    }
    expect(container.querySelector(".ops-text-lime")).toBeNull();
    expect(container.querySelector("[style*='width']")).toBeNull();
    expect(screen.getByText("Actualizado hoy")).toBeInTheDocument();
  });

  it("uses the pending phrase when there is no asOf", () => {
    renderLedger(null, null);
    expect(
      screen.getByText("Sin score aún (primer refresh pendiente)."),
    ).toBeInTheDocument();
  });
});
