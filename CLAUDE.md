# CLAUDE.md — boeltech-transport-web

Guía mínima para agentes en este repo. **Documentación detallada:** `D:\cowork\boeltech\erp-transport\docs\README.md` (rutas absolutas; ajustar si clonas fuera de `D:\cowork`).

## Commands

```bash
npm run dev        # Vite HMR
npm run build      # tsc -b && vite build
npm run lint
npm run lint:layers # ADR-0102 capas entre features (corre en CI; llega en la fase F2)
npm run test       # Vitest: proyectos node + dom + flows (max 2 workers en local)
npm run test:serial # 1 worker, pool forks (aísla archivos) — máquinas 8 GB; equivale a VITEST_SERIAL=1
npm run test:watch # cerrar al terminar (proceso persistente)
npm run test:node  # proyecto node: src/**/*.test.ts (sin DOM)
npm run test:dom   # proyecto dom: src/**/*.test.tsx (jsdom + src/test/setup.dom.ts)
npm run test:flows # proyecto flows: todos los smokes src/smoke/**
npm run test:flows -- <slug>  # un smoke: filtra por nombre de archivo (src/smoke/<slug>.smoke.test.tsx)
npm run typecheck:test        # tsc de los tests (tsconfig.test.json; lista de excluidos solo se achica)
```

**Niveles de prueba (ADR-0103):** T0 `npx vitest related --run --project node --project dom <archivos>` · T1 `npx vitest run --project node --project dom src/features/<feature>` · T2 `test:node` + `test:dom` + `typecheck:test` (CI) · T4 `test:flows -- <slug>` solo del área tocada. No correr `npm run test` completo en local salvo pre-release. Con 8 GB: `npm run test:serial` o `VITEST_SERIAL=1` (`$env:VITEST_SERIAL = "1"` en PowerShell); `--no-file-parallelism` solo deja `vmForks` en serie y comparte `document` entre archivos. Helpers: `src/test/README.md`.

**Smokes:** forma canónica `npm run test:flows -- <slug>`; un smoke nuevo es un archivo `src/smoke/<slug>.smoke.test.tsx`, **sin** script nuevo en `package.json`. Slugs por área:

| Slug (`test:flows -- …`) | Cubre |
|---|---|
| `approvals-` · `trip-expense-` | WS-F bandeja + badge dashboard; gastos de viaje (aprobación / autoaprobación) |
| `approval-policies` | ADR-0099 reglas de autorización (plantillas, 422/409/403, simulador, historial, guardia de huérfanos) |
| `notifications-inbox` | inbox campana + `/notifications` |
| `fiscal-edit` | WS-G timbrar → corregir RFC → retimbrar |
| `address-picker-` | WS-ADDR-PRELOAD precarga parada + sustitución |
| `address-cfdi-v03` | direcciones SAT v0.3+ (contrato paquete) |
| `location-field` | ADR-0092 LocationField BUSCAR→USAR |
| `platform-admin` · `platform-ar` · `session-platform-erp-isolation` | ADR-0062 panel tenant 0 + aislamiento de sesión |
| `platform-tenant-activate` | ADR-0073 activación admin |
| `platform-catalogs-import` | release kit SAT |
| `billing-workflow` · `billing-ar` · `billing-stripe` | ADR-0064 plan/consumo · ADR-0072 saldo AR · ADR-0076 Stripe-A/B |
| `billing-dispatch` · `invoice-auto-dispatch` · `finance-dispatch-workbench` | ADR-0082 corrida · ADR-0083 envío automático · workbench Finanzas |
| `auth-phase2` | ADR-0070 MFA/sesiones/cookies |
| `catalogs-tenant` · `imports-workflow` | catálogos tenant · importaciones |
| `credit-exposure` · `profitability-scope` | OP-L0.9 crédito · rentabilidad |
| `branches-workflow` | sucursales (listado → detalle → export → baja/restaurar) |
| `trip-multi-invoice` · `trip-false-trip` · `trip-revenue-split` · `trip-sin-cfdi` | ADR-0068 · ADR-0079 · ADR-0081 · viaje sin CFDI |
| `trip-trailers` · `trip-canvas` · `trip-mid-trip` | ADR-0077 remolques · ADR-0078 canvas · ADR-0093 E1 mid-trip |
| `trip-fleet-snapshot` | Datos para Carta Porte del viaje (tarjeta en Operación + refresco desde el catálogo) |
| `settlements-workflow` · `compensation-templates` · `drivers-workflow` | ADR-0085 liquidaciones · ADR-0089 plantillas · alta conductor |
| `dark.smoke` | smokes de tema oscuro (ya corren en `npm run test`) |

