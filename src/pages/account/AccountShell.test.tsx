import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccountShell } from "./AccountShell";
import { ROLES } from "@shared/constants/roles";

const getMfaStatus = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@features/auth", () => ({
  useAuth: () => useAuthMock(),
  authApi: {
    getMfaStatus: (...args: unknown[]) => getMfaStatus(...args),
  },
  MFA_STATUS_QUERY_KEY: ["auth", "mfa-status"],
}));

function renderShell() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/account"]}>
        <Routes>
          <Route path="/account" element={<AccountShell />}>
            <Route index element={<div>Datos outlet</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AccountShell", () => {
  beforeEach(() => {
    getMfaStatus.mockReset();
    useAuthMock.mockReset();
  });

  it("renderiza encabezado NL sin Volver al panel", async () => {
    getMfaStatus.mockResolvedValue({ enabled: true, enabledAt: null });
    useAuthMock.mockReturnValue({
      user: {
        role: ROLES.ADMIN,
        getFullName: () => "Rosa Alcántara",
        getTenantName: () => "Transportes del Bajío",
      },
    });
    renderShell();
    expect(screen.getByRole("heading", { name: "Mi cuenta" })).toBeInTheDocument();
    expect(screen.getByText(/Rosa Alcántara/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Volver al panel/i)).not.toBeInTheDocument();
    expect(await screen.findByText("Datos outlet")).toBeInTheDocument();
  });

  it("marca Seguridad con attention si admin y MFA off", async () => {
    getMfaStatus.mockResolvedValue({ enabled: false, enabledAt: null });
    useAuthMock.mockReturnValue({
      user: {
        role: ROLES.ADMIN,
        getFullName: () => "Rosa Alcántara",
        getTenantName: () => "Transportes del Bajío",
      },
    });
    renderShell();
    expect(
      await screen.findByRole("img", {
        name: /Activa la autenticación en dos pasos/i,
      }),
    ).toBeInTheDocument();
  });
});
