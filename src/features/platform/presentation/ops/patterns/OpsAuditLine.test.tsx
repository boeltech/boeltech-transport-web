import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "../opsTokens.css";
import { OpsAuditLine } from "./OpsAuditLine";

describe("OpsAuditLine", () => {
  it("paints only a destructive verb and renders no icon", () => {
    render(
      <div className="platform-ops">
        <OpsAuditLine
          time="2026-10-27 16:40"
          actor="operador@boeltech"
          verb="Plan asignado"
          object="Demo Transportes"
        />
        <OpsAuditLine
          time="2026-10-27 09:12"
          actor="operador@boeltech"
          verb="Cobro anulado"
          object="Demo Transportes"
          destructive
        />
      </div>,
    );

    const lines = screen.getAllByTestId("ops-audit-line");
    expect(lines[0].querySelector("[data-destructive]")).toHaveAttribute(
      "data-destructive",
      "false",
    );
    expect(lines[1].querySelector(".ops-audit-verb")).toHaveAttribute(
      "data-destructive",
      "true",
    );
    expect(lines[1]).toHaveAttribute("data-ops-tick", "danger");
    expect(lines[0]).not.toHaveAttribute("data-ops-tick");
    expect(lines[0].querySelector("svg")).not.toBeInTheDocument();
    expect(lines[1].querySelector("svg")).not.toBeInTheDocument();
    expect(lines[1]).toHaveTextContent("Cobro anulado");
  });
});
