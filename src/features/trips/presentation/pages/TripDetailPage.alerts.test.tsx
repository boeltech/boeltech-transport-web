import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertTriangle } from "lucide-react";

import { DetailAlertCard } from "@shared/ui/data-display";
import { Button } from "@shared/ui/button";
import { tripDetailCopy } from "../copy";
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
