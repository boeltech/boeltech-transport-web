import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { forwardRef, useImperativeHandle } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateVehiclePage } from "./CreateVehiclePage";
import { vehiclesCopy } from "../copy/vehiclesCopy";
import type { Vehicle } from "../../domain";

type CreateCallbacks = {
  onSuccess?: (data: Vehicle) => void;
  onError?: (error: Error) => void;
};

const { mockNavigate, mockToast, mockMutate, createCallbacks } = vi.hoisted(
  () => ({
    mockNavigate: vi.fn(),
    mockToast: vi.fn(),
    mockMutate: vi.fn(),
    createCallbacks: {} as CreateCallbacks,
  }),
);

vi.mock("react-router-dom", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...mod,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@features/vehicles/application", () => ({
  useCreateVehicle: (cb: CreateCallbacks) => {
    createCallbacks.onSuccess = cb.onSuccess;
    createCallbacks.onError = cb.onError;
    return { mutate: mockMutate, isPending: false };
  },
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: mockToast }),
  };
});

vi.mock("../components/VehicleForm", () => ({
  VehicleForm: forwardRef(function MockVehicleForm(_props, ref) {
    useImperativeHandle(ref, () => ({
      triggerStepValidation: async () => true,
      requestSubmit: () => undefined,
    }));
    return <div data-testid="vehicle-form" />;
  }),
}));

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        path: "/vehicles/new",
        element: (
          <QueryClientProvider client={client}>
            <CreateVehiclePage />
          </QueryClientProvider>
        ),
      },
    ],
    { initialEntries: ["/vehicles/new"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("CreateVehiclePage (F1 D2/D10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createCallbacks.onSuccess = undefined;
    createCallbacks.onError = undefined;
  });

  it("CTA de alta usa copy Registrar…", () => {
    renderPage();
    // WizardPageShell solo pinta el submit en el último paso; el copy es la SoT del CTA.
    expect(vehiclesCopy.form.create.submit).toBe("Registrar vehículo");
    expect(screen.getByRole("heading", { name: vehiclesCopy.form.create.title })).toBeInTheDocument();
  });

  it("tras crear navega al detalle /vehicles/:id", () => {
    renderPage();
    createCallbacks.onSuccess?.({
      id: "veh-42",
      unitNumber: "U-42",
    } as Vehicle);
    expect(mockNavigate).toHaveBeenCalledWith("/vehicles/veh-42");
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: vehiclesCopy.form.create.toastSuccessTitle,
        variant: "success",
      }),
    );
  });
});