**Deprecado (se retira en el próximo ciclo):** `npm run test:smoke:<x>` sigue existiendo como alias de `vitest run --project flows <filtro>` y corre **solo** su(s) smoke(s); las unitarias que antes listaba ya corren en `test:node` / `test:dom`. Excepción: `test:smoke:branch-kpis` no tiene smoke y corre los dos tests de componente SUC-M12 en el proyecto `dom`. Las menciones `Smoke npm run test:smoke:…` en las secciones de abajo equivalen a `npm run test:flows -- <slug>`.

**Liquidaciones y compensación a operadores (ADR-0085 / ADR-0086 / ADR-0087 + greenfield-base F8–F16):** hub **Pagos a operadores** siempre (`/finance/settlements`, tabs + sidebar); umbral VoBo default **0** (todo corte exige autorización hasta que el tenant lo suba); 7 categorías de anticipo; cálculo reactivo (`/finance/settlements/new`); detalle inmutable con balance strip y evidencia D3′; maker-checker; recibo de firma. Smoke `npm run test:smoke:settlements`. Guía: `D:\cowork\boeltech\erp-transport\docs\finanzas\liquidaciones-operadores-usuario.md` · diseño: `D:\cowork\boeltech\erp-transport\design\adr\0086-esquemas-compuestos-compensacion-operadores.md` · gobernanza: `D:\cowork\boeltech\erp-transport\design\adr\0087-gobernanza-tarifas-compensacion-operadores.md` · addendum base: `…/design/adr/0085-addendum-greenfield-como-base.md`.

**Reglas de autorización por tenant (ADR-0099):** `@features/approval-policies` en **`/settings/approvals`** («Reglas de autorización»: tarjetas por concepto, plantillas Un autorizador / Por monto / Doble firma, tramos y pasos, simulador, historial de versiones, restablecer estándar; solo lectura si `edit_enabled: false`). Bandeja con **«Me toca» / «Todas»**, chips de paso («Paso x de y · Falta: …»), Devolver para corregir (`DecisionReasonSheet`), historial (`ApprovalHistorySheet`) y guardas 409 de paso/revisión; alerta «Devuelta para corregir» + «Corregir y reenviar» en gastos de viaje (Costos), anticipos y liquidaciones; umbral VoBo **solo** en la regla de Liquidaciones (tarjeta muestra `voboThresholdMxn` del API; editor con «Monto mínimo para pedir autorización» y atajo «No pedir autorización en montos bajos»); el hub Pagos a operadores ya no tiene «Configuración» — «Reglas de autorización» solo en Por pagar / Por autorizar / Anticipos ([addendum](D:\cowork\boeltech\erp-transport\design\adr\0099-addendum-umbral-vobo-solo-en-reglas.md)). Smoke `npm run test:smoke:approval-policies`. Guías: `D:\cowork\boeltech\erp-transport\docs\finanzas\reglas-autorizacion-usuario.md` · `…\docs\finanzas\aprobaciones-centralizadas-usuario.md` · `…\docs\viajes\gastos-viaje-aprobacion-usuario.md` · diseño: `D:\cowork\boeltech\erp-transport\design\adr\0099-motor-politicas-aprobacion-por-tenant.md` · SDD `design/sdd/approval-policies/`.

**Crédito L0 (ADR-0049):** semáforo en detalle cliente + wizard Costos (`GET /clients/:id/credit-summary`) · sin bloqueo. Guía usuario: `D:\cowork\boeltech\erp-transport\docs\finanzas\credito-disponible-semaforo-usuario.md` · diseño: `D:\cowork\boeltech\erp-transport\design\sdd\credit-exposure\sdd.md`.

**Plataforma (ADR-0062):** consola en `/platform/*` (panel, empresas, catálogos globales, **auditoría** `/platform/audit`) · login `/platform/login` · API `POST /api/v1/platform/auth/login` · requiere backend Fase 3+ y migr. **106** (`platform_owner` en enum) + `npm run seed:platform-owner` en API. **Activación admin al alta (ADR-0073):** email activate + gate login; UI card/resend/rotate + `/activate-tenant`; smoke `npm run test:smoke:platform-tenant-activate`; guía `docs/plataforma/panel-tenant0-usuario.md` §3.2/3.3.

