import { describe, expect, it } from "vitest";

import { NOTIFICATION_SOURCES } from "../../domain";
import {
  NOTIFICATION_SOURCE_LABELS,
  notificationsCopy,
} from "./notificationsCopy";

describe("notificationsCopy F2", () => {
  it("cubre todas las fuentes con labels humanos en español (D5)", () => {
    for (const source of NOTIFICATION_SOURCES) {
      const label = NOTIFICATION_SOURCE_LABELS[source];
      expect(label).toBeTruthy();
      expect(label).not.toBe(source);
      expect(label).not.toMatch(/_/);
      expect(label).toMatch(/[A-Za-záéíóúñÁÉÍÓÚÑ ]/);
    }

    expect(NOTIFICATION_SOURCE_LABELS).toEqual({
      approvals: "Aprobaciones",
      dashboard: "Operación",
      billing_dispatch: "Envío de facturas",
      invoice_downloads: "Descargas CFDI",
    });
  });

  it("D8: CTA «Marcar todas como leídas» listo para primary header", () => {
    expect(notificationsCopy.markAllRead).toBe("Marcar todas como leídas");
    expect(notificationsCopy.markAllReadSuccess).toMatch(/marcadas como leídas/i);
  });
});
