import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@/app/providers/ThemeProvider";
import type { UserRole } from "@shared/constants/roles";
import type { RegisterFunnelPreference } from "../auth/register/registerFunnelPreference";

const completeProductOnboarding = vi.fn();
const refreshProfile = vi.fn();
const clearFunnel = vi.fn();
const navigate = vi.fn();
const getByCode = vi.fn(() => ({
  name: "Operación Micro",
  priceLabel: "Desde $389 / motriz",
  unitsLabel: "1–5 unidades",
  usersLabel: "2 usuarios",
  branchesLabel: "1 sucursal",
  stampsLabel: "30 timbres/motriz",
}));

let authRole: UserRole = "admin";
let canReadBilling = true;
let funnelPreference: RegisterFunnelPreference | null = {
  declaredFleetBand: "1_10",
  preferredPlanCode: "operacion_micro",
  savedAt: "2026-09-27T00:00:00.000Z",
};

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: {
      firstName: "Ana",
      email: "ana@acme.test",
      role: authRole,
    },
    refreshProfile: (...args: unknown[]) => refreshProfile(...args),
  }),
}));

vi.mock("@features/auth/infrastructure", () => ({
  authApi: {
    completeProductOnboarding: (...args: unknown[]) =>
      completeProductOnboarding(...args),
  },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) =>
      module === "billing" && action === "read" ? canReadBilling : false,
  }),
}));

vi.mock("../auth/register/registerFunnelPreference", () => ({
  readRegisterFunnelPreference: () => funnelPreference,
  clearRegisterFunnelPreference: () => clearFunnel(),
}));

