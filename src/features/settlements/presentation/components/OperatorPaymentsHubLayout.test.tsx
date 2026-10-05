import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import {
  COMPENSATION_CORRIDORS_PATH,
  COMPENSATION_TEMPLATES_PATH,
} from "@features/compensation/application/compensationRoutes";
import {
  SETTLEMENTS_ADVANCES_PATH,
  SETTLEMENTS_LIST_PATH,
  SETTLEMENTS_PENDING_APPROVAL_PATH,
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
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderHub(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<OperatorPaymentsHubLayout />}>
          <Route path={SETTLEMENTS_LIST_PATH} element={<div>tab</div>} />
          <Route path={SETTLEMENTS_PENDING_APPROVAL_PATH} element={<div>tab</div>} />
          <Route path={SETTLEMENTS_ADVANCES_PATH} element={<div>tab</div>} />
          <Route path={COMPENSATION_TEMPLATES_PATH} element={<div>tab</div>} />
          <Route path={COMPENSATION_CORRIDORS_PATH} element={<div>tab</div>} />
        </Route>
        <Route path="/settings/approvals" element={<div>reglas</div>} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );
}

const ALL_TABS = [
  SETTLEMENTS_LIST_PATH,
  SETTLEMENTS_PENDING_APPROVAL_PATH,
  SETTLEMENTS_ADVANCES_PATH,
  COMPENSATION_TEMPLATES_PATH,
  COMPENSATION_CORRIDORS_PATH,
];

describe("OperatorPaymentsHubLayout — acciones del hub (addendum ADR-0099-A6)", () => {
  beforeEach(() => {
    mockPermissions.granted = new Set(ADMIN_PERMISSIONS);
  });

  it.each(ALL_TABS)("admin no ve «Configuración» en %s", (path) => {
    renderHub(path);
    expect(screen.getByText("tab")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Configuración/i })).not.toBeInTheDocument();
  });

  it.each([
    [SETTLEMENTS_LIST_PATH, "/settings/approvals?concept=settlement"],
    [SETTLEMENTS_PENDING_APPROVAL_PATH, "/settings/approvals?concept=settlement"],
    [SETTLEMENTS_ADVANCES_PATH, "/settings/approvals?concept=driver_advance"],
  ])("«Reglas de autorización» en %s abre %s", async (path, target) => {
    const user = userEvent.setup();
    renderHub(path);
    await user.click(screen.getByRole("button", { name: copy.approvalPoliciesAction }));
    expect(screen.getByTestId("location")).toHaveTextContent(target);
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

  it.each([SETTLEMENTS_LIST_PATH, SETTLEMENTS_PENDING_APPROVAL_PATH, SETTLEMENTS_ADVANCES_PATH])(
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
