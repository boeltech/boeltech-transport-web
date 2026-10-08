---
name: vitest-testing-patterns
description: Patrones de testing con Vitest en boeltech-transport-web. Cubre tests de mappers (snake→camelCase), hooks de React Query, componentes con Testing Library, schemas Zod y utilidades de paginación. Usar al escribir o revisar cualquier test del frontend.
---

# Vitest Testing Patterns — boeltech-transport-web

## Cuándo aplicar

- Escribir un test nuevo para un mapper, hook, componente, schema Zod o utilidad
- Revisar si un test existente sigue las convenciones del repo
- Decidir qué tipo de test escribir para una función dada

---

## Configuración base

Tres proyectos Vitest en `vitest.config.ts`. **La extensión decide el proyecto:**

| Proyecto | Incluye | Entorno / pool | Nivel (ADR-0103) |
|---|---|---|---|
| `node` | `src/**/*.test.ts` (fuera de `src/smoke/**`) | node · `threads` | T0–T2 |
| `dom` | `src/**/*.test.tsx` (fuera de `src/smoke/**`) | jsdom · `vmForks` · setup `src/test/setup.dom.ts` | T0–T2 |
| `flows` | `src/smoke/**` | jsdom · `vmForks` · setup `src/test/setup.dom.ts` | T4 |

- Un test que necesita DOM (Testing Library, `renderHook`, `window`/`document`/storage) es `.test.tsx`. Un `.test.ts` corre sin DOM.
- `src/test/setup.dom.ts`: `@testing-library/jest-dom/vitest`, `matchMedia` y observers.
- Local: máximo 2 workers, `vmMemoryLimit: 512MB`. Con 8 GB: `npm run test:serial` o `VITEST_SERIAL=1` (1 worker, pool `forks`). `--no-file-parallelism` solo deja `vmForks` en serie y comparte `document` entre archivos.

| Comando | Nivel |
|---|---|
| `npx vitest related --run --project node --project dom <archivos>` | T0 |
| `npx vitest run --project node --project dom src/features/<feature>` | T1 |
| `npm run test:node` · `npm run test:dom` · `npm run typecheck:test` | T2 (CI) |
| `npm run test:flows -- <slug>` (solo el área) | T4 |

**Typecheck de tests:** `npm run typecheck:test` (`tsconfig.test.json`) corre en CI. La lista `exclude` solo se achica; prohibido `as any` / `@ts-ignore` / `@ts-nocheck` para salir de ella.

Aliases disponibles: `@/*`, `@features/*`, `@shared/*`, `@widgets/*`, `@app/*`, `@pages/*`.

---

## Tipo 1 — Test de Mapper (unitario puro)

El tipo más simple. Los mappers son funciones puras — no necesitan mocks.

**Archivo:** `src/features/<module>/infrastructure/mappers.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import { mapApprovableItem, mapListApprovalsResponse, type ApiApprovableItemRaw } from "./mappers";

// Fixture raw (snake_case — como viene de la API)
const rawItem: ApiApprovableItemRaw = {
  approvable_type: "trip_expense",
  id: "expense-1",
  amount: 1500,
  currency: "MXN",
  status: "pending",
  submitted_at: "2026-06-01T10:00:00.000Z",
  submitted_by: "user-1",
  context: {
    approvable_type: "trip_expense",
    trip_id: "trip-1",
    trip_code: "V-2026-001",
    driver_full_name: "Juan Pérez",
  },
  // ... resto de campos
};

describe("mapApprovableItem", () => {
  it("maps snake_case to camelCase", () => {
    const item = mapApprovableItem(rawItem);

    expect(item.approvableType).toBe("trip_expense");
    expect(item.amount).toBe(1500);
    // Discriminated union — hacer narrowing antes de acceder a campos específicos
    if (item.context.approvableType === "trip_expense") {
      expect(item.context.tripCode).toBe("V-2026-001");
      expect(item.context.driverFullName).toBe("Juan Pérez");
    }
  });
});

describe("mapListApprovalsResponse", () => {
  it("normalizes page_size to limit and total_pages to totalPages", () => {
    const mapped = mapListApprovalsResponse({
      data: [rawItem],
      pagination: { page: 2, page_size: 25, total: 40, total_pages: 2 },
    });

    expect(mapped.pagination.page).toBe(2);
    expect(mapped.pagination.limit).toBe(25);  // page_size → limit
    expect(mapped.pagination.totalPages).toBe(2);
    expect(mapped.data).toHaveLength(1);
  });
});
```

**Reglas:**
- Sin `vi.mock` — son funciones puras.
- Verificar el nombre de las propiedades camelCase explícitamente (no solo `toEqual(expected)` genérico).
- Para tipos discriminados, hacer narrowing antes de acceder a las propiedades específicas del case.

