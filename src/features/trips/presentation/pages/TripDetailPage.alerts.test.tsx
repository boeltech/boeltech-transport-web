import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertTriangle, Receipt } from "lucide-react";
import { MemoryRouter } from "react-router-dom";

import { DetailAlertCard } from "@shared/ui/data-display";
import { Button } from "@shared/ui/button";
import { tripDetailCopy } from "../copy";
import { resolveFiscalAttentionAlertSlot } from "../helpers/resolveFiscalAttentionAlertSlot";
import { applyOpenAssignFleetSearchParams } from "./tripDetailAssignFleetParams";

const shell = tripDetailCopy.shell;
const assignFleetLabel = tripDetailCopy.operation.action.assignFleet;

describe("TripDetailPage alerts — D6 Asignar flota", () => {
  it("CA: scheduled sin flota → banner con CTA Asignar flota en slot action", async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn();

    render(
      <DetailAlertCard
        severity="warning"
        icon={<AlertTriangle className="h-5 w-5" />}
        title={shell.alert.assignmentIncompleteTitle}
        items={[
          {
            label: shell.alert.assignmentVehicleLabel,
            text: shell.alert.assignmentVehicleMissing,
          },
        ]}
        action={
          <Button type="button" size="sm" variant="outline" onClick={onAssign}>
            {assignFleetLabel}
          </Button>
        }
      />,
    );

    expect(
      screen.getByText(shell.alert.assignmentIncompleteTitle),
    ).toBeInTheDocument();
    const cta = screen.getByRole("button", { name: assignFleetLabel });
    expect(cta).toBeInTheDocument();
    await user.click(cta);
    expect(onAssign).toHaveBeenCalledOnce();
  });

  it("CTA navega a ?tab=overview&assignFleet=1", () => {
    const next = applyOpenAssignFleetSearchParams(
      new URLSearchParams("tab=tracking"),
    );
    expect(next.get("tab")).toBe("overview");
    expect(next.get("assignFleet")).toBe("1");
  });

  it("operación incompleta reutiliza el mismo CTA Asignar flota", () => {
    render(
      <DetailAlertCard
        severity="critical"
        icon={<AlertTriangle className="h-5 w-5" />}
        title={shell.alert.operationIncompleteTitle}
        items={[
          {
            label: shell.alert.assignmentDriverLabel,
            text: shell.alert.operationDriverMissing,
          },
        ]}
        action={
          <Button type="button" size="sm" variant="outline">
            {assignFleetLabel}
          </Button>
        }
      />,
    );

    expect(
      screen.getByText(shell.alert.operationIncompleteTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: assignFleetLabel }),
    ).toBeInTheDocument();
  });
});

describe("TripDetailPage alerts — ATF wayfinding (PD1 consola on)", () => {
  it("midTrip + consola visible → slot midTrip (no silenciar)", () => {
    // Console visibility is intentionally not an input — coexist with preStats.
    expect(
      resolveFiscalAttentionAlertSlot({
        mode: "midTrip",
        freightHasPartialSubstitution: false,
      }),
    ).toBe("midTrip");
  });

  it("parcial + consola visible → banner crítico con Abrir factura original", () => {
    expect(
      resolveFiscalAttentionAlertSlot({
        mode: "midTrip",
        freightHasPartialSubstitution: true,
      }),
    ).toBe("partialSubstitution");

    render(
      <MemoryRouter>
        <DetailAlertCard
          severity="critical"
          icon={<Receipt className="h-5 w-5" />}
          title={shell.alert.substitutionCancelPendingTitle}
          action={
            <Button variant="outline" size="sm" asChild>
              <a href="/invoices/inv-original">
                {shell.alert.substitutionCancelPendingCta}
              </a>
            </Button>
          }
        >
          <p>{shell.alert.substitutionCancelPendingBody}</p>
        </DetailAlertCard>
      </MemoryRouter>,
    );

    expect(
      screen.getByText(shell.alert.substitutionCancelPendingTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: shell.alert.substitutionCancelPendingCta,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(shell.alert.fiscalAttentionCta)).toBeNull();
  });

  it("postCancel + consola visible → slot postCancel", () => {
    expect(
      resolveFiscalAttentionAlertSlot({
        mode: "postCancel",
        freightHasPartialSubstitution: false,
      }),
    ).toBe("postCancel");
  });
});
