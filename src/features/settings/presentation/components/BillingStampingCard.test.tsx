import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { BillingStampingCard } from "./BillingStampingCard";
import { PacProviders, type RegisterPacEmitterResult } from "../../domain";

function renderCard(
  overrides: Partial<Parameters<typeof BillingStampingCard>[0]> = {},
) {
  return render(
    <BillingStampingCard
      provider={PacProviders.PROFACT}
      canRunActions
      isTestingConnection={false}
      onTestConnection={vi.fn()}
      isRegisteringEmitter={false}
      onRegisterEmitter={vi.fn()}
      {...overrides}
    />,
  );
}

function emitterFailure(
  reason: RegisterPacEmitterResult["reason"],
): RegisterPacEmitterResult {
  return {
    success: false,
    attempted: false,
    provider: PacProviders.PROFACT,
    message: "Registro pendiente de prerequisitos",
    reason,
  };
}

describe("BillingStampingCard", () => {
  it("muestra el timbrador y deja el modo pendiente hasta comprobar la conexión", () => {
    renderCard();

    expect(screen.getByText("ProFact")).toBeInTheDocument();
    expect(
      screen.getByText("Se muestra al comprobar la conexión"),
    ).toBeInTheDocument();
  });

  it("muestra el ambiente que reporta la comprobación", () => {
    renderCard({
      connectionResult: {
        success: true,
        message: "Conexión correcta",
        provider: PacProviders.PROFACT,
        environment: "sandbox",
        errorType: null,
      },
    });

    expect(screen.getByText("Facturas de prueba")).toBeInTheDocument();
  });

  it.each([
    ["missing_rfc", /Falta el RFC de tu empresa/],
    ["missing_csd", /Falta cargar el sello digital/],
    ["missing_csd_password", /Falta la contraseña del sello/],
    ["provider_not_profact", /no permite dar de alta la empresa/],
    ["register_failed", /rechazó el alta/],
  ] as const)("nombra el requisito faltante para %s", (reason, expected) => {
    renderCard({ emitterResult: emitterFailure(reason) });

    expect(screen.getByText(expected)).toBeInTheDocument();
    expect(screen.queryByText(/prerequisitos/)).not.toBeInTheDocument();
  });

  it("cae al mensaje del servidor cuando no clasifica el fallo", () => {
    renderCard({
      emitterResult: {
        ...emitterFailure(null),
        message: "El timbrador no respondió",
      },
    });

    expect(screen.getByText("El timbrador no respondió")).toBeInTheDocument();
  });

  it("oculta las acciones en modo consulta", () => {
    renderCard({ canRunActions: false });

    expect(
      screen.queryByRole("button", { name: "Comprobar conexión" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Dar de alta tu empresa" }),
    ).not.toBeInTheDocument();
  });
});
