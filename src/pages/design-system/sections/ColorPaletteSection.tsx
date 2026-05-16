/**
 * ColorPaletteSection
 *
 * Muestra:
 *   - Escala primary 50→950
 *   - Tokens semánticos (solid + soft) con contraste anotado
 *   - Surfaces y neutrals
 *   - Sidebar tokens
 *
 * Cada swatch lee directamente el token CSS para que cualquier cambio
 * futuro en index.css se vea reflejado sin re-build de este código.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";

interface SwatchProps {
  label: string;
  /** CSS custom property name sin var(), ej. "primary-600" */
  token: string;
  /** Variable para el texto sobre el swatch */
  textToken?: string;
  /** Notas opcionales (ej. "Primary base") */
  note?: string;
}

function Swatch({ label, token, textToken = "foreground", note }: SwatchProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex h-16 items-end rounded-lg border px-3 py-2 shadow-sm"
        style={{
          backgroundColor: `var(--${token})`,
          color: `var(--${textToken})`,
        }}
      >
        <span className="font-mono text-xs font-semibold">{label}</span>
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <code className="font-mono text-[11px] text-muted-foreground">
          --{token}
        </code>
        {note ? (
          <span className="text-[11px] text-muted-foreground">{note}</span>
        ) : null}
      </div>
    </div>
  );
}

const PRIMARY_STEPS = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const;

const SEMANTIC_TOKENS = [
  {
    name: "success",
    label: "Success",
    note: "Operación completada, viaje finalizado",
  },
  { name: "warning", label: "Warning", note: "Licencia por vencer, pendiente" },
  { name: "info", label: "Info", note: "Notas, hints, neutral activo" },
  {
    name: "destructive",
    label: "Destructive",
    note: "Eliminar, cancelar, error",
  },
  { name: "neutral", label: "Neutral", note: "Borrador, inactivo, archivado" },
] as const;

export function ColorPaletteSection() {
  return (
    <div className="space-y-8">
      {/* Primary scale */}
      <Card>
        <CardHeader>
          <CardTitle>Primary scale — azul-tinta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11">
            {PRIMARY_STEPS.map((step) => {
              const isBase = step === "600";
              return (
                <Swatch
                  key={step}
                  label={step}
                  token={`primary-${step}`}
                  textToken={Number(step) >= 500 ? "primary-foreground" : "foreground"}
                  note={isBase ? "BASE" : undefined}
                />
              );
            })}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            <code className="font-mono text-xs">--primary-600</code> es el color
            de marca usado por <code className="font-mono text-xs">--primary</code>{" "}
            y <code className="font-mono text-xs">--ring</code>. La escala
            completa está disponible como utilidades Tailwind:{" "}
            <code className="font-mono text-xs">bg-primary-50</code>,{" "}
            <code className="font-mono text-xs">text-primary-700</code>, etc.
          </p>
        </CardContent>
      </Card>

      {/* Surfaces */}
      <Card>
        <CardHeader>
          <CardTitle>Surfaces & neutrals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Swatch label="background" token="background" />
            <Swatch label="card" token="card" textToken="card-foreground" />
            <Swatch label="popover" token="popover" textToken="popover-foreground" />
            <Swatch label="secondary" token="secondary" textToken="secondary-foreground" />
            <Swatch label="muted" token="muted" textToken="muted-foreground" />
            <Swatch label="accent" token="accent" textToken="accent-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Semantic */}
      <Card>
        <CardHeader>
          <CardTitle>Semantic tokens — solid + soft</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {SEMANTIC_TOKENS.map((t) => (
              <div
                key={t.name}
                className="grid grid-cols-1 gap-4 sm:grid-cols-[180px_1fr_1fr]"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">{t.label}</h4>
                  <p className="text-xs text-muted-foreground">{t.note}</p>
                </div>
                <Swatch
                  label="solid"
                  token={t.name}
                  textToken={`${t.name}-foreground`}
                />
                <Swatch
                  label="soft"
                  token={`${t.name}-soft`}
                  textToken={`${t.name}-soft-foreground`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sidebar tokens */}
      <Card>
        <CardHeader>
          <CardTitle>Sidebar palette</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Swatch
              label="sidebar"
              token="sidebar"
              textToken="sidebar-foreground"
            />
            <Swatch
              label="sidebar-primary"
              token="sidebar-primary"
              textToken="sidebar-primary-foreground"
            />
            <Swatch
              label="sidebar-accent"
              token="sidebar-accent"
              textToken="sidebar-accent-foreground"
            />
            <Swatch label="sidebar-border" token="sidebar-border" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