**Billing SaaS v1 (ADR-0064):** `@features/billing` en `/settings/subscription` (plan, consumo timbres, módulos, nivel L, retención, saldo AR, métodos de pago Stripe-A, Alert auto-cargo Stripe-B) · consola platform (suscripción, entitlements, CxC, Cobrar con Stripe, franja cobro automático) · paywall `internal_staff_compensation` en wizard viajes · smoke `test:smoke:billing-stripe`. Guía operador: `D:\cowork\boeltech\erp-transport\docs\facturacion\billing-saas-operacion-manual.md` §9–§11 · diseño: `D:\cowork\boeltech\erp-transport\design\sdd\saas-commercial-integration\sdd.md` · Stripe-A: `D:\cowork\boeltech\erp-transport\design\sdd\saas-stripe-gateway\sdd.md` · Stripe-B: `D:\cowork\boeltech\erp-transport\design\sdd\saas-stripe-auto-charge\sdd.md`.

**Multifactura por viaje (ADR-0068):** factura de flete (primaria + Carta Porte) y N facturas accesorias (solo servicios, sin CP) ligadas al mismo viaje · UI `?scope=accessory` · smoke `npm run test:smoke:trip-multi-invoice`. Guía: `D:\cowork\boeltech\erp-transport\docs\facturacion\facturas-accesorias-viaje-usuario.md` · diseño: `D:\cowork\boeltech\erp-transport\design\sdd\trip-multi-invoice\sdd.md`.

**Prorrateo multi-RFC (ADR-0081):** N CFDIs de flete por porción del acuerdo (`billing_scope=split_share`) · UI `?scope=split_share&leg_id=` · smoke `npm run test:smoke:trip-revenue-split`. Guía: `D:\cowork\boeltech\erp-transport\docs\facturacion\prorrateo-multi-rfc-viaje-usuario.md` · diseño: `D:\cowork\boeltech\erp-transport\design\adr\0081-split-multi-rfc-mismo-viaje.md` · SDD `design/sdd/trip-revenue-split/`.

**Esquemas + corrida de despacho (ADR-0082, F0–F4):** catálogo `/settings/billing-schemes` · asignación en cliente · corridas en Finanzas · digest 1 email/cliente (sin stamp) · smoke `npm run test:smoke:billing-dispatch`. Guía: `D:\cowork\boeltech\erp-transport\docs\facturacion\corrida-despacho-esquemas-usuario.md` · SDD `design/sdd/billing-scheme-dispatch/`.

**Envío automático de facturas (ADR-0083, F0–F3):** opt-in `invoice_auto_dispatch_enabled` + corrida `origin=scheduled` tras corte CDMX · badge Automática · alerta failed en factura · inbox `billing_dispatch` · smoke `npm run test:smoke:invoice-auto-dispatch`. Guía: `D:\cowork\boeltech\erp-transport\docs\facturacion\envio-automatico-facturas-usuario.md` · SDD `design/sdd/invoice-auto-dispatch/`. Local: worker (`npm run dev:worker`) + migr. **155**.

**Viaje en falso (ADR-0079, Aceptado · F0–F3 código):** ingreso sin CP como único CFDI del mismo viaje (`billing_scope=false_trip`); no relaja D2 de 0068; start no exige cargas. UI `?scope=false_trip` · smoke `npm run test:smoke:trip-false-trip`. Guía: `D:\cowork\boeltech\erp-transport\docs\facturacion\viaje-en-falso-usuario.md`. Evidencia PAC V7-FALSO pendiente. PRD (job UX) en paralelo. Diseño: `D:\cowork\boeltech\erp-transport\design\adr\0079-viaje-en-falso-ingreso-sin-carta-porte.md` · SDD `design/sdd/trip-false-trip/`.

**Flexibilidad mid-trip (ADR-0093, Aceptado · F0–F4 · Enmienda E1):** en `in_progress` replan de paradas `pending` (composer pending-only + `PUT …/stops:replan`), append carga, reasignar flota y mutar `base_rate` sin relajar `canEditTrip`; bandera `requires_fiscal_attention` + sustitución 04. Smoke `npm run test:smoke:trip-mid-trip`. Guía: `D:\cowork\boeltech\erp-transport\docs\viajes\flexibilidad-mid-trip-usuario.md`. Diseño: `D:\cowork\boeltech\erp-transport\design\adr\0093-flexibilidad-operativa-mid-trip.md` · SDD `design/sdd/trip-mid-trip-flexibility/`.

