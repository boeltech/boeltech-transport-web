/**
 * RouteStep - Paso 2 del Wizard
 * Ruta: Paradas del viaje (primera = origen, última = destino)
 */

import { useState } from "react";
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/text-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Checkbox } from "@shared/ui/checkbox";
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
  ChevronUp,
  ChevronDown,
  Building2,
} from "lucide-react";
import { cn } from "@shared/lib/utils";
import type { TripWizardFormValues, TripStopFormValues } from "../types";
import { useActiveClients } from "@/features/clients/application/hooks/useClients";
import { useClientAddresses } from "@/features/clients/application/hooks/useClientAddresses";
import { ADDRESS_TYPE_LABELS } from "@/features/clients/domain/entities";

interface RouteStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stopsFieldArray: UseFieldArrayReturn<TripWizardFormValues, "stops", any>;
}

const STOP_TYPE_OPTIONS = [
  {
    value: "origin",
    label: "Origen",
    icon: Navigation,
    color: "text-green-600",
  },
  { value: "pickup", label: "Carga", icon: MapPin, color: "text-blue-600" },
  {
    value: "delivery",
    label: "Descarga",
    icon: MapPin,
    color: "text-orange-600",
  },
  { value: "waypoint", label: "Escala", icon: MapPin, color: "text-gray-600" },
  { value: "destination", label: "Destino", icon: Flag, color: "text-red-600" },
];

// Tipos de parada permitidos según la posición
const getAvailableStopTypes = (position: "first" | "last" | "middle") => {
  switch (position) {
    case "first":
      // Primera parada: solo origen y/o carga
      return STOP_TYPE_OPTIONS.filter(
        (opt) => opt.value === "origin" || opt.value === "pickup",
      );
    case "last":
      // Última parada: solo destino y/o descarga
      return STOP_TYPE_OPTIONS.filter(
        (opt) => opt.value === "destination" || opt.value === "delivery",
      );
    case "middle":
      // Paradas intermedias: carga, descarga, escala
      return STOP_TYPE_OPTIONS.filter(
        (opt) =>
          opt.value === "pickup" ||
          opt.value === "delivery" ||
          opt.value === "waypoint",
      );
  }
};

