/**
 * RouteStep - Paso 2 del Wizard
 * Ruta: Paradas del viaje (primera = origen, última = destino)
 *
 * Reglas de negocio:
 * - Origen (posición 0): solo operación "carga" (pickup)
 * - Destino (última posición): solo operación "descarga" (delivery)
 * - Escala (posiciones intermedias): carga y/o descarga (editable inline)
 * - Drag & drop libre sin confirmación; las operaciones se ajustan automáticamente
 *   al cambiar de posición (origen/destino), y se preservan para escalas.
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
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
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
  Pencil,
} from "lucide-react";
import { cn } from "@shared/lib/utils";
import type { TripWizardFormValues, TripStopFormValues } from "../types";
import { useActiveClients } from "@/features/clients/application/hooks/useClients";
import { useClientAddresses } from "@/features/clients/application/hooks/useClientAddresses";
import { ADDRESS_TYPE_LABELS } from "@/features/clients/domain/entities";
import { StopType } from "@features/trips";

interface RouteStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stopsFieldArray: UseFieldArrayReturn<TripWizardFormValues, "stops", any>;
}

// Categorías principales de parada (mutuamente excluyentes)
const STOP_CATEGORY_OPTIONS = [
  {
    value: "origin",
    label: "Origen",
    icon: Navigation,
    color: "text-green-600",
  },
  {
    value: "waypoint",
    label: "Escala",
    icon: MapPin,
    color: "text-gray-600",
  },
  {
    value: "destination",
    label: "Destino",
    icon: Flag,
    color: "text-red-600",
  },
];

// Tipos de operación en la parada (pueden ser múltiples según la categoría)
const STOP_OPERATION_OPTIONS = [
  { value: "pickup", label: "Carga", icon: MapPin, color: "text-blue-600" },
  {
    value: "delivery",
    label: "Descarga",
    icon: MapPin,
    color: "text-orange-600",
  },
];

/**
 * Obtiene las operaciones permitidas según la categoría de parada
 * - Origen: solo carga (pickup)
 * - Destino: solo descarga (delivery)
 * - Escala: carga y/o descarga
 */
const getAvailableOperations = (
  category: "origin" | "waypoint" | "destination" | undefined,
) => {
  if (!category) return [];

  switch (category) {
    case "origin":
      return STOP_OPERATION_OPTIONS.filter((opt) => opt.value === "pickup");
    case "destination":
      return STOP_OPERATION_OPTIONS.filter((opt) => opt.value === "delivery");
    case "waypoint":
      return STOP_OPERATION_OPTIONS;
    default:
      return [];
  }
};

/**
 * Obtiene la categoría de una parada según su stopType array
 */
const getStopCategory = (
  stopType: TripStopFormValues["stopType"],
): "origin" | "waypoint" | "destination" | undefined => {
  if (stopType.includes(StopType.ORIGIN)) return "origin";
  if (stopType.includes(StopType.DESTINATION)) return "destination";
  if (stopType.includes(StopType.WAYPOINT)) return "waypoint";
  return undefined;
};

// Interfaz extendida para el estado del formulario de nueva parada
interface NewStopState extends Partial<TripStopFormValues> {
  stopCategory?: "origin" | "waypoint" | "destination";
}