**Datos para Carta Porte del viaje (foto de flota CP31):** tarjeta «Datos para Carta Porte» en el tab Operación del detalle (`@features/trips` · `presentation/components/trip-fleet-snapshot/`) con la unidad y el operador congelados, su fuente y diferencias con el catálogo; Sheet «Refrescar datos para Carta Porte» (por bloque, motivo 10–500, 409/422 con «Actualizar vista previa»); el aviso «Sustituir factura» sale del GET re-consultado (`cp_invoice_outdated`). API `GET /trips/:id/fleet-snapshot` y `POST …/fleet-snapshot:refresh`; permiso espejo `trips_fleet_snapshot` (read admin/manager/dispatcher/accountant, execute admin/manager; `operator` no ve la tarjeta); se oculta si el API tiene `CP31_FLEET_SNAPSHOT_READ_ENABLED` apagado. Smoke `npm run test:flows -- trip-fleet-snapshot`. Guía: `D:\cowork\boeltech\erp-transport\docs\viajes\datos-carta-porte-viaje-usuario.md` · runbook: `…\docs\operacion\cp31-foto-flota-runbook.md`.

**Alta de viaje canvas (ADR-0078, Aceptado · F0–F4 cerradas):** un CTA Reservar; `/trips/new` = canvas una pantalla (`FormPageShell`); completar Ruta/Cargas en el detalle (riel + Confirmar reserva); `/trips/:id/edit` redirige al detalle. Hold ADR-0071 intacto. Smoke: `npm run test:smoke:trip-canvas`. Diseño: `D:\cowork\boeltech\erp-transport\design\adr\0078-alta-viaje-canvas-completar-en-detalle.md` · [addendum composer](D:/cowork/boeltech/erp-transport/design/adr/0078-addendum-composer-esqueleto-ruta.md) (**Aceptado** — Capa 3 E1 web; **sin API**) · SDD `design/sdd/trip-canvas-intake/`. Post-v1: D10 catálogo de rutas.

**Sucursales:** detalle `/branches/:id` muestra mapa read-only Mapbox si hay `latitude`/`longitude` (`VITE_MAPBOX_PUBLIC_TOKEN`) y card **Historial de cambios** (`GET /branches/:id/activity`); captura/edición geo en alta y `/branches/:id/edit` vía `AddressInput`. **Sobrecupo de plan:** `meta.over_quota` en listado + wizard `POST /branches/reconcile-plan` + filtro de asignación en empleados. **SUC-M8a (ADR-0065):** `trips.origin_branch_id`, `vehicles.branch_id`, sucursal conductor heredada del empleado, filtro suave de flota; **cross-dock** en parada origen vía `AddressPicker` (`owner_type=branch`) + aviso en sheet de parada (sin checkbox en RouteStep). **SUC-M12 (ADR-0067):** widget `branch_kpis` en dashboard (comparar ≤3 sucursales) + `BranchOperationalKpiCard` en detalle; API `GET /dashboard/branch-kpis`; drill-down `GET /trips?origin_branch_id=`. Guía: `D:\cowork\boeltech\erp-transport\docs\sucursales\dashboard-kpis-usuario.md`. **Documentación vencida (ADR-0066):** toggle «Permitir documentación vencida» en paso 1 del wizard (seguro/SCT/licencia) + `allow_expired_docs` transitorio en create/update trip.

**Patrón Location (ADR-0092, F0–F6):** familia `@shared/ui/location` (`LocationField` / Card / Sheet) sobre `addresses` — BUSCAR→ENCONTRAR→CONFIRMAR→USAR; cableado en viajes, clientes, sucursales, `/settings/locations` y domicilio fiscal empresa. Smoke `npm run test:smoke:location-field`. Guía: `D:\cowork\boeltech\erp-transport\docs\direcciones\patron-location-usuario.md` · SDD `design/sdd/location-pattern/`. Ops: migr. API **166** (`geocoding_accuracy`).

