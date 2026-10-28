import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  PlatformLifecycleStage,
  PlatformTenantStatus,
} from "../../../domain/entities";
import { getLifecycleStageLabel } from "../../config/platformLifecycleConfig";
import "../opsTokens.css";
import { OpsHubHeader } from "./OpsHubHeader";
import { OpsButton } from "../ui/OpsButton";

describe("OpsHubHeader", () => {
  it("shows the name once, seals in order, and no status strip", () => {
    const { container } = render(
      <MemoryRouter>
        <div className="platform-ops">
          <OpsHubHeader
            tenantName="Acme Transport"
            subdomain="acme"
            tenantIdShort="abcd1234"
            accessStatus={PlatformTenantStatus.ACTIVE}
            lifecycleStage={PlatformLifecycleStage.AT_RISK}
            planCode="CTRL"
            planName="Control"
            pastDueLabel="Sigue operando · cobro pendiente"
            actions={<OpsButton variant="ghost">Cambiar plan</OpsButton>}
          />
        </div>
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Acme Transport")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { level: 1, name: "Acme Transport" }),
    ).toBeInTheDocument();
    expect(screen.getByText("acme")).toHaveClass("ops-font-mono");
    expect(screen.getByText("abcd1234")).toHaveClass("ops-font-mono");
    expect(screen.queryByTestId("ops-hub-semaphore-strip")).not.toBeInTheDocument();
    expect(container.querySelector(".ops-semaphore-dot")).toBeNull();
    expect(container.querySelector(".ops-hub-status-strip")).toBeNull();
    expect(screen.queryByText("Suscripción")).not.toBeInTheDocument();
    expect(screen.queryByText("Etapa")).not.toBeInTheDocument();
    expect(screen.queryByText("Acceso")).not.toBeInTheDocument();

    const seals = screen.getByTestId("ops-hub-seals");
    const nodes = Array.from(seals.children);
    expect(nodes[0]).toHaveAttribute("data-ops-plan-seal");
    expect(nodes[0]).toHaveTextContent("CTRL");
    expect(nodes[0]).not.toHaveTextContent("Control");
    expect(nodes[1]).toHaveAttribute("data-ops-lifecycle-seal");
    expect(nodes[1]).toHaveTextContent(
      getLifecycleStageLabel(PlatformLifecycleStage.AT_RISK),
    );
    expect(nodes[2]).toHaveAttribute("data-ops-badge", "ok");
    expect(nodes[2]).toHaveTextContent("Activo");

    expect(
      screen.getByText("Sigue operando · cobro pendiente").closest("[data-ops-tick]"),
    ).toHaveAttribute("data-ops-tick", "warn");
    expect(screen.getByRole("button", { name: "Cambiar plan" })).toHaveAttribute(
      "data-ops-button",
      "ghost",
    );
  });

  it("prints the commercial name when there is no plan code", () => {
    render(
      <MemoryRouter>
        <div className="platform-ops">
          <OpsHubHeader
            tenantName="Acme Transport"
            subdomain="acme"
            tenantIdShort="abcd1234"
            accessStatus={PlatformTenantStatus.SUSPENDED}
            lifecycleStage={PlatformLifecycleStage.ACTIVE}
            planName="Control"
          />
        </div>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("ops-hub-seals").querySelector("[data-ops-plan-seal]")).toHaveTextContent(
      "Control",
    );
    expect(screen.getByText("Suspendido")).toHaveAttribute("data-ops-badge", "danger");
    expect(screen.queryByText("Sigue operando · cobro pendiente")).not.toBeInTheDocument();
  });
});
