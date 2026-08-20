import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ComponentProps } from "react";
import { InvoiceConceptLineSheet } from "./InvoiceConceptLineSheet";
import { invoicingCopy } from "../copy/invoicingCopy";
import {
  applyConceptTaxFlags,
  defaultFleteConceptFormLine,
  type InvoiceConceptFormLine,
} from "../validation/invoiceFormSchema";

type SearchMockProps = {
  id?: string;
  value?: string;
  onSelect?: (item: { code: string; name: string }) => void;
  onClear?: () => void;
  error?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

function CatalogSearchMock({
  id,
  value,
  onSelect,
  onClear,
  error,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  label,
}: SearchMockProps & { label: string }) {
  return (
    <div>
      <input
        id={id}
        aria-label={label}
        value={value ?? ""}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        data-error={error ? "true" : undefined}
        onChange={(event) => {
          const code = event.target.value;
          if (!code) {
            onClear?.();
            return;
          }
          onSelect?.({ code, name: code === "E48" ? "Servicio" : "Concepto" });
        }}
      />
      {value ? (
        <button type="button" aria-label={`Limpiar ${label}`} onClick={() => onClear?.()}>
          Limpiar
        </button>
      ) : null}
    </div>
  );
}

vi.mock("@features/catalogs", () => ({
  ProductoServicioSearch: (props: SearchMockProps) => (
    <CatalogSearchMock {...props} label="Clave producto/servicio" />
  ),
  UnidadMedidaSearch: (props: SearchMockProps) => (
    <CatalogSearchMock {...props} label="Clave unidad" />
  ),
}));

const sheetCopy = invoicingCopy.concepts.sheet;
const validation = sheetCopy.validation;

const validServiceLine: InvoiceConceptFormLine = {
  concept_type: "service",
  clave_prod_serv: "78101800",
  clave_unidad: "E48",
  unidad: "Servicio",
  description: "Maniobras",
  quantity: 1,
  unit_price: 500,
  amount: 500,
  ...applyConceptTaxFlags(true, false, 0.16),
};

function renderSheet(
  props: Partial<ComponentProps<typeof InvoiceConceptLineSheet>> = {},
) {
  const onApply = vi.fn();
  const onOpenChange = vi.fn();
  render(
    <MemoryRouter>
      <InvoiceConceptLineSheet
        open
        onOpenChange={onOpenChange}
        mode="create-service"
        initialValues={null}
        editingIndex={null}
        catalogServices={[]}
        taxRate={0.16}
        onApply={onApply}
        {...props}
      />
    </MemoryRouter>,
  );
  return { onApply, onOpenChange };
}

describe("InvoiceConceptLineSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("con unit_price 0 muestra resumen ES al guardar", async () => {
    const user = userEvent.setup();
    renderSheet({
      mode: "edit",
      initialValues: { ...validServiceLine, unit_price: 0, amount: 0 },
      editingIndex: 0,
    });

    await user.click(screen.getByRole("button", { name: sheetCopy.apply }));

    await waitFor(() => {
      expect(screen.getByText(sheetCopy.validationSummary)).toBeInTheDocument();
    });
    expect(
      screen.getAllByText(validation.unitPriceRequired).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("Guardar concepto llama onApply con la partida", async () => {
    const user = userEvent.setup();
    const { onApply, onOpenChange } = renderSheet({
      mode: "edit",
      initialValues: validServiceLine,
      editingIndex: 1,
    });

    await user.click(screen.getByRole("button", { name: sheetCopy.apply }));

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledTimes(1);
    });
    expect(onApply).toHaveBeenCalledWith(validServiceLine, 1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("onClear de clave SAT limpia el valor en el control", async () => {
    const user = userEvent.setup();
    renderSheet({
      mode: "edit",
      initialValues: validServiceLine,
      editingIndex: 0,
    });

    await user.click(screen.getByText(invoicingCopy.concepts.satDetailsTrigger));

    const claveInput = await screen.findByLabelText("Clave producto/servicio");
    expect(claveInput).toHaveValue("78101800");

    await user.click(
      screen.getByRole("button", { name: "Limpiar Clave producto/servicio" }),
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Clave producto/servicio")).toHaveValue("");
    });
  });

  it("flete con retentionRequired fuerza IVA y retención al aplicar", async () => {
    const user = userEvent.setup();
    const fleteSinRetencion = {
      ...defaultFleteConceptFormLine(1000, {
        taxRate: 0.16,
        ivaAplica: true,
        retencionAplica: false,
      }),
    };
    const { onApply } = renderSheet({
      mode: "edit",
      initialValues: fleteSinRetencion,
      editingIndex: 0,
      retentionRequired: true,
    });

    await waitFor(() => {
      expect(screen.getByText(sheetCopy.retencionRequiredHint)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: sheetCopy.apply }));

    await waitFor(() => {
      expect(onApply).toHaveBeenCalledTimes(1);
    });
    const [applied] = onApply.mock.calls[0] as [InvoiceConceptFormLine, number];
    expect(applied.retained_iva_rate).toBe(0.04);
    expect(applied.iva_rate).toBe(0.16);
    expect(applied.object_imp).toBe("02");
  });

  it("enfoca descripción cuando es el primer error", async () => {
    const user = userEvent.setup();
    renderSheet({
      mode: "edit",
      initialValues: { ...validServiceLine, description: "" },
      editingIndex: 0,
    });

    await user.click(screen.getByRole("button", { name: sheetCopy.apply }));

    const description = screen.getByLabelText(/Descripción/i);
    await waitFor(() => {
      expect(description).toHaveFocus();
    });
  });
});
