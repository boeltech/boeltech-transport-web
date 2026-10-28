# Ops UI kit (Boeltech Ops)

Primitivos de **contenido** para la consola platform (flag `VITE_PLATFORM_CONSOLE_V1_ENABLED`). Scope CSS: `.platform-ops` + tokens `--ops-*` en `../opsTokens.css`.

## Reglas

- Importar desde este barrel (`./ui` o `…/ops/ui`).
- **No** montar `@shared/ui/{card,badge,table,button,sheet,dialog,tabs}` ni page-shells ERP desde `ops/**` fuera de `ops/ui/**` (ESLint error).
- Overlays (`OpsSheet` / `OpsDialog` / `OpsCommandDialog`) portalan a `#ops-portal-root` vía `OpsPortalHost` en `PlatformOpsShell` (hereda tema dark Ops).
- Flag OFF / Conform ERP: no tocar — vive fuera de este árbol.

## Primitivos

| Componente | Uso |
|---|---|
| `OpsButton` | `primary` · `ghost` · `danger` |
| `OpsBadge` | tonos `ok` / `warn` / `danger` / `accent` (tinta, no muted) / … |
| `OpsLifecycleSeal` | etapa: ok / warn / danger / trial (tinta) / muted |
| `OpsPlanSeal` | código de plan en mono |
| `OpsInput` / `OpsTextarea` / `OpsLabel` | campos dark (forms mutación Ola 3) |
| `OpsSelect*` | select Radix portal ops (sin popover ERP) |
| `OpsAlert` / `OpsFieldError` / `OpsFormErrors` | feedback inline dark |
| `OpsPanel` | superficie densa (sustituye Card light) |
| `OpsTable` | tabla skeleton densas filas |
| `OpsSheet` | drawer lateral |
| `OpsDialog` | confirmación (default `tone="danger"`) |
| `OpsCommand*` | CmdK dark (portal ops) |

Patrones → `ops/patterns/` (`OpsHoyQueues`, `OpsHubHeader`, `OpsTenantRow`, `OpsCollectionsBand`, `OpsAuditLine`, `OpsMoneyTable`, `OpsRiskSheetShell`).
