import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PAST_DUE_DAYS_UNTIL_PAUSE } from "@features/billing/presentation/utils/billingGrace";
import { formatDate, formatDateTime } from "@shared/utils/dateUtils";
import { TenantCommercialStatusStrip } from "./TenantCommercialStatusStrip";
import { platformCopy } from "../copy/platformCopy";
import { PLATFORM_TENANT_STATUS_LABELS } from "../../domain/entities";

const stripCopy = platformCopy.tenants.detail.commercialStrip;

describe("TenantCommercialStatusStrip", () => {
  it("past_due + acceso active: muestra sigue operando · cobro pendiente y gracia", () => {
    const periodStart = "2026-08-01T06:00:00.000Z";
    const grace = new Date(periodStart);
    grace.setUTCDate(grace.getUTCDate() + PAST_DUE_DAYS_UNTIL_PAUSE);

    render(
      <TenantCommercialStatusStrip
        accessStatus="active"
        subscriptionStatus="past_due"
        planName="Operación Pequeña"
        lifecycleStage="at_risk"
        currentPeriodStart={periodStart}
      />,
    );

    expect(
      screen.getByText(PLATFORM_TENANT_STATUS_LABELS.active),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        platformCopy.tenants.detail.subscription.statusLabels.past_due,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Operación Pequeña")).toBeInTheDocument();
    expect(
      screen.getByText(stripCopy.pastDueOperating),
    ).toBeInTheDocument();
    expect(
      screen.getByText(stripCopy.graceRef(formatDate(grace.toISOString()))),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Pago pendiente/i)).not.toBeInTheDocument();
  });

  it("trialing: muestra fin de prueba sin ocultar ejes", () => {
    const trialEndsAt = "2026-09-15T18:00:00.000Z";

    render(
      <TenantCommercialStatusStrip
        accessStatus="active"
        subscriptionStatus="trialing"
        planName="Operación Micro"
        lifecycleStage="trialing"
        trialEndsAt={trialEndsAt}
      />,
    );

    expect(
      screen.getAllByText(
        platformCopy.tenants.detail.subscription.statusLabels.trialing,
      ).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(stripCopy.subscriptionLabel)).toBeInTheDocument();
    expect(
      screen.getByText(stripCopy.trialEnds(formatDateTime(trialEndsAt))),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(stripCopy.pastDueOperating),
    ).not.toBeInTheDocument();
  });
});
