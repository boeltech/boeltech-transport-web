import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AddUserSheet } from "./AddUserSheet";
import { usersCopy } from "../copy/usersCopy";
import { invitationsApi } from "@features/invitations";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { ROLE_LABELS } from "@shared/constants/roles";

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: {
      id: "actor-1",
      role: "admin",
      email: "admin@empresa.com",
    },
  }),
}));

vi.mock("@features/invitations", () => ({
  invitationsApi: {
    create: vi.fn(),
  },
}));

vi.mock("../../application", () => ({
  useCreateUser: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@features/clients", () => ({
  useActiveClients: () => ({ data: [] }),
}));

vi.mock("@features/drivers", () => ({
  useDrivers: () => ({ data: { data: [] } }),
  formatDriverName: () => "",
}));

const toastMock = vi.fn();

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: toastMock }),
}));

function renderSheet(open = true) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AddUserSheet open={open} onOpenChange={vi.fn()} />
    </QueryClientProvider>,
  );
}

describe("AddUserSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("abre en modo Invitar por defecto", () => {
    renderSheet();
    expect(screen.getByText(usersCopy.addUser.title)).toBeInTheDocument();
    expect(
      screen.getByText(usersCopy.addUser.inviteDescription),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: usersCopy.addUser.submitInvite }),
    ).toBeInTheDocument();
    expect(screen.getByText(usersCopy.addUser.optionalSection)).toBeInTheDocument();
  });

  it("cambia a modo Dar acceso ya", async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(
      screen.getByRole("tab", { name: usersCopy.addUser.modes.register }),
    );

    expect(
      screen.getByText(usersCopy.addUser.registerDescription),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: usersCopy.addUser.submitRegister }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(usersCopy.addUser.fields.passwordPlaceholder),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: usersCopy.addUser.generatePassword }),
    ).toBeInTheDocument();
  });

  it("en Invitar el default es staff y el sheet no enlaza altas de maestro", () => {
    renderSheet();

    expect(screen.getByRole("combobox", { name: /Rol/i })).toHaveTextContent(
      ROLE_LABELS.admin,
    );
    expect(document.querySelector('a[href="/clients/new"]')).toBeNull();
    expect(document.querySelector('a[href="/drivers/new"]')).toBeNull();
  });

  it("en Dar acceso ya enseña portales y no ofrece CTA de alta", async () => {
    const user = userEvent.setup();
    renderSheet();

    await user.click(
      screen.getByRole("tab", { name: usersCopy.addUser.modes.register }),
    );

    expect(
      screen.getByText(usersCopy.addUser.registerDescription),
    ).toBeInTheDocument();
    expect(usersCopy.addUser.registerDescription).toMatch(/portal/i);
    expect(document.querySelector('a[href="/clients/new"]')).toBeNull();
    expect(document.querySelector('a[href="/drivers/new"]')).toBeNull();
  });

  it("muestra toast de límite al invitar con USER_LIMIT_REACHED", async () => {
    const user = userEvent.setup();
    vi.mocked(invitationsApi.create).mockRejectedValue(
      new ApiError("Sin plazas", 409, "USER_LIMIT_REACHED"),
    );

    renderSheet();

    const emailInput = screen.getByLabelText(usersCopy.addUser.fields.email, {
      exact: false,
    });
    await user.clear(emailInput);
    await user.type(emailInput, "nuevo@empresa.com");

    await user.click(
      screen.getByRole("button", { name: usersCopy.addUser.submitInvite }),
    );

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: usersCopy.limitReached.title,
          variant: "error",
        }),
      );
    });
  });
});
