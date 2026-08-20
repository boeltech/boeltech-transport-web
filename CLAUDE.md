# CLAUDE.md — boeltech-transport-web

Guía mínima para agentes en este repo. **Documentación detallada:** `D:\cowork\boeltech\erp-transport\docs\README.md` (rutas absolutas; ajustar si clonas fuera de `D:\cowork`).

## Commands

```bash
npm run dev        # Vite HMR
npm run build      # tsc -b && vite build
npm run lint
npm run test       # Vitest (max 2 workers en local)
npm run test:serial # Vitest 1 worker — máquinas 8 GB
npm run test:watch # cerrar al terminar (proceso persistente)
npm run test:smoke:approvals   # smoke WS-F bandeja + badge dashboard
npm run test:smoke:notifications # smoke inbox campana + /notifications
npm run test:smoke:fiscal-edit # smoke WS-G timbrar → corregir RFC → retimbrar
npm run test:smoke:address-picker # smoke WS-ADDR-PRELOAD precarga parada + sustitución (partner snapshot)
npm run test:smoke:platform      # smoke ADR-0062 panel tenant 0 (métricas → empresas → suspender)
npm run test:smoke:platform-tenant-activate # smoke ADR-0073 activación admin (create/card/activate-tenant)
npm run test:smoke:platform-catalogs-import # smoke release kit SAT (hub + plantilla + estimate; support RO)
npm run test:smoke:billing       # smoke ADR-0064 plan/consumo + paywall equipo de apoyo
npm run test:smoke:billing-ar    # smoke ADR-0072 saldo AR tenant (julio open → mark paid)
npm run test:smoke:auth-phase2   # smoke ADR-0070 MFA/sesiones/cookies (contrato cliente + interceptor)
npm run test:smoke:catalogs-tenant # smoke catálogos tenant: sin import SAT + CRUD internos
npm run test:smoke:credit        # smoke OP-L0.9 exposición crédito detalle + wizard Costos
npm run test:smoke:branches      # smoke sucursales: listado → detalle (mapa geo) → export → baja/restaurar + wizard alta
npm run test:smoke:branch-kpis   # smoke SUC-M12 widget dashboard compare + tarjeta KPI detalle sucursal
npm run test:smoke:trip-multi-invoice # smoke ADR-0068 flete + factura accesoria (CTA/scope/badge)
npm run test:smoke:trip-false-trip # smoke ADR-0079 viaje en falso (CTA/scope/badge, sin PAC)
npm run test:smoke:trip-trailers # smoke ADR-0077 remolques S/R + snapshot + cutover /trailers
npm run test:smoke:trip-canvas # smoke ADR-0078 Reservar → canvas → detalle riel → parada → confirmar
npm run test:smoke:imports   # smoke ADR-0074 import CSV maestros (hub → validate → commit)
```

**Crédito L0 (ADR-0049):** semáforo en detalle cliente + wizard Costos (`GET /clients/:id/credit-summary`) · sin bloqueo. Guía usuario: `D:\cowork\boeltech\erp-transport\docs\finanzas\credito-disponible-semaforo-usuario.md` · diseño: `D:\cowork\boeltech\erp-transport\design\sdd\credit-exposure\sdd.md`.

**Plataforma (ADR-0062):** consola en `/platform/*` (panel, empresas, catálogos globales, **auditoría** `/platform/audit`) · login `/platform/login` · API `POST /api/v1/platform/auth/login` · requiere backend Fase 3+ y migr. **106** (`platform_owner` en enum) + `npm run seed:platform-owner` en API. **Activación admin al alta (ADR-0073):** email activate + gate login; UI card/resend/rotate + `/activate-tenant`; smoke `npm run test:smoke:platform-tenant-activate`; guía `docs/plataforma/panel-tenant0-usuario.md` §3.2/3.3.

**Billing SaaS v1 (ADR-0064):** `@features/billing` read-only en `/settings/subscription` (plan, consumo timbres, módulos, nivel L, retención) · consola platform (suscripción, entitlements, export conciliación CSV) · paywall `internal_staff_compensation` en wizard viajes. Guía operador: `D:\cowork\boeltech\erp-transport\docs\facturacion\billing-saas-operacion-manual.md` · diseño: `D:\cowork\boeltech\erp-transport\design\sdd\saas-commercial-integration\sdd.md`.

**Multifactura por viaje (ADR-0068):** factura de flete (primaria + Carta Porte) y N facturas accesorias (solo servicios, sin CP) ligadas al mismo viaje · UI `?scope=accessory` · smoke `npm run test:smoke:trip-multi-invoice`. Guía: `D:\cowork\boeltech\erp-transport\docs\facturacion\facturas-accesorias-viaje-usuario.md` · diseño: `D:\cowork\boeltech\erp-transport\design\sdd\trip-multi-invoice\sdd.md`.

