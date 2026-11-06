import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/createTestQueryClient";
import { formatDate } from "@shared/utils/dateUtils";
import { financeCopy } from "../copy";
import { PendingRelationSheet } from "./PendingRelationSheet";

const { getPendingRelationCount, downloadPendingRelation } = vi.hoisted(() => ({
  getPendingRelationCount: vi.fn(),
  downloadPendingRelation: vi.fn(),
}));

vi.mock("@features/finance/infrastructure", () => ({
  financeApi: {
    getPendingRelationCount,
    downloadPendingRelation,
  },
}));

beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
});

const copy = financeCopy.summary.accountStatement.pendingRelation;
const clientName = "INDUSTRIA ILUMINADORA DE ALMACENES";
const clientRfc = "IIA040805DZ4";

function renderSheet() {
  const client = createTestQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <PendingRelationSheet
        open
        onOpenChange={vi.fn()}
        clientName={clientName}
        clientRfc={clientRfc}
      />
    </QueryClientProvider>,
  );
}

describe("PendingRelationSheet", () => {
  beforeEach(() => {
    getPendingRelationCount.mockReset();
    downloadPendingRelation.mockReset();
    downloadPendingRelation.mockResolvedValue(undefined);
  });

  it("shows the cutoff, count, legend and PDF with the RFC as text", async () => {
    getPendingRelationCount.mockResolvedValue({
      invoiceCount: 3,
      generatedOn: "2026-11-06",
    });

    renderSheet();

    expect(await screen.findByText(copy.countLabel(3))).toBeInTheDocument();
    expect(screen.getByText(clientName)).toBeInTheDocument();
    expect(screen.getByText(clientRfc)).toBeInTheDocument();
    expect(screen.getByText(copy.cutoffLabel)).toBeInTheDocument();
    expect(screen.getByText(formatDate("2026-11-06"))).toBeInTheDocument();
    expect(screen.getByText(copy.legend)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: copy.formatLabel }),
    ).toHaveTextContent(copy.formatPdf);
  });

  it("shows the empty phrase and does not download when the count is 0", async () => {
    getPendingRelationCount.mockResolvedValue({
      invoiceCount: 0,
      generatedOn: "2026-11-06",
    });

    renderSheet();

    expect(await screen.findByText(copy.empty)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.downloadAction }),
    ).toBeDisabled();
    expect(downloadPendingRelation).not.toHaveBeenCalled();
  });

  it("downloads pdf with the row RFC and the cutoff date", async () => {
    const user = userEvent.setup();
    getPendingRelationCount.mockResolvedValue({
      invoiceCount: 3,
      generatedOn: "2026-11-06",
    });

    renderSheet();

    await screen.findByText(copy.countLabel(3));
    await user.click(
      screen.getByRole("button", { name: copy.downloadAction }),
    );

    await waitFor(() => {
      expect(downloadPendingRelation).toHaveBeenCalledTimes(1);
    });
    expect(downloadPendingRelation).toHaveBeenCalledWith(
      clientRfc,
      "pdf",
      "2026-11-06",
    );
  });

  it("downloads csv after changing the format", async () => {
    const user = userEvent.setup();
    getPendingRelationCount.mockResolvedValue({
      invoiceCount: 3,
      generatedOn: "2026-11-06",
    });

    renderSheet();

    await screen.findByText(copy.countLabel(3));
    await user.click(screen.getByRole("combobox", { name: copy.formatLabel }));
    const listbox = await screen.findByRole("listbox");
    await user.click(within(listbox).getByRole("option", { name: copy.formatCsv }));
    await user.click(
      screen.getByRole("button", { name: copy.downloadAction }),
    );

    await waitFor(() => {
      expect(downloadPendingRelation).toHaveBeenCalledTimes(1);
    });
    expect(downloadPendingRelation).toHaveBeenCalledWith(
      clientRfc,
      "csv",
      "2026-11-06",
    );
  });
});
