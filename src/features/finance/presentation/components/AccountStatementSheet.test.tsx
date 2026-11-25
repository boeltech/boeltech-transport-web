import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AccountStatementItem } from "@features/finance/domain";
import { financeCopy } from "../copy";
import { AccountStatementSheet } from "./AccountStatementSheet";

const pdfMutate = vi.fn();
const csvMutate = vi.fn();

vi.mock("@features/finance/application", () => ({
  useDownloadAccountStatementPdf: () => ({ mutate: pdfMutate, isPending: false }),
  useDownloadAccountStatementCsv: () => ({ mutate: csvMutate, isPending: false }),
}));

const copy = financeCopy.summary.accountStatement.sheet;
const CLIENT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function renderSheet(overrides: Partial<AccountStatementItem> = {}): void {
  const row: AccountStatementItem = {
    clientId: CLIENT_ID,
    clientRfc: "ALU920314KJ8",
    clientName: "Abarrotes La Luz",
    totalInvoiced: 24_360,
    totalPaid: 0,
    balanceDue: 46_960,
    operationalBalance: 22_600,
    invoiceCount: 3,
    openInvoiceCount: 1,
    invoicesWithBalanceCount: 2,
    operationalTripCount: 4,
    overdueAmount: 0,
    lastCollectionAt: null,
    lastCollectionChannel: null,
    ...overrides,
  };
  render(<AccountStatementSheet open row={row} onOpenChange={vi.fn()} />);
}

const download = () => screen.getByRole("button", { name: copy.download });

describe("AccountStatementSheet", () => {
  beforeEach(() => {
    pdfMutate.mockReset();
    csvMutate.mockReset();
  });

  it("describe las dos secciones con los conteos del archivo", () => {
    renderSheet();

    expect(screen.getByText(copy.includeInvoicesHint)).toBeInTheDocument();
    expect(screen.getByText(copy.includeOperationalHint)).toBeInTheDocument();
    // Facturas con saldo (PUE y PPD), no solo las PPD de la cola.
    expect(screen.getByText("2 · $24,360.00")).toBeInTheDocument();
    expect(screen.getByText("4 · $22,600.00")).toBeInTheDocument();
    expect(screen.getByText(copy.csvNote)).toBeInTheDocument();
    expect(screen.getByText(copy.legend)).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/Cobros recibidos|Vista previa/)).not.toBeInTheDocument();
  });

  it("descarga PDF por RFC de forma predeterminada", async () => {
    renderSheet();
    expect(screen.getByRole("radio", { name: copy.formatPdf })).toBeChecked();

    await userEvent.click(download());

    expect(pdfMutate).toHaveBeenCalledWith({ clientRfc: "ALU920314KJ8" });
    expect(csvMutate).not.toHaveBeenCalled();
  });

  it("con CSV elegido descarga el CSV del mismo cliente", async () => {
    renderSheet();

    await userEvent.click(screen.getByRole("radio", { name: copy.formatCsv }));
    await userEvent.click(download());

    expect(csvMutate).toHaveBeenCalledWith({
      target: { clientRfc: "ALU920314KJ8" },
    });
  });

  it.each([
    ["sin RFC", ""],
    ["con RFC genérico", "XAXX010101000"],
  ])("cliente %s: descarga por client_id", async (_label, clientRfc) => {
    renderSheet({ clientRfc });

    await userEvent.click(download());

    expect(pdfMutate).toHaveBeenCalledWith({
      clientId: CLIENT_ID,
      clientName: "Abarrotes La Luz",
    });
    expect(screen.queryByText(copy.unavailable)).not.toBeInTheDocument();
  });

  it("RFC genérico sin cliente: explica el motivo y no descarga", () => {
    renderSheet({ clientRfc: "XAXX010101000", clientId: null });

    expect(screen.getByText(copy.unavailable)).toBeInTheDocument();
    expect(download()).toBeDisabled();
  });
});
