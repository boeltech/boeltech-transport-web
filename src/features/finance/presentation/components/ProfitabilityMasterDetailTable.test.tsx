import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import type { ProfitabilityAggregateItem } from "@features/finance/domain";
import { financeCopy } from "../copy";
import { ProfitabilityMasterDetailTable } from "./ProfitabilityMasterDetailTable";

const tripsQuery = vi.hoisted(() => ({
  data: undefined as
    | { data: never[]; pagination: { total: number } }
    | undefined,
  isLoading: false,
}));

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useProfitabilityTrips: () => ({
      data: tripsQuery.data,
      isLoading: tripsQuery.isLoading,
      isError: false,
      refetch: vi.fn(),
    }),
  };
});

const copy = financeCopy.profitability.masterDetail;

function aggregateItem(
  overrides: Partial<ProfitabilityAggregateItem> = {},
): ProfitabilityAggregateItem {
  return {
    key: "client-1",
    label: "Cliente Uno",
    tripCount: 2,
    totalRevenue: 2000,
    totalActual: 1000,
    blendedMargin: 1000,
    blendedMarginPct: 50,
    ...overrides,
  };
}

describe("ProfitabilityMasterDetailTable — F3 a11y teclado", () => {
  beforeEach(() => {
    tripsQuery.data = { data: [], pagination: { total: 0 } };
    tripsQuery.isLoading = false;
  });

  it("expande y colapsa con botón chevron (click y teclado Enter/Space)", async () => {
    const user = userEvent.setup();
    const onExpandedKeyChange = vi.fn();

    const { rerender } = renderWithTheme(
      <ProfitabilityMasterDetailTable
        scope="operational"
        dimension="client"
        onDimensionChange={vi.fn()}
        from="2026-01-01"
        to="2026-01-31"
        aggregate={[aggregateItem()]}
        aggregateLoading={false}
        emptyState={<p>vacío</p>}
        expandedKey={null}
        onExpandedKeyChange={onExpandedKeyChange}
      />,
      { route: ["/finance/analysis?view=margin"], resolvedTheme: "light" },
    );

    const expand = screen.getByRole("button", { name: copy.expandRow });
    expect(expand).toHaveAttribute("aria-expanded", "false");

    await user.click(expand);
    expect(onExpandedKeyChange).toHaveBeenCalledWith("client-1");

    onExpandedKeyChange.mockClear();
    rerender(
      <ProfitabilityMasterDetailTable
        scope="operational"
        dimension="client"
        onDimensionChange={vi.fn()}
        from="2026-01-01"
        to="2026-01-31"
        aggregate={[aggregateItem()]}
        aggregateLoading={false}
        emptyState={<p>vacío</p>}
        expandedKey="client-1"
        onExpandedKeyChange={onExpandedKeyChange}
      />,
    );

    const collapse = screen.getByRole("button", { name: copy.collapseRow });
    expect(collapse).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(copy.detailEmpty),
    ).toBeInTheDocument();

    collapse.focus();
    await user.keyboard("{Enter}");
    expect(onExpandedKeyChange).toHaveBeenCalledWith(null);

    onExpandedKeyChange.mockClear();
    collapse.focus();
    await user.keyboard(" ");
    expect(onExpandedKeyChange).toHaveBeenCalledWith(null);
  });

  it("click en la fila (fuera del botón) también expande", async () => {
    const user = userEvent.setup();
    const onExpandedKeyChange = vi.fn();

    renderWithTheme(
      <ProfitabilityMasterDetailTable
        scope="operational"
        dimension="client"
        onDimensionChange={vi.fn()}
        from="2026-01-01"
        to="2026-01-31"
        aggregate={[aggregateItem()]}
        aggregateLoading={false}
        emptyState={<p>vacío</p>}
        expandedKey={null}
        onExpandedKeyChange={onExpandedKeyChange}
      />,
      { route: ["/finance/analysis?view=margin"], resolvedTheme: "light" },
    );

    const row = screen.getByText("Cliente Uno").closest("tr");
    expect(row).toBeTruthy();
    await user.click(within(row as HTMLElement).getByText("Cliente Uno"));
    expect(onExpandedKeyChange).toHaveBeenCalledWith("client-1");
  });
});
