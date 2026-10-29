import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { wizardCopy } from "../../../copy";
import {
  publicGeneralRfcNotice,
  stopRfcNotClientOrCompanyNotice,
  ubicacionRfcSatNotice,
} from "./stopDialogFiscalCopy";
import { StopFormSheet } from "./StopFormSheet";

vi.mock("@shared/permissions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/permissions")>();
  return {
    ...actual,
    usePermissions: () => ({ hasPermission: () => false }),
  };
});

vi.mock("@features/clients/application/hooks/useClients", () => ({
  useActiveClients: () => ({ data: [] }),
}));

vi.mock("@features/clients/application/hooks/useClientAddresses", () => ({
  useClientAddress: () => ({ data: undefined }),
}));

vi.mock("@features/clients/application/hooks/useUpdateClientAddress", () => ({
  useUpdateClientAddress: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@features/partners", () => ({
  PartnerSnapshotPicker: () => null,
}));

vi.mock("@shared/ui/address-input", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/ui/address-input")>();
  return {
    ...actual,
    EntityAddressForm: () => null,
  };
});

vi.mock("@shared/ui/location", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/ui/location")>();
  return {
    ...actual,
    LocationField: () => <div data-testid="location-field-stub" />,
  };
});

const SAT_NOTICE = ubicacionRfcSatNotice();
const NOT_CLIENT_NOTICE = stopRfcNotClientOrCompanyNotice();

function renderSheet(
  props: Partial<ComponentProps<typeof StopFormSheet>> = {},
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <StopFormSheet
        open
        variant="inline"
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        initialData={{ stopCategory: "origin" }}
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe("StopFormSheet RFC de la ubicación", () => {
  it("muestra inscripción y la línea de que no es el RFC del cliente bajo el RFC", async () => {
    renderSheet();
    expect(await screen.findByText(SAT_NOTICE)).toBeInTheDocument();
    expect(screen.getByText(NOT_CLIENT_NOTICE)).toBeInTheDocument();
    expect(screen.queryByText(publicGeneralRfcNotice())).not.toBeInTheDocument();
  });

  it("no muestra las líneas mientras el colapsable está cerrado", async () => {
    const user = userEvent.setup();
    renderSheet({ keepBillingCollapsed: true });

    expect(screen.queryByText(SAT_NOTICE)).not.toBeInTheDocument();
    expect(screen.queryByText(NOT_CLIENT_NOTICE)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "RFC de esta parada" }),
    );
    expect(await screen.findByText(SAT_NOTICE)).toBeInTheDocument();
    expect(screen.getByText(NOT_CLIENT_NOTICE)).toBeInTheDocument();
  });

  it("oculta solo la frase de inscripción en cada RFC genérico", async () => {
    const mixed = renderSheet({
      initialData: {
        stopCategory: "waypoint",
        stopType: ["waypoint", "pickup", "delivery"],
        rfcRemitenteDestinatario: "  xaxx010101000  ",
        deliveryRfcRemitenteDestinatario: "EKU9003173C9",
      },
    });

    expect(await screen.findByLabelText(/RFC de quien entrega/)).toHaveValue(
      "  xaxx010101000  ",
    );
    expect(screen.getByLabelText(/RFC de quien recibe/)).toHaveValue(
      "EKU9003173C9",
    );
    expect(screen.getAllByText(SAT_NOTICE)).toHaveLength(1);
    expect(screen.getAllByText(NOT_CLIENT_NOTICE)).toHaveLength(2);
    expect(screen.getByText(publicGeneralRfcNotice())).toBeInTheDocument();
    mixed.unmount();

    renderSheet({
      initialData: {
        stopCategory: "waypoint",
        stopType: ["waypoint", "pickup", "delivery"],
        rfcRemitenteDestinatario: "XEXX010101000",
        deliveryRfcRemitenteDestinatario: "XAXX010101000",
      },
    });

    expect(await screen.findByLabelText(/RFC de quien entrega/)).toHaveValue(
      "XEXX010101000",
    );
    expect(screen.queryAllByText(SAT_NOTICE)).toHaveLength(0);
    expect(screen.getAllByText(NOT_CLIENT_NOTICE)).toHaveLength(2);
    expect(screen.getByText(publicGeneralRfcNotice())).toBeInTheDocument();
    expect(screen.queryByText(/queda resuelto/i)).not.toBeInTheDocument();
  });

  it("oculta ambas líneas mientras el RFC muestra error", async () => {
    const user = userEvent.setup();
    renderSheet();
    expect(await screen.findByText(SAT_NOTICE)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: wizardCopy.route.stopForm.action.save }),
    );

    const rfcError = wizardCopy.route.stopForm.validation.fieldRequired(
      wizardCopy.fiscal.missingLabels.primaryRfc,
    );
    expect(await screen.findByText(rfcError)).toBeInTheDocument();
    expect(screen.queryByText(SAT_NOTICE)).not.toBeInTheDocument();
    expect(screen.queryByText(NOT_CLIENT_NOTICE)).not.toBeInTheDocument();
  });
});
