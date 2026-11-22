import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import { DASHBOARD_PATH } from "@shared/utils/reportsWayfinding";
import { dashboardCopy } from "../copy/dashboardCopy";
import { DashboardAttentionZone } from "./DashboardAttentionZone";
import type { AttentionRowView } from "../../application/hooks/useDashboardAttention";

const navState = { from: DASHBOARD_PATH, fromLabel: "Inicio" };

const approvalRow: Extract<AttentionRowView, { kind: "ok" }> = {
  kind: "ok",
  id: "approvals",
  title: "Por autorizar",
  area: "Aprobaciones",
  urgency: "warning",
  count: 2,
  value: "2",
  ctaLabel: "Revisar",
  href: "/finance/approvals",
  labelDetail: "por autorizar",
};

function DestinationProbe() {
  const location = useLocation();
  return (
    <pre data-testid="dest-state">{JSON.stringify(location.state)}</pre>
  );
}

describe("DashboardAttentionZone", () => {
  it("pasa state.from y fromLabel al salir a bandeja (H-U01-N01)", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={[DASHBOARD_PATH]}>
        <Routes>
          <Route
            path={DASHBOARD_PATH}
            element={
              <DashboardAttentionZone
                role="manager"
                rows={[approvalRow]}
                isLoading={false}
                navState={navState}
              />
            }
          />
          <Route path="/finance/approvals" element={<DestinationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: dashboardCopy.attention.title }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: /Revisar/ }));

    expect(screen.getByTestId("dest-state")).toHaveTextContent(
      '"from":"/dashboard"',
    );
    expect(screen.getByTestId("dest-state")).toHaveTextContent(
      '"fromLabel":"Inicio"',
    );
  });
});
