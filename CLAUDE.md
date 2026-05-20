# CLAUDE.md — boeltech-transport-web

Guía mínima para agentes en este repo. **Documentación detallada:** `D:\cowork\boeltech\erp-transport\docs\README.md` (rutas absolutas; ajustar si clonas fuera de `D:\cowork`).

## Commands

```bash
npm run dev        # Vite HMR
npm run build      # tsc -b && vite build
npm run lint
npm run test       # Vitest
npm run test:watch
```

Env: `env/.env.example` · config: `src/shared/config/env.ts` · API: **`VITE_API_URL`** (default `http://localhost:3000/api/v1`).

## Architecture (resumen)

**React 19 + TypeScript + Vite**. **FSD + Clean** por feature en `src/features/<name>/`:

`domain/` ← `infrastructure/` · `presentation/` → `application/`

Importar solo vía `@features/<name>` (barrel `index.ts`).

| Alias | Ruta |
|---|---|
| `@features/*` | `src/features/*` |
| `@shared/*` | `src/shared/*` |
| `@widgets/*` | `src/widgets/*` |

- Axios: `src/shared/api/client/apiClient.ts` — body camelCase→snake; respuestas con `mapSingleResponse` / `deepToCamel`.
- Estado servidor: React Query v5. Formularios: RHF + Zod.

## Convenciones críticas (no negociables)

### API Response Standard

Backend en snake_case; UI en camelCase vía mappers. Mutaciones esperan `message` en JSON.

### Provider order (rutas autenticadas)

En `src/widgets/layout/ui/AppLayout.tsx` (exterior → interior):

`QueryProvider` → `AuthProvider` (`@features/auth`) → `PermissionProvider` → `ThemeProvider` → `ToastProvider` → `SidebarProvider` → `LayoutShell`

### Page shells

Nuevas páginas en `presentation/pages` usan `@shared/ui/page-shells` (`ListPageShell`, `DetailPageShell`, `FormPageShell`, `WizardPageShell`, `SettingsPageShell`). No importar primitivas wizard sueltas desde páginas.

Detalle + Sheet + master-detail: skill `.agents/skills/detail-sheet-master-detail/SKILL.md` · ref. `ClientDetailPage`.

### Formularios con Radix Select

Edición: cargar data antes de montar el form; **`defaultValues`** (no solo `values`); `key={id}` al cambiar entidad; opcionales → `undefined` + `RHFSelect` con sentinela `__none__`. Ref.: `EmployeeFormPage`, `RHFSelect`, `AddressInput`.

### Direcciones y SAT

- Diseño: `D:\cowork\boeltech\erp-transport\design\address-reusable-2026-04-21.md`
- Parse del paquete: `src/shared/cfdi/addressPayloadBridge.ts` — no duplicar reglas SAT.
- UI: `src/shared/ui/address-input/`
- Rollout direcciones v0.3: `D:\cowork\boeltech\erp-transport\docs\direcciones\address-cfdi-domain-v03-rollout.md`

### RBAC

7 roles: `src/shared/constants/roles.ts` (lockstep con API). Permisos: `src/shared/permissions/`. Guards en `src/app/router/`.

### Pitfalls

- Fechas al API: **ISO 8601 string** — no `new Date()` antes de enviar.
- Permisos en tablas: centralizar en componentes `*Actions`.
- Columnas BD en inglés snake_case (misma convención que API).

## Documentación detallada (fuente única)

| Tema | Ruta |
|---|---|
| Índice general | `D:\cowork\boeltech\erp-transport\docs\README.md` |
| Design system | `...\docs\design-system\` + `...\design\propuesta-shells-ux-ui-erp-t.md` |
| Viajes / tracking paradas | `...\docs\viajes\tracking-paradas-campos.md` |
| ProFact / timbrado | `...\docs\facturacion\profact-flujo-web-api.md` |
| ADR-0043 | `...\docs\adr-0043\` |
| Carta Porte 3.1 | `...\docs\carta-porte-3.1\` |
| Tracking (propuesta) | `D:\cowork\boeltech\erp-transport\design\tracking-system-proposal.md` |

**Skill compartido:** `D:\boeltech\dev\workspace\clients\transporte\skills\boeltech-erp-development\`

**Skills locales:** `.agents/skills/` (`vercel-react-best-practices`, `frontend-design`, `detail-sheet-master-detail`).

## Git

Conventional Commits · ramas `feature/...`, `bugfix/...`.
