# Prompts — movidos a la Software Factory

**Los prompts de revisión, auditoría y planeación ya no viven aquí.**

Fuente de verdad (versionada, con ficha de gobernanza):

```
D:\boeltech\software-factory\factory\cursor-capabilities\
```

Cada capacidad es un directorio con `PROMPT.md` (el prompt) y `README.md` (tag de capa,
quién la activa, **techo de autoridad**, qué no hace).

| Antes (aquí) | Ahora (capacidad) | Tag |
|--------------|-------------------|-----|
| `revision-proceso-negocio.md` | `revision-proceso-negocio/` | DOM |
| `revision-gestion-saas-erp.md` | `revision-gestion-saas-erp/` | PLT |
| `revision-diseno-producto.md` | `revision-diseno-producto/` | PRD |
| `plan-adr-sdd-maestro.md` | `plan-adr-sdd-maestro/` | TEC |
| `plan-implementacion.md` | `plan-implementacion/` | TEC |
| `auditoria-codigo-seguridad.md` | `auditoria-codigo-seguridad/` | TEC |
| `ux-ui-mejoras.md` | `ux-ui-mejoras/` | BLD |
| `auditoria-design-system.md` | `auditoria-design-system/` | BLD |
| `auditoria-formularios.md` | `auditoria-formularios/` | BLD |
| `plan-infra-ops.md` | `plan-infra-ops/` | REL |
| `contexto-completo.md` | `contexto-completo/` | — (utilidad, L0) |

Catálogo e índice: `...\factory\cursor-capabilities\README.md`

## Por qué se movieron

Vivían aquí sin versionar (`.cursor/*` está en `.gitignore`), fuera de la gobernanza de la
fábrica y sin techo de autoridad declarado. Ahora se activan por **tag** vía handoff del
Director, según `factory/GROK_CURSOR_ADDENDUM.md`.

## No los copies de vuelta

Duplicarlos en este repo reintroduce la deriva que el movimiento resolvió. Si un prompt
necesita cambios, se editan en la fábrica.
