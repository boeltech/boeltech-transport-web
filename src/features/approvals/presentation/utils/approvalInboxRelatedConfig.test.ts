import { describe, expect, it } from "vitest";
import {
  SETTLEMENTS_ADVANCES_PATH,
  SETTLEMENTS_LIST_PATH,
  settlementsPendingApprovalPath,
} from "@features/settlements/application/settlementsRoutes";
import { approvalsCopy } from "../copy/approvalsCopy";
import { resolveApprovalInboxRelatedConfig } from "./approvalInboxRelatedConfig";

const related = approvalsCopy.inbox.related;

describe("resolveApprovalInboxRelatedConfig", () => {
  it("anticipo → Anticipos", () => {
    expect(resolveApprovalInboxRelatedConfig("driver_advance_request")).toEqual(
      {
        label: related.advances.label,
        href: SETTLEMENTS_ADVANCES_PATH,
        description: related.advances.description,
      },
    );
  });

  it("liquidación → En autorización", () => {
    expect(
      resolveApprovalInboxRelatedConfig("internal_staff_compensation"),
    ).toEqual({
      label: related.pendingApproval.label,
      href: settlementsPendingApprovalPath(),
      description: related.pendingApproval.description,
    });
  });

  it("gasto u otro → Pagos a operadores", () => {
    expect(resolveApprovalInboxRelatedConfig("trip_expense")).toEqual({
      label: related.operatorPayments.label,
      href: SETTLEMENTS_LIST_PATH,
      description: related.operatorPayments.description,
    });
  });
});
