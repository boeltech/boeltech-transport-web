# Marks laTuno - v2.0

Color `#2558a8` (azul-tinta). Producto: **laTuno** · Empresa: Boeltech.

## Logo de producto (lockup)

Composición canónica: **`la` + isotipo G + `uno`**  
La «T» tipográfica se sustituye por `tlama-mark-g-paths-ink` (T con caminos).

### Espaciado (safe area)

Referencia de diseño (grid en px, tip guía adjunta):

| Zona | Tamaño | Ratio vs mark |
|------|--------|---------------|
| Altura mark / letras (`la` / `uno`) | 100 | 1 |
| Gap óptico letra↔mark | ~6 | 0.06 |
| Safe area exterior (exports) | 50 | 0.5 |

En UI: `BrandLockup` (`brandLockupMetrics.ts`).  
Asset de referencia: `latuno-lockup-safe-area.svg`.

## Isotipo canónico: G — T con caminos

| Archivo | Color | Uso |
|---------|-------|-----|
| `tlama-mark-g-paths.svg` | tinta `#0a0a0a` | Export monocromo |
| `tlama-mark-g-paths-ink.svg` | azul `#2558a8` | **Canónico UI** / favicon / letra «T» del lockup |
| `tlama-mark-g-paths-onbrand.svg` | blanco sobre tile `#2558a8` | Archivo (alternativa tile) |
| `tlama-mark-g-paths-ink-email.png` | ink | Email HTML (PNG 160×160) |

**Integrado:**
- `public/favicon.svg` = geometría ink G
- UI: `BrandLockup` (`la` + `LatunoMark` + `uno`) en sidebar, landing, auth, design-system
- Email: API `emailBrandHeaderHtml` → PNG G vía `FRONTEND_URL` / `EMAIL_BRAND_ASSET_BASE_URL`

## Propuestas experimentales (archivo, no canónicas)

| Archivo | Idea |
|---------|------|
| `latuno-mark-a-twin.svg` (+ ink / onbrand) | Curvas gemelas |
| `latuno-mark-b-portal.svg` | Portal de carga |
| `latuno-mark-c-signal.svg` | Señal de ruta |

## Marketing — landing `/welcome`

Hero sigue usando assets `tlama-landing-*` (tracto / ruta) como ancla visual; no son el logo.

## Cómo revisar

Con `npm run dev`:

- `/favicon.svg`
- `/brand/tlama-mark-g-paths-ink.svg`
- `/brand/latuno-lockup-safe-area.svg`
- `/welcome` (BrandLockup `la`+mark+`uno`)

Checklist visual: 16px · 64px · fondo claro/oscuro · gap letra↔mark.