---

## Tipo 2 — Test de Schema Zod (unitario puro)

**Archivo:** `src/features/<module>/presentation/validation/<module>Schema.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import {
  invoiceCreateFormSchema,
  invoiceFormSchema,
  defaultInvoiceFormValues,
  parseCreateInvoicePayload,
} from "./invoiceFormSchema";

const validBase = {
  ...defaultInvoiceFormValues(),  // ← usar la función de defaults del schema
  receiver_rfc: "XAXX010101000",
  receiver_name: "Cliente SA de CV",
  receiver_tax_regime: "601",
  receiver_postal_code: "64000",
  subtotal: 1000,
  total_tax: 160,
  total: 1160,
};

describe("invoiceCreateFormSchema", () => {
  it("requires trip_ids on create", () => {
    const result = invoiceCreateFormSchema.safeParse({ ...validBase, trip_ids: [] });
    expect(result.success).toBe(false);
  });

  it("accepts valid create payload with at least one trip", () => {
    const result = invoiceCreateFormSchema.safeParse({
      ...validBase,
      trip_ids: ["550e8400-e29b-41d4-a716-446655440000"],
    });
    expect(result.success).toBe(true);
  });
});

describe("parseCreateInvoicePayload", () => {
  it("injects trip id from URL parameter", () => {
    const payload = parseCreateInvoicePayload(validBase, "550e8400-e29b-41d4-a716-446655440000");
    expect(payload.trip_ids).toEqual(["550e8400-e29b-41d4-a716-446655440000"]);
  });
});
```

**Reglas:** idénticas al backend — `safeParse`, narrowing con `if (!result.success) return`, probar defaults y rechazos.

---

## Tipo 3 — Test de Hook React Query (unitario)

Testea la *configuración* del hook (queryKey, callbacks de invalidación) sin montar componentes.

**Archivo:** `src/features/<module>/application/hooks/use<Module>.test.ts`

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useCreateInvoice, invoiceQueryKeys } from "./useInvoices";

// ── Mocks de @tanstack/react-query ────────────────────────────────
const invalidateQueries = vi.fn();
const useMutationMock = vi.fn((config: unknown) => config);  // retorna la config sin ejecutarla

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: (config: unknown) => useMutationMock(config),
  useQueryClient: () => ({ invalidateQueries }),
}));

// ── Mock del módulo de API ────────────────────────────────────────
vi.mock("@features/invoicing/infrastructure", () => ({
  invoicingApi: {
    create: vi.fn(),
    getAll: vi.fn(),
    stamp: vi.fn(),
    cancel: vi.fn(),
    // ... todos los métodos usados por el hook
  },
}));

describe("useCreateInvoice cache invalidation", () => {
  beforeEach(() => {
    invalidateQueries.mockReset();
    useMutationMock.mockClear();
  });

  it("invalidates lists, finance root and trips on success", () => {
    // useMutation retorna la config → accedemos a onSuccess directamente
    const mutationConfig = useCreateInvoice({ onSuccess: vi.fn() }) as unknown as {
      onSuccess: (data: { id: string }, variables: unknown, context: unknown, mutation: unknown) => void;
    };

    // Simular llamada a onSuccess
    mutationConfig.onSuccess({ id: "inv-1" }, {}, {}, {});

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: invoiceQueryKeys.lists() });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["finance"] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["trips"] });

    // Verificar que NO se invalida lo que no debe
    expect(invalidateQueries).not.toHaveBeenCalledWith({ queryKey: ["invoices", "prefill"] });
  });
});
```

**Cuándo usar este patrón:**
- Verificar que un mutation invalida exactamente las query keys correctas.
- Testear la lógica de callbacks sin renderizar UI.

---

## Tipo 4 — Test de Componente (React Testing Library)

### Componente simple sin QueryClient

Para componentes que solo renderizan (sin hooks de React Query propios):

**Archivo:** `src/features/<module>/presentation/components/<Component>.test.tsx`

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ApprovalRow } from "./ApprovalRow";

// Fixture de entidad del dominio (camelCase)
const item: ApprovableItem = {
  approvableType: "trip_expense",
  id: "expense-1",
  amount: 500,
  currency: "MXN",
  status: "pending",
  context: {
    approvableType: "trip_expense",
    tripId: "trip-1",
    tripCode: "V-2026-001",
    driverFullName: "Juan Pérez",
  },
  // ...
};

describe("ApprovalRow", () => {
  it("renders trip code as link to trip detail", () => {
    render(
      <MemoryRouter>  {/* ← siempre que haya <Link> */}
        <table><tbody>
          <ApprovalRow
            item={item}
            selected={false}
            selectable
            canUpdate
            onSelectChange={vi.fn()}
            onApprove={vi.fn()}
            onReject={vi.fn()}
          />
        </tbody></table>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "V-2026-001" }))
      .toHaveAttribute("href", "/trips/trip-1");
    expect(screen.getByText("Combustible")).toBeInTheDocument();
  });

  it("renders fallback for unsupported approvable types", () => {
    const unsupported = { ...item, approvableType: "unknown_type", context: { approvableType: "unknown_type" } };

    render(
      <table><tbody>
        <ApprovalRow item={unsupported} ... />
      </tbody></table>,
    );

    expect(screen.getByText(/Tipo no soportado/i)).toBeInTheDocument();
  });
});
```