vi.mock("@shared/commercial/usePublicOperationalPlans", () => ({
  usePublicOperationalPlans: () => ({
    getByCode: (...args: unknown[]) => getByCode(...args),
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

import { onboardingCopy as copy } from "./onboardingCopy";
import OnboardingPage from "./OnboardingPage";

function renderPage(from?: { pathname: string; search?: string }) {
  return render(
    <ThemeProvider defaultMode="system">
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/onboarding",
            state: from ? { from } : undefined,
          },
        ]}
      >
        <OnboardingPage />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

async function goToPlanStep(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Siguiente" }));
  await user.click(screen.getByRole("button", { name: "Siguiente" }));
}

describe("OnboardingPage families", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authRole = "admin";
    canReadBilling = true;
    funnelPreference = {
      declaredFleetBand: "1_10",
      preferredPlanCode: "operacion_micro",
      savedAt: "2026-09-27T00:00:00.000Z",
    };
    completeProductOnboarding.mockResolvedValue(undefined);
    refreshProfile.mockResolvedValue(undefined);
  });

  it("founder (admin + billing.read) sees 3 steps and no workspace/review", () => {
    renderPage();

    expect(
      screen.getByRole("button", { name: "Bienvenida (actual)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Apariencia" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tu plan" })).toBeInTheDocument();
    expect(screen.queryByText("Tu espacio")).not.toBeInTheDocument();
    expect(screen.queryByText("Confirmar")).not.toBeInTheDocument();
    expect(screen.getByText(/Datos para facturar/)).toBeInTheDocument();
    expect(screen.queryByText(/menú según tu rol/i)).not.toBeInTheDocument();
  });

  it("admin without funnel (variant A) shows assigned plan card, not trial", async () => {
    funnelPreference = null;
    const user = userEvent.setup();
    renderPage();

    expect(
      screen.getByRole("button", { name: "Bienvenida (actual)" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tu plan" })).toBeInTheDocument();
    expect(screen.getByText(copy.steps.plan.descriptionA)).toBeInTheDocument();
    expect(screen.queryByText(/Tu cuenta está lista/i)).not.toBeInTheDocument();

    await goToPlanStep(user);

    expect(screen.getByText(copy.plan.assignedTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.plan.assignedFooter)).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Ver Tu plan/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(copy.plan.trialTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(/14 días/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Q_fact/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Orientativ/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Plan preferido")).not.toBeInTheDocument();
    expect(screen.queryByText(/Preferencia al registrarte/i)).not.toBeInTheDocument();
    expect(getByCode).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: copy.header.submitFounder }),
    );
    await waitFor(() => {
      expect(completeProductOnboarding).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith("/settings/billing", {
        replace: true,
      });
    });
  });

  it("admin with funnel (variant B) shows trial and Ver Tu plan, not catalog list", async () => {
    const user = userEvent.setup();
    renderPage();

    await goToPlanStep(user);

    expect(screen.getByText(copy.plan.trialTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.plan.trialBody)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Ver Tu plan/i })).toHaveAttribute(
      "href",
      "/settings/subscription",
    );
    expect(screen.getByText(/Flota que indicaste: 1–10 unidades/)).toBeInTheDocument();
    expect(screen.queryByText("Desde $389 / motriz")).not.toBeInTheDocument();
    expect(screen.queryByText("1–5 unidades")).not.toBeInTheDocument();
    expect(screen.queryByText("30 timbres/motriz")).not.toBeInTheDocument();
    expect(screen.queryByText("Sin declarar")).not.toBeInTheDocument();
    expect(getByCode).toHaveBeenCalledWith("operacion_micro");

    await user.click(
      screen.getByRole("button", { name: copy.header.submitFounder }),
    );
    await waitFor(() => {
      expect(completeProductOnboarding).toHaveBeenCalled();
      expect(clearFunnel).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith("/settings/billing", {
        replace: true,
      });
    });
  });

  it("admin with funnel and no fleet omits the fleet line", async () => {
    funnelPreference = {
      declaredFleetBand: null,
      preferredPlanCode: "operacion_micro",
      savedAt: "2026-09-27T00:00:00.000Z",
    };
    const user = userEvent.setup();
    renderPage();

    await goToPlanStep(user);

    expect(screen.getByText(copy.plan.trialTitle)).toBeInTheDocument();
    expect(screen.queryByText(/Flota que indicaste/)).not.toBeInTheDocument();
    expect(screen.queryByText("Sin declarar")).not.toBeInTheDocument();
  });

  it("dispatcher card orients to the day's trips, without patio jargon", async () => {
    authRole = "dispatcher";
    funnelPreference = null;
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByRole("button", { name: /actual/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /anterior/i })).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /tu día empieza en Viajes/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/reservas e inicias los viajes/i)).toBeInTheDocument();
    expect(screen.queryByText(/patio|sales el viaje|oficina/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/organizas los viajes, las unidades/i),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ir a Viajes" }));
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/trips", { replace: true });
    });
  });

  it("operator card orients to loading trip expenses, without job jargon", async () => {
    authRole = "operator";
    funnelPreference = null;
    const user = userEvent.setup();
    renderPage();

    expect(
      screen.getByRole("heading", { name: /cargas los gastos en Viajes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/casetas, combustible y extras/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\bjob\b|viven|Costos|tab/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /actual/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ir a Viajes" }));
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/trips", { replace: true });
    });
  });

  it("manager card orients to Viajes as the house, without SAT jargon", async () => {
    authRole = "manager";
    funnelPreference = null;
    const user = userEvent.setup();
    renderPage();

    expect(
      screen.getByRole("heading", { name: /empiezas en Viajes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /organizas los viajes, las unidades y los conductores/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/SAT|bandeja|trámite|Por facturar/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /actual/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ir a Viajes" }));
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/trips", { replace: true });
    });
  });

  it("accountant card orients to Por facturar without CFDI or patio jargon", async () => {
    authRole = "accountant";
    funnelPreference = null;
    const user = userEvent.setup();
    renderPage();

    expect(
      screen.getByRole("heading", { name: /empiezas en Por facturar/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/facturas los viajes que ya están listos/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/CFDI|patio|cola|Atención fiscal/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Tu plan")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /actual/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ir a Por facturar" }));
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/finance/invoiceable", {
        replace: true,
      });
    });
  });

  it("driver card orients to assigned trips without tracking jargon", async () => {
    authRole = "driver";
    funnelPreference = null;
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByText("Tu plan")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /actual/ })).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /empiezas en Mis viajes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/inicias y completas los viajes que te asignaron/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/detalle|recorrido|Seguimiento|Programado/i),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ir a Mis viajes" }));
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/trips", { replace: true });
    });
  });

  it("client card orients to consulting shipments, without patio jargon", async () => {
    authRole = "client";
    funnelPreference = null;
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByText("Tu plan")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /actual/ })).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /empiezas en Mis envíos/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/consultas el estado de tus envíos/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/oficina|capturó|operas el viaje|Mis facturas/i),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ir a Mis envíos" }));
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/trips", { replace: true });
    });
  });

  it("useful from from the gate wins over the house", async () => {
    authRole = "dispatcher";
    funnelPreference = null;
    const user = userEvent.setup();
    renderPage({ pathname: "/trips/t-9", search: "?tab=cargo" });

    await user.click(screen.getByRole("button", { name: "Ir a Viajes" }));
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/trips/t-9?tab=cargo", {
        replace: true,
      });
    });
  });

  it("from /dashboard is ignored and uses the house", async () => {
    authRole = "dispatcher";
    funnelPreference = null;
    const user = userEvent.setup();
    renderPage({ pathname: "/dashboard" });

    await user.click(screen.getByRole("button", { name: "Ir a Viajes" }));
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/trips", { replace: true });
    });
  });

  it("admin + funnel without billing.read is staff card (no plan, no stepper)", () => {
    canReadBilling = false;
    renderPage();

    expect(
      screen.getByRole("heading", { name: /empiezas en Datos para facturar/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /cargas la información con la que la empresa factura a sus clientes/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Tu plan")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /actual/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /anterior/i })).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ir a Datos para facturar" }),
    ).toBeInTheDocument();
  });
});
