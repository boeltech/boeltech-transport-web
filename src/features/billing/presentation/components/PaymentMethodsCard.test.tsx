import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { BillingPaymentMethod } from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import { PaymentMethodsCard } from "./PaymentMethodsCard";

const mockHasPermission = vi.fn();
const mockListPaymentMethods = vi.fn();
const mockCreateSetupIntent = vi.fn();
const mockDeletePaymentMethod = vi.fn();
const mockSetDefault = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    toast: vi.fn(),
  }),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: {
      id: "u1",
      role: "admin",
      tenant: { id: "t1" },
    },
  }),
}));

vi.mock("../../infrastructure/stripeClient", () => ({
  isStripePublishableConfigured: () => true,
  getStripePromise: () => Promise.resolve(null),
  isSaasStripeNotConfiguredError: () => false,
  SAAS_STRIPE_NOT_CONFIGURED: "SAAS_STRIPE_NOT_CONFIGURED",
}));

vi.mock("../../infrastructure/billingApi", () => ({
  billingApi: {
    listPaymentMethods: (...args: unknown[]) => mockListPaymentMethods(...args),
    createSetupIntent: (...args: unknown[]) => mockCreateSetupIntent(...args),
    confirmSetupIntent: vi.fn(),
    setDefaultPaymentMethod: (...args: unknown[]) => mockSetDefault(...args),
    deletePaymentMethod: (...args: unknown[]) =>
      mockDeletePaymentMethod(...args),
  },
}));

const PM_DEFAULT: BillingPaymentMethod = {
  id: "pm-1",
  tenantId: "t1",
  gateway: "stripe",
  gatewayPaymentMethodId: "pm_stripe",
  brand: "visa",
  last4: "4242",
  expMonth: 12,
  expYear: 2030,
  isDefault: true,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

function wrap(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe("PaymentMethodsCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockImplementation(
      (resource: string, action: string) =>
        resource === "billing" && (action === "read" || action === "update"),
    );
    mockListPaymentMethods.mockResolvedValue([PM_DEFAULT]);
  });

  it("lists masked card and shows add CTA for billing.update", async () => {
    wrap(<PaymentMethodsCard />);

    await waitFor(() => {
      expect(screen.getByText(/visa •••• 4242/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(billingCopy.paymentMethods.defaultBadge),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: billingCopy.paymentMethods.addCard }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/suscripción Boeltech/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.paymentMethods.autoChargeHint),
    ).toBeInTheDocument();
    expect(billingCopy.paymentMethods.autoChargeHint).not.toMatch(/CFDI|flete/i);
    expect(
      screen.queryByRole("switch"),
    ).not.toBeInTheDocument();
  });

  it("does not promise auto-charge when there is no card", async () => {
    mockListPaymentMethods.mockResolvedValue([]);
    wrap(<PaymentMethodsCard />);

    await waitFor(() => {
      expect(
        screen.getByText(billingCopy.paymentMethods.empty),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText(billingCopy.paymentMethods.autoChargeHint),
    ).not.toBeInTheDocument();
  });

  it("hides mutations when accountant has billing.read only", async () => {
    mockHasPermission.mockImplementation(
      (resource: string, action: string) =>
        resource === "billing" && action === "read",
    );

    wrap(<PaymentMethodsCard />);

    await waitFor(() => {
      expect(screen.getByText(/visa •••• 4242/i)).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: billingCopy.paymentMethods.addCard }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: billingCopy.paymentMethods.delete }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(billingCopy.paymentMethods.readOnlyHint),
    ).toBeInTheDocument();
  });

  it("starts SetupIntent when Agregar tarjeta is clicked", async () => {
    const user = userEvent.setup();
    mockCreateSetupIntent.mockResolvedValue({
      clientSecret: "seti_secret",
      customerId: "cus_1",
      setupIntentId: "seti_1",
    });

    wrap(<PaymentMethodsCard />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: billingCopy.paymentMethods.addCard }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: billingCopy.paymentMethods.addCard }),
    );

    await waitFor(() => {
      expect(mockCreateSetupIntent).toHaveBeenCalled();
    });
  });
});
