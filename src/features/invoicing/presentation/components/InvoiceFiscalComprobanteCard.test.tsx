import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { InvoiceFiscalComprobanteCard } from "./InvoiceFiscalComprobanteCard";
import { invoicingCopy } from "../copy/invoicingCopy";
import type { InvoiceFormValues } from "../validation/invoiceFormSchema";

vi.mock("@features/catalogs", () => ({
  CatalogTypeCode: {
    SAT_REGIMEN_FISCAL: "sat_regimen_fiscal",
    SAT_USO_CFDI: "sat_uso_cfdi",
    SAT_FORMA_PAGO: "sat_forma_pago",
    SAT_METODO_PAGO: "sat_metodo_pago",
  },
  useCatalogOptions: (typeCode: string) => {
    const options: Record<string, Array<{ code: string; name: string }>> = {
      sat_regimen_fiscal: [
        {
          code: "603",
          name: "Personas Morales con Fines no Lucrativos",
        },
      ],
      sat_uso_cfdi: [{ code: "S01", name: "Sin efectos fiscales" }],
      sat_forma_pago: [{ code: "99", name: "Por definir" }],
      sat_metodo_pago: [
        { code: "PUE", name: "Pago en una sola exhibición" },
      ],
    };
    return { data: options[typeCode] ?? [] };
  },
}));

const dual = invoicingCopy.labelDual;
const comprobanteCopy = invoicingCopy.comprobante;

function renderCard(onEdit = vi.fn()) {
  function Harness() {
    const form = useForm<InvoiceFormValues>({
      defaultValues: {
        receiver_tax_regime: "603",
        receiver_postal_code: "63734",
        cfdi_usage: "S01",
        payment_form: "99",
        payment_method: "PUE",
      } as InvoiceFormValues,
    });

    return (
      <InvoiceFiscalComprobanteCard control={form.control} onEdit={onEdit} />
    );
  }

  return { onEdit, ...render(<Harness />) };
}

describe("InvoiceFiscalComprobanteCard", () => {
  it("renders dual labels and catalog names without collapsing to codes", () => {
    renderCard();

    expect(
      screen.getByRole("heading", { name: comprobanteCopy.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(dual.taxRegime)).toBeInTheDocument();
    expect(screen.getByText(`(${dual.taxRegimeSat})`)).toBeInTheDocument();
    expect(
      screen.getByText("Personas Morales con Fines no Lucrativos"),
    ).toBeInTheDocument();
    expect(screen.getByText(dual.cfdiUsage)).toBeInTheDocument();
    expect(screen.getByText("Sin efectos fiscales")).toBeInTheDocument();
    expect(screen.getByText("63734")).toBeInTheDocument();
    expect(
      screen.getByText("Pago en una sola exhibición · Por definir"),
    ).toBeInTheDocument();
  });

  it("opens the fiscal correction sheet from the card action", async () => {
    const user = userEvent.setup();
    const { onEdit } = renderCard();

    await user.click(
      screen.getByRole("button", { name: comprobanteCopy.edit }),
    );

    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
