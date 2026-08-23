import { describe, expect, it } from "vitest";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { resolveInvoiceEditPageGate } from "./invoiceEditPageGate";

describe("resolveInvoiceEditPageGate", () => {
  it("returns loading while the detail query is loading", () => {
    expect(
      resolveInvoiceEditPageGate({
        isLoading: true,
        isError: false,
        error: null,
        invoice: undefined,
      }),
    ).toEqual({ kind: "loading" });
  });

  it("returns loadError for 404 without data", () => {
    expect(
      resolveInvoiceEditPageGate({
        isLoading: false,
        isError: true,
        error: new ApiError("Not found", 404),
        invoice: undefined,
      }),
    ).toEqual({ kind: "loadError", errorState: "notFound" });
  });

  it("returns loadError for 403 without data", () => {
    expect(
      resolveInvoiceEditPageGate({
        isLoading: false,
        isError: true,
        error: new ApiError("Forbidden", 403),
        invoice: undefined,
      }),
    ).toEqual({ kind: "loadError", errorState: "forbidden" });
  });

  it("returns notEditable when invoice is not draft", () => {
    expect(
      resolveInvoiceEditPageGate({
        isLoading: false,
        isError: false,
        error: null,
        invoice: { status: "stamped" },
      }),
    ).toEqual({ kind: "notEditable" });
  });

  it("returns notEditable when invoice is missing without query error", () => {
    expect(
      resolveInvoiceEditPageGate({
        isLoading: false,
        isError: false,
        error: null,
        invoice: undefined,
      }),
    ).toEqual({ kind: "notEditable" });
  });

  it("returns ready for a draft invoice", () => {
    expect(
      resolveInvoiceEditPageGate({
        isLoading: false,
        isError: false,
        error: null,
        invoice: { status: "draft" },
      }),
    ).toEqual({ kind: "ready" });
  });
});
