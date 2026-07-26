/**
 * TypographySection
 *
 * Muestra:
 *   - Familia sans (IBM Plex Sans) en pesos disponibles
 *   - Familia mono (JetBrains Mono) con sample de RFC, UUID, totales
 *   - Escala tipográfica con line-heights
 *   - Feature settings (tabular-nums en tablas)
 */

import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";

const TYPE_SCALE = [
  { token: "text-4xl", className: "text-4xl", label: "Display ocasional" },
  { token: "text-3xl", className: "text-3xl", label: "h1 hero / dashboard" },
  { token: "text-2xl", className: "text-2xl", label: "h2 (page-shell title)" },
  { token: "text-xl", className: "text-xl", label: "h3" },
  { token: "text-lg", className: "text-lg", label: "Subtítulos, énfasis" },
  { token: "text-base", className: "text-base", label: "Body principal" },
  { token: "text-sm", className: "text-sm", label: "Body secundario, metadata" },
  { token: "text-xs", className: "text-xs", label: "Captions, labels micro" },
] as const;

const WEIGHTS = [
  { className: "font-normal", label: "Regular 400" },
  { className: "font-medium", label: "Medium 500" },
  { className: "font-semibold", label: "Semibold 600" },
  { className: "font-bold", label: "Bold 700" },
] as const;

export function TypographySection() {
  return (
    <div className="space-y-8">
      {/* Sans family */}
      <Card>
        <CardHeader>
          <CardTitle>IBM Plex Sans — UI + display</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Sample
              </p>
              <p className="text-5xl font-bold tracking-[-0.02em]">
                Boeltech ERP Transporte
              </p>
              <p className="text-2xl text-muted-foreground">
                Sistema de gestión para empresas de transporte mexicanas
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {WEIGHTS.map((w) => (
                <div
                  key={w.className}
                  className="rounded-md border border-border p-4"
                >
                  <p className={`${w.className} text-2xl`}>Aa Bb 123</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {w.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mono family */}
      <Card>
        <CardHeader>
          <CardTitle>JetBrains Mono — datos tabulares</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="rounded-md border border-border bg-muted/30 p-4 font-mono text-sm">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="py-1 pr-4 text-muted-foreground">RFC</td>
                    <td className="py-1 text-right font-medium">
                      BOEL920101AB1
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4 text-muted-foreground">UUID</td>
                    <td className="py-1 text-right font-medium">
                      A1B2C3D4-E5F6-7890-ABCD-EF1234567890
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4 text-muted-foreground">
                      Clave SAT
                    </td>
                    <td className="py-1 text-right font-medium">78101800</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4 text-muted-foreground">
                      Subtotal
                    </td>
                    <td className="py-1 text-right font-medium tabular-nums">
                      $ 10,750.00
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4 text-muted-foreground">IVA 16%</td>
                    <td className="py-1 text-right font-medium tabular-nums">
                      $ &nbsp;1,720.00
                    </td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="py-2 pr-4 font-semibold">Total</td>
                    <td className="py-2 text-right font-bold tabular-nums">
                      $ 12,470.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground">
              Ligaduras desactivadas globalmente (
              <code className="font-mono text-xs">font-feature-settings: "liga" 0</code>
              ) para evitar artifacts en códigos SAT como{" "}
              <code className="font-mono">!=</code> o{" "}
              <code className="font-mono">{`-->`}</code>. Tablas heredan{" "}
              <code className="font-mono text-xs">tabular-nums</code> por
              default vía la regla base en{" "}
              <code className="font-mono text-xs">@layer base</code>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Type scale */}
      <Card>
        <CardHeader>
          <CardTitle>Escala tipográfica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {TYPE_SCALE.map((s) => (
              <div
                key={s.token}
                className="grid grid-cols-[100px_1fr_200px] items-baseline gap-4 border-b border-border pb-3 last:border-b-0"
              >
                <code className="font-mono text-[11px] text-muted-foreground">
                  {s.token}
                </code>
                <p className={s.className}>El rápido zorro marrón</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
