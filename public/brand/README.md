# Marks tlamx - v3.0

Color `#2558a8` (azul-tinta). Producto: **tlamx** · Empresa: Boeltech.  
Wordmark display: **Comfortaa** (+ stroke `.brand-wordmark-thick`).

## Logo de producto (lockup)

Composición canónica: **isotipo portal B + wordmark `tlamx`** (Comfortaa).

### Espaciado (safe area / guía Rilxer)

| Zona | Tamaño | Ratio vs mark |
|------|--------|---------------|
| Altura mark / wordmark | 100 | 1 |
| Gap mark → wordmark | 50 | 0.5 |
| Safe area exterior (exports) | 50 | 0.5 |

En UI: `BrandLockup` (`brandLockupMetrics.ts`).  
Asset de referencia: `latuno-lockup-safe-area.svg`.

## Isotipo canónico: B — portal

| Archivo | Color | Uso |
|---------|-------|-----|
| `latuno-mark-b-portal.svg` | tinta `#0a0a0a` | Export monocromo |
| `latuno-mark-b-portal-ink.svg` | azul `#2558a8` | **Canónico UI** / favicon |
| `latuno-mark-b-portal-onbrand.svg` | blanco sobre tile | Archivo (alternativa tile) |
| `latuno-mark-b-portal-ink-email.png` | ink | Email HTML (PNG 160×160, fondo blanco; API embebe data URI) |

viewBox ceñido `10 14 80 70` para paridad óptica.

**Integrado:**
- `public/favicon.svg` = portal ink
- UI: `BrandLockup` (`LatunoMark` + `Wordmark` Comfortaa) en sidebar, landing, auth, design-system
- Email: API `emailBrandHeaderHtml` → PNG portal **inline** (data URI); override remoto opcional `EMAIL_BRAND_ASSET_BASE_URL`. Regenerar: `node scripts/generate-email-mark.mjs` en API.

## Archivo — propuestas / legado

| Archivo | Nota |
|---------|------|
| `tlama-mark-g-paths*.svg` | Isotipo G histórico (T con caminos) |
| `latuno-mark-a-twin*.svg` | Curvas gemelas (archivo) |
| `latuno-mark-c-signal.svg` | Señal de ruta (archivo) |
| `tlama-landing-*` | Hero marketing (no son logo) |

## Cómo revisar

Con `npm run dev`:

- `/favicon.svg`
- `/brand/latuno-mark-b-portal-ink.svg`
- `/brand/latuno-lockup-safe-area.svg`
- `/welcome`, `/login`, sidebar ERP

Checklist: 16px · 64px · gap 0.5×mark · Comfortaa + stroke en wordmark · centro óptico mark↔wordmark (`WORDMARK_OPTICAL_Y_OFFSET_RATIO`).