### Componente con hooks de React Query y permisos

Para componentes que usan `useMutation`, `usePermissions`, etc.:

```tsx
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockHasPermission = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock("@features/invoicing/application", () => ({
  useDeleteInvoice:            () => ({ mutate: vi.fn(), isPending: false }),
  useRegisterPayment:          () => ({ mutate: vi.fn(), isPending: false }),
  useCancelInvoice:            () => ({ mutate: vi.fn(), isPending: false }),
  useSubstituteStampedInvoice: () => ({ mutate: vi.fn(), isPending: false }),
}));

// Factory de la entidad con valores por defecto + overrides
function buildInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv-1",
    status: "stamped",
    paymentMethod: "PUE",
    balanceDue: 1160,
    totalPaid: 0,
    // ... todos los campos requeridos ...
    ...overrides,
  };
}

// Wrapper con QueryClient (retry: false para que no reintenteA en tests)
function renderActions(invoice: Invoice) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <InvoiceActions invoiceId={invoice.id} invoiceStatus={invoice.status} fullInvoice={invoice} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("InvoiceActions register payment visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockImplementation((_module: string, action: string) =>
      action === "create" || action === "delete",
    );
  });

  it("hides Registrar pago for PUE invoices (paid in full at stamping)", () => {
    renderActions(buildInvoice());  // PUE por defecto

    expect(screen.queryByRole("button", { name: /Registrar pago/i }))
      .not.toBeInTheDocument();
  });

  it("shows Registrar pago for PPD with remaining balance", () => {
    renderActions(buildInvoice({ paymentMethod: "PPD", balanceDue: 660, totalPaid: 500 }));

    expect(screen.getByRole("button", { name: /Registrar pago/i }))
      .toBeInTheDocument();
  });
});
```

**Reglas:**
- `QueryClient` con `retry: false` — sin ello los tests intentan reintentar requests fallidos.
- Un `QueryClient` nuevo por test (dentro del wrapper) — no compartir instancia.
- Mockear hooks de mutations con `() => ({ mutate: vi.fn(), isPending: false })` — no usar `useMutation` real.
- `queryByRole` para verificar ausencia; `getByRole` para verificar presencia (falla si no existe).
- Siempre usar `MemoryRouter` cuando el componente renderiza `<Link>`.

### Helpers compartidos (`src/test/`)

Úsalos en tests nuevos o al tocar uno existente (adopción incremental; guía completa en `src/test/README.md`):

| Archivo | Para qué |
|---|---|
| `createTestQueryClient.ts` | `QueryClient` con `retry: false` y `gcTime: 0` |
| `renderWithProviders.tsx` | `renderWithProviders(ui, { route, path })`, `createTestWrapper` para `renderHook` |
| `renderWithTheme.tsx` | Lo anterior + `ThemeProvider` |
| `mocks/auth.ts` · `mocks/permissions.ts` · `mocks/toast.ts` | Factories tipadas de `@features/auth`, `@shared/permissions`, `useToast` |

```tsx
vi.mock("@shared/permissions", async () =>
  (await import("@/test/mocks/permissions")).permissionsModuleMock());

beforeEach(() => {
  vi.clearAllMocks();
  grantPermissions(["settlements.update"]);
});

renderWithProviders(<TripDetailPage />, { route: "/trips/t-1", path: "/trips/:id" });
```

---

## Tipo 5 — Test de Utilidad Asíncrona (paginación / fetching)

Para funciones que hacen múltiples llamadas paginadas:

