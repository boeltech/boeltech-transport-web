import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock3, Edit3, FileWarning, Route, Save } from "lucide-react";

import type { Trip, UpdateTripInput } from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { ScrollArea } from "@shared/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { HintIcon } from "@shared/ui/hint-icon";

import {
  buildUpdateTripInputFromQuickEditValues,
  getStopFiscalStatus,
  mapTripToQuickEditValues,
  type StopFiscalStatus,
  type TripQuickEditValues,
} from "./tripQuickEditPayload";
import {
  formatTripApiValidationForUser,
  validateUpdateTripApiPayload,
} from "../pages/create/validateTripApiPayload";

type TripQuickEditSheetProps = {
  trip: Trip;
  open: boolean;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: UpdateTripInput) => Promise<void>;
};

function fiscalStatusCopy(status: StopFiscalStatus): {
  label: string;
  variant: "default" | "secondary" | "destructive";
} {
  if (status === "ok") {
    return { label: "Fiscal OK", variant: "default" };
  }
  if (status === "invalid") {
    return { label: "RFC inválido", variant: "destructive" };
  }
  return { label: "RFC pendiente", variant: "secondary" };
}

function normalizeRfc(value: string): string {
  return value.trim().toUpperCase();
}

export function TripQuickEditSheet({
  trip,
  open,
  isSaving,
  onOpenChange,
  onSubmit,
}: TripQuickEditSheetProps) {
  const [values, setValues] = useState<TripQuickEditValues>(() =>
    mapTripToQuickEditValues(trip),
  );
  const [stopFieldErrors, setStopFieldErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValues(mapTripToQuickEditValues(trip));
    setStopFieldErrors({});
    setGlobalError(null);
  }, [open, trip]);

  const fiscalSummary = useMemo(() => {
    const counters = { ok: 0, invalid: 0, pending: 0 };
    for (const stop of values.stops) {
      const status = getStopFiscalStatus(stop);
      counters[status] += 1;
    }
    return counters;
  }, [values.stops]);

  const setStopValue = (
    stopId: string,
    patch: Partial<TripQuickEditValues["stops"][number]>,
  ) => {
    setValues((prev) => ({
      ...prev,
      stops: prev.stops.map((stop) =>
        stop.stopId === stopId ? { ...stop, ...patch } : stop,
      ),
    }));
    setStopFieldErrors((prev) => {
      if (!prev[stopId]) return prev;
      const next = { ...prev };
      delete next[stopId];
      return next;
    });
  };

  const handleSave = async () => {
    setGlobalError(null);
    setStopFieldErrors({});

    if (!values.scheduledDeparture) {
      setGlobalError("La salida programada es obligatoria para guardar.");
      return;
    }

    const stopErrors: Record<string, string[]> = {};
    for (const stop of values.stops) {
      const issues: string[] = [];
      const status = getStopFiscalStatus(stop);
      if (status === "pending") {
        issues.push("Captura RFC remitente/destinatario o RFC de entrega.");
      } else if (status === "invalid") {
        issues.push("El RFC capturado no cumple formato válido.");
      }
      const parsedDistance =
        stop.distanceFromPreviousKm.trim() === ""
          ? undefined
          : Number(stop.distanceFromPreviousKm);
      if (
        stop.sequenceOrder > 0 &&
        (parsedDistance == null || !Number.isFinite(parsedDistance) || parsedDistance < 0)
      ) {
        issues.push("Distancia desde parada anterior inválida.");
      }
      if (issues.length > 0) stopErrors[stop.stopId] = issues;
    }

    if (Object.keys(stopErrors).length > 0) {
      setStopFieldErrors(stopErrors);
      setGlobalError("Hay paradas con datos fiscales o de ruta pendientes.");
      return;
    }

    const payload = buildUpdateTripInputFromQuickEditValues(trip, values);
    const apiValidation = validateUpdateTripApiPayload(payload);
    if (!apiValidation.ok) {
      setGlobalError(formatTripApiValidationForUser(apiValidation.fieldErrors, 4));
      return;
    }

    await onSubmit(payload);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full max-h-[100dvh] flex-col overflow-hidden sm:max-w-2xl">
        <SheetHeader className="shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Edicion rapida de viaje
          </SheetTitle>
          <SheetDescription>
            Ajusta horarios y datos operativos/fiscales por parada sin salir del detalle.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 pr-2">
          <div className="space-y-4 pb-1">
            <Alert>
              <Route className="h-4 w-4" />
              <AlertTitle>Flujo rapido</AlertTitle>
              <AlertDescription>
                Si necesitas reestructurar cargas, costos o asignaciones complejas, usa{" "}
                <Link to={`/trips/${trip.id}/edit`} className="font-medium underline underline-offset-2">
                  edicion completa
                </Link>
                .
              </AlertDescription>
            </Alert>

            {globalError ? (
              <Alert variant="destructive">
                <FileWarning className="h-4 w-4" />
                <AlertTitle>No se pudo guardar</AlertTitle>
                <AlertDescription>{globalError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-3 rounded-lg border p-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="quick-scheduled-departure">Salida programada</Label>
                <Input
                  id="quick-scheduled-departure"
                  type="datetime-local"
                  value={values.scheduledDeparture}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      scheduledDeparture: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quick-scheduled-arrival">Llegada programada</Label>
                <Input
                  id="quick-scheduled-arrival"
                  type="datetime-local"
                  value={values.scheduledArrival}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      scheduledArrival: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                <span>
                  Fiscal: {fiscalSummary.ok} OK · {fiscalSummary.pending} pendientes ·{" "}
                  {fiscalSummary.invalid} invalidos
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {values.stops.map((stop) => {
                const status = getStopFiscalStatus(stop);
                const statusUi = fiscalStatusCopy(status);
                return (
                  <section key={stop.stopId} className="rounded-lg border p-3 space-y-3">
                    <header className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">
                          Parada {stop.sequenceOrder + 1}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stop.locationName || "Sin nombre de ubicacion"}
                        </p>
                      </div>
                      <Badge variant={statusUi.variant}>{statusUi.label}</Badge>
                    </header>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Nombre de parada</Label>
                        <Input
                          value={stop.locationName}
                          onChange={(event) =>
                            setStopValue(stop.stopId, { locationName: event.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Llegada estimada</Label>
                        <Input
                          type="datetime-local"
                          value={stop.estimatedArrival}
                          onChange={(event) =>
                            setStopValue(stop.stopId, {
                              estimatedArrival: event.target.value,
                            })
                          }
                        />
                      </div>
                      {stop.sequenceOrder > 0 ? (
                        <div className="space-y-1.5 md:col-span-2">
                          <Label>Distancia desde parada anterior (km)</Label>
                          <Input
                            inputMode="decimal"
                            value={stop.distanceFromPreviousKm}
                            onChange={(event) =>
                              setStopValue(stop.stopId, {
                                distanceFromPreviousKm: event.target.value,
                              })
                            }
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>RFC remitente/destinatario</Label>
                        <Input
                          value={stop.rfcRemitenteDestinatario}
                          onChange={(event) =>
                            setStopValue(stop.stopId, {
                              rfcRemitenteDestinatario: normalizeRfc(event.target.value),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Nombre remitente/destinatario</Label>
                        <Input
                          value={stop.nombreRemitenteDestinatario}
                          onChange={(event) =>
                            setStopValue(stop.stopId, {
                              nombreRemitenteDestinatario: event.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor={`quick-stop-${stop.stopId}-delivery-rfc`}>
                            RFC de entrega (opcional)
                          </Label>
                          <HintIcon
                            label="Información sobre RFC de entrega"
                            side="top"
                          >
                            Úsalo cuando quien recibe la mercancía en esta parada no sea el mismo
                            que el destinatario fiscal de «RFC remitente/destinatario» (por ejemplo
                            entrega a un tercero o almacén distinto). En Carta Porte es un dato
                            aparte; si aplica, puede bastar este RFC para el dato fiscal de la
                            parada.
                          </HintIcon>
                        </div>
                        <Input
                          id={`quick-stop-${stop.stopId}-delivery-rfc`}
                          value={stop.deliveryRfcRemitenteDestinatario}
                          onChange={(event) =>
                            setStopValue(stop.stopId, {
                              deliveryRfcRemitenteDestinatario: normalizeRfc(
                                event.target.value,
                              ),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor={`quick-stop-${stop.stopId}-delivery-name`}>
                            Nombre de entrega (opcional)
                          </Label>
                          <HintIcon
                            label="Información sobre nombre de entrega"
                            side="top"
                          >
                            Nombre o razón social de quien recibe físicamente la entrega, cuando
                            difiere del «Nombre remitente/destinatario».
                          </HintIcon>
                        </div>
                        <Input
                          id={`quick-stop-${stop.stopId}-delivery-name`}
                          value={stop.deliveryNombreRemitenteDestinatario}
                          onChange={(event) =>
                            setStopValue(stop.stopId, {
                              deliveryNombreRemitenteDestinatario: event.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {stopFieldErrors[stop.stopId]?.length ? (
                      <ul className="text-xs text-destructive space-y-1">
                        {stopFieldErrors[stop.stopId].map((issue) => (
                          <li key={issue}>- {issue}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="shrink-0 gap-2 border-t border-border bg-background pt-4 sm:justify-between">
          <Button variant="outline" asChild>
            <Link to={`/trips/${trip.id}/edit`}>Abrir edicion completa</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              Guardar cambios
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