Guía usuario plataforma: `D:\cowork\boeltech\erp-transport\docs\plataforma\panel-tenant0-usuario.md`  
Guía usuario aprobaciones: `D:\cowork\boeltech\erp-transport\docs\finanzas\aprobaciones-centralizadas-usuario.md`  
Guía usuario reglas de autorización: `D:\cowork\boeltech\erp-transport\docs\finanzas\reglas-autorizacion-usuario.md`  
Guía usuario gastos de viaje (devolución y corrección): `D:\cowork\boeltech\erp-transport\docs\viajes\gastos-viaje-aprobacion-usuario.md`  
Guía usuario corrección fiscal: `D:\cowork\boeltech\erp-transport\docs\viajes\corregir-datos-fiscales-viaje-usuario.md`

Env: `env/.env.example` · config: `src/shared/config/env.ts` · API: **`VITE_API_URL`** (default `http://localhost:3000/api/v1`). Dev RAM: `VITE_DISABLE_DEV_POLLING` · runbook `docs/ci-build/dev-memory-runbook.md`. **Sentry:** `D:\cowork\boeltech\erp-transport\docs\operacion\sentry-integracion.md` · vars `VITE_SENTRY_DSN`, `VITE_ENVIRONMENT`, `VITE_GIT_SHA`.

## Architecture (resumen)

**React 19 + TypeScript + Vite**. **FSD + Clean** por feature en `src/features/<name>/`:

`domain/` ← `infrastructure/` · `presentation/` → `application/`

