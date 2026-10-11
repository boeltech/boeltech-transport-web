import { describe, expect, it } from "vitest";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { getBulkDownloadInProgressActiveId } from "./useInvoiceBulkDownload";

describe("getBulkDownloadInProgressActiveId", () => {
  it("extrae active_id del 409", () => {
    const error = new ApiError(
      "Ya hay una descarga",
      409,
      "BULK_DOWNLOAD_IN_PROGRESS",
      { active_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
    );
    expect(getBulkDownloadInProgressActiveId(error)).toBe(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
  });

  it("null si no es el código", () => {
    expect(
      getBulkDownloadInProgressActiveId(new ApiError("x", 422, "OTHER")),
    ).toBeNull();
  });
});
