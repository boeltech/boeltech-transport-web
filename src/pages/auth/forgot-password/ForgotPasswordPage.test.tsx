import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

const { getSubdomain, post } = vi.hoisted(() => ({
  getSubdomain: vi.fn(() => "s-software"),
  post: vi.fn(),
}));

vi.mock("@features/auth/infrastructure", () => ({
  tokenStorage: {
    getSubdomain: () => getSubdomain(),
  },
}));

vi.mock("@shared/api", () => ({
  apiClient: {
    post: (...args: unknown[]) => post(...args),
  },
}));

import ForgotPasswordPage from "./ForgotPasswordPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    getSubdomain.mockReturnValue("s-software");
    post.mockReset();
  });

  it("no precarga Empresa; el atajo rellena el subdomain guardado", async () => {
    const user = userEvent.setup();
    renderPage();

    const subdomain = screen.getByLabelText("Empresa");
    expect(subdomain).toHaveValue("");

    await user.click(
      screen.getByRole("button", { name: "Usar empresa: s-software" }),
    );

    expect(subdomain).toHaveValue("s-software");
  });

  it("muestra helper de código de empresa", () => {
    renderPage();
    expect(
      screen.getByText(/Debe coincidir con el código de empresa del login/i),
    ).toBeInTheDocument();
  });
});
