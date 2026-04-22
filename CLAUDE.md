# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start development server (Vite HMR)
npm run build      # TypeScript check + production build (tsc -b && vite build)
npm run lint       # ESLint static analysis
npm run preview    # Preview production build
```

There is no test runner configured.

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
- Base URL: `VITE_API_URL444444` env var (defaults to `http://localhost:3000/api/v1`)

### State Management

- **Server state:** TanStack React Query v5 — staleTime 5 min, gcTime 10 min, no retry on 4xx
- **UI/auth state:** React Context (`AuthContext`, `ThemeProvider`, `SidebarProvider`)
- **Forms:** React Hook Form + Zod via `@hookform/resolvers`

### RBAC / Permissions

Defined in `src/shared/permissions/`. Modules include `trips`, `vehicles`, `drivers`, `clients`, `employees`, etc. Actions include `read`, `create`, `update`, `delete`, `updateStatus`, `approve`, etc.

Route guards: `PrivateRoute`, `PermissionRoute`, `ModuleRoute`, `RoleRoute`, `AdminRoute` — all in `src/app/router/`.

### UI Components

shadcn/ui components (Radix UI primitives) live in `src/shared/ui/`. Use `cn()` from `src/shared/lib/` (clsx + tailwind-merge) for className composition.

Dark mode is class-based (`dark:` prefix, toggled on `<html>`). Theme uses CSS variables (`--primary`, `--background`, etc.).

### Key Shared Utilities

- `src/shared/utils/dateUtils.ts` — `formatDate`, `formatDateTime`, `isExpired`, `isExpiringSoon`
- `src/shared/utils/errorMapper.ts` — API error → user message
- `src/shared/hooks/` — `useAuth`, `usePermissions`, `useRole`, `useTheme`, `useToast`, `useMediaQuery`

## API Response Standard

Every endpoint returns one of three structures. **Always use `data` as the key — never the entity name.**

| Scenario | HTTP | Structure |
|---|---|---|
| Single resource | 200/201 | `{ data: { ...resource }, message?: string }` |
| Paginated list | 200 | `{ data: [...], pagination: { page, limit, total, totalPages } }` |
| Action only | 200 | `{ message: string }` |

Backend responds in `snake_case` always. Frontend transforms to `camelCase` via mappers.

## Provider Order (Critical)

In `src/app/providers/` — must always follow this exact order:

1. `QueryProvider`
2. `AuthProvider`
3. `PermissionProvider`
4. `ThemeProvider`
5. `ToastProvider`
6. `SidebarProvider`
7. `LayoutShell`

## Database Column Naming

**All PostgreSQL column names must be English snake_case** — never Spanish, even for CFDI/SAT domain fields. Use `issuer_rfc` not `emisor_rfc`, `payment_form` not `forma_pago`, `issued_at` not `fecha_emision`, etc. SAT catalog *values* (`PUE`, `PPD`, `S01`, `MXN`) stay as-is — they are external identifiers. When a migration with Spanish names exists, create a new numbered migration with `RENAME COLUMN` — never edit past migrations.

## Critical Pitfalls

**Timezone**: Always use ISO 8601 strings for dates — never convert to `new Date()` before sending to the API.

**Trip overlap detection**: When checking vehicle/driver availability, always use the SQL `OVERLAPS` operator on `(scheduled_departure, scheduled_arrival)` against active statuses (`scheduled`, `in_progress`). Check both vehicle AND driver in the same validation.

**Permissions**: Never scatter `can('module', 'action')` checks individually — centralize them in a dedicated `<ModuleActions />` component.

## Naming Conventions

- **PascalCase**: Components, Classes, Types, Interfaces
- **camelCase**: Functions, variables, methods
- **UPPER_SNAKE_CASE**: Constants, env variables
- **kebab-case**: File names

## Git Workflow

**Conventional commits**: `feat(trips): add cancellation`, `fix(auth): token refresh race`, `refactor(vehicles): extract validation`

**Branch naming**: `feature/trips-cancellation`, `bugfix/auth-token-refresh`

## RBAC Roles

9 roles: `admin`, `manager`, `dispatcher`, `driver`, `mechanic`, `accountant`, `client`, `viewer`, `guest`.

`driver` and `client` roles have restricted access (own resources only). Check ownership separately from permission when rendering actions for these roles.

## Reference Files

Detailed guidelines in `D:\boeltech\dev\workspace\clients\transporte\skills\boeltech-erp-development\`:

- `SKILL.md` — Full architecture patterns with code examples
- `references/api-standards.md` — REST conventions, pagination, HTTP codes
- `references/rbac-permissions.md` — Full permissions matrix per module/role
- `references/component-patterns.md` — React Query hooks, form patterns, dialog patterns
- `references/clean-architecture.md` — Layer responsibilities, DI container, data flow
- `references/database-schema.md` — PostgreSQL schema, views, functions, indexes

## Installed Skills (`.claude/skills/`)

Skills en esta carpeta son cargados automáticamente por Claude Code. No es necesario referenciarlos explícitamente, pero se documentan aquí para tener visibilidad de las guías activas.

| Skill | Cuándo aplicar |
|---|---|
| `vercel-react-best-practices` | Al escribir, revisar o refactorizar componentes React: re-renders, bundle size, async patterns, rendering performance |
| `frontend-design` | Al construir nuevos componentes, páginas o interfaces: diseño visual, tipografía, color, animaciones, composición espacial |
