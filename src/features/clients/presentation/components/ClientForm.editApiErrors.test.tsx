import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ClientForm, type ClientFormRef } from "./ClientForm";
import type { Client } from "../../domain";

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@features/catalogs", () => ({
  RegimenFiscalSelect: ({
    triggerId,
    value,
    onValueChange,
    error,
  }: {
    triggerId?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    error?: boolean;
  }) => (
    <input
      id={triggerId}
      aria-invalid={error ? "true" : undefined}
      value={value ?? ""}
      onChange={(e) => onValueChange?.(e.target.value)}
      data-testid="tax-regime-select"
    />
  ),
}));

const editClient = {
  id: "c1",
  tenantId: "t1",
  clientCode: "CLI-1",
  type: "company",
  legalName: "Transportes Demo SA de CV",
  tradeName: "Demo",
  taxId: "AAA010101AAA",
  taxRegime: "601",
  paymentTerms: "cash",
  creditDays: 0,
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} as Client;

describe("ClientForm edit API field errors", () => {
  it("applyApiValidationErrors marca taxId con FieldInlineError + aria-invalid", async () => {
    const ref = createRef<ClientFormRef>();
    render(
      <ClientForm
        ref={ref}
        mode="edit"
        client={editClient}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    await act(async () => {
      ref.current?.applyApiValidationErrors([
        { field: "tax_id", message: "RFC ya registrado" },
      ]);
    });

    expect(document.getElementById("taxId-error")).toHaveTextContent(
      "RFC ya registrado",
    );
    expect(screen.getByLabelText(/RFC/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
