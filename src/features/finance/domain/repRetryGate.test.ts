import { describe, expect, it } from "vitest";
import {
  canRetryRepStamp,
  isRepManualReview,
  isRepOrphanParked,
  isRepPacConfigErrorMessage,
  isRepPermanentError,
  isRepStatusTerminal,
  REP_PAC_CONFIG_ERROR_MESSAGE,
  REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE,
} from "./repRetryGate";

describe("repRetryGate", () => {
  it("detects manual_review from waitReason, error kind, or fixed timeout message", () => {
    expect(isRepManualReview({ waitReason: "manual_review" })).toBe(true);
    expect(isRepManualReview({ repErrorKind: "manual_review" })).toBe(true);
    expect(
      isRepManualReview({
        waitReason: null,
        repLastError: REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE,
      }),
    ).toBe(true);
    expect(
      isRepManualReview({ waitReason: "queued", repLastError: "otro" }),
    ).toBe(false);
  });

  it("detects PAC config messages (base + tip. 702 hint)", () => {
    expect(isRepPacConfigErrorMessage(REP_PAC_CONFIG_ERROR_MESSAGE)).toBe(true);
    expect(
      isRepPacConfigErrorMessage(
        `${REP_PAC_CONFIG_ERROR_MESSAGE} Registre el RFC emisor en Datos para facturar o en el panel del timbrador.`,
      ),
    ).toBe(true);
    expect(
      isRepPacConfigErrorMessage("Registre el RFC emisor en el panel"),
    ).toBe(true);
    expect(isRepPacConfigErrorMessage("Error de validación PAC")).toBe(false);
    expect(isRepPacConfigErrorMessage(null)).toBe(false);
  });

  it("blocks retry for orphan, manual_review, permanent, and config messages", () => {
    expect(
      canRetryRepStamp({
        repStatus: "failed",
        repCfdiUuid: "uuid-1",
        repLastError: "x",
      }),
    ).toBe(false);
    expect(
      canRetryRepStamp({
        repStatus: "failed",
        waitReason: "manual_review",
        repCfdiUuid: null,
      }),
    ).toBe(false);
    expect(
      canRetryRepStamp({
        repStatus: "failed",
        repErrorKind: "permanent",
        repCfdiUuid: null,
        repLastError: "Error PAC validación",
      }),
    ).toBe(false);
    expect(
      canRetryRepStamp({
        repStatus: "failed",
        repErrorKind: null,
        repCfdiUuid: null,
        repLastError: REP_PAC_CONFIG_ERROR_MESSAGE,
      }),
    ).toBe(false);
    expect(
      canRetryRepStamp({
        repStatus: "failed",
        repErrorKind: "temporary",
        repCfdiUuid: null,
        repLastError: "Error PAC transporte",
      }),
    ).toBe(true);
    expect(isRepPermanentError({ repErrorKind: "permanent" })).toBe(true);
    expect(isRepOrphanParked({ repStatus: "failed", repCfdiUuid: "u" })).toBe(
      true,
    );
  });

  it("marks stamped/failed/cancelled as terminal for poll stop", () => {
    expect(isRepStatusTerminal("pending")).toBe(false);
    expect(isRepStatusTerminal("restamp_pending")).toBe(false);
    expect(isRepStatusTerminal("stamped")).toBe(true);
    expect(isRepStatusTerminal("failed")).toBe(true);
  });
});