export function RouteStep({ form, stopsFieldArray }: RouteStepProps) {
  const { fields, insert, remove, move } = stopsFieldArray;
  const [isAddStopDialogOpen, setIsAddStopDialogOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Estado para el popover de edición de operaciones en escalas
  const [editingStopIndex, setEditingStopIndex] = useState<number | null>(null);

  const [newStop, setNewStop] = useState<NewStopState>({
    stopCategory: undefined,
    stopType: [],
    clientId: "",
    clientAddressId: "",
    address: "",
    city: "",
    state: "",
    contactName: "",
    contactPhone: "",
    notes: "",
  });

  // ========== FUNCIONES HELPER ==========

  /**
   * Verifica si ya existe una parada con la categoría especificada
   */
  const hasStopCategory = (
    category: "origin" | "destination" | "waypoint",
  ): boolean => {
    const categoryType =
      category === "origin"
        ? StopType.ORIGIN
        : category === "destination"
          ? StopType.DESTINATION
          : StopType.WAYPOINT;

    return fields.some((_, index) => {
      const stop = form.getValues(`stops.${index}`);
      return stop.stopType.includes(categoryType);
    });
  };

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
    if (
      newStop.address &&
      newStop.city &&
      newStop.stopCategory &&
      newStop.stopType &&
      newStop.stopType.length > 0
    ) {
      // Combinar la categoría con las operaciones
      const stopTypes: TripStopFormValues["stopType"] = [
        newStop.stopCategory as any,
        ...newStop.stopType,
      ];

      let insertIndex = 0;

      if (fields.length > 0) {
        if (stopTypes.includes(StopType.ORIGIN)) {
          insertIndex = 0;
        } else if (stopTypes.includes(StopType.DESTINATION)) {
          insertIndex = fields.length;
        } else {
          // Para escalas, insertamos antes del destino (si existe)
          const destinationIndex = fields.findIndex((_, index) => {
            const stop = form.getValues(`stops.${index}`);
            return stop.stopType.includes(StopType.DESTINATION);
          });
          insertIndex =
            destinationIndex !== -1 ? destinationIndex : fields.length;
        }
      } else {
        insertIndex = 0;
      }

      insert(insertIndex, {
        sequenceOrder: insertIndex,
        stopType: stopTypes,
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
      requestAnimationFrame(() => {
        const currentStops = form.getValues("stops");

        currentStops.forEach((_, index) => {
          form.setValue(`stops.${index}.sequenceOrder`, index);
        });
      });

      // Resetear el formulario
      setNewStop({
        stopCategory: undefined,
        stopType: [],
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

  /**
   * Maneja el movimiento de paradas (botones arriba/abajo y drag & drop).
   * Se ejecuta directamente sin confirmación; las operaciones se ajustan
   * automáticamente según la nueva posición.
   */
  const handleMoveStop = (fromIndex: number, toIndex: number) => {
    if (toIndex >= 0 && toIndex < fields.length) {
      performMove(fromIndex, toIndex);
    }
  };

  const performMove = (fromIndex: number, toIndex: number) => {
    move(fromIndex, toIndex);

    requestAnimationFrame(() => {
      const currentStops = form.getValues("stops");

      currentStops.forEach((_, index) => {
        form.setValue(`stops.${index}.sequenceOrder`, index);
        updateStopTypeForPosition(index);
      });
    });
  };

  const handleRemoveStop = (index: number) => {
    remove(index);

    requestAnimationFrame(() => {
      const currentStops = form.getValues("stops");

      currentStops.forEach((_, idx) => {
        form.setValue(`stops.${idx}.sequenceOrder`, idx);
        updateStopTypeForPosition(idx);
      });
    });
  };

  /**
   * Actualiza el stopType de una parada según su posición en la lista.
   * - Posición 0 → ORIGIN + PICKUP
   * - Última posición → DESTINATION + DELIVERY
   * - Posiciones intermedias → WAYPOINT + operaciones preservadas
   */
  const updateStopTypeForPosition = (index: number) => {
    const currentStop = form.getValues(`stops.${index}`);
    if (!currentStop) return;

    let newTypes: TripStopFormValues["stopType"];

    const currentStops = form.getValues("stops");

    if (currentStops.length === 0 && index === 0) {
      return;
    }

    if (index === 0 && currentStops.length > 0) {
      // Primera parada: debe ser ORIGIN + solo PICKUP (carga)
      newTypes = [StopType.ORIGIN, StopType.PICKUP];
    } else if (index === currentStops.length - 1 && currentStops.length > 0) {
      // Última parada: debe ser DESTINATION + solo DELIVERY (descarga)
      newTypes = [StopType.DESTINATION, StopType.DELIVERY];
    } else {
      // Parada intermedia: remover ORIGIN y DESTINATION, mantener operaciones existentes
      newTypes = currentStop.stopType.filter(
        (type) => type !== StopType.ORIGIN && type !== StopType.DESTINATION,
      );

      // Agregar WAYPOINT si no tiene ninguna categoría de posición
      if (
        !newTypes.includes(StopType.WAYPOINT) &&
        !newTypes.includes(StopType.ORIGIN) &&
        !newTypes.includes(StopType.DESTINATION)
      ) {
        newTypes = [StopType.WAYPOINT, ...newTypes];
      }

      // Si no tiene operaciones (pickup/delivery), mantener las que tenía
      const hasOperations = newTypes.some(
        (type) => type === StopType.PICKUP || type === StopType.DELIVERY,
      );
      if (!hasOperations) {
        // Preservar las operaciones originales que no sean categorías
        const originalOperations = currentStop.stopType.filter(
          (type) =>
            type !== StopType.ORIGIN &&
            type !== StopType.DESTINATION &&
            type !== StopType.WAYPOINT,
        );
        newTypes = [...newTypes, ...originalOperations];
      }
    }

    form.setValue(`stops.${index}.stopType`, newTypes);
  };

  /**
   * Maneja el cambio de operaciones en una parada tipo Escala (waypoint) ya creada.
   * Solo aplica para paradas intermedias (no origen ni destino).
   */
  const handleWaypointOperationChange = (
    stopIndex: number,
    operation: string,
    checked: boolean,
  ) => {
    const currentStop = form.getValues(`stops.${stopIndex}`);
    if (!currentStop) return;

    // Extraer las operaciones actuales (sin categorías)
    const currentOperations = currentStop.stopType.filter(
      (type) =>
        type !== StopType.ORIGIN &&
        type !== StopType.DESTINATION &&
        type !== StopType.WAYPOINT,
    );

    let newOperations: string[];

    if (checked) {
      newOperations = [...currentOperations, operation];
    } else {
      newOperations = currentOperations.filter((t) => t !== operation);
    }

    // No permitir dejar sin operaciones
    if (newOperations.length === 0) return;

    // Reconstruir el stopType: WAYPOINT + operaciones seleccionadas
    const newStopType = [
      StopType.WAYPOINT,
      ...newOperations,
    ] as TripStopFormValues["stopType"];

    form.setValue(`stops.${stopIndex}.stopType`, newStopType);
  };

  // ========== DRAG AND DROP HANDLERS ==========

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      handleMoveStop(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // ========== UI HELPERS ==========

  const getStopIcon = (stopType: TripStopFormValues["stopType"]) => {
    if (stopType.includes(StopType.ORIGIN)) return Navigation;
    if (stopType.includes(StopType.DESTINATION)) return Flag;
    return MapPin;
  };

  const getStopLabel = (stopType: TripStopFormValues["stopType"]) => {
    const labels: string[] = [];

    if (stopType.includes(StopType.ORIGIN)) labels.push("Origen");
    if (stopType.includes(StopType.DESTINATION)) labels.push("Destino");
    if (stopType.includes(StopType.WAYPOINT)) labels.push("Escala");
    if (stopType.includes(StopType.PICKUP)) labels.push("Carga");
    if (stopType.includes(StopType.DELIVERY)) labels.push("Descarga");

    return labels.join(" + ");
  };

  const getStopTypeInfo = (type: string) => {
    const category = STOP_CATEGORY_OPTIONS.find((opt) => opt.value === type);
    if (category) {
      return {
        label: category.label,
        icon: category.icon,
        color: category.color,
      };
    }
    const operation = STOP_OPERATION_OPTIONS.find((opt) => opt.value === type);
    if (operation) {
      return {
        label: operation.label,
        icon: operation.icon,
        color: operation.color,
      };
    }
    return { label: type, icon: MapPin, color: "text-gray-600" };
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ruta del Viaje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de paradas */}
          <div className="space-y-2">
            {fields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay paradas agregadas</p>
                <p className="text-sm">
                  Agregue al menos una parada de origen y una de destino
                </p>
              </div>
            )}

            {fields.map((field, index) => {
              const stop = form.watch(`stops.${index}`);

              // Si stop es undefined, no renderizar nada
              if (!stop || !stop.stopType) {
                return null;
              }

              const Icon = getStopIcon(stop.stopType);
              const category = getStopCategory(stop.stopType);
              const isWaypoint = category === "waypoint";

              return (
                <div
                  key={field.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex items-start gap-3 p-4 border rounded-lg transition-all",
                    draggedIndex === index && "opacity-50",
                    "hover:shadow-md cursor-move",
                    stop.stopType.includes(StopType.ORIGIN) &&
                      "border-green-200 bg-green-50/50",
                    stop.stopType.includes(StopType.DESTINATION) &&
                      "border-red-200 bg-red-50/50",
                  )}
                >
                  {/* Drag Handle */}
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Stop Icon */}
                  <div className="pt-1">
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        stop.stopType.includes(StopType.ORIGIN) &&
                          "text-green-600",
                        stop.stopType.includes(StopType.DESTINATION) &&
                          "text-red-600",
                        stop.stopType.includes(StopType.WAYPOINT) &&
                          "text-gray-600",
                      )}
                    />
                  </div>

                  {/* Stop Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1">
                          {Array.isArray(stop.stopType) ? (
                            stop.stopType.map((type) => {
                              const stopTypeInfo = getStopTypeInfo(type);

                              return (
                                <span
                                  key={type}
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
                                  {stopTypeInfo.label}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground">
                              {getStopLabel(stop.stopType)}
                            </span>
                          )}

                          {/* Botón editar operaciones - solo para escalas (waypoint) */}
                          {isWaypoint && (
                            <Popover
                              open={editingStopIndex === index}
                              onOpenChange={(open) =>
                                setEditingStopIndex(open ? index : null)
                              }
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 ml-1"
                                  title="Editar operaciones de esta escala"
                                >
                                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-64 p-3"
                                align="start"
                                side="bottom"
                              >
                                <div className="space-y-3">
                                  <p className="text-sm font-medium">
                                    Operaciones de la Escala
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Seleccione carga, descarga o ambas
                                  </p>
                                  <div className="space-y-2">
                                    {STOP_OPERATION_OPTIONS.map((option) => {
                                      const OpIcon = option.icon;
                                      const isChecked = stop.stopType.includes(
                                        option.value as any,
                                      );
                                      // No permitir desmarcar si es la única operación seleccionada
                                      const operationCount =
                                        stop.stopType.filter(
                                          (t) =>
                                            t === StopType.PICKUP ||
                                            t === StopType.DELIVERY,
                                        ).length;
                                      const isLastOperation =
                                        isChecked && operationCount === 1;

                                      return (
                                        <div
                                          key={option.value}
                                          className={cn(
                                            "flex items-center gap-3 p-2.5 border rounded-lg transition-colors",
                                            isChecked &&
                                              "border-primary bg-primary/5",
                                          )}
                                        >
                                          <Checkbox
                                            id={`edit-op-${index}-${option.value}`}
                                            checked={isChecked}
                                            disabled={isLastOperation}
                                            onCheckedChange={(checked) => {
                                              handleWaypointOperationChange(
                                                index,
                                                option.value,
                                                !!checked,
                                              );
                                            }}
                                          />
                                          <label
                                            htmlFor={`edit-op-${index}-${option.value}`}
                                            className={cn(
                                              "flex items-center gap-2 text-sm font-medium leading-none cursor-pointer",
                                              isLastOperation &&
                                                "opacity-50 cursor-not-allowed",
                                            )}
                                          >
                                            <OpIcon
                                              className={cn(
                                                "h-4 w-4",
                                                option.color,
                                              )}
                                            />
                                            {option.label}
                                          </label>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {stop.stopType.filter(
                                    (t) =>
                                      t === StopType.PICKUP ||
                                      t === StopType.DELIVERY,
                                  ).length === 1 && (
                                    <p className="text-xs text-muted-foreground italic">
                                      Debe tener al menos una operación
                                      seleccionada
                                    </p>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>

                        {stop.locationName && (
                          <p className="font-medium truncate">
                            {stop.locationName}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground truncate">
                          {stop.address}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {stop.city}
                          {stop.state && `, ${stop.state}`}
                        </p>
                      </div>
                    </div>

                    {stop.contactName && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Contacto: {stop.contactName}
                        {stop.contactPhone && ` · ${stop.contactPhone}`}
                      </p>
                    )}

                    {stop.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        {stop.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleMoveStop(index, index - 1)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleMoveStop(index, index + 1)}
                      disabled={index === fields.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveStop(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Stop Buttons */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Agregar parada:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {/* Botón Origen */}
              <Button
                type="button"
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => {
                  setNewStop((prev) => ({
                    ...prev,
                    stopCategory: "origin",
                    stopType: ["pickup" as any],
                  }));
                  setIsAddStopDialogOpen(true);
                }}
                disabled={hasStopCategory("origin")}
              >
                <Navigation className="h-5 w-5 text-green-600" />
                <span className="text-xs">Origen</span>
                {hasStopCategory("origin") && (
                  <span className="text-xs text-muted-foreground">
                    (Existe)
                  </span>
                )}
              </Button>

              {/* Botón Escala */}
              <Button
                type="button"
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => {
                  setNewStop((prev) => ({
                    ...prev,
                    stopCategory: "waypoint",
                    stopType: [],
                  }));
                  setIsAddStopDialogOpen(true);
                }}
              >
                <MapPin className="h-5 w-5 text-gray-600" />
                <span className="text-xs">Escala</span>
              </Button>

              {/* Botón Destino */}
              <Button
                type="button"
                variant="outline"
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => {
                  setNewStop((prev) => ({
                    ...prev,
                    stopCategory: "destination",
                    stopType: ["delivery" as any],
                  }));
                  setIsAddStopDialogOpen(true);
                }}
                disabled={hasStopCategory("destination")}
              >
                <Flag className="h-5 w-5 text-red-600" />
                <span className="text-xs">Destino</span>
                {hasStopCategory("destination") && (
                  <span className="text-xs text-muted-foreground">
                    (Existe)
                  </span>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Solo puede existir un origen y un destino. Puede agregar múltiples
              escalas.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add Stop Dialog */}
      <Dialog open={isAddStopDialogOpen} onOpenChange={setIsAddStopDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Agregar Nueva Parada:{" "}
              {newStop.stopCategory === "origin" && "Origen"}
              {newStop.stopCategory === "waypoint" && "Escala"}
              {newStop.stopCategory === "destination" && "Destino"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información del Tipo de Parada (Solo lectura) */}
            <div className="p-4 border-2 border-primary/20 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-3">
                {newStop.stopCategory === "origin" && (
                  <>
                    <Navigation className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">Parada de Origen</p>
                      <p className="text-xs text-muted-foreground">
                        Solo permite operación de carga (por defecto)
                      </p>
                    </div>
                  </>
                )}
                {newStop.stopCategory === "waypoint" && (
                  <>
                    <MapPin className="h-6 w-6 text-gray-600" />
                    <div>
                      <p className="font-medium text-sm">
                        Parada Intermedia (Escala)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Puede realizar carga, descarga o ambas operaciones
                      </p>
                    </div>
                  </>
                )}
                {newStop.stopCategory === "destination" && (
                  <>
                    <Flag className="h-6 w-6 text-red-600" />
                    <div>
                      <p className="font-medium text-sm">Parada de Destino</p>
                      <p className="text-xs text-muted-foreground">
                        Solo permite operación de descarga (por defecto)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Operaciones en la Parada */}
            {newStop.stopCategory && (
              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Operaciones en esta Parada *{" "}
                  <span className="text-muted-foreground font-normal">
                    {newStop.stopCategory === "origin" && "(solo carga)"}
                    {newStop.stopCategory === "destination" &&
                      "(solo descarga)"}
                    {newStop.stopCategory === "waypoint" &&
                      "(carga y/o descarga)"}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {getAvailableOperations(newStop.stopCategory).map(
                    (option) => {
                      const OpIcon = option.icon;
                      const isChecked =
                        newStop.stopType?.includes(option.value as any) ??
                        false;

                      return (
                        <div
                          key={option.value}
                          className={cn(
                            "flex items-center gap-3 p-3 border rounded-lg",
                            isChecked && "border-primary bg-primary/5",
                          )}
                        >
                          <Checkbox
                            id={`operation-${option.value}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const currentTypes = newStop.stopType || [];
                              let newTypes: typeof currentTypes;

                              if (checked) {
                                newTypes = [
                                  ...currentTypes,
                                  option.value as TripStopFormValues["stopType"][number],
                                ];
                              } else {
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
                            htmlFor={`operation-${option.value}`}
                            className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            <OpIcon className={cn("h-4 w-4", option.color)} />
                            {option.label}
                          </label>
                        </div>
                      );
                    },
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {newStop.stopCategory === "origin" &&
                    "En el origen solo se permite carga de mercancía (por defecto)"}
                  {newStop.stopCategory === "destination" &&
                    "En el destino solo se permite descarga de mercancía (por defecto)"}
                  {newStop.stopCategory === "waypoint" &&
                    "En escalas puede realizar carga, descarga o ambas operaciones"}
                </p>
              </div>
            )}

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
              onClick={() => {
                setNewStop({
                  stopCategory: undefined,
                  stopType: [],
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
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddStop}
              disabled={
                !newStop.address ||
                !newStop.city ||
                !newStop.stopCategory ||
                !newStop.stopType ||
                newStop.stopType.length === 0
              }
            >
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
