import { vi } from "vitest";
import type { AuthContextType } from "@features/auth";
// La entidad se importa de su archivo y no del barrel: este módulo se carga
// dentro del factory de `vi.mock("@features/auth")`, donde el barrel ya es el mock.
import { User, type UserJSON } from "@features/auth/domain/entities";

type AuthModule = typeof import("@features/auth");

export const TEST_TENANT = {
  id: "tenant-test-1",
  name: "Transportes Prueba",
  subdomain: "prueba",
} as const;

export function createTestUser(overrides: Partial<UserJSON> = {}): User {
  return User.fromJSON({
    id: "user-test-1",
    email: "usuario@boeltech.test",
    firstName: "Usuario",
    lastName: "Prueba",
    role: "admin",
    tenant: { ...TEST_TENANT },
    ...overrides,
  });
}

/** Valor completo de `useAuth()`; `user: null` produce una sesión cerrada. */
export function createAuthState(
  overrides: Partial<AuthContextType> = {},
): AuthContextType {
  const user = overrides.user === undefined ? createTestUser() : overrides.user;
  return {
    user,
    token: user ? "test-access-token" : null,
    isAuthenticated: user !== null,
    isLoading: false,
    login: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
    refreshProfile: vi.fn(async () => user ?? undefined),
    replaceSessionUser: vi.fn(),
    applySessionTokens: vi.fn(),
    ...overrides,
  };
}

export const mockUseAuth = vi.fn<() => AuthContextType>(() => createAuthState());

/** Sesión con el usuario indicado (`null` = sin sesión) hasta el próximo `resetAuthMock`. */
export function setMockAuthUser(overrides: Partial<UserJSON> | null = {}): User | null {
  const user = overrides === null ? null : createTestUser(overrides);
  mockUseAuth.mockReturnValue(createAuthState({ user }));
  return user;
}

export function resetAuthMock(): void {
  mockUseAuth.mockReset();
}

/**
 * Reemplazo de `@features/auth` sin cargar el barrel real:
 *
 * vi.mock("@features/auth", async () =>
 *   (await import("@/test/mocks/auth")).authModuleMock());
 */
export function authModuleMock(): Pick<
  AuthModule,
  "useAuth" | "useCurrentUser" | "useIsAuthenticated" | "useAuthLoading"
> {
  return {
    useAuth: () => mockUseAuth(),
    useCurrentUser: () => mockUseAuth().user,
    useIsAuthenticated: () => mockUseAuth().isAuthenticated,
    useAuthLoading: () => mockUseAuth().isLoading,
  };
}
