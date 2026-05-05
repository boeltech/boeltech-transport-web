# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start development server (Vite HMR)
npm run build      # TypeScript check + production build (tsc -b && vite build)
npm run lint       # ESLint static analysis
npm run preview    # Preview production build
npm run test       # Vitest single run
npm run test:watch # Vitest watch mode
```

Example env: `env/.env.example`. Runtime config is centralized in `src/shared/config/env.ts`.

## Architecture

This is a **React 19 + TypeScript + Vite** transportation/logistics ERP. It follows **Clean Architecture** within a **Feature-Sliced Design (FSD)** layout.

### Folder Layout

```
src/
├── app/          # App shell: providers, router, global styles, entry point
├── features/     # Feature modules (see below)
├── pages/        # Non-feature pages (auth, errors, landing, root redirect)
├── shared/       # Cross-cutting: API client, UI library, hooks, utils, RBAC
└── widgets/      # Layout composition (AppLayout, Sidebar, Header)
```

### Feature Module Structure

Every feature follows this exact layered structure (see `src/features/vehicles/` as the canonical example):

```
features/<name>/
├── domain/            # Pure business models — NO external dependencies
│   ├── entities.ts    # TypeScript interfaces and types
│   └── index.ts
├── application/       # React Query hooks + use case orchestration
│   ├── hooks/         # useXxx.ts per operation (list, detail, create, update, delete)
│   ├── useCases/      # Business use case classes
│   └── index.ts
├── infrastructure/    # Technical implementation
│   ├── api/           # Axios API calls (raw snake_case in/out)
│   ├── mappers.ts     # snake_case ↔ camelCase conversion
│   ├── repositories/
│   └── index.ts
├── presentation/      # React components and pages
│   ├── components/
│   ├── pages/
│   ├── validation/    # Zod schemas
│   └── index.ts
└── index.ts           # Public API — only import features through this
```

**Dependency direction:** `presentation → application → domain ← infrastructure`

Never import from a feature's internal paths. Always use the top-level `@features/<name>` alias.

### Path Aliases (tsconfig)

```
@/*            → src/*
@app/*         → src/app/*
@features/*    → src/features/*
@shared/*      → src/shared/*
@widgets/*     → src/widgets/*
@pages/*       → src/pages/*
```

### API Communication

- Single Axios instance at `src/shared/api/client/apiClient.ts`
- Requests: auto-converts camelCase body → snake_case (except `FormData`)
- Responses: raw snake_case — callers use `mapSingleResponse`, `mapPaginatedResponse`, or `mapActionResponse` from `src/shared/api/mappers/response-mapper.ts` which apply `deepToCamel`
- Base URL: **`VITE_API_URL`** (see `import.meta.env` / `src/shared/config/env.ts`; defaults to `http://localhost:3000/api/v1`). Optional **`VITE_API_TIMEOUT`** (ms, default 30000).

### State Management

- **Server state:** TanStack React Query v5 — staleTime 5 min, gcTime 10 min, no retry on 4xx
- **UI/auth state:** `ThemeProvider`, `SidebarProvider`, `ToastProvider` (`src/app/providers/`); authentication via **`AuthProvider`** / `AuthContext` from **`@features/auth`** (composed in `AppLayout`, not only `App.tsx`).
- **Forms:** React Hook Form + Zod via `@hookform/resolvers`

### Formularios: datos persistidos, Radix Select y empleados (patrón estable)

Resumen del problema que se corrigió y de la implementación final (empleados + dirección SAT).

#### Síntoma

En **edición de empleado**, los `Select` de Radix del formulario (género, estado civil, compensación, catálogos de puesto, etc.) a veces quedaban **sin etiqueta** aunque el estado de RHF tuviera el valor correcto. En cambio, los campos dentro de **`AddressInput`** (que usa `useController` por campo) sí se hidrataban bien.

#### Causa raíz (combinada)

1. **`values` de React Hook Form + `Controller` + Radix Select controlado**  
   En esta pantalla, sincronizar el formulario solo con la prop `values` (post-mount) podía dejar los selects en un estado visual inconsistente: Radix exige que `Select.value` coincida **exactamente** con un `SelectItem.value` en el render donde el control ya está montado.

2. **Valores vacíos inconsistentes**  
   Usar `""` en campos opcionales de select hace que el `value` no exista en la lista de ítems → el trigger se ve “vacío”. Para opcionales se normaliza a **`undefined`** y en UI se usa un sentinela (`__none__` → “Sin especificar”) vía `RHFSelect`.

3. **Municipio SAT: corto en BD vs compuesto en catálogo**  
   En BD conviene persistir el código **corto** del municipio (ej. `039`, Carta Porte). El catálogo SAT en UI expone códigos **compuestos** (ej. `JAL-039`). El `Select` debe recibir el compuesto para pintar; el formulario debe seguir guardando el corto. Ver `AddressInput.tsx` (`resolveMunicipalityCatalogCode`, `toShortSatCode`, ref de respaldo ante carrera CP/estado/municipios).

#### Patrón recomendado (alineado con `CompanySettingsForm`)

| Aspecto | Qué hacer |
|--------|-----------|
| Montaje en edición | En la **página contenedora**, no montar el formulario hasta tener la data (`useEmployee` + skeleton). Así el primer `useForm` ya recibe el objeto completo. |
| Hidratación inicial | Usar **`defaultValues`** con el resultado de `employeeToFormValues(existing)` (o equivalente). **No** depender de `values` solo para esta pantalla si los selects son Radix controlados vía `Controller`. |
| Remount al cambiar entidad | `key={id ?? "new"}` en el componente interno del formulario para forzar `defaultValues` frescos al cambiar de empleado. |
| Selects genéricos | Componente compartido [`RHFSelect`](src/shared/ui/form/RHFSelect.tsx): `Controller` + mapeo sentinela + normalización `trim` / `""` → sentinela; opcionalmente `key` en el `Select` raíz para forzar sincronía con Radix. |
| Dirección | [`AddressInput`](src/shared/ui/address-input/AddressInput.tsx): un `useController` por campo; lookup por CP + catálogos SAT en cascada. |

#### Archivos de referencia

- Contenedor + carga: [`EmployeeFormPage.tsx`](src/features/employees/presentation/pages/EmployeeFormPage.tsx) (skeleton en edición, `key` en el inner).
- Formulario: [`EmployeeFormInner.tsx`](src/features/employees/presentation/components/EmployeeFormInner.tsx) (`initialFormValues` → `defaultValues` únicamente; mapeo `employeeToFormValues`).
- Defaults y opcionales: [`employeeSchema.ts`](src/features/employees/presentation/validation/employeeSchema.ts) (`defaultEmployeeFormValues`, opcionales de select como `undefined`).
- Género desde API: [`mappers.ts`](src/features/employees/infrastructure/mappers.ts) (`parseGenderFromApi`).

### RBAC / Permissions

Defined in `src/shared/permissions/`. Module keys include `trips`, `vehicles`, `drivers`, `clients`, `branches`, `employees`, `catalogs`, `invoices`, `settings`, etc. (`MODULES` in `domain/entities.ts`). Actions include `read`, `create`, `update`, `delete`, `updateStatus`, `approve`, etc.

Route guards: `PrivateRoute`, `PermissionRoute`, `ModuleRoute`, `RoleRoute`, `AdminRoute` — all in `src/app/router/`.

### Creación de entidades (patrón wizard)

Las pantallas de **alta** de entidades deben seguir el mismo patrón que el wizard de viajes (`TripFormPage`):

- **Indicador compartido**: [`WizardSteps`](src/shared/ui/wizard/WizardSteps.tsx) dentro de [`WizardProgressCard`](src/shared/ui/wizard/WizardProgressCard.tsx) (Card + padding).
- **Navegación**: Anterior / Siguiente (validar el paso actual antes de avanzar); en el último paso antes del envío, **Revisión** con datos en solo lectura y botón **Crear** / **Registrar** / **Guardar**.
- **Clic en pasos** (opcional): igual que viajes — `allowNavigation` + `onStepClick`: se puede volver a pasos ya visitados o al actual; hacia adelante solo si la validación del paso actual pasa.
- **Atomicidad API**: no es obligatorio un solo POST; clientes y empleados pueden seguir con varias llamadas si el dominio lo requiere; la homologación es de **UX** (shell, pasos, copy de acciones).

### Page Shells (estandar Fase 3)

Todas las nuevas pantallas en `presentation/pages` deben usar shells de `@shared/ui/page-shells`.

#### Cuándo usar cada shell

- **`ListPageShell`**: pantallas de listado con toolbar (búsqueda/filtros/acciones), grid/lista y paginación.
- **`DetailPageShell`**: detalle de entidad con header (back, icono, título, estado, acciones), tabs y metadata.
- **`FormPageShell`**: formularios de edición simple (sin pasos).
- **`WizardPageShell`**: altas/flows por pasos con validación por paso y confirmación final.
- **`SettingsPageShell`**: pantallas de configuración sobre el layout de settings.

**Variante canónica — detalle con Sheet y sub-recursos master-detail:** cuando el registro principal se edita en un **Sheet** contextual (sin página `/edit` dedicada) y los hijos tienen **CRUD propio** en un tab (lista + panel), ver el skill [`.agents/skills/detail-sheet-master-detail/SKILL.md`](.agents/skills/detail-sheet-master-detail/SKILL.md). Referencia: [`ClientDetailPage.tsx`](src/features/clients/presentation/pages/ClientDetailPage.tsx) + [`ClientAddressMasterDetail.tsx`](src/features/clients/presentation/components/ClientAddressMasterDetail.tsx).

#### Guardrails de arquitectura

- En `presentation/pages`, **no importar** primitivas wizard desde `@shared/ui/wizard`; usar `WizardPageShell`.
- Priorizar `ListPageShell` para listas y `WizardPageShell` para altas en pasos.
- Excepciones permitidas solo con justificación explícita en PR (ej. UX especializada que el shell aún no soporta).

#### Patrón de migración recomendado

1. Mantener hooks y lógica de dominio tal cual (`useXxx`, mappers, mutaciones).
2. Mover únicamente layout/navegación de página al shell correspondiente.
3. Reusar el contenido actual como `children`/`renderStep` del shell.
4. Conectar estados:
   - loading/notFound en `FormPageShell`/`DetailPageShell`
   - `triggerStepValidation` + `requestSubmit` en `WizardPageShell`
5. Verificar:
   - `npx tsc --noEmit`
   - `npm run lint`

#### Ejemplos mínimos por shell

- **Lista**: `features/vehicles/presentation/pages/VehicleListPage.tsx`
- **Detalle**: `features/invoicing/presentation/pages/InvoiceDetailPage.tsx`
- **Formulario (simple)**: `features/employees/presentation/pages/EmployeeFormPage.tsx` · **Detalle + Sheet (padre) + master-detail (hijos)**: `features/clients/presentation/pages/ClientDetailPage.tsx` (patrón en [`.agents/skills/detail-sheet-master-detail/SKILL.md`](.agents/skills/detail-sheet-master-detail/SKILL.md))
- **Wizard**: `features/trips/presentation/pages/create/TripFormPage.tsx`

### UI Components

shadcn/ui components (Radix UI primitives) live in `src/shared/ui/`. Use `cn()` from `src/shared/lib/` (clsx + tailwind-merge) for className composition.

Dark mode is class-based (`dark:` prefix, toggled on `<html>`). Theme uses CSS variables (`--primary`, `--background`, etc.).

### Key Shared Utilities

- `src/shared/utils/dateUtils.ts` — `formatDate`, `formatDateTime`, `isExpired`, `isExpiringSoon`
- `src/shared/utils/errorMapper.ts` — API error → user message
- `src/shared/hooks/` — `useAuth`, `usePermissions`, `useRole`, `useTheme`, `useToast`, `useMediaQuery`

### Address model — design source & implementation

**Plan y contrato (fuente de verdad fuera de este repo):** antes de tocar paradas, payloads o el flujo de dirección en viajes, leer el documento de diseño y fases:

- `D:\cowork\boeltech\erp-transport\design\address-reusable-2026-04-21.md`

Ahí está la migración unificada (`address_id` / `addresses`, SAT en JSON, reducción de campos duplicados en `trip_stops`, checklist por fase). En este frontend ya encaja: contrato `ApiStopResponse` + mappers, entidad `TripStop`, wizard de creación (`TripFormPage`, `StopFormDialog`, `validation` / `wizardStopPayload`), actualización de paradas (`stopRepository`, `UpdateTripUseCase`), y lectura (`TripDetailPage`, `FinishTripPage`, `uiHelpers`).

**Código compartido en este repo:**

- `src/shared/validation/addressSchema.ts` — contrato canónico (`addressSchema`, `cartaPorteReadyAddressSchema`).
- `src/shared/ui/address-input/` — `AddressInput`, `AddressPreview` y hooks; CP vía `GET /api/v1/catalogs/sat/by-postal-code/:cp` (`use-postal-code-lookup.ts`).

## API Response Standard

Every endpoint returns one of three structures. **Always use `data` as the key — never the entity name.**

| Scenario | HTTP | Structure |
|---|---|---|
| Single resource | 200/201 | `{ data: { ...resource }, message?: string }` |
| Paginated list | 200 | `{ data: [...], pagination: { page, limit, total, totalPages } }` |
| Action only | 200 | `{ message: string }` |

Backend responds in `snake_case` always. Frontend transforms to `camelCase` via mappers. Successful **mutations** (`POST`/`PUT`/`PATCH`/`DELETE`) should include a **`message`** in the JSON body per backend conventions.

## Provider Order (Critical)

For **authenticated** routes, preserve this nesting order in **`src/widgets/layout/ui/AppLayout.tsx`** (outer → inner):

1. `QueryProvider` — `src/app/providers/QueryProvider.tsx`
2. `AuthProvider` — `@features/auth` (`src/features/auth/presentation/ui/AuthProvider.tsx`)
3. `PermissionProvider` — `src/app/providers/PermissionProvider.tsx`
4. `ThemeProvider` — `src/app/providers/ThemeProvider.tsx`
5. `ToastProvider` — `src/app/providers/ToastProvider.tsx`
6. `SidebarProvider` — `src/app/providers/SidebarProvider.tsx`
7. `LayoutShell` — `src/widgets/layout/ui/LayoutShell.tsx`

Other provider files remain under `src/app/providers/`; **`AuthProvider` is not defined there** — import from `@features/auth` only.

## Database Column Naming

**All PostgreSQL column names must be English snake_case** — never Spanish, even for CFDI/SAT domain fields. Use `issuer_rfc` not `emisor_rfc`, `payment_form` not `forma_pago`, `issued_at` not `fecha_emision`, etc. SAT catalog *values* (`PUE`, `PPD`, `S01`, `MXN`) stay as-is — they are external identifiers. When a migration with Spanish names exists, create a new numbered migration with `RENAME COLUMN` — never edit past migrations.

## Critical Pitfalls

**Timezone**: Always use ISO 8601 strings for dates — never convert to `new Date()` before sending to the API.

**Trip overlap detection**: When checking vehicle/driver availability, always use the SQL `OVERLAPS` operator on `(scheduled_departure, scheduled_arrival)` against active statuses (`scheduled`, `in_progress`). Check both vehicle AND driver in the same validation.

**Permissions**: Avoid scattering `hasPermission(module, action)` / `can('module.action')` checks across cells — centralize them in a dedicated `*Actions` component (for example `TripActions`).

## Naming Conventions

- **PascalCase**: Components, Classes, Types, Interfaces
- **camelCase**: Functions, variables, methods
- **UPPER_SNAKE_CASE**: Constants, env variables
- **kebab-case**: File names

## Git Workflow

**Conventional commits**: `feat(trips): add cancellation`, `fix(auth): token refresh race`, `refactor(vehicles): extract validation`

**Branch naming**: `feature/trips-cancellation`, `bugfix/auth-token-refresh`

## RBAC Roles

**Canonical source:** [`src/shared/constants/roles.ts`](src/shared/constants/roles.ts) — must stay in lockstep with `boeltech-transport-api/src/shared/constants/roles.ts`.

There are **7** official role values (JWT / DB). Labels are Spanish for UI only.

| Code (`UserRole`) | UI label (ES) | Hierarchy |
|---|---|---|
| `admin` | Administrador | 7 |
| `manager` | Gerente | 6 |
| `dispatcher` | Despachador | 5 |
| `accountant` | Contador | 4 |
| `operator` | Operador | 3 |
| `driver` | Conductor | 2 |
| `client` | Cliente | 1 |

**Not in the codebase:** `mechanic`, `viewer`, `guest` (legacy doc only — do not use).

**Permission matrix (intent):** [`src/shared/permissions/domain/rolePermissions.ts`](src/shared/permissions/domain/rolePermissions.ts). **`admin`** is treated as full access in rules (often bypass), not an exhaustive string list.

`driver` and `client` need **row-level / ownership** checks in addition to module permissions.

## Reference Files

Detailed guidelines in `D:\boeltech\dev\workspace\clients\transporte\skills\boeltech-erp-development\`:

- `SKILL.md` — Full architecture patterns with code examples
- `references/api-standards.md` — REST conventions, pagination, HTTP codes
- `references/rbac-permissions.md` — Full permissions matrix per module/role
- `references/component-patterns.md` — React Query hooks, form patterns, dialog patterns
- `references/clean-architecture.md` — Layer responsibilities, DI container, data flow
- `references/database-schema.md` — PostgreSQL schema, views, functions, indexes

## Installed Skills (`.agents/skills/`)

**Dentro del repo:** `.agents/skills/` (raíz del frontend) cuando exista contenido. **Guía compartida transporte (fuera del web):** `D:\boeltech\dev\workspace\clients\transporte\skills\boeltech-erp-development\` — `SKILL.md` + `references/` (API, RBAC, DB, patrones). Usar la ruta que corresponda al clone local.

Si existe `.claude/skills/` en el disco del desarrollador, puede duplicar o enlazar skills del IDE; para documentación de producto priorizar `.agents/skills/` o la carpeta `transporte/skills` anterior.

Skills en esta carpeta suelen cargarse automáticamente en Claude Code cuando está configurado para este repo. No es necesario referenciarlos explícitamente en cada tarea, pero se documentan aquí para visibilidad de las guías activas.

| Skill | Cuándo aplicar |
|---|---|
| `vercel-react-best-practices` | Al escribir, revisar o refactorizar componentes React: re-renders, bundle size, async patterns, rendering performance |
| `frontend-design` | Al construir nuevos componentes, páginas o interfaces: diseño visual, tipografía, color, animaciones, composición espacial |
| `detail-sheet-master-detail` | Detalle con `DetailPageShell`, edición del padre en Sheet y sub-recursos con master-detail / CRUD inmediato (evitar doble modelo de guardado) |
