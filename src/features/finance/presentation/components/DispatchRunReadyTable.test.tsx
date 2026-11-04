import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { BillingDispatchRunItem } from "../../domain/billingDispatchRun.types";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { DispatchRunReadyTable } from "./DispatchRunReadyTable";

function buildItem(
  partial: Partial<BillingDispatchRunItem> &
    Pick<BillingDispatchRunItem, "id" | "documentKind" | "clientId">,
): BillingDispatchRunItem {
  return {
    itemKind: "ready_to_send",
    tripId: null,
    invoiceId: null,
    paymentId: null,
    billingScope: null,
    status: "listed",
    folio: null,
    emailMessageId: null,
    errorMessage: null,
    sentAt: null,
    createdAt: "2026-08-08T12:00:00.000Z",
    updatedAt: "2026-08-08T12:00:00.000Z",
    ...partial,
  };
}

describe("DispatchRunReadyTable", () => {
  it("renderiza columnas Folio · Cliente · Estado sin Id ni monto", () => {
    render(
      <DispatchRunReadyTable
        items={[
          buildItem({
            id: "1",
            documentKind: "invoice",
            clientId: "c1",
            clientName: "Acme",
            folio: "A-10",
            invoiceId: "abcd1234-efgh-ijkl-mnop-qrstuvwx9999",
          }),
        ]}
      />,
    );

    expect(
      screen.getByRole("columnheader", {
        name: dispatchRunsCopy.detail.table.folio,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", {
        name: dispatchRunsCopy.detail.table.client,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", {
        name: dispatchRunsCopy.detail.table.status,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", {
        name: dispatchRunsCopy.detail.table.id,
      }),
    ).toBeNull();
    expect(screen.queryByRole("columnheader", { name: /Monto/i })).toBeNull();
    expect(screen.getByText("A-10")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.queryByText("abcd…9999")).toBeNull();
    expect(
      screen.getByText(dispatchRunsCopy.detail.table.readyStatus),
    ).toBeInTheDocument();
  });

  it("trunca folio UUID opaco (REP) a 8 caracteres", () => {
    render(
      <DispatchRunReadyTable
        items={[
          buildItem({
            id: "2",
            documentKind: "rep",
            clientId: "c2",
            clientName: "Beta",
            folio: "9802301f-f80c-4378-a7f0-8d2ef1688ce8",
            paymentId: "d1e6aaaa-bbbb-cccc-dddd-eeeeeeee9d94",
          }),
        ]}
      />,
    );

    expect(screen.getByText("9802301f")).toBeInTheDocument();
    expect(
      screen.queryByText("9802301f-f80c-4378-a7f0-8d2ef1688ce8"),
    ).not.toBeInTheDocument();
  });
});