**Viaje en falso (ADR-0079, Aceptado · F0–F3 código):** ingreso sin CP como único CFDI del mismo viaje (`billing_scope=false_trip`); no relaja D2 de 0068; start no exige cargas. UI `?scope=false_trip` · smoke `npm run test:smoke:trip-false-trip`. Guía: `D:\cowork\boeltech\erp-transport\docs\facturacion\viaje-en-falso-usuario.md`. Evidencia PAC V7-FALSO pendiente. Capa 1 job UX en paralelo. Diseño: `D:\cowork\boeltech\erp-transport\design\adr\0079-viaje-en-falso-ingreso-sin-carta-porte.md` · SDD `design/sdd/trip-false-trip/`.

**Alta de viaje canvas (ADR-0078, Aceptado · F0–F4 cerradas):** un CTA Reservar; `/trips/new` = canvas una pantalla (`FormPageShell`); completar Ruta/Cargas en el detalle (riel + Confirmar reserva); `/trips/:id/edit` redirige al detalle. Hold ADR-0071 intacto. Smoke: `npm run test:smoke:trip-canvas`. Diseño: `D:\cowork\boeltech\erp-transport\design\adr\0078-alta-viaje-canvas-completar-en-detalle.md` · [addendum composer](D:/cowork/boeltech/erp-transport/design/adr/0078-addendum-composer-esqueleto-ruta.md) (**Aceptado** — Capa 3 E1 web; **sin API**) · SDD `design/sdd/trip-canvas-intake/`. Post-v1: D10 catálogo de rutas.

**Sucursales:** detalle `/branches/:id` muestra mapa read-only Mapbox si hay `latitude`/`longitude` (`VITE_MAPBOX_PUBLIC_TOKEN`) y card **Historial de cambios** (`GET /branches/:id/activity`); captura/edición geo en alta y `/branches/:id/edit` vía `AddressInput`. **Sobrecupo de plan:** `meta.over_quota` en listado + wizard `POST /branches/reconcile-plan` + filtro de asignación en empleados. **SUC-M8a (ADR-0065):** `trips.origin_branch_id`, `vehicles.branch_id`, sucursal conductor heredada del empleado, filtro suave de flota; **cross-dock** en parada origen vía `AddressPicker` (`owner_type=branch`) + aviso en sheet de parada (sin checkbox en RouteStep). **SUC-M12 (ADR-0067):** widget `branch_kpis` en dashboard (comparar ≤3 sucursales) + `BranchOperationalKpiCard` en detalle; API `GET /dashboard/branch-kpis`; drill-down `GET /trips?origin_branch_id=`. Guía: `D:\cowork\boeltech\erp-transport\docs\sucursales\dashboard-kpis-usuario.md`. **Documentación vencida (ADR-0066):** toggle «Permitir documentación vencida» en paso 1 del wizard (seguro/SCT/licencia) + `allow_expired_docs` transitorio en create/update trip.

Guía usuario plataforma: `D:\cowork\boeltech\erp-transport\docs\plataforma\panel-tenant0-usuario.md`  
Guía usuario aprobaciones: `D:\cowork\boeltech\erp-transport\docs\finanzas\aprobaciones-centralizadas-usuario.md`  
Guía usuario corrección fiscal: `D:\cowork\boeltech\erp-transport\docs\viajes\corregir-datos-fiscales-viaje-usuario.md`

Env: `env/.env.example` · config: `src/shared/config/env.ts` · API: **`VITE_API_URL`** (default `http://localhost:3000/api/v1`). Dev RAM: `VITE_DISABLE_DEV_POLLING` · runbook `docs/ci-build/dev-memory-runbook.md`. **Sentry:** `D:\cowork\boeltech\erp-transport\docs\operacion\sentry-integracion.md` · vars `VITE_SENTRY_DSN`, `VITE_ENVIRONMENT`, `VITE_GIT_SHA`.

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

Nuevas páginas en `presentation/pages` usan `@shared/ui/page-shells` (`ListPageShell`, `DetailPageShell`, `FormPageShell`, `WizardPageShell`, `SettingsPageShell`). No importar primitivas wizard sueltas desde páginas. Alta por pasos: `src/shared/ui/page-shells/README.md` · `D:\cowork\boeltech\erp-transport\docs\design-system\wizard-page-pattern.md`.

