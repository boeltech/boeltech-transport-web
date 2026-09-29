import { describe, expect, it } from "vitest";
import {
  APPROVALS_INBOX_PATH,
  buildApprovalsInboxPath,
  isApprovalsInboxHref,
} from "./approvalsInboxPath";

describe("approvalsInboxPath", () => {
  it("arma la bandeja canónica sin el tab legacy de /finance", () => {
    expect(
      buildApprovalsInboxPath({
        type: "trip_expense",
        status: "pending",
        tripId: "trip-1",
        tripCode: "V-1",
      }),
    ).toBe(
      "/finance/approvals?type=trip_expense&status=pending&tripId=trip-1&tripCode=V-1",
    );
    expect(buildApprovalsInboxPath()).toBe(APPROVALS_INBOX_PATH);
  });

  it("reconoce hrefs de la bandeja", () => {
    expect(isApprovalsInboxHref("/finance/approvals?type=trip_expense")).toBe(
      true,
    );
    expect(isApprovalsInboxHref("/finance?tab=approvals")).toBe(false);
    expect(isApprovalsInboxHref("/trips/abc")).toBe(false);
  });
});
