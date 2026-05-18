/**
 * FeedbackSection
 *
 * Componentes de retroalimentación:
 *   - Alert: mensajes estáticos contextuales con variantes semánticas
 *   - EmptyState: tablas/listas sin datos
 *   - LoadingPageState: skeletons estructurados por tipo de página
 *
 * Todos consumen tokens del DS post-Fase 4.
 */

import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Package,
  Plus,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertWithIcon,
} from "@shared/ui/alert";
import { EmptyState } from "@shared/ui/feedback-states";
import { LoadingPageState } from "@shared/ui/feedback-states/LoadingPageState";

export function FeedbackSection() {
  return (
    <div className="space-y-8">
      {/* Alert */}
      <Card>
        <CardHeader>
          <CardTitle>Alert — mensajes contextuales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Mensaje neutro</AlertTitle>
            <AlertDescription>
              Variante default — sin connotación semántica. Útil para tips o
              notas generales.
            </AlertDescription>
          </Alert>
          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Operación completada</AlertTitle>
            <AlertDescription>
              El viaje se guardó correctamente y se asignó al conductor.
            </AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Licencia por vencer</AlertTitle>
            <AlertDescription>
              Roberto García: su licencia vence en 12 días. Renuévala antes
              del 28 de mayo.
            </AlertDescription>
          </Alert>
          <Alert variant="info">
            <Info className="h-4 w-4" />
            <AlertTitle>Sincronización en progreso</AlertTitle>
            <AlertDescription>
              Estamos actualizando los catálogos SAT. Esto puede tomar unos
              minutos.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No pudimos emitir el CFDI</AlertTitle>
            <AlertDescription>
              El PAC respondió con error 301. Verifica que la dirección
              fiscal del cliente esté completa.
            </AlertDescription>
          </Alert>

          <div className="pt-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              AlertWithIcon (helper)
            </p>
            <div className="mt-2 space-y-2">
              <AlertWithIcon
                variant="info"
                title="Tip"
                showIcon
              >
                <code>AlertWithIcon</code> arma título + descripción + icono
                automáticamente para uso rápido.
              </AlertWithIcon>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EmptyState */}
      <Card>
        <CardHeader>
          <CardTitle>EmptyState — sin resultados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md border">
            <EmptyState
              icon={<Package />}
              title="Sin viajes registrados"
              description="Aún no has registrado viajes. Crea el primero para empezar a operar."
              cta={{
                label: "Crear primer viaje",
                icon: <Plus className="h-4 w-4" />,
                onClick: () => {
                  /* demo */
                },
              }}
            />
          </div>

          <div className="rounded-md border">
            <EmptyState
              size="md"
              icon={<Filter />}
              title="Ningún resultado coincide"
              description="Prueba ajustar los filtros o limpiar la búsqueda."
              cta={{
                label: "Limpiar filtros",
                onClick: () => {
                  /* demo */
                },
                variant: "outline",
              }}
              secondaryCta={{
                label: "Ver todos",
                onClick: () => {
                  /* demo */
                },
                variant: "ghost",
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* LoadingPageState */}
      <Card>
        <CardHeader>
          <CardTitle>LoadingPageState — skeletons estructurados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Skeletons por tipo de shell: <code>list</code>, <code>detail</code>,{" "}
            <code>form</code>, <code>wizard</code>. Aquí mostramos los 4 en
            paralelo a escala reducida.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            <SkeletonPreview label="variant=list">
              <LoadingPageState variant="list" />
            </SkeletonPreview>
            <SkeletonPreview label="variant=detail">
              <LoadingPageState variant="detail" />
            </SkeletonPreview>
            <SkeletonPreview label="variant=form">
              <LoadingPageState variant="form" />
            </SkeletonPreview>
            <SkeletonPreview label="variant=wizard">
              <LoadingPageState variant="wizard" />
            </SkeletonPreview>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SkeletonPreviewProps {
  label: string;
  children: React.ReactNode;
}

function SkeletonPreview({ label, children }: SkeletonPreviewProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="max-h-[360px] overflow-hidden rounded-md border bg-muted/20 p-3">
        <div className="origin-top-left scale-[0.7]">{children}</div>
      </div>
    </div>
  );
}
