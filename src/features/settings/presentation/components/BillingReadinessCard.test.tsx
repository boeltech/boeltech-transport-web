import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { formatDate } from "@shared/utils/dateUtils";
import { FinkokEmitterStatuses } from "../../domain";
import { BillingReadinessCard } from "./BillingReadinessCard";
import type {
  CertificateReadiness,
  FinkokEmitterReadiness,
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

function finkokReady(): FinkokEmitterReadiness {
  return {
    visible: true,
    status: FinkokEmitterStatuses.READY,
    detail: null,
    rowStatus: "ready",
    blocksReady: false,
  };
}

function finkokNotRegistered(): FinkokEmitterReadiness {
  return {
    visible: true,
    status: FinkokEmitterStatuses.NOT_REGISTERED,
    detail: null,
    rowStatus: "pending",
    blocksReady: true,
  };
}

function finkokSuspended(): FinkokEmitterReadiness {
  return {
    visible: true,
    status: FinkokEmitterStatuses.SUSPENDED,
    detail: null,
    rowStatus: "pending",
    blocksReady: true,
  };
}

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
        provider="finkok"
        canRunDiagnostics
        onTestConnection={vi.fn()}
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

  it("no muestra fila ProFact ni botón Dar de alta", () => {
    renderCard({ finkokEmitter: finkokNotRegistered(), canMutateFinkokEmitter: true });

    expect(
      screen.queryByText("Alta de tu empresa ante el timbrador"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Dar de alta tu empresa/i }),
    ).not.toBeInTheDocument();
  });

  it("muestra RFC ante el timbrador cuando el flag está on", () => {
    renderCard({ finkokEmitter: finkokReady() });

    expect(screen.getAllByText("RFC ante el timbrador").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("Registrado ante el timbrador").length).toBeGreaterThan(
      0,
    );
  });

  it("oculta el paso RFC cuando no es visible (flag off)", () => {
    renderCard({
      finkokEmitter: {
        visible: false,
        status: FinkokEmitterStatuses.UNAVAILABLE,
        detail: null,
        rowStatus: "unknown",
        blocksReady: false,
      },
    });

    expect(screen.queryByText("RFC ante el timbrador")).not.toBeInTheDocument();
  });

  it("A3: no declara listo si falta el RFC aunque la conexión esté ok", () => {
    renderCard({
      connection: "ready",
      finkokEmitter: finkokNotRegistered(),
      canMutateFinkokEmitter: true,
    });

    expect(
      screen.getByText("Falta algo para poder facturar"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Listo para facturar")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Tus datos están completos"),
    ).not.toBeInTheDocument();
  });

  it("declara listo con núcleo + RFC ready + conexión", () => {
    renderCard({
      connection: "ready",
      finkokEmitter: finkokReady(),
      canMutateFinkokEmitter: true,
    });

    expect(screen.getByText("Listo para facturar")).toBeInTheDocument();
  });

  it("ofrece Reintentar registro y dispara el callback", async () => {
    const user = userEvent.setup();
    const onRegister = vi.fn();
    renderCard({
      finkokEmitter: finkokNotRegistered(),
      canMutateFinkokEmitter: true,
      onRegisterFinkokEmitter: onRegister,
    });

    const buttons = screen.getAllByRole("button", {
      name: "Reintentar registro",
    });
    await user.click(buttons[0]!);
    expect(onRegister).toHaveBeenCalledTimes(1);
  });

  it("en suspendido solo ofrece Verificar estado (sin reintentar alta)", () => {
    renderCard({
      finkokEmitter: finkokSuspended(),
      canMutateFinkokEmitter: true,
    });

    expect(
      screen.getAllByRole("button", { name: "Verificar estado" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("button", { name: "Reintentar registro" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByText(/Registro suspendido\. Contacta a soporte Boeltech/)
        .length,
    ).toBeGreaterThan(0);
  });

  it("manager no ve CTAs de registro/reintento", () => {
    renderCard({
      finkokEmitter: finkokNotRegistered(),
      canMutateFinkokEmitter: false,
    });

    expect(
      screen.queryByRole("button", { name: "Reintentar registro" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Verificar registro" }),
    ).not.toBeInTheDocument();
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

  it("lleva al diagnóstico solo cuando la conexión falla", () => {
    renderCard({ connection: "pending" });

    expect(
      screen.getByRole("link", { name: "Comprobar la conexión" }),
    ).toHaveAttribute("href", "#diagnostico-timbrador");
  });

  it("declara listo para facturar con la conexión comprobada (flag off)", () => {
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
          provider="finkok"
          canRunDiagnostics
          onTestConnection={vi.fn()}
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
