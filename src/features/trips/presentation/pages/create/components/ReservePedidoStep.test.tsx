import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { MemoryRouter } from "react-router-dom";

import { TooltipProvider } from "@shared/ui/tooltip";
import { canvasCopy } from "../../../copy/canvasCopy";
import { cfdiEmissionIntentCopy } from "../../../copy/cfdiEmissionIntentCopy";
import { ReservePedidoStep } from "./ReservePedidoStep";
import {
  defaultWizardFormValues,
  type TripWizardFormValues,
} from "./validation";

const fields = canvasCopy.fields;

const { mockHasPermission } = vi.hoisted(() => ({
  mockHasPermission: vi.fn(),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

function Harness({
  clientId = "",
  profile,
}: {
  clientId?: string;
  profile?: "receptor_cfdi" | "comercial_only";
} = {}) {
  const form = useForm<TripWizardFormValues>({
    defaultValues: {
      ...(defaultWizardFormValues as TripWizardFormValues),
      clientId,
    },
  });
  return (
    <MemoryRouter>
      <TooltipProvider delayDuration={0}>
        <ReservePedidoStep
          form={form}
          clients={[
            { id: "c-1", legalName: "Cliente SA", cfdiReceptorProfile: profile },
          ]}
          isLoadingClients={false}
        />
      </TooltipProvider>
    </MemoryRouter>
  );
}

describe("ReservePedidoStep client scale", () => {
  beforeEach(() => {
    mockHasPermission.mockReset();
  });

  it("muestra Link a /clients/new si clients.create", () => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "clients" && action === "create",
    );
    render(<Harness />);

    expect(
      screen.getByRole("link", { name: fields.action.newClient }),
    ).toHaveAttribute("href", "/clients/new");
    expect(
      screen.queryByText(fields.hint.newClientEscalate),
    ).not.toBeInTheDocument();
  });

  it("oculta el alta y muestra hint de escala si !clients.create", () => {
    mockHasPermission.mockReturnValue(false);
    render(<Harness />);

    expect(
      screen.queryByRole("link", { name: fields.action.newClient }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(fields.hint.newClientEscalate)).toBeInTheDocument();
  });

  it("renderiza select Clase de ruta con default Foráneo", () => {
    mockHasPermission.mockReturnValue(false);
    render(<Harness />);

    expect(document.getElementById("routeType")).toBeInTheDocument();
    expect(screen.getByText("Foráneo")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: fields.label.routeType }),
    ).toBeInTheDocument();
  });

  it("muestra notas del pedido sin colapsable y orden lean PD1", () => {
    mockHasPermission.mockReturnValue(false);
    render(<Harness />);

    const client = document.getElementById("clientId");
    const origin = document.getElementById("originCity");
    const departure = document.getElementById("scheduledDeparture");
    const notes = document.getElementById("notes");
    const routeType = document.getElementById("routeType");

    expect(client).toBeTruthy();
    expect(origin).toBeTruthy();
    expect(departure).toBeTruthy();
    expect(notes).toBeTruthy();
    expect(routeType).toBeTruthy();

    const following = Node.DOCUMENT_POSITION_FOLLOWING;
    expect(client!.compareDocumentPosition(origin!) & following).toBeTruthy();
    expect(origin!.compareDocumentPosition(departure!) & following).toBeTruthy();
    expect(departure!.compareDocumentPosition(notes!) & following).toBeTruthy();
    expect(notes!.compareDocumentPosition(routeType!) & following).toBeTruthy();

    expect(
      screen.getByRole("textbox", { name: fields.label.notes }),
    ).toBeInTheDocument();
  });

  it("eco de solo lectura Factura del viaje, sin selector", () => {
    mockHasPermission.mockReturnValue(false);
    const { rerender } = render(<Harness clientId="c-1" profile="receptor_cfdi" />);

    expect(
      screen.getByText(
        `${cfdiEmissionIntentCopy.field.label}: ${cfdiEmissionIntentCopy.options.emitir_cfdi}`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(canvasCopy.invoiceEcho.inherited),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", {
        name: cfdiEmissionIntentCopy.field.label,
      }),
    ).not.toBeInTheDocument();

    rerender(<Harness clientId="c-1" profile="comercial_only" />);
    expect(
      screen.getByText(
        `${cfdiEmissionIntentCopy.field.label}: ${cfdiEmissionIntentCopy.options.sin_cfdi_efectivo}`,
      ),
    ).toBeInTheDocument();
  });

  it("no muestra el eco si todavía no hay cliente", () => {
    mockHasPermission.mockReturnValue(false);
    render(<Harness />);
    expect(
      screen.queryByText(canvasCopy.invoiceEcho.inherited),
    ).not.toBeInTheDocument();
  });
});
