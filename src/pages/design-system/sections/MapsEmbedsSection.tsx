/**
 * MapsEmbedsSection
 *
 * Patrones para Mapbox y embeds externos reactivos al tema.
 */

import { Map, MapPin, Route } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  MAPBOX_STYLE_DARK,
  MAPBOX_STYLE_LIGHT,
} from "@shared/geolocation/mapboxStyles";
import { useTheme } from "@shared/hooks";

const MAPBOX_CHECKLIST = [
  "Inicializar con useMapboxStyle() — no hardcodear streets-v12.",
  "Al cambiar tema: map.setStyle() y esperar style.load antes de re-aplicar capas.",
  "Re-sincronizar markers y GeoJSON tras setStyle (syncMapOverlays).",
  "line-color y fills desde tokens CSS (--chart-1 vía getChartPrimaryColor).",
  "Popups HTML: evitar color:#666; usar opacity o clases del DS.",
] as const;

const EMBED_CHECKLIST = [
  "Contenedor con bg-background o bg-muted/30 y border-border.",
  "Respetar color-scheme del documento (html.dark).",
  "Re-mount o re-style embeds de terceros al cambiar resolvedTheme.",
  "No mezclar colores Tailwind crudos (bg-gray-*, text-red-600).",
] as const;

const ANTI_PATTERNS = [
  "mapbox://styles/mapbox/streets-v12 fijo en dark mode.",
  "line-color: #2563eb hardcodeado.",
  "Olvidar re-aplicar markers tras setStyle.",
  "Popups con estilos inline no adaptativos.",
] as const;

export function MapsEmbedsSection() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Map className="h-4 w-4" />
            Mapbox — estilos por tema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-2 font-medium">Tema resuelto</th>
                  <th className="px-4 py-2 font-medium">Style URL</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-2">light</td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {MAPBOX_STYLE_LIGHT}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2">dark</td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {MAPBOX_STYLE_DARK}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
            {`const mapboxStyle = useMapboxStyle();

map.setStyle(mapboxStyle);
map.once("style.load", () => syncMapOverlays(map, params));`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Route className="h-4 w-4" />
            Demo — mapa reactivo (mock)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-52 overflow-hidden rounded-md border bg-muted/30">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--muted)_0%,var(--card)_100%)]" />
            <div className="absolute inset-4 rounded border border-dashed border-border bg-background/40" />
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
              <MapPin className="h-8 w-8 text-muted-foreground" />
              <Badge variant="info" tone="soft">
                resolvedTheme: {resolvedTheme}
              </Badge>
              <p className="text-center text-xs text-muted-foreground">
                Mock estático — validar en viaje (Seguimiento) y dirección
                cliente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Checklist Mapbox</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
              {MAPBOX_CHECKLIST.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Embeds externos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
              {EMBED_CHECKLIST.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Anti-patrones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
            {ANTI_PATTERNS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Referencias en código</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 font-mono text-xs text-muted-foreground">
          <p>src/shared/geolocation/mapboxStyles.ts</p>
          <p>src/shared/geolocation/application/hooks/useMapboxStyle.ts</p>
          <p>src/shared/geolocation/mapboxThemeColors.ts</p>
          <p>src/shared/ui/address-input/AddressGeolocationMap.tsx</p>
          <p>
            src/features/trips/presentation/components/trip-tracking/TripTrackingMapView.tsx
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
