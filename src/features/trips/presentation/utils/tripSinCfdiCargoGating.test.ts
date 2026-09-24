import { describe, expect, it } from "vitest";

import { TRIP_SIN_CFDI_CARGO_REQUIRED_CODE } from "@boeltech/cfdi-domain";
import { ApiError } from "@shared/api/interceptors/error-handler";

import { cfdiEmissionIntentCopy } from "../copy/cfdiEmissionIntentCopy";
import {
  countActiveTripCargos,
  resolveSinCfdiCargoApiErrorMessage,
  sinCfdiCargoBlockReason,
} from "./tripSinCfdiCargoGating";

const copy = cfdiEmissionIntentCopy.cargoGate;

describe("countActiveTripCargos", () => {
  it("ignora cancelled", () => {
    expect(
      countActiveTripCargos([
        { status: "pending" },
        { status: "cancelled" },
        { status: "in_transit" },
      ]),
    ).toBe(2);
  });

  it("devuelve 0 con lista vacía", () => {
    expect(countActiveTripCargos([])).toBe(0);
  });
});

describe("sinCfdiCargoBlockReason", () => {
  it("no bloquea emitir_cfdi sin cargas", () => {
    expect(sinCfdiCargoBlockReason("emitir_cfdi", [], "start")).toBeNull();
    expect(sinCfdiCargoBlockReason("emitir_cfdi", [], "complete")).toBeNull();
  });

  it("bloquea sin_cfdi_efectivo sin cargas activas", () => {
    expect(sinCfdiCargoBlockReason("sin_cfdi_efectivo", [], "start")).toBe(
      copy.ctaStartBlocked,
    );
    expect(
      sinCfdiCargoBlockReason(
        "sin_cfdi_efectivo",
        [{ status: "cancelled" }],
        "complete",
      ),
    ).toBe(copy.ctaCompleteBlocked);
  });

  it("no bloquea sin_cfdi_efectivo con ≥1 carga activa", () => {
    expect(
      sinCfdiCargoBlockReason(
        "sin_cfdi_efectivo",
        [{ status: "pending" }],
        "start",
      ),
    ).toBeNull();
  });

  it("trata intent undefined como emitir_cfdi", () => {
    expect(sinCfdiCargoBlockReason(undefined, [], "start")).toBeNull();
  });
});

describe("resolveSinCfdiCargoApiErrorMessage", () => {
  it("mapea TRIP_SIN_CFDI_CARGO_REQUIRED al alert PRD", () => {
    expect(
      resolveSinCfdiCargoApiErrorMessage(
        new ApiError("server", 409, TRIP_SIN_CFDI_CARGO_REQUIRED_CODE),
      ),
    ).toBe(copy.alertSheet);
  });

  it("devuelve null para otros errores", () => {
    expect(
      resolveSinCfdiCargoApiErrorMessage(new ApiError("otro", 409, "OTHER")),
    ).toBeNull();
    expect(resolveSinCfdiCargoApiErrorMessage(new Error("x"))).toBeNull();
  });
});
