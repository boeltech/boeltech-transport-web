import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import type { ClientCreditSummary } from "@features/clients/domain/entities";
import { CreditExposureCard } from "./CreditExposureCard";
import { creditExposureCopy } from "./creditExposureCopy";

function buildSummary(
  status: ClientCreditSummary["status"],
  overrides: Partial<ClientCreditSummary> = {},
): ClientCreditSummary {
  return {
    clientId: "client-1",
    paymentTerms: status === "no_credit_terms" ? "cash" : "credit",
    creditDays: 30,
    creditLimit: status === "no_limit" ? null : 100_000,
    breakdown: { invoiced: 45_000, unbilled: 12_000, pendingDraft: 3_000 },
    totalExposure: 60_000,
    availableCredit: status === "exceeded" ? 0 : 40_000,
    utilizationPct:
      status === "ok" ? 0.6 : status === "warn" ? 0.85 : status === "exceeded" ? 1.2 : null,
    status,
    nextInvoiceDueAt: "2026-07-15",
    ...overrides,
  };
}

function renderCard(summary: ClientCreditSummary, showBreakdown = false) {
  return render(
    <MemoryRouter>
      <CreditExposureCard summary={summary} showBreakdown={showBreakdown} />
    </MemoryRouter>,
  );
}

describe("CreditExposureCard", () => {
  it("renders no_credit_terms state", () => {
    renderCard(buildSummary("no_credit_terms"));
    expect(screen.getByText(creditExposureCopy.noCreditTerms)).toBeInTheDocument();
    expect(screen.getByText(creditExposureCopy.statusLabel.no_credit_terms)).toBeInTheDocument();
  });

  it("renders no_limit state with configure CTA", () => {
    renderCard(buildSummary("no_limit"));
    expect(screen.getByText(creditExposureCopy.noLimit)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: creditExposureCopy.configureLimit })).toHaveAttribute(
      "href",
      "/clients/client-1/edit",
    );
  });

  it("renders ok state with utilization", () => {
    renderCard(buildSummary("ok"));
    expect(screen.getByText(creditExposureCopy.statusLabel.ok)).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("renders warn state", () => {
    renderCard(buildSummary("warn"));
    expect(screen.getByText(creditExposureCopy.statusLabel.warn)).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  it("renders exceeded state with the amount over the limit", () => {
    renderCard(
      buildSummary("exceeded", { totalExposure: 120_000, availableCredit: 0 }),
    );
    expect(screen.getByText(creditExposureCopy.statusLabel.exceeded)).toBeInTheDocument();
    expect(screen.getByText(creditExposureCopy.overLimit)).toBeInTheDocument();
    expect(screen.getByText(/^\$20,000\.00$/)).toBeInTheDocument();
  });

  it("muestra el disponible con centavos exactos, sin redondear", () => {
    renderCard(
      buildSummary("ok", {
        availableCredit: 40_320.55,
        totalExposure: 59_679.45,
        creditLimit: 100_000.5,
      }),
    );
    expect(screen.getByText(/40,320\.55/)).toBeInTheDocument();
    expect(screen.getByText(/59,679\.45/)).toBeInTheDocument();
    expect(screen.getByText(/100,000\.50/)).toBeInTheDocument();
  });

  it("renders breakdown rows when showBreakdown is true, sin porcentajes por fila", () => {
    renderCard(buildSummary("ok"), true);
    expect(screen.getByText(creditExposureCopy.breakdownTitle)).toBeInTheDocument();
    expect(screen.getByText(creditExposureCopy.breakdown.invoiced)).toBeInTheDocument();
    expect(screen.getByText(creditExposureCopy.breakdown.unbilled)).toBeInTheDocument();
    expect(screen.getByText(creditExposureCopy.breakdown.pendingDraft)).toBeInTheDocument();
    expect(screen.queryByText(/\(\d+%\)/)).not.toBeInTheDocument();
  });
});
