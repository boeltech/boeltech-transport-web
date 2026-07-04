/**
 * OverlaysSection
 *
 * Componentes que aparecen sobre el contenido principal:
 *   - Dialog: modal centrado para acciones que requieren confirmación
 *   - Sheet: drawer lateral para edición o detalle contextual
 *   - Popover: contenido anclado a un trigger (filtros, micro-formularios)
 *   - Tooltip: ayuda contextual breve sobre hover/focus
 *   - Toast (sonner): notificaciones efímeras
 *
 * Cada uno tiene reglas de cuándo usar — ver descripción de cada card.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shared/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@shared/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@shared/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import {
  useToast,
  toastSuccess,
  toastError,
  toastWarning,
  toastInfo,
} from "@shared/hooks/useToast";
import { Info } from "lucide-react";

export function OverlaysSection() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { toast } = useToast();

  return (
    <div className="space-y-8">
      {/* Dialog */}
      <Card>
        <CardHeader>
          <CardTitle>Dialog — modal centrado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Úsalo para confirmaciones críticas, formularios cortos, o
            visualizaciones que requieren bloqueo del flujo. Si la edición
            es contextual sobre una entidad, prefiere <code>Sheet</code>.
            Con <code>modal=&#123;true&#125;</code> (default de Dialog), los toasts
            no son interactivos mientras el dialog esté abierto — usa{" "}
            <code>Alert</code> inline para errores de API.
          </p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Abrir dialog de ejemplo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Cancelar este viaje?</DialogTitle>
                <DialogDescription>
                  Esta acción no se puede deshacer. El conductor y el cliente
                  serán notificados automáticamente.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setDialogOpen(false)}
                >
                  Conservar viaje
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDialogOpen(false);
                    toastSuccess(
                      "Viaje cancelado",
                      "Se notificó al conductor y al cliente.",
                    );
                  }}
                >
                  Sí, cancelar viaje
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Sheet */}
      <Card>
        <CardHeader>
          <CardTitle>Sheet — drawer lateral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Patrón canónico para editar la entidad principal desde su
            página de detalle (ver skill <code>detail-sheet-master-detail</code>).
            Permite seguir viendo el contexto del detalle mientras editas.
            El primitivo usa <code>modal=&#123;false&#125;</code> por defecto y un
            guard Sonner para que los toasts sigan siendo interactivos{" "}
            <strong>sin cerrar el sheet</strong>.
          </p>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline">Editar cliente (sheet)</Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>Editar cliente</SheetTitle>
                <SheetDescription>
                  Los cambios se guardan al confirmar. Las direcciones tienen
                  su propio CRUD en el tab "Direcciones" del detalle.
                </SheetDescription>
              </SheetHeader>
              <div className="my-6 space-y-3 text-sm">
                <p className="text-muted-foreground">
                  (Aquí iría el formulario real del cliente — para fines de
                  showcase no lo embebemos.)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    toastError(
                      "Error de ejemplo",
                      "Haz clic en este toast o selecciona este texto: el sheet debe permanecer abierto.",
                    )
                  }
                >
                  Simular error API (toast)
                </Button>
              </div>
              <SheetFooter>
                <Button
                  variant="ghost"
                  onClick={() => setSheetOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    setSheetOpen(false);
                    toastSuccess("Cliente actualizado");
                  }}
                >
                  Guardar cambios
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </CardContent>
      </Card>

      {/* Popover */}
      <Card>
        <CardHeader>
          <CardTitle>Popover — contenido anclado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para micro-formularios, filtros rápidos o ayuda contextual
            extendida (más que un Tooltip, menos que un Dialog).
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Filtros rápidos</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 space-y-3">
              <div>
                <p className="text-sm font-medium">Filtrar por estado</p>
                <p className="text-xs text-muted-foreground">
                  Aplica un filtro temporal sin abandonar la lista.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline">
                  Programados
                </Button>
                <Button size="sm" variant="outline">
                  En ruta
                </Button>
                <Button size="sm" variant="outline">
                  Completados
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* Tooltip */}
      <Card>
        <CardHeader>
          <CardTitle>Tooltip — ayuda breve</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Etiqueta o explicación corta sobre hover/focus. Nunca uses
            tooltips para información esencial — no son accesibles a touch
            users sin un fallback.
          </p>
          <TooltipProvider delayDuration={0}>
            <div className="flex flex-wrap items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Información adicional sobre este campo
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover sobre mí</Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Aparezco a la derecha
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Tooltip abajo</Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Aparezco abajo
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Toast */}
      <Card>
        <CardHeader>
          <CardTitle>Toast (sonner) — notificación efímera</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Helpers tipados disponibles en <code>@shared/hooks/useToast</code>:
            {" "}
            <code>toastSuccess</code>, <code>toastError</code>,{" "}
            <code>toastWarning</code>, <code>toastInfo</code>,{" "}
            <code>toastPromise</code>, <code>toastDismiss</code>.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="success"
              onClick={() =>
                toastSuccess("Viaje creado", "Se asignó al conductor #3421")
              }
            >
              Success
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                toastError("Error al guardar", "Revisa la conexión e intenta de nuevo")
              }
            >
              Error
            </Button>
            <Button
              variant="warning"
              onClick={() =>
                toastWarning(
                  "Licencia por vencer",
                  "Roberto García: vence en 12 días",
                )
              }
            >
              Warning
            </Button>
            <Button
              variant="info"
              onClick={() =>
                toastInfo("Sincronización completa", "Catálogos SAT actualizados")
              }
            >
              Info
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast({
                  title: "Notificación neutra",
                  description: "Sin variante semántica",
                  variant: "default",
                })
              }
            >
              Plain
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
