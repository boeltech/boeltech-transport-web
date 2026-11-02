import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import {
  FINANCE_COBROS_LEGACY_PATH,
  FINANCE_COBROS_PATH,
  FINANCE_EFECTIVO_POR_COBRAR_LEGACY_PATH,
  FINANCE_EFECTIVO_POR_COBRAR_PATH,
} from "../../application/financeRoutes";
import {
  FinanceCobrosLegacyRedirect,
  FinanceEfectivoPorCobrarLegacyRedirect,
} from "./FinancePathLegacyRedirects";

function LocationProbe({ testId }: { testId: string }) {
  const location = useLocation();
  return (
    <div
      data-testid={testId}
      data-pathname={location.pathname}
      data-search={location.search}
    />
  );
}

describe("FinancePathLegacyRedirects", () => {
  it("redirige /finance/cobros a /finance/payments preservando query", () => {
    render(
      <MemoryRouter
        initialEntries={[
          `${FINANCE_COBROS_LEGACY_PATH}?rfc=XAXX010101000&bucket=partial`,
        ]}
      >
        <Routes>
          <Route
            path={FINANCE_COBROS_LEGACY_PATH}
            element={<FinanceCobrosLegacyRedirect />}
          />
          <Route
            path={FINANCE_COBROS_PATH}
            element={<LocationProbe testId="payments-landed" />}
          />
        </Routes>
      </MemoryRouter>,
    );

    const landed = screen.getByTestId("payments-landed");
    expect(landed).toHaveAttribute("data-pathname", FINANCE_COBROS_PATH);
    expect(landed).toHaveAttribute(
      "data-search",
      "?rfc=XAXX010101000&bucket=partial",
    );
  });

  it("redirige /finance/efectivo-por-cobrar a operational-cash-pending preservando clientId", () => {
    render(
      <MemoryRouter
        initialEntries={[
          `${FINANCE_EFECTIVO_POR_COBRAR_LEGACY_PATH}?clientId=client-a`,
        ]}
      >
        <Routes>
          <Route
            path={FINANCE_EFECTIVO_POR_COBRAR_LEGACY_PATH}
            element={<FinanceEfectivoPorCobrarLegacyRedirect />}
          />
          <Route
            path={FINANCE_EFECTIVO_POR_COBRAR_PATH}
            element={<LocationProbe testId="efectivo-landed" />}
          />
        </Routes>
      </MemoryRouter>,
    );

    const landed = screen.getByTestId("efectivo-landed");
    expect(landed).toHaveAttribute(
      "data-pathname",
      FINANCE_EFECTIVO_POR_COBRAR_PATH,
    );
    expect(landed).toHaveAttribute("data-search", "?clientId=client-a");
  });
});
