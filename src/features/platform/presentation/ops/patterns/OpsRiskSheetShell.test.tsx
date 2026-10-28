import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "../opsTokens.css";
import { OpsRiskSheetShell } from "./OpsRiskSheetShell";

describe("OpsRiskSheetShell (L2 M2)", () => {
  it("marks danger header with tick token attribute", () => {
    render(
      <div className="platform-ops">
        <OpsRiskSheetShell
          open
          onOpenChange={vi.fn()}
          tone="danger"
          title="Suspender empresa"
          testId="ops-risk-shell"
        >
          <p>body</p>
        </OpsRiskSheetShell>
      </div>,
    );

    const header = screen.getByText("Suspender empresa").closest(".ops-risk-header");
    expect(header).toHaveAttribute("data-tone", "danger");
    expect(header).toHaveAttribute("data-ops-tick", "danger");
  });
});