export function RouteStep({ form, stopsFieldArray }: RouteStepProps) {
  const { fields, append, remove, move } = stopsFieldArray;
  const [isAddStopDialogOpen, setIsAddStopDialogOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [newStop, setNewStop] = useState<Partial<TripStopFormValues>>({
    stopType: ["pickup"], // Ahora es un array
    clientId: "",
    clientAddressId: "",
    address: "",
    city: "",
    state: "",
    contactName: "",
    contactPhone: "",
    notes: "",
  });

  // Cargar clientes activos
  const { data: clients = [] } = useActiveClients();

  // Cargar direcciones del cliente seleccionado
  const { data: addresses = [] } = useClientAddresses(newStop.clientId);

  // Manejar selección de dirección
  const handleAddressSelect = (addressId: string) => {
    const selectedAddress = addresses.find((addr) => addr.id === addressId);
    if (selectedAddress) {
      setNewStop((prev) => ({
        ...prev,
        clientAddressId: addressId,
        locationName: selectedAddress.locationName || "",
        address: selectedAddress.address,
        city: selectedAddress.city,
        state: selectedAddress.state || "",
        postalCode: selectedAddress.postalCode || "",
        contactName: selectedAddress.contactName || "",
        contactPhone: selectedAddress.contactPhone || "",
      }));
    } else {
      setNewStop((prev) => ({
        ...prev,
        clientAddressId: addressId,
      }));
    }
  };

  // Manejar cambio de cliente
  const handleClientChange = (clientId: string) => {
    setNewStop({
      ...newStop,
      clientId,
      clientAddressId: "",
      locationName: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      contactName: "",
      contactPhone: "",
    });
  };

  const handleAddStop = () => {
    if (newStop.address && newStop.city && newStop.stopType) {
      // Determinar el tipo de parada según la posición
      const stopType = newStop.stopType as TripStopFormValues["stopType"];

      // Si es la primera parada, debe ser origen
      // if (fields.length === 0) {
      //   stopType = "origin";
      // }
      // Si ya existe al menos una parada, insertar antes de la última (que será destino)
      const insertIndex = fields.length > 0 ? fields.length : 0;

      append({
        sequenceOrder: insertIndex,
        stopType,
        clientId: newStop.clientId || undefined,
        clientAddressId: newStop.clientAddressId || undefined,
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

      // Actualizar sequenceOrder de todas las paradas
      setTimeout(() => {
        fields.forEach((_, index) => {
          form.setValue(`stops.${index}.sequenceOrder`, index);
        });
      }, 0);

      setNewStop({
        stopType: ["pickup"],
        clientId: "",
        clientAddressId: "",
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
    // No permitir mover la primera (origen) ni la última (destino)
    // if (fromIndex === 0 || fromIndex === fields.length - 1) return;
    // if (toIndex === 0 || toIndex === fields.length - 1) return;
    if (toIndex >= 0 && toIndex < fields.length) {
      move(fromIndex, toIndex);
      // Actualizar sequenceOrder después de mover
      setTimeout(() => {
        fields.forEach((_, index) => {
          form.setValue(`stops.${index}.sequenceOrder`, index);
        });
      }, 0);
    }
  };

  const handleRemoveStop = (index: number) => {
    // Eliminar la parada
    remove(index);

    // Actualizar sequenceOrder de las paradas restantes inmediatamente
    // Usar el array actualizado después del remove
    const remainingStops = fields.filter((_, idx) => idx !== index);
    remainingStops.forEach((_, idx) => {
      form.setValue(`stops.${idx}.sequenceOrder`, idx);
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      handleMoveStop(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getStopTypeInfo = (stopType: string) => {
    return (
      STOP_TYPE_OPTIONS.find((o) => o.value === stopType) ||
      STOP_TYPE_OPTIONS[0]
    );
  };

  return (
    <div className="space-y-6">
      {/* Paradas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" /> Paradas del Viaje
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
              <p className="font-medium">No hay paradas agregadas</p>
              <p className="text-sm">
                Agregue al menos el origen y destino del viaje
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setIsAddStopDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar Primera Parada
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => {
                const isFirst = index === 0;
                const isLast = index === fields.length - 1;
                // const canMove = !isFirst && !isLast;
                // const canDelete = !isFirst && !isLast;
                const stopInfo = getStopTypeInfo(field.stopType);
                const StopIcon = stopInfo.icon;

                return (
                  <div
                    key={field.id}
                    draggable={true}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "flex items-start gap-3 p-4 border rounded-lg transition-all",
                      draggedIndex === index && "opacity-50 scale-95",
                      "hover:shadow-md cursor-move bg-muted/30",
                      isFirst && "border-green-200 bg-green-50/50",
                      fields.length > 1 &&
                        isLast &&
                        "border-red-200 bg-red-50/50",
                    )}
                  >
                    <div className="flex flex-col items-center gap-1 pt-1">
                      {
                        // canMove ? (
                        <div className="flex flex-col">
                          <button
                            type="button"
                            className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveStop(index, index - 1);
                            }}
                            disabled={isFirst}
                            title="Mover arriba"
                          >
                            <ChevronUp className="h-3 w-3 text-muted-foreground" />
                          </button>
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                          <button
                            type="button"
                            className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveStop(index, index + 1);
                            }}
                            disabled={isLast}
                            title="Mover abajo"
                          >
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                        // ) : (
                        // <StopIcon className={cn("h-6 w-6", stopInfo.color)} />
                        // )
                      }
                      <span className="text-xs font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Mostrar múltiples badges para cada tipo de parada */}
                        {Array.isArray(field.stopType) ? (
                          field.stopType.map((type) => {
                            const typeInfo = getStopTypeInfo(type);
                            const TypeIcon = typeInfo.icon;
                            return (
                              <div
                                key={type}
                                className="flex items-center gap-1"
                              >
                                <TypeIcon
                                  className={cn("h-4 w-4", typeInfo.color)}
                                />
                                <span
                                  className={cn(
                                    "px-2 py-0.5 text-xs font-medium rounded",
                                    type === "origin" &&
                                      "bg-green-100 text-green-700",
                                    type === "pickup" &&
                                      "bg-blue-100 text-blue-700",
                                    type === "delivery" &&
                                      "bg-orange-100 text-orange-700",
                                    type === "waypoint" &&
                                      "bg-gray-100 text-gray-700",
                                    type === "destination" &&
                                      "bg-red-100 text-red-700",
                                  )}
                                >
                                  {typeInfo.label}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          // Fallback para compatibilidad con datos antiguos
                          <>
                            <StopIcon
                              className={cn("h-5 w-5", stopInfo.color)}
                            />
                            <span
                              className={cn(
                                "px-2 py-0.5 text-xs font-medium rounded",
                                field.stopType === "origin" &&
                                  "bg-green-100 text-green-700",
                                field.stopType === "pickup" &&
                                  "bg-blue-100 text-blue-700",
                                field.stopType === "delivery" &&
                                  "bg-orange-100 text-orange-700",
                                field.stopType === "waypoint" &&
                                  "bg-gray-100 text-gray-700",
                                field.stopType === "destination" &&
                                  "bg-red-100 text-red-700",
                              )}
                            >
                              {stopInfo.label}
                            </span>
                          </>
                        )}

                        {field.locationName && (
                          <span className="text-sm font-medium">
                            {field.locationName}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium">{field.address}</p>
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
                      {field.notes && (
                        <p className="text-xs text-muted-foreground italic">
                          {field.notes}
                        </p>
                      )}
                    </div>

                    {
                      // canDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveStop(index);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      // )
                    }
                  </div>
                );
              })}
            </div>
          )}

          {fields.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <p className="font-medium">💡 Información:</p>
              <ul className="mt-1 ml-4 list-disc space-y-1">
                <li>
                  La primera parada es el <strong>origen</strong> del viaje
                </li>
                <li>
                  La última parada es el <strong>destino</strong> del viaje
                </li>
                {/* <li>
                  Puede agregar paradas intermedias de carga, descarga o escalas
                </li>
                <li>Las paradas intermedias se pueden reordenar</li> */}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para agregar parada */}
      <Dialog open={isAddStopDialogOpen} onOpenChange={setIsAddStopDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {
                // fields.length === 0
                //   ? "Agregar Origen"
                //   : fields.length === 1
                //     ? "Agregar Destino"
                //     :
                "Agregar Parada"
              }
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Tipo de Parada *</label>
              <div className="space-y-2">
                {(() => {
                  // Determinar posición de la nueva parada
                  let position: "first" | "last" | "middle";
                  if (fields.length === 0) {
                    position = "first";
                  } else if (fields.length === 1) {
                    position = "last";
                  } else {
                    position = "middle";
                  }

                  // Obtener tipos disponibles según la posición
                  const availableTypes = getAvailableStopTypes(position);

                  return availableTypes.map((option) => {
                    const Icon = option.icon;
                    const isChecked =
                      newStop.stopType?.includes(
                        option.value as TripStopFormValues["stopType"][number],
                      ) || false;

                    return (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`stopType-${option.value}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const currentTypes = newStop.stopType || [];
                            let newTypes: typeof currentTypes;

                            if (checked) {
                              // Agregar el tipo si no existe
                              newTypes = [
                                ...currentTypes,
                                option.value as TripStopFormValues["stopType"][number],
                              ];
                            } else {
                              // Remover el tipo
                              newTypes = currentTypes.filter(
                                (t) => t !== option.value,
                              );
                            }

                            setNewStop({
                              ...newStop,
                              stopType: newTypes,
                            });
                          }}
                        />
                        <label
                          htmlFor={`stopType-${option.value}`}
                          className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          <Icon className={cn("h-4 w-4", option.color)} />
                          {option.label}
                        </label>
                      </div>
                    );
                  });
                })()}
              </div>
              <p className="text-xs text-muted-foreground">
                {fields.length === 0 &&
                  "Primera parada: Seleccione Origen y/o Carga"}
                {fields.length === 1 &&
                  "Última parada: Seleccione Destino y/o Descarga"}
                {fields.length > 1 &&
                  "Parada intermedia: Seleccione Carga, Descarga y/o Escala"}
              </p>
            </div>

            {/* {fields.length < 2 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                {fields.length === 0
                  ? "Esta será la parada de origen del viaje"
                  : "Esta será la parada de destino del viaje"}
              </div>
            )} */}

            {/* Selector de Cliente */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Cliente (opcional)
              </label>
              <Select
                value={newStop.clientId || ""}
                onValueChange={handleClientChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-client">Sin cliente</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Asocie esta parada a un cliente para cargar sus direcciones
              </p>
            </div>

            {/* Selector de Dirección del Cliente */}
            {newStop.clientId && addresses.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Dirección del Cliente
                </label>
                <Select
                  value={newStop.clientAddressId || ""}
                  onValueChange={handleAddressSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar dirección..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-client-address">
                      Ingresar manualmente
                    </SelectItem>
                    {addresses.map((address) => (
                      <SelectItem key={address.id} value={address.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {address.locationName || address.address}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {address.city}
                            {address.state && `, ${address.state}`} -{" "}
                            {ADDRESS_TYPE_LABELS[address.addressType]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Seleccione una dirección guardada o ingrese manualmente
                </p>
              </div>
            )}

            {newStop.clientId && addresses.length === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                Este cliente no tiene direcciones registradas. Ingrese la
                dirección manualmente.
              </div>
            )}

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
                disabled={!!newStop.clientAddressId}
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
                disabled={!!newStop.clientAddressId}
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
                  disabled={!!newStop.clientAddressId}
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
                  disabled={!!newStop.clientAddressId}
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
