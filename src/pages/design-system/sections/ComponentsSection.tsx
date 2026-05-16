/**
 * ComponentsSection
 *
 * Showcase de los componentes base del DS post-Fase 0:
 *   - Button (todas las variantes y tamaños, con/sin iconos, loading)
 *   - Badge (variantes semánticas en solid y soft)
 */

import { Plus, Trash2, Save, Download } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";

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
