# Marks tlamx - v3.0

Color `#008292` (Teal Operate, paleta v2 Patio). Producto: **tlamx** · Empresa: Boeltech.  
Wordmark display: **Schibsted Grotesk** 700 (Opción B · unifica con `/welcome`).

## Logo de producto (lockup)

Composición canónica: **isotipo portal B + wordmark `tlamx`** (Schibsted Grotesk).

### Espaciado (safe area / guía Rilxer)

| Zona | Tamaño | Ratio vs mark |
|------|--------|---------------|
| Altura mark / wordmark | 100 | 1 |
| Gap mark → wordmark | 50 | 0.5 |
| Safe area exterior (exports) | 50 | 0.5 |

En UI: `BrandLockup` (`brandLockupMetrics.ts`).  
Asset de referencia: `tlamx-lockup-safe-area.svg`.

## Isotipo canónico: B — portal

| Archivo | Color | Uso |
|---------|-------|-----|
| `tlamx-mark-portal.svg` | tinta `#0a0a0a` | Export monocromo |
| `tlamx-mark-portal-ink.svg` | teal `#008292` | **Canónico UI** / favicon |
| `tlamx-mark-portal-onbrand.svg` | blanco sobre tile teal | Archivo (alternativa tile) |
| `tlamx-mark-portal-ink-email.png` | teal | Email HTML (PNG 160×160, fondo blanco; API embebe data URI) |
| `latuno-mark-b-portal-ink-email.png` | teal | **Legado — no borrar.** Mismo PNG; lo siguen pidiendo correos ya enviados |

viewBox ceñido `10 14 80 70` para paridad óptica.

**Integrado:**
- `public/favicon.svg` = portal ink
- UI: `BrandLockup` (`TlamxMark` + `Wordmark` Schibsted) en sidebar, landing, auth, design-system
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
- `/brand/tlamx-mark-portal-ink.svg`
- `/brand/tlamx-lockup-safe-area.svg`
- `/welcome`, `/login`, sidebar ERP

Checklist: 16px · 64px · gap 0.5×mark · Schibsted 700 (sin stroke) · centro óptico mark↔wordmark (`WORDMARK_OPTICAL_Y_OFFSET_RATIO`).
