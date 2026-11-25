import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AccountStatementItem } from "@features/finance/domain";
import { FINANCE_HUB_PATH } from "@features/finance/application";
import { financeCopy } from "../copy";
import { FinanceAccountStatementSection } from "./FinanceAccountStatementSection";

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useDownloadAccountStatementPdf: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
    useDownloadAccountStatementCsv: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
  };
});

function buildRow(
  overrides: Partial<AccountStatementItem> = {},
): AccountStatementItem {
  return {
    clientId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    clientRfc: "IIA040805DZ4",
    clientName: "INDUSTRIA ILUMINADORA DE ALMACENES",
    totalInvoiced: 31920,
    totalPaid: 0,
    balanceDue: 0,
    operationalBalance: 0,
    invoiceCount: 1,
    openInvoiceCount: 0,
    invoicesWithBalanceCount: 0,
    operationalTripCount: 0,
    overdueAmount: 0,
    lastCollectionAt: null,
    lastCollectionChannel: null,
    ...overrides,
  };
}

function renderSection(ui: ReactElement): ReturnType<typeof render> {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("FinanceAccountStatementSection", () => {
  it("muestra columnas multi-canal (K6) y no Relación / Resumen (PDF)", () => {
    renderSection(
      <FinanceAccountStatementSection
        rows={[
          buildRow({
            balanceDue: 46_960,
            operationalBalance: 22_600,
            openInvoiceCount: 2,
            operationalTripCount: 4,
            lastCollectionAt: "2026-11-12T18:00:00.000Z",
            lastCollectionChannel: "without_invoice",
          }),
        ]}
        isLoading={false}
        canDownloadStatement
        showCollectAction
      />,
    );

    expect(
      screen.getByRole("columnheader", {
        name: financeCopy.summary.table.withInvoice,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", {
        name: financeCopy.summary.table.withoutInvoice,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", {
        name: financeCopy.summary.table.lastCollection,
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: financeCopy.summary.accountStatement.pendingRelation.actionAria(
          "INDUSTRIA ILUMINADORA DE ALMACENES",
        ),
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Resumen (PDF)")).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: financeCopy.summary.accountStatement.downloadActionAria(
          "INDUSTRIA ILUMINADORA DE ALMACENES",
        ),
      }),
    ).toHaveTextContent("Estado de cuenta");
  });

  it("abre menú ⋯ con Registrar cobro hacia /finance/collections/new", async () => {
    const user = userEvent.setup();
    const clientName = "INDUSTRIA ILUMINADORA DE ALMACENES";

    renderSection(
      <FinanceAccountStatementSection
        rows={[
          buildRow({
            openInvoiceCount: 1,
            balanceDue: 12_000,
          }),
        ]}
        isLoading={false}
        showCollectAction
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: financeCopy.summary.accountStatement.moreActionsAria(clientName),
      }),
    );
    const collect = await screen.findByRole("menuitem", {
      name: financeCopy.summary.accountStatement.collectActionAria(clientName),
    });
    expect(collect).toHaveAttribute(
      "href",
      expect.stringContaining("/finance/collections/new?"),
    );
    expect(collect.getAttribute("href")).toContain("channel=with_invoice");
  });

  it("pasa state.from=/finance y fromLabel=Cartera al abrir el cliente", async () => {
    const user = userEvent.setup();
    const clientId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const clientName = "INDUSTRIA ILUMINADORA DE ALMACENES";

    function ClientProbe() {
      const location = useLocation();
      return <div>{JSON.stringify(location.state)}</div>;
    }

    render(
      <MemoryRouter initialEntries={[FINANCE_HUB_PATH]}>
        <Routes>
          <Route
            path={FINANCE_HUB_PATH}
            element={
              <FinanceAccountStatementSection
                rows={[
                  buildRow({
                    clientId,
                    openInvoiceCount: 1,
                    balanceDue: 12_000,
                  }),
                ]}
                isLoading={false}
                showCollectAction
              />
            }
          />
          <Route path="/clients/:id" element={<ClientProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("link", { name: clientName }));
    expect(screen.getByText(/"from":"\/finance"/)).toBeInTheDocument();
    expect(screen.getByText(/"fromLabel":"Cartera"/)).toBeInTheDocument();
  });

  it("filtra por canal Con factura / Sin factura / Con vencido", async () => {
    const user = userEvent.setup();
    renderSection(
      <FinanceAccountStatementSection
        rows={[
          buildRow({
            clientName: "Solo factura",
            clientRfc: "AAA010101AAA",
            balanceDue: 10_000,
            operationalBalance: 0,
            openInvoiceCount: 1,
          }),
          buildRow({
            clientName: "Solo operativo",
            clientRfc: "",
            clientId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            balanceDue: 5_000,
            operationalBalance: 5_000,
            openInvoiceCount: 0,
            operationalTripCount: 2,
          }),
          buildRow({
            clientName: "Con vencido",
            clientRfc: "CCC010101CCC",
            balanceDue: 8_000,
            operationalBalance: 0,
            openInvoiceCount: 1,
            overdueAmount: 8_000,
          }),
        ]}
        isLoading={false}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: new RegExp(financeCopy.summary.accountStatement.filters.overdue),
      }),
    );
    expect(screen.getByRole("row", { name: /Con vencido/i })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Solo factura/i })).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: new RegExp(
          financeCopy.summary.accountStatement.filters.withoutInvoice,
        ),
      }),
    );
    expect(
      screen.getByRole("row", { name: /Solo operativo/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("row", { name: /Con vencido/i }),
    ).not.toBeInTheDocument();
  });

  it("filtra client-side por RFC", async () => {
    const user = userEvent.setup();
    renderSection(
      <FinanceAccountStatementSection
        rows={[
          buildRow({
            clientRfc: "IIA040805DZ4",
            clientName: "INDUSTRIA ILUMINADORA DE ALMACENES",
            balanceDue: 1000,
            openInvoiceCount: 1,
          }),
          buildRow({
            clientRfc: "XAXX010101000",
            clientName: "CLIENTE GENERICO",
            totalInvoiced: 1000,
            balanceDue: 1000,
            openInvoiceCount: 1,
          }),
        ]}
        isLoading={false}
      />,
    );

    const search = screen.getByRole("searchbox", {
      name: financeCopy.summary.accountStatement.searchAriaLabel,
    });
    await user.type(search, "xaxx010101");

    expect(
      screen.getByRole("row", { name: /CLIENTE GENERICO/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("row", {
        name: /INDUSTRIA ILUMINADORA DE ALMACENES/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("muestra vacío de filtro cuando ningún RFC coincide", async () => {
    const user = userEvent.setup();
    renderSection(
      <FinanceAccountStatementSection
        rows={[buildRow({ balanceDue: 100, openInvoiceCount: 1 })]}
        isLoading={false}
      />,
    );

    await user.type(
      screen.getByRole("searchbox", {
        name: financeCopy.summary.accountStatement.searchAriaLabel,
      }),
      "NOEXISTE",
    );

    expect(
      screen.getByText(financeCopy.summary.accountStatement.filterEmpty.title),
    ).toBeInTheDocument();
  });

  it("lista y cuenta solo clientes con saldo, sin leyenda del menú (K13)", () => {
    renderSection(
      <FinanceAccountStatementSection
        rows={[
          buildRow({
            clientName: "Con saldo",
            balanceDue: 3000,
            openInvoiceCount: 1,
            invoicesWithBalanceCount: 2,
          }),
          buildRow({
            clientName: "Saldado",
            clientRfc: "SAL010101AB1",
            clientId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
            balanceDue: 0,
          }),
        ]}
        showCollectAction
      />,
    );

    expect(screen.queryByRole("row", { name: /Saldado/ })).not.toBeInTheDocument();
    expect(
      screen.getByText(financeCopy.summary.accountStatement.footerNote(1)),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: new RegExp(`^${financeCopy.summary.accountStatement.filters.all}\\s*1$`),
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/«⋯»/)).not.toBeInTheDocument();
    // El menú se conserva (K7).
    expect(
      screen.getByRole("button", {
        name: financeCopy.summary.accountStatement.moreActionsAria("Con saldo"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(financeCopy.summary.accountStatement.invoiceCountUnder(2)),
    ).toBeInTheDocument();
  });

  it("ofrece «Estado de cuenta» a un cliente sin RFC", () => {
    renderSection(
      <FinanceAccountStatementSection
        rows={[
          buildRow({
            clientName: "Materiales Ortega",
            clientRfc: "",
            balanceDue: 18_300,
            operationalBalance: 18_300,
            operationalTripCount: 2,
          }),
        ]}
        canDownloadStatement
      />,
    );

    expect(
      screen.getByRole("button", {
        name: financeCopy.summary.accountStatement.downloadActionAria(
          "Materiales Ortega",
        ),
      }),
    ).toBeInTheDocument();
  });

  it("resalta vencido en ámbar", () => {
    renderSection(
      <FinanceAccountStatementSection
        rows={[
          buildRow({
            balanceDue: 15_600,
            openInvoiceCount: 1,
            overdueAmount: 15_600,
          }),
        ]}
        isLoading={false}
      />,
    );

    const row = screen.getByRole("row", {
      name: /INDUSTRIA ILUMINADORA DE ALMACENES/i,
    });
    const overdue = within(row)
      .getAllByText("$15,600.00")
      .find((el) => el.className.includes("text-warning"));
    expect(overdue).toBeTruthy();
  });
});
