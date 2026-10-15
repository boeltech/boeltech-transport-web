import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import {
  COMPENSATION_CORRIDORS_PATH,
  COMPENSATION_TEMPLATES_PATH,
} from "@features/compensation/application";
import {
  SETTLEMENTS_ADVANCES_PATH,
  SETTLEMENTS_LIST_PATH,
  SETTLEMENTS_REGISTRY_PATH,
} from "../../application/settlementsRoutes";
import { settlementsCopy } from "../copy/settlementsCopy";
import { OperatorPaymentsHubLayout } from "./OperatorPaymentsHubLayout";

const mockPermissions = vi.hoisted(() => ({ granted: new Set<string>() }));

vi.mock("@shared/permissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/permissions")>()),
  usePermissions: () => ({
    hasPermission: (module: string, action: string) =>
      mockPermissions.granted.has(`${module}.${action}`),
  }),
}));

vi.mock("../../application/hooks/useSettlementsReadiness", () => ({
  useSettlementsReadiness: () => ({
    items: [],
    isReady: true,
    isLoading: false,
  }),
  buildSettlementsReadinessItems: vi.fn(),
  SETTLEMENTS_READINESS_PROBE_PAGE_SIZE: 1,
}));

const ADMIN_PERMISSIONS = [
  "settlements.read",
  "settlements.create",
  "settlements.update",
  "approval_policies.read",
  "approval_policies.update",
];

const copy = settlementsCopy.hub;

function LocationProbe() {
  const location = useLocation();
  return (
    <div>
      <div data-testid="location">{`${location.pathname}${location.search}`}</div>
      <div data-testid="location-state">{JSON.stringify(location.state)}</div>
    </div>
  );
}

function renderHub(
  path: string,
  state?: { from?: string },
) {
  render(
    <MemoryRouter
      initialEntries={[state ? { pathname: path, state } : path]}
    >
      <Routes>
        <Route element={<OperatorPaymentsHubLayout />}>
          <Route path={SETTLEMENTS_LIST_PATH} element={<div>tab</div>} />
          <Route path={SETTLEMENTS_REGISTRY_PATH} element={<div>tab</div>} />
          <Route path={SETTLEMENTS_ADVANCES_PATH} element={<div>tab</div>} />
          <Route path={COMPENSATION_TEMPLATES_PATH} element={<div>tab</div>} />
          <Route path={COMPENSATION_CORRIDORS_PATH} element={<div>tab</div>} />
        </Route>
        <Route path="/settings/approvals" element={<div>reglas</div>} />
        <Route path="/finance/settlements/new" element={<div>alta</div>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );
}

const ALL_TABS = [
  SETTLEMENTS_LIST_PATH,
  SETTLEMENTS_ADVANCES_PATH,
  COMPENSATION_TEMPLATES_PATH,
  COMPENSATION_CORRIDORS_PATH,
];

describe("OperatorPaymentsHubLayout — acciones del hub (addendum ADR-0099-A6)", () => {
  beforeEach(() => {
    mockPermissions.granted = new Set(ADMIN_PERMISSIONS);
  });

  it("no muestra el tab Por autorizar (VoBo vive en bucket En autorización)", () => {
    renderHub(SETTLEMENTS_LIST_PATH);
    expect(
      screen.queryByRole("link", { name: /Por autorizar/i }),
    ).not.toBeInTheDocument();
  });

  it("en historial muestra relatedConfig de vuelta a por pagar", () => {
    renderHub(SETTLEMENTS_REGISTRY_PATH);
    expect(
      screen.getByRole("link", { name: copy.registryRelated.label }),
    ).toHaveAttribute("href", SETTLEMENTS_LIST_PATH);
  });

  it("en por pagar no muestra relatedConfig (Tarifas ya es tab del hub)", () => {
    renderHub(SETTLEMENTS_LIST_PATH);
    expect(
      screen.queryByRole("link", { name: /Ir a Tarifas/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: copy.registryRelated.label }),
    ).not.toBeInTheDocument();
  });

  it("en Tarifas con state.from del alta muestra relatedConfig de vuelta (S5-01)", () => {
    const createHref =
      "/finance/settlements/new?employeeId=emp-1&periodStart=2026-08-01&periodEnd=2026-08-15";
    renderHub(COMPENSATION_TEMPLATES_PATH, { from: createHref });
    expect(
      screen.getByRole("link", { name: copy.createRelated.label }),
    ).toHaveAttribute("href", createHref);
  });

  it.each(ALL_TABS)("admin no ve «Configuración» en %s", (path) => {
    renderHub(path);
    expect(screen.getByText("tab")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Configuración/i })).not.toBeInTheDocument();
  });

  it.each([
    [SETTLEMENTS_LIST_PATH, "/settings/approvals?concept=settlement"],
    [SETTLEMENTS_ADVANCES_PATH, "/settings/approvals?concept=driver_advance"],
  ])("«Reglas de autorización» en %s abre %s con state.from", async (path, target) => {
    const user = userEvent.setup();
    renderHub(path);
    await user.click(screen.getByRole("button", { name: copy.approvalPoliciesAction }));
    expect(screen.getByTestId("location")).toHaveTextContent(target);
    expect(screen.getByTestId("location-state")).toHaveTextContent(
      JSON.stringify({ from: path }),
    );
  });

  it.each([COMPENSATION_TEMPLATES_PATH, COMPENSATION_CORRIDORS_PATH])(
    "«Reglas de autorización» no aparece en %s",
    (path) => {
      renderHub(path);
      expect(
        screen.queryByRole("button", { name: copy.approvalPoliciesAction }),
      ).not.toBeInTheDocument();
    },
  );

  it.each([SETTLEMENTS_LIST_PATH, SETTLEMENTS_ADVANCES_PATH])(
    "sin approval_policies.read no ve «Reglas de autorización» en %s",
    (path) => {
      mockPermissions.granted = new Set(["settlements.read", "settlements.create", "settlements.update"]);
      renderHub(path);
      expect(
        screen.queryByRole("button", { name: copy.approvalPoliciesAction }),
      ).not.toBeInTheDocument();
    },
  );
});
