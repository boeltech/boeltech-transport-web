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

| id | kind | enabled | path esperado |
|----|------|---------|---------------|
| `product-preview-dashboard` | `product-preview` | `true` (alias Viajes; auth funnel) | `/commercial/product/product-preview-trips.png` |
| `product-preview-fleet` | `product-preview` | `true` | `/commercial/product/product-preview-fleet.png` |
| `product-preview-trips` | `product-preview` | `true` | `/commercial/product/product-preview-trips.png` |
| `product-preview-clients` | `product-preview` | `true` | `/commercial/product/product-preview-clients.png` |
| `product-preview-billing` | `product-preview` | `true` | `/commercial/product/product-preview-billing.png` |
| `og-default` | `og` | `false` | `/commercial/og/og-default.webp` |

Crops A3 (Evidencia / auth funnel): PNG ~1024×510. Recaptura en staging (unread 0, sin badges ruidosos) → reemplazar mismos filenames o pasar a WebP y actualizar `src` en el catálogo.

El hero de `/welcome` **no** monta preview de producto (solo foto patio + copy + trust); la prueba de UI vive en `#evidencia`.

## Fuera de alcance (L0/L1)

DAM, upload admin, CDN, S3, localización `es`/`en`, librería de screenshots por módulo ERP.
