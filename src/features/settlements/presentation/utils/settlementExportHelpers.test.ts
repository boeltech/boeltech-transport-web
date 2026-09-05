import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  exportSettlementsCsv,
  exportDriverAdvancesCsv,
} from "./settlementExportHelpers";
import type { DriverAdvance, DriverSettlement } from "../../domain/entities";

const mockDownloadCsv = vi.fn();

vi.mock("@shared/utils/exportCsv", () => ({
  downloadCsv: (...args: unknown[]) => mockDownloadCsv(...args),
}));

describe("settlementExportHelpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("exportDriverAdvancesCsv", () => {
    it("exporta anticipos correctamente con cálculo de saldo y headers correspondientes", () => {
      const advances: DriverAdvance[] = [
        {
          id: "adv-1",
          tenantId: "tenant-1",
          folio: "ANT-202608-0001",
          employeeId: "emp-1",
          employeeFullName: "Pedro Infante",
          tripId: "trip-1",
          tripCode: "TRP-101",
          amount: 2500,
          balanceRemaining: 1000,
          currency: "MXN",
          category: "travel_advance",
          status: "partially_applied",
          disbursedAt: "2026-08-10T10:00:00Z",
          paymentMethod: "bank_transfer",
          bankReference: "SPEI-12345",
          notes: "Viáticos CDMX-GDL",
          createdAt: "2026-08-10T09:00:00Z",
          updatedAt: "2026-08-15T12:00:00Z",
        },
      ];

      exportDriverAdvancesCsv(advances);

      expect(mockDownloadCsv).toHaveBeenCalledTimes(1);
      const [filename, headers, rows] = mockDownloadCsv.mock.calls[0]!;

      expect(filename).toMatch(/^anticipos-operadores-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(headers).toEqual([
        "Folio",
        "Operador",
        "Categoría",
        "Monto Solicitado",
        "Monto Aplicado",
        "Saldo Pendiente",
        "Estado",
        "Fecha Creación",
        "Observaciones",
      ]);

      expect(rows).toHaveLength(1);
      const row = rows[0];
      expect(row[0]).toBe("ANT-202608-0001");
      expect(row[1]).toBe("Pedro Infante");
      expect(row[2]).toBe("Anticipo de viaje");
      expect(row[3]).toBe(2500);
      expect(row[4]).toBe(1500); // 2500 - 1000 aplicado
      expect(row[5]).toBe(1000); // balance remaining
      expect(row[6]).toBe("Parcialmente descontado");
      expect(row[7]).toBe("2026-08-10");
      expect(row[8]).toBe("Viáticos CDMX-GDL");
    });
  });

  describe("exportSettlementsCsv", () => {
    it("exporta liquidaciones con montos y fechas formateadas", () => {
      const settlements: DriverSettlement[] = [
        {
          id: "st-1",
          tenantId: "tenant-1",
          settlementNumber: "LIQ-202608-0001",
          employeeId: "emp-1",
          employeeFullName: "Pedro Infante",
          agreementSnapshot: { currency: "MXN" },
          periodStart: "2026-08-01",
          periodEnd: "2026-08-15",
          status: "approved",
          totalTripsCommission: 4500,
          totalBaseSalary: 0,
          totalReimbursableExpenses: 500,
          totalBonuses: 0,
          totalAdvancesDeducted: 1000,
          totalOtherDeductions: 0,
          grossAmount: 5000,
          netAmount: 4000,
          currency: "MXN",
          disbursedAt: null,
          disbursedBy: null,
          disbursementMethod: null,
          disbursementReference: null,
          approvedAt: "2026-08-16T10:00:00Z",
          approvedBy: "user-1",
          rejectionReason: null,
          notes: "Corte quincenal",
          createdAt: "2026-08-15T18:00:00Z",
          updatedAt: "2026-08-16T10:00:00Z",
        },
      ];

      exportSettlementsCsv(settlements);

      expect(mockDownloadCsv).toHaveBeenCalledTimes(1);
      const [filename, headers, rows] = mockDownloadCsv.mock.calls[0]!;

      expect(filename).toMatch(/^liquidaciones-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(headers).toContain("Folio");
      expect(headers).toContain("Monto Neto");
      expect(rows[0][0]).toBe("LIQ-202608-0001");
      expect(rows[0][7]).toBe(4000); // netAmount
    });
  });
});
