import { describe, expect, it, vi } from "vitest";
import type { DocumentExpiryItem } from "../../domain";
import { navigateToDocumentExpiryDetail } from "./documentExpiryNavigation";

function baseItem(
  overrides: Partial<DocumentExpiryItem>,
): DocumentExpiryItem {
  return {
    entityType: "vehicle",
    entityId: "id-1",
    entityLabel: "Label",
    docType: "insurance",
    expiresOn: "2026-11-01",
    daysRemaining: 10,
    severity: "warning",
    ...overrides,
  };
}

describe("navigateToDocumentExpiryDetail", () => {
  it("routes insurance and sct_permit to vehicle documents tab", () => {
    const navigate = vi.fn();

    navigateToDocumentExpiryDetail(
      baseItem({ docType: "insurance", entityId: "veh-a" }),
      navigate,
    );
    expect(navigate).toHaveBeenCalledWith("/vehicles/veh-a?tab=documents", {
      state: { from: "/fleet/documents" },
    });

    navigate.mockClear();
    navigateToDocumentExpiryDetail(
      baseItem({ docType: "sct_permit", entityId: "veh-b" }),
      navigate,
      "/fleet/documents?within_days=15",
    );
    expect(navigate).toHaveBeenCalledWith("/vehicles/veh-b?tab=documents", {
      state: { from: "/fleet/documents?within_days=15" },
    });
  });

  it("routes license and medical_certificate to driver documents tab", () => {
    const navigate = vi.fn();

    navigateToDocumentExpiryDetail(
      baseItem({
        entityType: "driver",
        docType: "license",
        entityId: "drv-1",
      }),
      navigate,
    );
    expect(navigate).toHaveBeenCalledWith("/drivers/drv-1?tab=documents", {
      state: { from: "/fleet/documents" },
    });

    navigate.mockClear();
    navigateToDocumentExpiryDetail(
      baseItem({
        entityType: "driver",
        docType: "medical_certificate",
        entityId: "drv-2",
      }),
      navigate,
    );
    expect(navigate).toHaveBeenCalledWith("/drivers/drv-2?tab=documents", {
      state: { from: "/fleet/documents" },
    });
  });
});
