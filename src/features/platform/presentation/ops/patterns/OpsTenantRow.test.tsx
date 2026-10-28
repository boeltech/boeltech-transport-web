import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "../opsTokens.css";
import { OpsButton } from "../ui/OpsButton";
import { OpsTenantRow } from "./OpsTenantRow";

function renderRow(props: Partial<ComponentProps<typeof OpsTenantRow>> = {}) {
  return render(
    <div className="platform-ops">
      <OpsTenantRow
        idLabel="a1b2"
        name="Demo Transportes"
        planName="Control"
        lifecycleLabel="Activa"
        lifecycleTone="ok"
        time="2026-10-27 16:40"
        {...props}
      />
    </div>,
  );
}

describe("OpsTenantRow", () => {
  it("renders id, name, seals and time with one tick", () => {
    renderRow({ tick: "warn", lifecycleTone: "warn", lifecycleLabel: "En riesgo" });

    const row = screen.getByTestId("ops-tenant-row");
    expect(row).toHaveAttribute("data-ops-tick", "warn");
    expect(row).toHaveTextContent("a1b2");
    expect(row).toHaveTextContent("Demo Transportes");
    expect(row).toHaveTextContent("Control");
    expect(row).toHaveTextContent("En riesgo");
    expect(row).toHaveTextContent("2026-10-27 16:40");
    expect(row.querySelector("[data-ops-plan-seal]")).toBeInTheDocument();
    expect(row.querySelector("[data-ops-lifecycle-seal]")).toHaveAttribute(
      "data-tone",
      "warn",
    );
    expect(row.querySelector("button")).not.toBeInTheDocument();
  });

  it("omits the tick and renders the mutation slot when provided", () => {
    renderRow({
      action: (
        <OpsButton variant="danger" size="sm">
          Suspender
        </OpsButton>
      ),
    });

    const row = screen.getByTestId("ops-tenant-row");
    expect(row).not.toHaveAttribute("data-ops-tick");
    expect(screen.getByRole("button", { name: "Suspender" })).toBeInTheDocument();
  });
});
