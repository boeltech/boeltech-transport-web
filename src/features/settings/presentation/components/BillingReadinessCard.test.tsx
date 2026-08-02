import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { formatDate } from "@shared/utils/dateUtils";
import { BillingReadinessCard } from "./BillingReadinessCard";
import type {
  CertificateReadiness,
  NumberingReadiness,
} from "../utils/billingReadiness";

const READY_CERTIFICATE: CertificateReadiness = {
  status: "ready",
  expiresAt: new Date("2028-01-15T00:00:00.000Z"),
  daysRemaining: 500,
};

const READY_NUMBERING: NumberingReadiness = { status: "ready", serie: "A" };

function renderCard(overrides: Partial<Parameters<typeof BillingReadinessCard>[0]> = {}) {
  return render(
    <BillingReadinessCard
      certificate={READY_CERTIFICATE}
      numbering={READY_NUMBERING}
      connection="unknown"
      isCheckingConnection={false}
      emitter="unknown"
      isRegisteringEmitter={false}
      {...overrides}
    />,
  );
}

describe("BillingReadinessCard", () => {
  it("resume los cuatro requisitos", () => {
    renderCard();

    expect(screen.getByText("Sello digital de tu empresa")).toBeInTheDocument();
    expect(screen.getByText("Numeración de tus facturas")).toBeInTheDocument();
    expect(screen.getByText("Conexión con el timbrador")).toBeInTheDocument();
    expect(
      screen.getByText("Alta de tu empresa ante el timbrador"),
    ).toBeInTheDocument();
  });

  it("no convierte las comprobaciones sin ejecutar en tareas pendientes", () => {
    renderCard();

    expect(screen.getByText("Comprobaciones opcionales")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("lleva al bloque de timbrado solo cuando una comprobación falla", () => {
    renderCard({ connection: "pending" });

    expect(
      screen.getByRole("link", { name: "Comprobar la conexión" }),
    ).toHaveAttribute("href", "#timbrado");
  });

  it("declara listo para facturar solo con las dos comprobaciones hechas", () => {
    const { rerender } = renderCard();
    expect(screen.getByText("Tus datos están completos")).toBeInTheDocument();

    rerender(
      <BillingReadinessCard
        certificate={READY_CERTIFICATE}
        numbering={READY_NUMBERING}
        connection="ready"
        isCheckingConnection={false}
        emitter="ready"
        isRegisteringEmitter={false}
      />,
    );

    expect(screen.getByText("Listo para facturar")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("apunta al sello cuando falta cargarlo", () => {
    renderCard({
      certificate: { status: "pending", expiresAt: null, daysRemaining: null },
    });

    expect(
      screen.getByText("Falta algo para poder facturar"),
    ).toBeInTheDocument();
    expect(screen.getByText("Falta cargarlo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cargar el sello digital" })).toHaveAttribute(
      "href",
      "#sello-digital",
    );
  });

  it("avisa del vencimiento próximo del sello con la fecha visible", () => {
    const expiresAt = new Date("2026-09-20T12:00:00.000Z");
    renderCard({
      certificate: { status: "warning", expiresAt, daysRemaining: 50 },
    });

    expect(screen.getByText("Tu sello digital está por vencer")).toBeInTheDocument();
    expect(
      screen.getByText(`Vence el ${formatDate(expiresAt.toISOString())}`),
    ).toBeInTheDocument();
  });

  it("reporta la serie sin inventar el folio en curso", () => {
    renderCard();

    expect(screen.getByText("Serie A")).toBeInTheDocument();
    expect(screen.queryByText(/folio/i)).not.toBeInTheDocument();
  });
});
