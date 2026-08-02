# Assets comerciales (L0/L1)

Superficies públicas de marketing y embudo auth. **No** mezclar con marca tipográfica/isotipo (`public/brand/`) ni con logos de tenant / CFDI.

## Carpetas

| Carpeta | Uso |
|---------|-----|
| `product/` | Screenshots / previews del producto (landing, auth) |
| `hero/` | Visuales de hero (reservado) |
| `og/` | Open Graph / social share |

## Naming

`{dominio}-{rol}-{variante}.{ext}`

Ejemplos:

- `product-preview-dashboard.webp`
- `og-default.webp`

## Formatos

- Preferir **WebP**.
- PNG solo si hace falta transparencia no cubierta o compatibilidad puntual.
- Declarar siempre `width` / `height` en el catálogo.
- Sin datos reales de clientes ni RFC visibles en capturas.

## Cómo añadir un asset (checklist)

1. Coloca el archivo en la subcarpeta correcta, p. ej.  
   `public/commercial/product/product-preview-dashboard.webp`
2. Abre `src/shared/commercial/assets/commercialAssets.ts`:
   - Si el `id` ya existe → pon `enabled: true` y ajusta `src` / `alt` / dimensiones.
   - Si es nuevo → agrega el `id` al union tipado y una entrada en el catálogo.
3. Consume con `<CommercialImage id="…" />` (`@shared/ui/commercial`).
4. En landing/auth, el preview CSS mock se **reemplaza** (no se duplica) cuando `product-preview-dashboard` tiene `enabled: true`.

## Catálogo

Fuente de verdad tipada: `src/shared/commercial/assets/commercialAssets.ts`.

| id | kind | enabled (inicial) | path esperado |
|----|------|-------------------|---------------|
| `product-preview-dashboard` | `product-preview` | `false` hasta drop-in | `/commercial/product/product-preview-dashboard.webp` |
| `og-default` | `og` | `false` | `/commercial/og/og-default.webp` |

## Fuera de alcance (L0/L1)

DAM, upload admin, CDN, S3, localización `es`/`en`, librería de screenshots por módulo ERP.
