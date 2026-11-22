import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VerifyEmailChangePage from "./VerifyEmailChangePage";

const confirmEmailChange = vi.fn();

vi.mock("@features/auth/infrastructure", () => ({
  authApi: {
    confirmEmailChange: (...args: unknown[]) => confirmEmailChange(...args),
  },
  tokenStorage: {
    clear: vi.fn(),
  },
}));

function renderPage(search = "") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/verify-email-change${search}`]}>
        <Routes>
          <Route path="/verify-email-change" element={<VerifyEmailChangePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("VerifyEmailChangePage", () => {
  beforeEach(() => {
    confirmEmailChange.mockReset();
  });

  it("muestra error si falta token", async () => {
    renderPage();
    expect(
      await screen.findByText(/No se pudo confirmar el cambio/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Pedir otro enlace/i })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(confirmEmailChange).not.toHaveBeenCalled();
  });

  it("en éxito ofrece ir a login", async () => {
    confirmEmailChange.mockResolvedValue({ email: "nuevo@tbajio.mx" });
    renderPage("?token=abc");
    expect(
      await screen.findByText(/Correo actualizado/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Ir a iniciar sesión/i }),
    ).toHaveAttribute("href", "/login");
  });

  it("en error de API muestra pedir otro enlace", async () => {
    confirmEmailChange.mockRejectedValue({
      response: { data: { message: "Token inválido" } },
    });
    renderPage("?token=bad");
    expect(
      await screen.findByText(/No se pudo confirmar el cambio/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Pedir otro enlace/i }),
    ).toBeInTheDocument();
  });
});
