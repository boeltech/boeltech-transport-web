import { describe, expect, it } from "vitest";
import { shellCopy } from "../copy/tripDetail/shellCopy";
import {
  resolveTripAccessDeniedCopy,
  resolveTripWayfindingBackLabel,
} from "./tripWayfinding";

describe("resolveTripWayfindingBackLabel", () => {
  it("label Volver a aprobaciones desde la bandeja", () => {
    expect(
      resolveTripWayfindingBackLabel(
        "/finance/approvals?type=trip_expense&status=pending",
      ),
    ).toBe(shellCopy.state.backToApprovals);
  });

  it("label Volver a Viajes en el listado", () => {
    expect(resolveTripWayfindingBackLabel("/trips?status=in_progress")).toBe(
      shellCopy.state.backToList,
    );
  });

  it("label Volver al envío / a envíos desde facturación", () => {
    expect(
      resolveTripWayfindingBackLabel("/finance/dispatch/run-1"),
    ).toBe(shellCopy.state.backToDispatchRun);
    expect(
      resolveTripWayfindingBackLabel("/finance/dispatch?tab=sent"),
    ).toBe(shellCopy.state.backToDispatch);
    expect(
      resolveTripWayfindingBackLabel("/finance/dispatch/period"),
    ).toBe(shellCopy.state.backToDispatchPeriod);
  });

  it("label Volver al pago desde liquidaciones", () => {
    expect(
      resolveTripWayfindingBackLabel(
        "/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15",
      ),
    ).toBe(shellCopy.state.backToSettlementPayment);
    expect(
      resolveTripWayfindingBackLabel(
        "/finance/settlements/11111111-1111-4111-8111-111111111111",
      ),
    ).toBe(shellCopy.state.backToSettlementPayment);
    expect(
      resolveTripWayfindingBackLabel("/finance/settlements/pending-approval"),
    ).toBe(shellCopy.state.backToList);
  });
});

describe("resolveTripAccessDeniedCopy", () => {
  it("cliente: no es tuyo o pide vínculo; back a Mis envíos", () => {
    const denied = resolveTripAccessDeniedCopy(false, true);
    expect(denied.description).toBe(
      shellCopy.state.accessDeniedDescriptionClient,
    );
    expect(denied.backLabel).toBe(shellCopy.state.backToListClient);
  });

  it("conductor conserva copy propio", () => {
    const denied = resolveTripAccessDeniedCopy(true);
    expect(denied.description).toBe(
      shellCopy.state.accessDeniedDescriptionDriver,
    );
    expect(denied.backLabel).toBe(shellCopy.state.backToListDriver);
  });
});
