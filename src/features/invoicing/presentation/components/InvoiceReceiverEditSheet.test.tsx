import { forwardRef } from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InvoiceReceiverEditSheet } from "./InvoiceReceiverEditSheet";
import { invoicingCopy } from "../copy/invoicingCopy";
import type { InvoiceReceiverFormValues } from "../validation/invoiceFormSchema";

type CatalogSelectMockProps = {
  triggerId?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

function mockCatalogSelect(label: string) {
  return forwardRef<HTMLButtonElement, CatalogSelectMockProps>(
    function CatalogSelectMock(
      {
        triggerId,
        value,
        onValueChange,
        placeholder,
        error,
        disabled,
        "aria-invalid": ariaInvalid,
        "aria-describedby": ariaDescribedBy,
      },
      ref,
    ) {
      return (
        <button
          type="button"
          ref={ref}
          id={triggerId}
          disabled={disabled}
          aria-label={label}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          data-error={error ? "true" : undefined}
          data-value={value ?? ""}
          onClick={() => onValueChange?.(value || "601")}
        >
          {value || placeholder || label}
        </button>
      );
    },
  );
}

vi.mock("@features/catalogs/presentation/components", () => ({
  RegimenFiscalSelect: mockCatalogSelect("Régimen del receptor"),
  UsoCfdiSelect: mockCatalogSelect("Para qué se usa la factura"),
  MetodoPagoSelect: mockCatalogSelect("Cómo se cobra"),
  FormaPagoSelect: mockCatalogSelect("Con qué medio se paga"),
}));

const sheetCopy = invoicingCopy.comprobante.sheet;
const receiverValidation = sheetCopy.validation;

const emptyValues: InvoiceReceiverFormValues = {
  receiver_rfc: "",
  receiver_name: "",
  receiver_tax_regime: "",
  receiver_postal_code: "",
  cfdi_usage: "",
  payment_form: "",
  payment_method: "PUE",
};

const validValues: InvoiceReceiverFormValues = {
  receiver_rfc: "CDE010101AB1",
  receiver_name: "Cliente Demo SA",
  receiver_tax_regime: "601",
  receiver_postal_code: "64000",
  cfdi_usage: "S01",
  payment_form: "99",
  payment_method: "PUE",
};

describe("InvoiceReceiverEditSheet", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("con validateOnOpen muestra resumen y mensajes ES de catálogos", async () => {
    render(
      <InvoiceReceiverEditSheet
        open
        onOpenChange={vi.fn()}
        values={emptyValues}
        onApply={vi.fn()}
        validateOnOpen
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(sheetCopy.validationSummary),
      ).toBeInTheDocument();
    });

    expect(
      screen.getAllByText(receiverValidation.taxRegimeRequired).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(receiverValidation.cfdiUsageRequired).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(receiverValidation.paymentFormRequired).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/Too small/i)).not.toBeInTheDocument();
  });

  it("Aplicar cambios llama onApply con los valores del form", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <InvoiceReceiverEditSheet
        open
        onOpenChange={onOpenChange}
        values={validValues}
        onApply={onApply}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: sheetCopy.apply }),
    );

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledTimes(1);
    });
    expect(onApply).toHaveBeenCalledWith(validValues);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("RFC genérico: fija 616 y S01, bloquea los selects y aplica sin tocarlos", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();

    render(
      <InvoiceReceiverEditSheet
        open
        onOpenChange={vi.fn()}
        values={{
          ...validValues,
          receiver_rfc: "XAXX010101000",
          receiver_name: "",
          receiver_tax_regime: "626",
          cfdi_usage: "G03",
        }}
        onApply={onApply}
      />,
    );

    const regime = screen.getByRole("button", { name: "Régimen del receptor" });
    const usage = screen.getByRole("button", {
      name: "Para qué se usa la factura",
    });
    await waitFor(() => {
      expect(regime).toHaveAttribute("data-value", "616");
    });
    expect(usage).toHaveAttribute("data-value", "S01");
    expect(regime).toBeDisabled();
    expect(usage).toBeDisabled();
    expect(
      screen.getAllByText(invoicingCopy.genericReceiver.lockedHelp("national"))
        .length,
    ).toBe(2);

    await user.click(screen.getByRole("button", { name: sheetCopy.apply }));

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledTimes(1);
    });
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        receiver_rfc: "XAXX010101000",
        receiver_name: "PUBLICO EN GENERAL",
        receiver_tax_regime: "616",
        cfdi_usage: "S01",
      }),
    );
  });

  it("al salir de RFC genérico vacía régimen y uso y no aplica sin elegirlos", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();

    render(
      <InvoiceReceiverEditSheet
        open
        onOpenChange={vi.fn()}
        values={{
          ...validValues,
          receiver_rfc: "XAXX010101000",
          receiver_tax_regime: "616",
          cfdi_usage: "S01",
        }}
        onApply={onApply}
      />,
    );

    const rfcInput = screen.getByLabelText(/^RFC/);
    await user.clear(rfcInput);
    await user.type(rfcInput, "CDE010101AB1");

    const regime = screen.getByRole("button", { name: "Régimen del receptor" });
    await waitFor(() => {
      expect(regime).toHaveAttribute("data-value", "");
    });
    expect(regime).not.toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Para qué se usa la factura" }),
    ).toHaveAttribute("data-value", "");

    await user.click(screen.getByRole("button", { name: sheetCopy.apply }));

    await waitFor(() => {
      expect(screen.getByText(sheetCopy.validationSummary)).toBeInTheDocument();
    });
    expect(onApply).not.toHaveBeenCalled();
  });

  it("enfoca el campo de texto indicado en focusField", async () => {
    render(
      <InvoiceReceiverEditSheet
        open
        onOpenChange={vi.fn()}
        values={emptyValues}
        onApply={vi.fn()}
        validateOnOpen
        focusField="receiver_name"
      />,
    );

    const nameInput = screen.getByLabelText(/Nombre \/ razón social/i);
    await waitFor(() => {
      expect(nameInput).toHaveFocus();
    });
  });
});
