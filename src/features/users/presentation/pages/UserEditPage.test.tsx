import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserEditPage } from "./UserEditPage";
import { usersCopy } from "../copy/usersCopy";
import { UserStatus, type User } from "../../domain";
import { ROLES } from "@shared/constants/roles";
import { TooltipProvider } from "@shared/ui/tooltip";

const { mockUseUser, mockMutate } = vi.hoisted(() => ({
  mockUseUser: vi.fn(),
  mockMutate: vi.fn(),
}));

vi.mock("../../application", () => ({
  useUser: (...args: unknown[]) => mockUseUser(...args),
  useUpdateUser: () => ({ mutate: mockMutate, isPending: false }),
}));

vi.mock("@features/approval-policies", () => ({
  usePolicyOrphanConfirmation: () => ({
    intercept: () => false,
    dialog: {
      open: false,
      onOpenChange: vi.fn(),
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    },
  }),
  PolicyOrphanConfirmDialog: () => null,
}));

vi.mock("@features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/auth")>();
  return {
    ...actual,
    useAuth: () => ({
      user: {
        id: "actor-1",
        role: "admin",
        email: "admin@empresa.com",
      },
    }),
  };
});

vi.mock("@features/clients", () => ({
  useActiveClients: () => ({ data: [] }),
}));

vi.mock("@features/drivers", () => ({
  useDrivers: () => ({ data: { data: [] } }),
  formatDriverName: () => "",
}));

function buildUser(overrides: Partial<User> = {}): User {
  return {
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
    ...overrides,
  };
}

// Data router required: UserEditPage uses useUnsavedChangesGuard → useBlocker.
function renderEditPage(
  path = "/users/11111111-1111-4111-8111-111111111111/edit",
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        path: "/users/:id/edit",
        element: (
          <QueryClientProvider client={client}>
            <TooltipProvider>
              <UserEditPage />
            </TooltipProvider>
          </QueryClientProvider>
        ),
      },
      {
        path: "/users/:id",
        element: <div>Detalle</div>,
      },
    ],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

describe("UserEditPage F2 (D7/D8)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUser.mockReturnValue({
      data: buildUser(),
      isLoading: false,
      isError: false,
    });
  });

  it("monta form corto con pie no sticky, Cancelar y Guardar disabled sin dirty", () => {
    const { container } = renderEditPage();
    const fc = usersCopy.form;

    expect(screen.getByText("Editar Ana López")).toBeInTheDocument();
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
