import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ClientForm, type ClientFormRef } from "./ClientForm";

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

describe("ClientForm optional field errors", () => {
  it("muestra FieldInlineError + aria-invalid bajo tradeName cuando es inválido", async () => {
    const ref = createRef<ClientFormRef>();
    render(
      <ClientForm
        ref={ref}
        mode="create"
        onChange={vi.fn()}
        defaultValues={{
          legalName: "Transportes Demo SA de CV",
          taxId: "AAA010101AAA",
          taxRegime: "601",
          tradeName: "x".repeat(201),
        }}
      />,
    );

    let valid = true;
    await act(async () => {
      valid = (await ref.current?.triggerValidation()) ?? true;
    });

    expect(valid).toBe(false);
    expect(document.getElementById("tradeName-error")).toBeTruthy();
    expect(screen.getByLabelText("Nombre Comercial")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
});
