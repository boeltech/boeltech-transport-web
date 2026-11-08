# Geolocalización y mapas (`@shared/geolocation`)

Contrato de implementación para Mapbox y embeds de terceros. Intención (los mapas siguen el
tema; colores desde tokens): SoT `D:\cowork\boeltech\erp-transport\design\tlamx\platforms\web\design.md` §5.

Demo viva: `/design-system` → **Mapas + embeds** (admin).

## Mapbox por tema

| Tema resuelto | Style URL |
|---------------|-----------|
| `light` | `mapbox://styles/mapbox/streets-v12` |
| `dark` | `mapbox://styles/mapbox/dark-v11` |

Módulo: `mapboxStyles.ts` · hook `useMapboxStyle()` (lee `resolvedTheme` del `ThemeProvider`) ·
colores: `mapboxThemeColors.ts`.

Flujo al cambiar tema:

1. Inicializar el mapa con el estilo del hook (no hardcodear `streets-v12`).
2. `useEffect` dependiente de `mapboxStyle` → `map.setStyle(...)`.
3. En `style.load`, re-aplicar markers, fuentes GeoJSON y capas (`syncMapOverlays`):
   `setStyle()` borra layers y sources.
4. `line-color` y rellenos desde `--chart-1` (`getChartPrimaryColor()`), no `#2563eb`.

Referencias: `src/shared/ui/address-input/AddressGeolocationMap.tsx` (marker único) ·
`src/features/trips/presentation/components/trip-tracking/TripTrackingMapView.tsx` (ruta + paradas).

## Embeds externos (iframes, widgets)

- Contenedor `bg-background` o `bg-muted/30` + `border-border`.
- Respetar `color-scheme` de `html` / `html.dark` (`index.css`).
- Re-montar o reconfigurar el embed cuando cambie `resolvedTheme`.
- Sin estilos inline fijos (`color:#666`) en HTML generado para popups.

## Anti-patrones

- Estilo Mapbox fijo en dark mode.
- Colores Tailwind crudos en overlays (`bg-gray-*`, `text-red-600`).
- Olvidar re-sincronizar capas tras `setStyle()`.

## Verificación

- Manual: cambiar tema en Seguimiento de viaje y en formulario de dirección.
- `npm run test:smoke:dark` · `mapboxStyles.test.ts` · `mapboxThemeColors.test.ts`.
