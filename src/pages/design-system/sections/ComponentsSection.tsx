/**
 * ComponentsSection
 *
 * Showcase de los componentes base del DS post-Fase 0:
 *   - Button (todas las variantes y tamaños, con/sin iconos, loading)
 *   - Badge (variantes semánticas en solid y soft)
 *   - EntitlementBadge + AddonTeaserRow (Complementos · evolve-ds F5)
 *   - Tabs (soft/segmented — nav local canónica)
 */

import { ArrowRight, Lock, Plus, Radio, Trash2, Save, Download } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { AddonTeaserRow } from "@shared/ui/addon-teaser";
import { EntitlementBadge } from "@shared/ui/entitlement-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";

export function ComponentsSection() {
  return (
    <div className="space-y-8">
      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Button — variantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Row label="Solid (primarias)">
              <Button>Default</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="success">Success</Button>
              <Button variant="warning">Warning</Button>
              <Button variant="info">Info</Button>
            </Row>
            <Row label="Outlined / sutiles">
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </Row>
            <Row label="Con icono">
              <Button leftIcon={<Plus />}>Nuevo viaje</Button>
              <Button variant="outline" leftIcon={<Download />}>
                Exportar
              </Button>
              <Button variant="destructive" leftIcon={<Trash2 />}>
                Eliminar
              </Button>
              <Button variant="success" rightIcon={<Save />}>
                Guardar
              </Button>
            </Row>
            <Row label="Tamaños">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra large</Button>
            </Row>
            <Row label="Estados">
              <Button disabled>Disabled</Button>
              <Button isLoading>Guardando…</Button>
              <Button variant="outline" isLoading>
                Procesando
              </Button>
            </Row>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badge — variantes semánticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <Row label="Solid">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Completado</Badge>
              <Badge variant="warning">Por vencer</Badge>
              <Badge variant="info">En curso</Badge>
              <Badge variant="destructive">Cancelado</Badge>
              <Badge variant="neutral">Borrador</Badge>
            </Row>
            <Row label='Soft (tone="soft") — recomendado para listas densas'>
              <Badge variant="success" tone="soft">
                Completado
              </Badge>
              <Badge variant="warning" tone="soft">
                Por vencer
              </Badge>
              <Badge variant="info" tone="soft">
                En curso
              </Badge>
              <Badge variant="destructive" tone="soft">
                Cancelado
              </Badge>
              <Badge variant="neutral" tone="soft">
                Borrador
              </Badge>
            </Row>
            <Row label="Outline">
              <Badge variant="outline">Outline</Badge>
            </Row>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Regla: <strong>nunca</strong> usar colores Tailwind crudos
            (bg-green-500, text-yellow-700, etc.) para chips de estado. Si
            necesitas un estado nuevo, agrega un token semántico primero en{" "}
            <code className="font-mono text-xs">index.css</code>.
          </p>
        </CardContent>
      </Card>

      {/* EntitlementBadge — Complementos */}
      <Card>
        <CardHeader>
          <CardTitle>EntitlementBadge — estado de complemento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Sentence-case, tono soft. Fuente de verdad de copy canónico en el
            primitivo; no armar chips ad-hoc con{" "}
            <code className="font-mono text-xs">Badge</code> para Activo /
            Disponible / No disponible / Versión anticipada.
          </p>
          <Row label="Estados">
            <EntitlementBadge variant="active" />
            <EntitlementBadge variant="available" />
            <EntitlementBadge variant="unavailable" />
            <EntitlementBadge variant="early_access" />
          </Row>
          <Row label="Etiqueta de tipo (no es estado)">
            <EntitlementBadge variant="kind" />
            <span className="text-sm text-muted-foreground">
              Acompaña el nombre en presentación y teaser.
            </span>
          </Row>

          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium">AddonTeaserRow</p>
            <p className="text-sm text-muted-foreground">
              Solo ficha de unidad (u otra superficie con contexto). No en
              badge de alertas, Inicio ni resumen de viaje.
            </p>
            <AddonTeaserRow
              icon={<Radio className="h-4 w-4" />}
              title="Monitoreo GPS"
              badge={<EntitlementBadge variant="kind" />}
              description="Ve dónde está esta unidad y su recorrido. No está incluido en tu plan."
              action={
                <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-foreground">
                  Conocer Monitoreo GPS
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              }
            />
          </div>

          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium">
              Entrada bloqueada del sidebar (contrato)
            </p>
            <p className="text-sm text-muted-foreground">
              Nav item con{" "}
              <code className="font-mono text-xs">
                entitlement + lockedPreview
              </code>
              ; grupo «Complementos» al final. No reimplementar el chrome: vive
              en <code className="font-mono text-xs">widgets/sidebar</code>.
            </p>
            <div
              className="w-56 rounded-lg border border-sidebar-border bg-sidebar p-2 text-sidebar-foreground"
              aria-hidden
            >
              <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-sidebar-foreground/60">
                Complementos
              </p>
              <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm">
                <Radio className="h-4 w-4 shrink-0 opacity-80" />
                <span className="flex-1 truncate">Monitoreo GPS</span>
                <Lock className="h-3.5 w-3.5 shrink-0 opacity-70" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs — soft/segmented */}
      <Card>
        <CardHeader>
          <CardTitle>Tabs — soft / segmented</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Nav local canónica de página/ruta: track{" "}
            <code className="font-mono text-xs">bg-muted</code> + píldora
            activa <code className="font-mono text-xs">bg-background</code>{" "}
            elevada. Misma familia que{" "}
            <code className="font-mono text-xs">ThemeSegmented</code>. No
            underline, no primary filled, no riel ámbar (el ámbar es chrome del
            sidebar).
          </p>
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="bodegas">Bodegas</TabsTrigger>
              <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="text-sm text-muted-foreground">
              Panel de ejemplo — Detail/Hub usan este primitivo vía{" "}
              <code className="font-mono text-xs">TabsList</code>.
            </TabsContent>
            <TabsContent value="bodegas" className="text-sm text-muted-foreground">
              Segundo panel — mismo set de clases exportadas.
            </TabsContent>
            <TabsContent value="fiscal" className="text-sm text-muted-foreground">
              Tercer panel.
            </TabsContent>
          </Tabs>
          <p className="text-xs text-muted-foreground">
            Settings / Cuenta usan{" "}
            <code className="font-mono">RouteTabsNav</code> con las mismas
            clases; track por defecto{" "}
            <code className="font-mono">trackFit=&quot;hug&quot;</code> (no
            estira a full width). Escape:{" "}
            <code className="font-mono">trackFit=&quot;stretch&quot;</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface RowProps {
  label: string;
  children: React.ReactNode;
}

function Row({ label, children }: RowProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