Entre features, importar por capa: `@features/<name>/{domain|application|infrastructure|presentation}` (el `index.ts` de cada capa). Las páginas no se exportan en ningún index: el router las carga con `lazy()` por ruta profunda (`@features/<name>/presentation/pages/<Page>`). `application`/`domain`/`infrastructure` y `@shared` no importan la raíz ni `/presentation` de otra feature; prohibido también el alias `@/features/*` (`npm run lint:layers`, desde F2). Query keys y filtros de invalidación en `domain/`. La raíz `@features/<name>` es transitoria y se retira por feature (ADR-0102). Si cambias un specifier, actualiza su `vi.mock`.

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
| Mejoras UX/UI / copy | capacidad `ux-ui-mejoras` (BLD) — ver **Capacidades Cursor** abajo |
| Viajes / tracking paradas | `...\docs\viajes\tracking-paradas-campos.md` |
| Viajes — edición híbrida (ADR-0044) | `...\design\adr\0044-viajes-edicion-hibrida-desde-detalle.md` · matriz `...\docs\viajes\edicion-viajes-matriz-ux.md` |
| Viajes — canvas de alta (ADR-0078, Aceptado · F0–F4) | `...\design\adr\0078-alta-viaje-canvas-completar-en-detalle.md` · addendum composer **Aceptado** (E1 web, sin API) · SDD `...\design\sdd\trip-canvas-intake\` |
| Viajes — mid-trip (ADR-0093, Aceptado · F0–F4 · E1) | `...\design\adr\0093-flexibilidad-operativa-mid-trip.md` · SDD `...\design\sdd\trip-mid-trip-flexibility\` · guía `...\docs\viajes\flexibilidad-mid-trip-usuario.md` · smoke `test:smoke:trip-mid-trip` |
| Viajes — prorrateo multi-RFC (ADR-0081) | `...\design\adr\0081-split-multi-rfc-mismo-viaje.md` · SDD `...\design\sdd\trip-revenue-split\` · guía `...\docs\facturacion\prorrateo-multi-rfc-viaje-usuario.md` |
| Viajes — falso ingreso sin CP (ADR-0079, Aceptado · F0–F3 código) | `...\design\adr\0079-viaje-en-falso-ingreso-sin-carta-porte.md` · addendum 0068 · SDD `...\design\sdd\trip-false-trip\` · guía `...\docs\facturacion\viaje-en-falso-usuario.md` |
| ProFact / timbrado | `...\docs\facturacion\profact-flujo-web-api.md` |
| ADR-0043 | `...\docs\adr-0043\` |
| Carta Porte 3.1 | `...\docs\carta-porte-3.1\` |
| Tracking (propuesta archivada) | `D:\cowork\boeltech\erp-transport\planes\cerrados\tracking-system-proposal.md` |

**Skill compartido:** `D:\boeltech\dev\workspace\clients\transporte\skills\boeltech-erp-development\`

**Skills versionadas (Cloud Agents y `/frontend-senior`):** `.agents/skills/` — `design-system`, `frontend-component`, `frontend-module-scaffold`, `vitest-testing-patterns`, `detail-sheet-master-detail`.

**Skills locales (gitignored):** `.agents/skills/` y `.claude/skills/` — `frontend-design`, `vercel-react-best-practices`, `neversight-skills_feed-tremor-design-system` (`tremor-design-system`, dashboards/charts vía LobeHub).

## Git

Conventional Commits · ramas `feature/...`, `bugfix/...`.

**Worktrees:** por defecto se construye en el repo principal. Worktree (`../_wt-web-<slug>`, rama desde `main` local) solo si hay otro pedido en curso en este repo o WIP sin commitear que se cruza con el pedido. Al crearlo, el orquestador lo agrega **antes de construir** a `../boeltech-transport.code-workspace` (`folders`), sin pedir permiso, y lo quita al cerrar. Detalle: `software-factory/factory/GROK_CURSOR_ADDENDUM.md` §Worktrees.

## Despliegue

- **Push a `main` no despliega**: solo corre `CI` (build, tokens, contraste, `npm run test` con flows).
- **Staging = tag** `staging-AAAA-MM-DD.N` sobre un commit de `main` (`deploy-staging.yml`). El workflow verifica que el commit esté en `main` y espera a que su corrida de `CI` esté en verde; el tag debe apuntar al último commit de un push. Lo crea y empuja el CEO tras el gate de despliegue de `/qa` (HB-G8). Si el cambio depende de la API, etiquetar primero la API.
- **Producción:** `deploy-prod.yml` manual (`workflow_dispatch`), frase literal del CEO (HB-G4).
- **Mínimo de pruebas por pedido:** el constructor corre una vez, al cerrar el pedido, según el tipo de cambio (nada en copy/estilos; `vitest related` en lógica normal; feature si es código compartido; smoke del área solo si cambia el flujo). Typecheck = `npx tsc -p tsconfig.app.json --noEmit` (`tsc --noEmit` en raíz no revisa nada; `tsc -b` es del build/CI). Ajustes tras entrega: solo `vitest related` de lo tocado. El orquestador no vuelve a correr pruebas: revisa el diff contra el reporte. `/qa` de desarrollo solo si hay riesgo crítico y sin re-corridas. `npm run test` completo lo corre CI y se exige en el gate de despliegue. Detalle: `software-factory/factory/agents/frontend-senior.md` §Mínimo necesario.


## Cursor rules (versionadas en repo)
Core en .cursor/rules/ (Cloud Agents las ven): `form-validation-ux`, `overlays-toast`, `sheet-from-menu-focus`, `frontend-api-env`, `cfdi-domain-adr-0043`. (`database-timestamptz` vive en la API, por glob de SQL.)
`.cursor/plans/` sigue gitignored — no always-on.

## Capacidades Cursor (Software Factory)

Los prompts de revisión, auditoría y planeación **ya no viven en este repo**. Fuente de verdad:

`D:\boeltech\software-factory\factory\cursor-capabilities\` — catálogo en su `README.md`.

Cada capacidad trae ficha de gobernanza: tag de capa (DOM/PLT/PRD/TEC/BLD/QA/REL), quién la
activa y **techo de autoridad**. Las que tocan este repo: `ux-ui-mejoras` (BLD),
`auditoria-design-system` (BLD), `auditoria-formularios` (BLD), `auditoria-codigo-seguridad` (TEC),
`revision-diseno-producto` (PRD).

Puntero local: `.cursor/prompts/README.md`. No copiar los prompts de vuelta aquí.

### Roles invocables (subagentes)

`/experto-transporte` · `/disenador-producto` · `/lider-tecnico` · `/qa` · `/arquitecto-saas` — los
cinco son `readonly` (techo L1: revisan y dictaminan, no implementan). Orden de capas:
`DOM → PRD → TEC → BLD`. En este repo `/disenador-producto` decide flujo, navegación y
densidad **antes** de tocar UI.

**`/frontend-senior`** es quien implementa (**L2 acotado**: escribe archivos, **no ejecuta
git** — sin rama, sin commit, sin PR; el commit lo haces tú a mano), cargando la capacidad
`ux-ui-mejoras` en modo `implementar`. No arranca sin handoff de PRD o TEC y pedido in scope
— es el DoR de E5. Se le indica **una fase** y devuelve la lista de archivos tocados.

Se definen en `D:\boeltech\software-factory\factory\agents\` y se materializan aquí con
`software-factory\scripts\sync-agents.ps1`. **`.cursor/agents/` es generado y gitignored** —
no editar a mano. Arrancan sin tu contexto: indícales el pedido (`pedidos/<slug>/PEDIDO.md`).