Detalle + Sheet + master-detail: skill `.agents/skills/detail-sheet-master-detail/SKILL.md` · ref. `ClientDetailPage`.

### Formularios con Radix Select

Edición: cargar data antes de montar el form; **`defaultValues`** (no solo `values`); `key={id}` al cambiar entidad; opcionales → `undefined` + `RHFSelect` con sentinela `__none__`. Ref.: `EmployeeFormPage`, `RHFSelect`, `AddressInput`.

### Validación UX en formularios

Patrón homologado: `FieldInlineError` (`text-xs`), `error` + ARIA en controles, `FormValidationSummary` tras `trigger` fallido (wizards sin toast al avanzar). Primitivos: `@shared/ui/form` · guías: `form-validation-pattern.md` y `wizard-page-pattern.md` en `docs/design-system/` · regla Cursor: `.cursor/rules/form-validation-ux.mdc`.

### Direcciones y SAT

- Direcciones: `D:\cowork\boeltech\erp-transport\design\sdd\addresses\README.md` · ADR-0042 · UI: `src/shared/ui/address-input/README.md`
- Parse del paquete: `src/shared/cfdi/addressPayloadBridge.ts` — no duplicar reglas SAT.
- UI: `src/shared/ui/address-input/` — `variant` (UX CP31) + `formContext` (negocio); obligatoriedad XSD: `src/shared/validation/cp31DomicilioUx.ts`
- Rollout direcciones v0.3: `D:\cowork\boeltech\erp-transport\docs\direcciones\address-cfdi-domain-v03-rollout.md`

### RBAC

7 roles: `src/shared/constants/roles.ts` (lockstep con API). Permisos: `src/shared/permissions/`. Guards en `src/app/router/`.

### Pitfalls

- Fechas al API: **ISO 8601 string** — no `new Date()` antes de enviar.
- Permisos en tablas: centralizar en componentes `*Actions`.
- Columnas BD en inglés snake_case (misma convención que API).
- Facturas timbradas: sustitución = **`SubstituteInvoiceSheet`** (no Dialog); cancelar/pago siguen en Dialog — ver `docs/design-system/patterns.md` § detalle fiscal.

## Documentación detallada (fuente única)

| Tema | Ruta |
|---|---|
| Índice general | `D:\cowork\boeltech\erp-transport\docs\README.md` |
| Design system | `...\docs\design-system\` + `...\planes\cerrados\propuesta-shells-ux-ui-erp-t.md` |
| Wizards (alta) | `src/shared/ui/page-shells/README.md` · `...\docs\design-system\wizard-page-pattern.md` |
| Mejoras UX/UI / copy | `.cursor/prompts/ux-ui-mejoras.md` |
| Landing + login (look / motion / assets) | `.cursor/prompts/landing-visual-polish.md` |
| Viajes / tracking paradas | `...\docs\viajes\tracking-paradas-campos.md` |
| Viajes — edición híbrida (ADR-0044) | `...\design\adr\0044-viajes-edicion-hibrida-desde-detalle.md` · matriz `...\docs\viajes\edicion-viajes-matriz-ux.md` |
| Viajes — canvas de alta (ADR-0078, Aceptado · F0–F4) | `...\design\adr\0078-alta-viaje-canvas-completar-en-detalle.md` · addendum composer **Aceptado** (E1 web, sin API) · SDD `...\design\sdd\trip-canvas-intake\` |
| Viajes — falso ingreso sin CP (ADR-0079, Aceptado · F0–F3 código) | `...\design\adr\0079-viaje-en-falso-ingreso-sin-carta-porte.md` · addendum 0068 · SDD `...\design\sdd\trip-false-trip\` · guía `...\docs\facturacion\viaje-en-falso-usuario.md` |
| ProFact / timbrado | `...\docs\facturacion\profact-flujo-web-api.md` |
| ADR-0043 | `...\docs\adr-0043\` |
| Carta Porte 3.1 | `...\docs\carta-porte-3.1\` |
| Tracking (propuesta archivada) | `D:\cowork\boeltech\erp-transport\planes\cerrados\tracking-system-proposal.md` |

**Skill compartido:** `D:\boeltech\dev\workspace\clients\transporte\skills\boeltech-erp-development\`

**Skills locales:** `.agents/skills/` y `.claude/skills/` — `frontend-design`, `vercel-react-best-practices`, `detail-sheet-master-detail` (`.agents` only), `neversight-skills_feed-tremor-design-system` (`tremor-design-system`, dashboards/charts vía LobeHub).

## Git

Conventional Commits · ramas `feature/...`, `bugfix/...`.
