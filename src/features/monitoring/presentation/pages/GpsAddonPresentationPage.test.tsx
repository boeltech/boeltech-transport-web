import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/createTestQueryClient";
import { grantPermissions } from "@/test/mocks/permissions";
import { monitoringCopy } from "../copy/monitoringCopy";
import { GpsAddonPresentationPage } from "./GpsAddonPresentationPage";

const mockUseAuth = vi.fn();

vi.mock("@features/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@features/settings", () => ({
  useCompanySettings: () => ({
    data: { rfc: "ABC010101XXX" },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@shared/permissions", async () =>
  (await import("@/test/mocks/permissions")).permissionsModuleMock(),
);

function renderPage() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <GpsAddonPresentationPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("GpsAddonPresentationPage", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: {
        email: "ana@norte.mx",
        getFullName: () => "Ana López",
        getTenantName: () => "Transportes del Norte SA",
      },
    });
  });

  it("admin (billing.update) shows mailto CTA and secondary link", () => {
    grantPermissions((module, action) => module === "billing" && action === "update");
    renderPage();

    const copy = monitoringCopy.presentation;
    expect(screen.getByTestId("gps-addon-presentation")).toBeInTheDocument();
    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(screen.getByText(copy.includesTitle)).toBeInTheDocument();
    expect(screen.getByText(copy.how.step2.title)).toBeInTheDocument();

    const cta = screen.getByTestId("gps-addon-request-activation");
    expect(cta).toHaveAttribute("href");
    const href = cta.getAttribute("href") ?? "";
    expect(href.startsWith("mailto:billing@boeltech.com?")).toBe(true);
    expect(decodeURIComponent(href)).toContain(
      "Solicitud de activación — Monitoreo GPS — Transportes del Norte SA",
    );
    expect(decodeURIComponent(href)).toContain("RFC: ABC010101XXX");
    expect(decodeURIComponent(href)).not.toMatch(/precio|\$/i);

    expect(screen.getByTestId("gps-addon-view-complements")).toHaveAttribute(
      "href",
      "/settings/subscription",
    );
    expect(screen.getByText(copy.mailtoHint)).toBeInTheDocument();
    expect(screen.queryByTestId("gps-addon-ask-admin")).not.toBeInTheDocument();
  });

  it("manager/dispatcher sees ask-admin without mailto", () => {
    grantPermissions(() => false);
    renderPage();

    expect(screen.getByTestId("gps-addon-ask-admin")).toBeInTheDocument();
    expect(
      screen.getByText(monitoringCopy.presentation.askAdminTitle),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("gps-addon-request-activation"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("gps-addon-view-complements"),
    ).not.toBeInTheDocument();
  });
});
