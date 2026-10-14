import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserForm } from "./UserForm";
import { usersCopy } from "../copy/usersCopy";
import { UserStatus, type User } from "../../domain";
import { ROLES } from "@shared/constants/roles";

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: {
      id: "actor-1",
      role: "admin",
      email: "admin@empresa.com",
    },
  }),
}));

vi.mock("@features/clients", () => ({
  useActiveClients: () => ({ data: [] }),
}));

vi.mock("@features/drivers", () => ({
  useDrivers: () => ({ data: { data: [] } }),
  formatDriverName: () => "",
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const editUser = {
  id: "11111111-1111-4111-8111-111111111111",
  tenantId: "t-1",
  email: "ana@empresa.com",
  firstName: "Ana",
  lastName: "López",
  role: ROLES.DISPATCHER,
  status: UserStatus.ACTIVE,
  lastLogin: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdBy: null,
  updatedBy: null,
  createdByName: null,
  updatedByName: null,
  clientId: null,
  employeeId: null,
  driverId: null,
} as User;

function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

const fc = usersCopy.form;

describe("UserForm edit F2 (D7)", () => {
  it("monta pie FormSticky sticky=false, Cancelar/Guardar y Guardar disabled sin dirty", () => {
    const { container } = renderWithQuery(
      <UserForm
        mode="edit"
        user={editUser}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText(fc.editSectionTitle)).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /secciones/i }),
    ).toBeNull();
    expect(container.querySelector(".sticky.bottom-0")).toBeNull();
    expect(
      screen.getByRole("button", { name: fc.cancel }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: fc.submitEdit }),
    ).toBeDisabled();
  });
});
