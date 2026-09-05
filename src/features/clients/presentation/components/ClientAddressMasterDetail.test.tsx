import { describe, expect, it, vi, beforeEach } from "vitest";
import { forwardRef, useImperativeHandle } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@shared/api/interceptors/error-handler";
import type { ClientAddress, ClientAddressListItem } from "../../domain";
import type { ClientAddressFormData } from "../validation/clientAddressSchema";
import { clientDetailCopy } from "../copy/clientDetailCopy";
import { ClientAddressMasterDetail } from "./ClientAddressMasterDetail";
import type { ClientAddressFormRef } from "./ClientAddressForm";

const copy = clientDetailCopy.address;

const refetchAddresses = vi.fn();
const refetchDetail = vi.fn();
const createMutate = vi.fn();
const updateMutate = vi.fn();
const deleteMutate = vi.fn();

let createPending = false;

const listItem: ClientAddressListItem = {
  id: "addr-1",
  addressType: "shipping",
  isPrimary: false,
  isActive: true,
  locationName: "Bodega Norte",
  postalCode: "64000",
  satStateCode: "NLE",
};

const detail: ClientAddress = {
  id: "addr-1",
  tenantId: "tenant-1",
  clientId: "client-1",
  addressType: "shipping",
  isPrimary: false,
  isActive: true,
  locationName: "Bodega Norte",
  street: "Av Industrial",
  exteriorNumber: "100",
  postalCode: "64000",
  satCountryCode: "MEX",
  satStateCode: "NLE",
  satMunicipalityCode: "039",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

let addressesQuery: {
  data: unknown;
  isLoading: boolean;
  isError: boolean;
  refetch: typeof refetchAddresses;
} = {
  data: [],
  isLoading: false,
  isError: false,
  refetch: refetchAddresses,
};

let addressDetailQuery: {
  data: ClientAddress | null | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: typeof refetchDetail;
} = {
  data: undefined,
  isLoading: false,
  isError: false,
  refetch: refetchDetail,
};

const formValues: ClientAddressFormData = {
  addressType: "shipping",
  isPrimary: false,
  locationName: "Bodega Norte",
  street: "Av Industrial",
  exteriorNumber: "100",
  interiorNumber: null,
  reference: null,
  postalCode: "64000",
  satCountryCode: "MEX",
  satStateCode: "NLE",
  satMunicipalityCode: "039",
  satLocalityCode: null,
  localityName: null,
  satNeighborhoodCode: null,
  neighborhoodName: null,
  latitude: null,
  longitude: null,
  rfcRemitenteDestinatario: "",
  nombreRemitenteDestinatario: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  businessHours: "",
  notes: "",
  specialInstructions: "",
};

const getValues = vi.fn(() => formValues);
const triggerValidation = vi.fn(async () => true);
const applySatFieldErrors = vi.fn();
const applyApiValidationErrors = vi.fn(() => []);

vi.mock("@shared/hooks", () => ({
  useMediaQuery: () => false,
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("../../application", () => ({
  useClientAddresses: () => addressesQuery,
  useClientAddress: () => addressDetailQuery,
  useCreateClientAddress: () => ({
    mutate: createMutate,
    get isPending() {
      return createPending;
    },
  }),
  useUpdateClientAddress: () => ({
    mutate: updateMutate,
    isPending: false,
  }),
  useSetPrimaryClientAddress: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteClientAddress: () => ({
    mutate: deleteMutate,
    isPending: false,
  }),
}));

vi.mock("../hooks/useClientAddressLocationLabels", () => ({
  useClientAddressLocationLabels: () => ({
    isLoading: false,
    stateLabel: "Nuevo León",
    municipalityLabel: null,
  }),
}));

vi.mock("./ClientAddressForm", () => {
  const Stub = forwardRef<ClientAddressFormRef>(function ClientAddressFormStub(
    _props,
    ref,
  ) {
    useImperativeHandle(ref, () => ({
      triggerValidation,
      getValues,
      applySatFieldErrors,
      applyApiValidationErrors,
      clearApiFieldErrors: () => undefined,
    }));
    return <div data-testid="client-address-form-stub" />;
  });
  return { ClientAddressForm: Stub };
});

vi.mock("../validation/clientAddressSchema", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../validation/clientAddressSchema")>();
  return {
    ...actual,
    validateClientAddressFormComplete: vi.fn(async () => ({ ok: true as const })),
  };
});

describe("ClientAddressMasterDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createPending = false;
    addressesQuery = {
      data: [],
      isLoading: false,
      isError: false,
      refetch: refetchAddresses,
    };
    addressDetailQuery = {
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: refetchDetail,
    };
    getValues.mockReturnValue(formValues);
    triggerValidation.mockResolvedValue(true);
  });

  it("shows list error with retry instead of empty create CTA when query fails", async () => {
    const user = userEvent.setup();
    addressesQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: refetchAddresses,
    };

    render(<ClientAddressMasterDetail clientId="client-1" />);

    expect(screen.getByText(copy.listErrorTitle)).toBeInTheDocument();
    expect(screen.queryByText(copy.emptyTitle)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.emptyCta }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.listErrorRetry }));
    expect(refetchAddresses).toHaveBeenCalled();
  });

  it("shows detail error with retry when detail query fails", async () => {
    const user = userEvent.setup();
    addressesQuery = {
      data: [listItem],
      isLoading: false,
      isError: false,
      refetch: refetchAddresses,
    };
    addressDetailQuery = {
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: refetchDetail,
    };

    render(<ClientAddressMasterDetail clientId="client-1" />);

    expect(screen.getByText(copy.detailErrorTitle)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.edit })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.detailErrorRetry }));
    expect(refetchDetail).toHaveBeenCalled();
  });

  it("shows detail error when detail resolves to null (404 mapped)", async () => {
    addressesQuery = {
      data: [listItem],
      isLoading: false,
      isError: false,
      refetch: refetchAddresses,
    };
    addressDetailQuery = {
      data: null,
      isLoading: false,
      isError: false,
      refetch: refetchDetail,
    };

    render(<ClientAddressMasterDetail clientId="client-1" />);

    expect(screen.getByText(copy.detailErrorTitle)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.edit })).not.toBeInTheDocument();
  });

  it("does not submit create while mutation is pending", async () => {
    const user = userEvent.setup();
    createPending = true;
    addressesQuery = {
      data: [],
      isLoading: false,
      isError: false,
      refetch: refetchAddresses,
    };

    render(
      <ClientAddressMasterDetail
        clientId="client-1"
        clientRfc="XAXX010101000"
        clientName="Demo SA"
      />,
    );

    await user.click(screen.getByRole("button", { name: copy.emptyCta }));
    expect(screen.getByTestId("client-address-form-stub")).toBeInTheDocument();

    // Botón Guardar está disabled; el atajo Ctrl+S debe respetar isPending.
    await user.keyboard("{Control>}s{/Control}");

    expect(createMutate).not.toHaveBeenCalled();
    expect(triggerValidation).not.toHaveBeenCalled();
  });

  it("submits create using form getValues instead of parent shadow state", async () => {
    const user = userEvent.setup();
    addressesQuery = {
      data: [],
      isLoading: false,
      isError: false,
      refetch: refetchAddresses,
    };

    render(
      <ClientAddressMasterDetail
        clientId="client-1"
        clientRfc="XAXX010101000"
        clientName="Demo SA"
      />,
    );

    await user.click(screen.getByRole("button", { name: copy.emptyCta }));
    expect(screen.getByTestId("client-address-form-stub")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.createSubmit }));

    expect(triggerValidation).toHaveBeenCalled();
    expect(getValues).toHaveBeenCalled();
    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "client-1",
        data: expect.objectContaining({
          locationName: "Bodega Norte",
          street: "Av Industrial",
          addressType: "shipping",
        }),
      }),
      expect.any(Object),
    );
  });

  it("maps API validation errors onto the form on create failure", async () => {
    const user = userEvent.setup();
    render(<ClientAddressMasterDetail clientId="client-1" />);

    await user.click(screen.getByRole("button", { name: copy.emptyCta }));
    await user.click(screen.getByRole("button", { name: copy.createSubmit }));

    const mutateOptions = createMutate.mock.calls[0]?.[1] as {
      onError?: (error: Error) => void;
    };
    const apiError = new ApiError("Validación", 422, "VALIDATION_ERROR", undefined, [
      { field: "postal_code", message: "Código postal inválido", label: "CP" },
    ]);

    mutateOptions.onError?.(apiError);

    expect(applyApiValidationErrors).toHaveBeenCalledWith([
      { field: "postal_code", message: "Código postal inválido" },
    ]);
  });

  it("shows soft-delete copy in the delete confirmation dialog", async () => {
    const user = userEvent.setup();
    addressesQuery = {
      data: [listItem],
      isLoading: false,
      isError: false,
      refetch: refetchAddresses,
    };
    addressDetailQuery = {
      data: detail,
      isLoading: false,
      isError: false,
      refetch: refetchDetail,
    };

    render(<ClientAddressMasterDetail clientId="client-1" />);

    await user.click(screen.getByRole("button", { name: copy.delete }));

    expect(screen.getByText(copy.deleteTitle)).toBeInTheDocument();
    expect(
      screen.getByText(copy.deleteDescription("Bodega Norte")),
    ).toBeInTheDocument();
    expect(screen.queryByText(/permanentemente/i)).not.toBeInTheDocument();
  });
});
