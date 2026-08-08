import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActivateTenantPage } from "./ActivateTenantPage";
import { tenantActivationCopy } from "../copy/tenantActivationCopy";
import { tenantActivationsApi } from "../../infrastructure/tenantActivationsApi";

const setToken = vi.fn();
const setRefreshToken = vi.fn();
const setUser = vi.fn();

vi.mock("@features/platform/infrastructure/platformTokenStorage", () => ({
  platformTokenStorage: {
    setToken,
    setRefreshToken,
    setUser,
    getToken: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock("../../infrastructure/tenantActivationsApi", () => ({
  tenantActivationsApi: {
    verify: vi.fn(),
    accept: vi.fn(),
  },
}));

const mockedApi = vi.mocked(tenantActivationsApi);

function renderPage(search = "?token=valid-token") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/activate-tenant${search}`]}>
        <Routes>
          <Route path="/activate-tenant" element={<ActivateTenantPage />} />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ActivateTenantPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows invalid state when token is missing", async () => {
    renderPage("");
    expect(
      await screen.findByText(tenantActivationCopy.invalidTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: tenantActivationCopy.invalidCta }),
    ).toHaveAttribute("href", "/login");
  });

  it("shows invalid state when verify fails", async () => {
    mockedApi.verify.mockRejectedValue(new Error("ACTIVATION_INVALID"));
    renderPage("?token=bad");
    expect(
      await screen.findByText(tenantActivationCopy.invalidTitle),
    ).toBeInTheDocument();
  });

  it("accepts valid token and does not write platform storage", async () => {
    const user = userEvent.setup();
    mockedApi.verify.mockResolvedValue({
      emailMasked: "a***@empresa.mx",
      companyName: "Transportes Ejemplo",
      subdomain: "ejemplo",
      expiresAt: "2026-08-14T18:00:00.000Z",
    });
    mockedApi.accept.mockResolvedValue({
      message: "OK",
      data: { subdomain: "ejemplo", emailMasked: "a***@empresa.mx" },
    });

    renderPage("?token=good-token");

    expect(
      await screen.findByRole("button", {
        name: tenantActivationCopy.activate,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Transportes Ejemplo")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: tenantActivationCopy.activate }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(tenantActivationCopy.successTitle),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("link", { name: tenantActivationCopy.successCta }),
    ).toHaveAttribute("href", "/login?subdomain=ejemplo");

    expect(setToken).not.toHaveBeenCalled();
    expect(setRefreshToken).not.toHaveBeenCalled();
    expect(setUser).not.toHaveBeenCalled();
  });
});
