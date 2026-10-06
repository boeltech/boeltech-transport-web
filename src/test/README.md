# Helpers de test (`src/test/`)

Adopción incremental: úsalos en tests nuevos o al tocar uno existente; no hay
migración masiva.

| Archivo | Para qué |
|---|---|
| `setup.dom.ts` | Setup de los proyectos `dom` y `flows` (jest-dom, `matchMedia`, observers). |
| `createTestQueryClient.ts` | `QueryClient` con `retry: false` y `gcTime: 0`. |
| `renderWithProviders.tsx` | `renderWithProviders`, `createTestWrapper` (para `renderHook`) y `TestProviders`. |
| `renderWithTheme.tsx` | Igual que el anterior + `ThemeProvider` y utilidades de tema oscuro. |
| `mocks/auth.ts` | `@features/auth`: usuario real (`User.fromJSON`) y `useAuth()` completo. |
| `mocks/permissions.ts` | `@shared/permissions`: permisos concedidos/denegados y rol. |
| `mocks/toast.ts` | `useToast` de `@shared/hooks` con `vi.fn` por método. |

## Render

```tsx
import { renderWithProviders, createTestWrapper } from "@/test/renderWithProviders";

renderWithProviders(<TripsListPage />, { route: "/trips?status=draft" });
renderWithProviders(<TripDetailPage />, { route: "/trips/t-1", path: "/trips/:id" });

const { Wrapper, queryClient } = createTestWrapper({ withRouter: false });
renderHook(() => useSomething(), { wrapper: Wrapper });
```

`rerender` conserva el mismo `QueryClient`. Pasa `queryClient` si necesitas
sembrar caché o espiar `invalidateQueries`.

## Mocks de módulo

`vi.mock` se eleva sobre los imports, así que el factory carga la factory con
`import()` dinámico. Los mocks solo importan **tipos** de los barrels reales:
mockear con estos factories evita cargar `@features/auth` / `@shared/permissions`.

```tsx
import { setMockAuthUser, resetAuthMock } from "@/test/mocks/auth";
import { grantPermissions } from "@/test/mocks/permissions";
import { mockToast } from "@/test/mocks/toast";

vi.mock("@features/auth", async () =>
  (await import("@/test/mocks/auth")).authModuleMock());
vi.mock("@shared/permissions", async () =>
  (await import("@/test/mocks/permissions")).permissionsModuleMock());
vi.mock("@shared/hooks", async () =>
  (await import("@/test/mocks/toast")).toastHooksMock());

beforeEach(() => {
  vi.clearAllMocks();
  resetAuthMock();                        // vuelve al usuario admin por defecto
  grantPermissions(["settlements.update"]); // o "all" | "none" | (module, action) => boolean
});

it("…", () => {
  setMockAuthUser({ id: "user-creator-123", role: "manager" });
  const permissions = grantPermissions("all", { role: "manager" });
  // …
  expect(permissions.hasPermission).toHaveBeenCalledWith("trips", "update");
  expect(mockToast.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "error" }));
});
```

- `vi.clearAllMocks()` **no** borra `mockReturnValue`: fija auth/permisos en
  `beforeEach` (o llama `resetAuthMock` / `resetPermissionsMock`).
- Los factories reemplazan el módulo completo con solo sus hooks. Si el
  componente usa algo más del barrel (guards, `useListingFilters`, …), combina
  con `importOriginal` — sabiendo que eso sí carga el barrel real:

```tsx
vi.mock("@shared/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/hooks")>()),
  ...(await import("@/test/mocks/toast")).toastHooksMock(),
}));
```