```typescript
import { describe, expect, it, vi } from "vitest";
import type { IGetTripsUseCase } from "@features/trips/application/useCases/trip/GetTripsUseCase";
import { fetchAllTripsForExport } from "./useExportTrips";

describe("fetchAllTripsForExport", () => {
  it("fetches all pages sequentially until totalPages is reached", async () => {
    const execute = vi.fn<IGetTripsUseCase["execute"]>()
      .mockResolvedValueOnce({  // página 1
        success: true,
        data: {
          data: [trip("t1"), trip("t2")],
          pagination: { page: 1, limit: 100, total: 150, totalPages: 2 },
        },
      })
      .mockResolvedValueOnce({  // página 2
        success: true,
        data: {
          data: [trip("t3")],
          pagination: { page: 2, limit: 100, total: 150, totalPages: 2 },
        },
      });

    const result = await fetchAllTripsForExport({ execute } as IGetTripsUseCase, {});

    expect(result).toHaveLength(3);
    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute.mock.calls[0]?.[0]?.limit).toBe(100);
    expect(execute.mock.calls[1]?.[0]?.page).toBe(2);
  });
});
```

---

## Matchers de @testing-library/jest-dom

Los más usados (disponibles gracias al setup file):

| Matcher | Qué verifica |
|---|---|
| `toBeInTheDocument()` | El elemento existe en el DOM |
| `not.toBeInTheDocument()` | El elemento NO existe |
| `toHaveAttribute("href", "/path")` | El atributo tiene el valor exacto |
| `toHaveTextContent("texto")` | El texto del elemento coincide |
| `toBeDisabled()` | El elemento está deshabilitado |
| `toBeVisible()` | El elemento es visible (no `display: none`) |

Queries más usadas de Testing Library:

| Query | Cuándo usar |
|---|---|
| `getByRole("button", { name: /texto/i })` | Primer opción — accesible y semántico |
| `getByRole("link", { name: "texto" })` | Para `<Link>` y `<a>` |
| `getByText("texto exacto")` | Para texto que no es un rol |
| `queryByRole(...)` | Para verificar ausencia (retorna `null`, no lanza) |
| `screen.getByRole(...)` | Preferido sobre destructuring de `render()` |

---

## Anti-patrones

❌ **`screen.getByTestId("...")`** — usar roles y text queries (más resilientes a cambios de markup).

❌ **`QueryClient` compartido entre tests** — el cache persiste entre tests; crear uno nuevo por caso.

❌ **Mockear `useMutation` devolviendo solo `{ mutate: vi.fn() }`** sin `isPending` — el componente puede condicionar rendering en `isPending`.

❌ **Test de hook con `QueryClient` propio o compartido** — para verificar invalidaciones, usa la extracción de config del Tipo 3 (`.test.ts`, sin DOM); para comportamiento con datos, `renderHook` con `createTestWrapper` (`.test.tsx`), que crea un `QueryClient` de test por wrapper.

❌ **`.test.ts` que toca `window`/`document`** — corre en el proyecto `node` y falla; renómbralo a `.test.tsx`.

❌ **`act(...)` manual innecesario** — RTL lo envuelve internamente para `render`, `fireEvent` y `userEvent`; agregar `act` extra genera warnings.

❌ **Fixtures de datos `any`** — usar los tipos de dominio (`TripListItem`, `Invoice`, etc.) para que TypeScript detecte cuando cambia la interfaz.

❌ **Wrapper con `BrowserRouter`** en tests — usar `MemoryRouter` (sin efectos de historial del browser).

❌ **`vi.mock` con un specifier distinto al que importa el código bajo prueba** — Vitest intercepta por archivo resuelto: si el código importa `@features/approvals/application` y el test mockea `@features/approvals`, el mock no intercepta y el test corre el código real sin avisar. Si un cambio de producción mueve un import a otra capa (ADR-0102), actualiza en el mismo cambio sus `vi.mock`: `rg 'vi\.mock\(\s*["'']@/?features/<x>["'']' src`.

---

## Referencias

| Recurso | Ruta |
|---|---|
| Config | `vitest.config.ts` |
| Setup file (dom y flows) | `src/test/setup.dom.ts` |
| Helpers de test | `src/test/README.md` |
| Typecheck de tests | `tsconfig.test.json` |
| Niveles T0–T5 | ADR-0103 |
| Test de mapper canónico | `src/features/approvals/infrastructure/mappers.test.ts` |
| Test de hook canónico | `src/features/invoicing/application/hooks/useInvoices.test.ts` |
| Test de componente simple | `src/features/approvals/presentation/components/ApprovalRow.test.tsx` |
| Test de componente + QueryClient | `src/features/invoicing/presentation/components/InvoiceActions.test.tsx` |
| Test de schema Zod | `src/features/invoicing/presentation/validation/invoiceFormSchema.test.ts` |
| Test de utilidad paginada | `src/features/reports/presentation/hooks/useExportTrips.test.tsx` |
| Skill componentes | `.agents/skills/frontend-component/SKILL.md` |
