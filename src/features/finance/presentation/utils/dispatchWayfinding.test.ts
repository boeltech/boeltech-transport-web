import { describe, expect, it } from "vitest";
import {
  FINANCE_DISPATCH_PATH,
  FINANCE_DISPATCH_PERIOD_PATH,
} from "../../application/financeRoutes";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import {
  isFinanceDispatchPeriodHref,
  isFinanceDispatchWorkbenchHref,
  resolveDispatchRunBackHref,
  resolveDispatchRunBackLabel,
  resolvePeriodListBackHref,
} from "./dispatchWayfinding";

describe("dispatchWayfinding", () => {
  it("reconoce workbench y periodo, no el detalle", () => {
    expect(isFinanceDispatchWorkbenchHref(FINANCE_DISPATCH_PATH)).toBe(true);
    expect(
      isFinanceDispatchWorkbenchHref(`${FINANCE_DISPATCH_PATH}?tab=sent`),
    ).toBe(true);
    expect(isFinanceDispatchPeriodHref(FINANCE_DISPATCH_PERIOD_PATH)).toBe(
      true,
    );
    expect(
      isFinanceDispatchPeriodHref(`${FINANCE_DISPATCH_PERIOD_PATH}?dispatch_status=cancelled`),
    ).toBe(true);
    expect(
      isFinanceDispatchWorkbenchHref("/finance/dispatch/run-1"),
    ).toBe(false);
    expect(isFinanceDispatchPeriodHref("/finance/dispatch/run-1")).toBe(false);
  });

  it("vuelve al workbench, al listado o a la factura según from", () => {
    expect(
      resolveDispatchRunBackHref(`${FINANCE_DISPATCH_PATH}?tab=sent`),
    ).toBe(`${FINANCE_DISPATCH_PATH}?tab=sent`);
    expect(resolveDispatchRunBackLabel(`${FINANCE_DISPATCH_PATH}?tab=sent`)).toBe(
      dispatchRunsCopy.detail.backToWorkbench,
    );
    expect(
      resolveDispatchRunBackHref(
        `${FINANCE_DISPATCH_PERIOD_PATH}?dispatch_status=cancelled`,
      ),
    ).toBe(`${FINANCE_DISPATCH_PERIOD_PATH}?dispatch_status=cancelled`);
    expect(resolveDispatchRunBackLabel(
      `${FINANCE_DISPATCH_PERIOD_PATH}?dispatch_status=cancelled`,
    )).toBe(dispatchRunsCopy.detail.backToList);
    expect(resolveDispatchRunBackHref("/invoices/inv-1")).toBe("/invoices/inv-1");
    expect(resolveDispatchRunBackLabel("/invoices/inv-1")).toBe(
      dispatchRunsCopy.detail.backToInvoice,
    );
    expect(resolveDispatchRunBackHref(undefined)).toBe(
      FINANCE_DISPATCH_PERIOD_PATH,
    );
    expect(resolveDispatchRunBackLabel(undefined)).toBe(
      dispatchRunsCopy.detail.backToList,
    );
  });

  it("del listado solo vuelve a Envíos si venía del workbench puntual", () => {
    expect(resolvePeriodListBackHref(undefined)).toBeNull();
    expect(resolvePeriodListBackHref(FINANCE_DISPATCH_PERIOD_PATH)).toBeNull();
    expect(
      resolvePeriodListBackHref(`${FINANCE_DISPATCH_PATH}?tab=sent`),
    ).toBe(`${FINANCE_DISPATCH_PATH}?tab=sent`);
  });
});
