/**
 * RouteStep - Paso 2 del Wizard
 * Ruta: Origen, Destino y Paradas intermedias
 */

import { useState } from "react";
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Button } from "@shared/ui/button";
import { Textarea } from "@shared/ui/text-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shared/ui/dialog";
import {
  MapPin,
  Plus,
  Trash2,
  GripVertical,
  Navigation,
  Flag,
} from "lucide-react";
import { cn } from "@shared/lib/utils";
import type { TripWizardFormValues, TripStopFormValues } from "../types";

interface RouteStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stopsFieldArray: UseFieldArrayReturn<TripWizardFormValues, "stops", any>;
}

const STOP_TYPE_OPTIONS = [
  { value: "pickup", label: "Carga" },
  { value: "delivery", label: "Descarga" },
  { value: "waypoint", label: "Escala" },
];

export function RouteStep({ form, stopsFieldArray }: RouteStepProps) {
  const { fields, append, remove, move } = stopsFieldArray;
  const [isAddStopDialogOpen, setIsAddStopDialogOpen] = useState(false);
  const [newStop, setNewStop] = useState<Partial<TripStopFormValues>>({
    stopType: "pickup",
    address: "",
    city: "",
    state: "",
    contactName: "",
    contactPhone: "",
    notes: "",
  });

  const handleAddStop = () => {
    if (newStop.address && newStop.city && newStop.stopType) {
      append({
        sequenceOrder: fields.length,
        stopType: newStop.stopType as TripStopFormValues["stopType"],
        address: newStop.address,
        city: newStop.city,
        state: newStop.state || "",
        postalCode: newStop.postalCode,
        locationName: newStop.locationName,
        contactName: newStop.contactName,
        contactPhone: newStop.contactPhone,
        estimatedArrival: newStop.estimatedArrival,
        notes: newStop.notes,
      });
      setNewStop({
        stopType: "pickup",
        address: "",
        city: "",
        state: "",
        contactName: "",
        contactPhone: "",
        notes: "",
      });
      setIsAddStopDialogOpen(false);
    }
  };

  const handleMoveStop = (fromIndex: number, toIndex: number) => {
    if (toIndex >= 0 && toIndex < fields.length) {
      move(fromIndex, toIndex);
      // Actualizar sequenceOrder
      fields.forEach((_, index) => {
        form.setValue(`stops.${index}.sequenceOrder`, index);
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Origen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Navigation className="h-5 w-5 text-green-600" /> Origen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="originAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección *</FormLabel>
                <FormControl>
                  <Input placeholder="Calle, número, colonia..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="originCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ciudad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="originState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input placeholder="Estado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Paradas Intermedias */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" /> Paradas Intermedias
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddStopDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Agregar Parada
          </Button>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay paradas intermedias</p>
              <p className="text-sm">
                Agregue paradas de carga, descarga o escalas
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <button
                      type="button"
                      className="p-1 hover:bg-muted rounded cursor-grab"
                      onClick={() => handleMoveStop(index, index - 1)}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <span className="text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded",
                          field.stopType === "pickup" &&
                            "bg-green-100 text-green-700",
                          field.stopType === "delivery" &&
                            "bg-blue-100 text-blue-700",
                          field.stopType === "waypoint" &&
                            "bg-gray-100 text-gray-700",
                        )}
                      >
                        {STOP_TYPE_OPTIONS.find(
                          (o) => o.value === field.stopType,
                        )?.label || field.stopType}
                      </span>
                      {field.locationName && (
                        <span className="text-sm font-medium">
                          {field.locationName}
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{field.address}</p>
                    <p className="text-xs text-muted-foreground">
                      {field.city}
                      {field.state && `, ${field.state}`}
                    </p>
                    {field.contactName && (
                      <p className="text-xs text-muted-foreground">
                        Contacto: {field.contactName}{" "}
                        {field.contactPhone && `- ${field.contactPhone}`}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Destino */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-600" /> Destino
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="destinationAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dirección *</FormLabel>
                <FormControl>
                  <Input placeholder="Calle, número, colonia..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="destinationCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ciudad" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destinationState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input placeholder="Estado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dialog para agregar parada */}
      <Dialog open={isAddStopDialogOpen} onOpenChange={setIsAddStopDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar Parada</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Parada *</label>
              <Select
                value={newStop.stopType}
                onValueChange={(value) =>
                  setNewStop({
                    ...newStop,
                    stopType: value as TripStopFormValues["stopType"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {STOP_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nombre del Lugar (opcional)
              </label>
              <Input
                placeholder="Ej: Bodega Central, CEDIS Norte..."
                value={newStop.locationName || ""}
                onChange={(e) =>
                  setNewStop({ ...newStop, locationName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dirección *</label>
              <Input
                placeholder="Calle, número, colonia..."
                value={newStop.address || ""}
                onChange={(e) =>
                  setNewStop({ ...newStop, address: e.target.value })
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Ciudad *</label>
                <Input
                  placeholder="Ciudad"
                  value={newStop.city || ""}
                  onChange={(e) =>
                    setNewStop({ ...newStop, city: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Input
                  placeholder="Estado"
                  value={newStop.state || ""}
                  onChange={(e) =>
                    setNewStop({ ...newStop, state: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre Contacto</label>
                <Input
                  placeholder="Nombre del contacto"
                  value={newStop.contactName || ""}
                  onChange={(e) =>
                    setNewStop({ ...newStop, contactName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Teléfono Contacto</label>
                <Input
                  placeholder="Teléfono"
                  value={newStop.contactPhone || ""}
                  onChange={(e) =>
                    setNewStop({ ...newStop, contactPhone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <Textarea
                placeholder="Instrucciones especiales..."
                value={newStop.notes || ""}
                onChange={(e) =>
                  setNewStop({ ...newStop, notes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddStopDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddStop}
              disabled={!newStop.address || !newStop.city}
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
