import { describe, expect, it } from "vitest";
import type { DriverAdvance } from "../../domain/entities";
import type { DriverAdvanceEditValues } from "../validation/settlementSchemas";
import {
  appendAdvanceNote,
  diffAdvanceEdit,
  isAdvanceDisbursed,
  isAdvanceEditable,
  isAdvanceReturned,
  lastAdvanceSignature,
} from "./advanceEditing";

const advance: DriverAdvance = {
  id: "adv-1",
  tenantId: "tenant-1",
  folio: "ANT-202610-0001",
  employeeId: "emp-1",
  employeeFullName: "Pedro Infante",
  tripId: null,
  tripCode: null,
  amount: 8000,
  balanceRemaining: 8000,
  currency: "MXN",
  category: "travel_advance",
  status: "pending_disbursement",
  disbursedAt: null,
  paymentMethod: "bank_transfer",
  bankReference: null,
  notes: "Casetas",
  approvedByName: "Ana López",
  approvedAt: "2026-10-02T10:00:00Z",
  createdAt: "2026-10-01T10:00:00Z",
  updatedAt: "2026-10-01T10:00:00Z",
};

const values = (overrides: Partial<DriverAdvanceEditValues> = {}): DriverAdvanceEditValues => ({
  employeeId: "emp-1",
  tripId: "",
  amount: 8000,
  category: "travel_advance",
  paymentMethod: "bank_transfer",
  bankReference: "",
  notes: "Casetas",
  ...overrides,
});

describe("advanceEditing", () => {
  it("clasifica estados editables, entregados y devueltos", () => {
    expect(isAdvanceEditable("pending_disbursement")).toBe(true);
    expect(isAdvanceEditable("disbursed")).toBe(false);
    expect(isAdvanceDisbursed("partially_applied")).toBe(true);
    expect(isAdvanceDisbursed("draft")).toBe(false);
    expect(
      isAdvanceReturned({
        status: "draft",
        approval: { flowStatus: "returned" } as DriverAdvance["approval"],
      }),
    ).toBe(true);
    expect(isAdvanceReturned({ status: "draft", approval: null })).toBe(false);
  });

  it("D18: cambio de monto autorizado es material y pide confirmación con «$8,000 → $12,000»", () => {
    const diff = diffAdvanceEdit(advance, values({ amount: 12000 }));

    expect(diff.material).toBe(true);
    expect(diff.requiresConfirmation).toBe(true);
    expect(diff.payload).toEqual({ expectedStatus: "pending_disbursement", amount: 12000 });
    expect(diff.changes).toHaveLength(1);
    expect(`${diff.changes[0].from} → ${diff.changes[0].to}`).toMatch(/8,000.*→.*12,000/);
  });

  it("D18: asignar viaje es material y manda tripId en el payload", () => {
    const tripId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    const diff = diffAdvanceEdit(advance, values({ tripId }), {
      trip: { from: "Sin viaje (cuenta del operador)", to: "V-2026-001" },
    });

    expect(diff.material).toBe(true);
    expect(diff.requiresConfirmation).toBe(true);
    expect(diff.payload).toEqual({
      expectedStatus: "pending_disbursement",
      tripId,
    });
    expect(diff.changes).toEqual([
      {
        field: "tripId",
        label: "Viaje",
        from: "Sin viaje (cuenta del operador)",
        to: "V-2026-001",
      },
    ]);
  });

  it("D18: quitar viaje manda tripId null y es material", () => {
    const withTrip: DriverAdvance = {
      ...advance,
      tripId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      tripCode: "V-2026-001",
    };
    const diff = diffAdvanceEdit(withTrip, values({ tripId: "" }));

    expect(diff.material).toBe(true);
    expect(diff.requiresConfirmation).toBe(true);
    expect(diff.payload).toEqual({
      expectedStatus: "pending_disbursement",
      tripId: null,
    });
    expect(diff.changes[0]).toMatchObject({
      field: "tripId",
      from: "V-2026-001",
      to: "Sin viaje (cuenta del operador)",
    });
  });

  it("solo nota: sin confirmación y payload solo con notas", () => {
    const diff = diffAdvanceEdit(advance, values({ notes: "Casetas y comida" }));

    expect(diff.material).toBe(false);
    expect(diff.requiresConfirmation).toBe(false);
    expect(diff.payload).toEqual({
      expectedStatus: "pending_disbursement",
      notes: "Casetas y comida",
    });
  });

  it("sin cambios devuelve payload null; vaciar referencia/nota manda null", () => {
    expect(diffAdvanceEdit(advance, values()).payload).toBeNull();
    expect(diffAdvanceEdit(advance, values({ notes: "  " })).payload).toEqual({
      expectedStatus: "pending_disbursement",
      notes: null,
    });
  });

  it("en borrador un cambio material no pide confirmación; el operador solo cambia en borrador", () => {
    const draft = { ...advance, status: "draft" as const };
    const diff = diffAdvanceEdit(draft, values({ employeeId: "emp-2", amount: 9000 }), {
      employee: { from: "Pedro Infante", to: "Juan Pérez" },
    });
    expect(diff.requiresConfirmation).toBe(false);
    expect(diff.payload).toMatchObject({ employeeId: "emp-2", amount: 9000 });

    const pending = diffAdvanceEdit(advance, values({ employeeId: "emp-2" }));
    expect(pending.payload).toBeNull();
  });

  it("firma vigente: último paso firmado o aprobador legado en pendiente de entrega", () => {
    expect(lastAdvanceSignature(advance)).toEqual({
      name: "Ana López",
      role: null,
      decidedAt: "2026-10-02T10:00:00Z",
    });
    expect(lastAdvanceSignature({ ...advance, status: "draft" })).toBeNull();
  });

  it("D19: la nota nueva conserva la anterior y agrega la fecha", () => {
    expect(appendAdvanceNote("Casetas", " Devolvió $500 ", "3 oct")).toBe(
      "Casetas\n— 3 oct: Devolvió $500",
    );
    expect(appendAdvanceNote(null, "Primera", "3 oct")).toBe("— 3 oct: Primera");
  });
});
