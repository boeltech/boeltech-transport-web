import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import { formatDate } from "@shared/utils/dateUtils";
import { BillingReadinessCard } from "./BillingReadinessCard";
import type {
  CertificateReadiness,
  IdentityReadiness,
  NumberingReadiness,
} from "../utils/billingReadiness";

const READY_IDENTITY: IdentityReadiness = { status: "ready" };
const READY_CERTIFICATE: CertificateReadiness = {
  status: "ready",
  expiresAt: new Date("2028-01-15T00:00:00.000Z"),
  daysRemaining: 500,
};
const READY_NUMBERING: NumberingReadiness = { status: "ready", serie: "A" };

function renderCard(
  overrides: Partial<Parameters<typeof BillingReadinessCard>[0]> = {},
) {
  return render(
    <MemoryRouter>
      <BillingReadinessCard
        identity={READY_IDENTITY}
        certificate={READY_CERTIFICATE}
        numbering={READY_NUMBERING}
        connection="unknown"
        isCheckingConnection={false}
        emitter="unknown"
        isRegisteringEmitter={false}
        provider="profact"
        canRunDiagnostics
        onTestConnection={vi.fn()}
        onRegisterEmitter={vi.fn()}
        {...overrides}
      />
    </MemoryRouter>,
  );
}

describe("BillingReadinessCard", () => {
  it("resume identidad, sello, numeración y diagnóstico", () => {
    renderCard();

    expect(
      screen.getByText("Identidad fiscal de la empresa"),
    ).toBeInTheDocument();
    expect(screen.getByText("Sello digital de tu empresa")).toBeInTheDocument();
    expect(screen.getByText("Numeración de tus facturas")).toBeInTheDocument();
    expect(screen.getByText("Diagnóstico del timbrador")).toBeInTheDocument();
  });

  it("lleva a General cuando falta la identidad", () => {
    renderCard({ identity: { status: "pending" } });

    expect(
      screen.getByText("Falta algo para poder facturar"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ir a General" }),
    ).toHaveAttribute("href", "/settings/general");
  });

  it("no convierte las comprobaciones sin ejecutar en tareas pendientes", () => {
    renderCard();

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("lleva al diagnóstico solo cuando una comprobación falla", () => {
    renderCard({ connection: "pending" });

    expect(
      screen.getByRole("link", { name: "Comprobar la conexión" }),
    ).toHaveAttribute("href", "#diagnostico-timbrador");
  });

  it("declara listo para facturar solo con las dos comprobaciones hechas", () => {
    const { rerender } = renderCard();
    expect(screen.getByText("Tus datos están completos")).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <BillingReadinessCard
          identity={READY_IDENTITY}
          certificate={READY_CERTIFICATE}
          numbering={READY_NUMBERING}
          connection="ready"
          isCheckingConnection={false}
          emitter="ready"
          isRegisteringEmitter={false}
          provider="profact"
          canRunDiagnostics
          onTestConnection={vi.fn()}
          onRegisterEmitter={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Listo para facturar")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("apunta al sello cuando falta cargarlo", () => {
    renderCard({
      certificate: { status: "pending", expiresAt: null, daysRemaining: null },
    });

    expect(
      screen.getByRole("link", { name: "Cargar el sello digital" }),
    ).toHaveAttribute("href", "#sello-digital");
  });

  it("explica que el sello lo carga un admin cuando el rol no puede subirlo", () => {
    renderCard({
      certificate: { status: "pending", expiresAt: null, daysRemaining: null },
      certificateUploadRestricted: true,
    });

    expect(screen.getByText("Lo carga un administrador")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Cargar el sello digital" }),
    ).not.toBeInTheDocument();
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
