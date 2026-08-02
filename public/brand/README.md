# Marks Tlama - v1.1

Color `#2558a8` (azul-tinta). Sin figura de porteador. SVG ASCII-safe (sin comentarios internos).

## Elegido (2026-07-26): G — T con caminos

**Canonico por ahora.** T solida casi esquinada (r 1 en viewBox 100), perforada por una T
interior en negativo (canal/ranura 6). Sin triangulo. Origen: concepto Davinci, limpio a SVG.

| Archivo | Color | Uso |
|---------|-------|-----|
| `tlama-mark-g-paths.svg` | tinta `#0a0a0a` | Lockup, docs, export monocromo |
| `tlama-mark-g-paths-ink.svg` | azul `#2558a8` | **Canonico UI** / favicon / marketing |
| `tlama-mark-g-paths-onbrand.svg` | blanco sobre tile `#2558a8` | Archivo (alternativa tile) |

**Integrado:**
- `public/favicon.svg` = geometria `ink`
- UI: `BrandLockup` (`TlamaMark` brand/ink + `Wordmark`) en sidebar, landing header, auth y design-system
- **Email (PNG):** `tlama-mark-g-paths-ink-email.png` (160×160) — Gmail/Outlook no renderizan SVG en `<img>`; la API usa este path vía `emailBrandHeaderHtml`. Con `FRONTEND_URL=localhost` el logo no carga en clientes externos: usar `EMAIL_BRAND_ASSET_BASE_URL` (HTTPS público) o staging.

Limite: a 16px el canal se reduce; sobre fondos claros el ink mantiene contraste.

## Archivo — propuestas no elegidas

### Serie 2 - Isotipos minimal (sin monograma)

| Archivo | Idea |
|---------|------|
| `tlama-mark-d-bond.svg` | Bloque + curva |
| `tlama-mark-e-span.svg` | Arco + dos nodos + carga |
| `tlama-mark-f-pack.svg` | Correa + dos bloques |

### Serie 1 - Monograma

| Archivo | Idea |
|---------|------|
| `tlama-mark-a-monogram.svg` | Solo T |
| `tlama-mark-b-route.svg` | T + ruta |
| `tlama-mark-c-load.svg` | T + carga + banda |

## Como revisar

Con `npm run dev`:

- `/favicon.svg`
- `/brand/tlama-mark-g-paths.svg`
- `/brand/tlama-mark-g-paths-ink.svg`
- `/brand/tlama-mark-g-paths-onbrand.svg`

Checklist visual: 16px · 64px · fondo claro y oscuro.
