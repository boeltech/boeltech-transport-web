/**
 * StopFormDialog - Dialog para agregar/editar paradas
 * Clean Architecture - Presentation Layer
 *
 * Fase C: ubicación capturada con `AddressInput` compartido (addressSchema / SAT en inglés)
 * y mapeo a `TripStopFormValues` del wizard.
 *
 * Ubicación: src/features/trips/presentation/pages/create/components/StopFormDialog.tsx
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shared/ui/dialog";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/text-area";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Checkbox } from "@shared/ui/checkbox";
import { Separator } from "@shared/ui/separator";
import { Badge } from "@shared/ui/badge";
import { Switch } from "@shared/ui/switch";
import {
  MapPin,
  Navigation,
  Flag,
  Building2,
  AlertCircle,
  FileText,
  User,
  Phone,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import AddressInput from "@shared/ui/address-input/AddressInput";

import { useActiveClients } from "@features/clients/application/hooks/useClients";
import {
  useClientAddresses,
  useClientAddress,
} from "@features/clients/application/hooks/useClientAddresses";
import { ADDRESS_TYPE_LABELS } from "@features/clients/domain/entities";

import type { TripStopFormValues } from "./validation";
import { stopHasUnifiedAddressId } from "./validation";
import {
  type StopFormData,
  type StopDialogFormValues,
  getEmptyStopDialogValues,
  tripStopToDialogValues,
  mergeDialogWithClientCatalog,
  clientAddressToDialogSlice,
} from "./stopDialogAddressMapper";

export type {
  StopCategory,
  StopFormData,
  StopDialogFormValues,
} from "./stopDialogAddressMapper";

// ============================================================================
// TYPES
// ============================================================================

export interface StopFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StopFormData) => void;
  initialData?: StopFormData;
  mode?: "create" | "edit";
}

const STOP_OPERATION_OPTIONS = [
  { value: "pickup" as const, label: "Carga", icon: MapPin, color: "text-blue-600" },
  {
    value: "delivery" as const,
    label: "Descarga",
    icon: MapPin,
    color: "text-orange-600",
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function StopFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = "create",
}: StopFormDialogProps) {
  const [useAddressFiscalData, setUseAddressFiscalData] = useState(true);
  const hasInitializedFiscalModeRef = useRef(false);
  const wasDialogOpenRef = useRef(false);
  const lastSyncedCatalogIdRef = useRef<string | null>(null);

  const form = useForm<StopDialogFormValues>({
    defaultValues: getEmptyStopDialogValues(),
    mode: "onChange",
  });

  const { control, reset, setValue, getValues, handleSubmit } = form;

  const clientId = useWatch({ control, name: "clientId" }) ?? "";
  const clientAddressId = useWatch({ control, name: "clientAddressId" }) ?? "";
  const addressId = useWatch({ control, name: "addressId" }) ?? "";

  const { data: clients = [] } = useActiveClients();
  const { data: addresses = [] } = useClientAddresses(clientId);
  const { data: selectedAddressFull } = useClientAddress(clientId, clientAddressId);
  const selectedAddress = selectedAddressFull ?? undefined;

  // Al abrir el diálogo: hidratar desde initialData (cada apertura, no solo el primer mount)
  useEffect(() => {
    if (!open) {
      wasDialogOpenRef.current = false;
      lastSyncedCatalogIdRef.current = null;
      return;
    }
    if (wasDialogOpenRef.current) return;
    wasDialogOpenRef.current = true;

    const next = initialData
      ? tripStopToDialogValues({
          ...initialData,
          stopType: initialData.stopType || [],
        })
      : getEmptyStopDialogValues();

    reset(next);
    setUseAddressFiscalData(true);
    hasInitializedFiscalModeRef.current = false;
    lastSyncedCatalogIdRef.current = null;
  }, [open, initialData, reset]);

  // En modo edición, si la parada ya tenía override manual de RFC/Nombre
  useEffect(() => {
    if (
      !open ||
      mode !== "edit" ||
      !clientAddressId ||
      !selectedAddress ||
      hasInitializedFiscalModeRef.current
    ) {
      return;
    }

    const normalizeRfc = (value?: string | null) =>
      (value ?? "")
        .trim()
        .toUpperCase();
    const normalizeName = (value?: string | null) =>
      (value ?? "")
        .trim()
        .toLowerCase();

    const currentRfc = normalizeRfc(getValues("rfcRemitenteDestinatario"));
    const currentName = normalizeName(getValues("nombreRemitenteDestinatario"));
    const addressRfc = normalizeRfc(selectedAddress.rfcRemitenteDestinatario);
    const addressName = normalizeName(
      selectedAddress.nombreRemitenteDestinatario,
    );

    const hasCurrentValues = Boolean(currentRfc || currentName);
    const matchesAddressData =
      (!addressRfc || currentRfc === addressRfc) &&
      (!addressName || currentName === addressName);

    setUseAddressFiscalData(!hasCurrentValues || matchesAddressData);
    hasInitializedFiscalModeRef.current = true;
  }, [
    clientAddressId,
    getValues,
    mode,
    open,
    selectedAddress,
  ]);

  // Sincronizar RFC/Nombre desde catálogo cuando aplica
  useEffect(() => {
    if (mode === "edit" && !hasInitializedFiscalModeRef.current) {
      return;
    }
    if (!useAddressFiscalData || !clientAddressId || !selectedAddress) {
      return;
    }

    setValue("rfcRemitenteDestinatario", selectedAddress.rfcRemitenteDestinatario || "", {
      shouldValidate: true,
    });
    setValue(
      "nombreRemitenteDestinatario",
      selectedAddress.nombreRemitenteDestinatario || "",
      { shouldValidate: true },
    );
  }, [clientAddressId, mode, selectedAddress, setValue, useAddressFiscalData]);

  // Volcar dirección del catálogo al formulario (inglés) cuando llega el detalle
  useEffect(() => {
    if (!clientAddressId || !selectedAddress) {
      lastSyncedCatalogIdRef.current = null;
      return;
    }
    if (lastSyncedCatalogIdRef.current === selectedAddress.id) return;
    lastSyncedCatalogIdRef.current = selectedAddress.id;

    const slice = clientAddressToDialogSlice(selectedAddress);
    (Object.keys(slice) as (keyof typeof slice)[]).forEach((key) => {
      const val = slice[key];
      if (val !== undefined) {
        setValue(key, val as never, { shouldDirty: true, shouldValidate: true });
      }
    });
    setValue("addressId", selectedAddress.id, { shouldDirty: true, shouldValidate: true });
  }, [clientAddressId, selectedAddress, setValue]);

  const watched = useWatch({ control });

  const displayStop = useMemo(
    () =>
      mergeDialogWithClientCatalog(
        (watched ?? getEmptyStopDialogValues()) as StopDialogFormValues,
        selectedAddress,
        useAddressFiscalData,
      ),
    [watched, selectedAddress, useAddressFiscalData],
  );

  const handleClientChange = useCallback(
    (nextClientId: string) => {
      const actualClientId = nextClientId === "no-client" ? "" : nextClientId;
      hasInitializedFiscalModeRef.current = false;
      lastSyncedCatalogIdRef.current = null;
      setUseAddressFiscalData(true);
      setValue("clientId", actualClientId);
      setValue("clientAddressId", "");
      setValue("addressId", "");
      setValue("locationName", "");
      setValue("satStateCode", "");
      setValue("satMunicipalityCode", "");
      setValue("postalCode", "");
      setValue("satLocalityCode", null);
      setValue("satNeighborhoodCode", null);
      setValue("neighborhoodName", null);
      setValue("cityName", "");
      setValue("street", "");
      setValue("exteriorNumber", "");
      setValue("interiorNumber", null);
      setValue("reference", null);
      setValue("rfcRemitenteDestinatario", "");
      setValue("nombreRemitenteDestinatario", "");
      setValue("contactName", "");
      setValue("contactPhone", "");
    },
    [setValue],
  );

  const handleAddressSelect = useCallback(
    (selectedCatalogId: string) => {
      hasInitializedFiscalModeRef.current = false;
      lastSyncedCatalogIdRef.current = null;

      if (selectedCatalogId === "manual-entry") {
        lastSyncedCatalogIdRef.current = null;
        setUseAddressFiscalData(false);
        setValue("clientAddressId", "");
        setValue("addressId", "");
        setValue("locationName", "");
        setValue("satStateCode", "");
        setValue("satMunicipalityCode", "");
        setValue("postalCode", "");
        setValue("satLocalityCode", null);
        setValue("satNeighborhoodCode", null);
        setValue("neighborhoodName", null);
        setValue("cityName", "");
        setValue("street", "");
        setValue("exteriorNumber", "");
        setValue("interiorNumber", null);
        setValue("reference", null);
        setValue("rfcRemitenteDestinatario", "");
        setValue("nombreRemitenteDestinatario", "");
        setValue("contactName", "");
        setValue("contactPhone", "");
        return;
      }
      setValue("clientAddressId", selectedCatalogId, { shouldDirty: true });
      setValue("addressId", selectedCatalogId, { shouldDirty: true });
    },
    [setValue],
  );

  const handleOperationToggle = useCallback(
    (operation: TripStopFormValues["stopType"][number]) => {
      const currentTypes = getValues("stopType") || [];
      let newTypes: typeof currentTypes;
      if (currentTypes.includes(operation)) {
        newTypes = currentTypes.filter((t) => t !== operation);
      } else {
        newTypes = [...currentTypes, operation];
      }
      setValue("stopType", newTypes, { shouldDirty: true, shouldValidate: true });
    },
    [getValues, setValue],
  );

  const submitDialog = handleSubmit((values) => {
    onSubmit(mergeDialogWithClientCatalog(values, selectedAddress, useAddressFiscalData));
    onOpenChange(false);
  });

  const getAvailableOperations = () => {
    const cat = displayStop.stopCategory;
    if (!cat) return [];
    switch (cat) {
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

  const getMissingRequiredFields = (): string[] => {
    const missing: string[] = [];
    const d = displayStop;

    if (!d.stopCategory) {
      missing.push("Tipo de parada");
      return missing;
    }

    if (d.stopCategory === "waypoint" && (!d.stopType || d.stopType.length === 0)) {
      missing.push("Operación de escala");
    }

    if (!stopHasUnifiedAddressId(d)) {
      if (!d.satEstadoCode?.trim()) missing.push("Estado SAT");
      if (!d.satMunicipioCode?.trim()) missing.push("Municipio SAT");
      if (!/^\d{5}$/.test(d.postalCode?.trim() ?? "")) {
        missing.push("Código postal");
      }
    }

    if (d.stopCategory === "destination" && !d.estimatedArrival) {
      missing.push("Hora estimada de llegada");
    }

    return missing;
  };

  const missingRequiredFields = getMissingRequiredFields();
  const isFormValid = missingRequiredFields.length === 0;

  const showWaypointArrivalWarning =
    displayStop.stopCategory === "waypoint" && !displayStop.estimatedArrival;

  const dialogTitle =
    mode === "edit"
      ? "Editar Parada"
      : displayStop.stopCategory === "origin"
        ? "Agregar Parada de Origen"
        : displayStop.stopCategory === "waypoint"
          ? "Agregar Escala"
          : displayStop.stopCategory === "destination"
            ? "Agregar Parada de Destino"
            : "Agregar Parada";

  const isAddressLocked = !!displayStop.clientAddressId;
  const isFiscalDataLocked = isAddressLocked && useAddressFiscalData;

  const addressInputMode = stopHasUnifiedAddressId({ addressId }) ? "cfdi" : "carta-porte";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {dialogTitle}
            <Badge variant="outline" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Carta Porte 3.1
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div
            className={cn(
              "p-4 border-2 rounded-lg",
              displayStop.stopCategory === "origin" &&
                "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
              displayStop.stopCategory === "waypoint" &&
                "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900",
              displayStop.stopCategory === "destination" &&
                "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
            )}
          >
            <div className="flex items-center gap-3">
              {displayStop.stopCategory === "origin" && (
                <>
                  <Navigation className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Parada de Origen</p>
                    <p className="text-xs text-muted-foreground">
                      Punto de inicio del viaje. Solo permite carga de mercancía.
                    </p>
                  </div>
                </>
              )}
              {displayStop.stopCategory === "waypoint" && (
                <>
                  <MapPin className="h-6 w-6 text-gray-600" />
                  <div>
                    <p className="font-medium text-sm">Escala Intermedia</p>
                    <p className="text-xs text-muted-foreground">
                      Puede realizar carga, descarga o ambas operaciones.
                    </p>
                  </div>
                </>
              )}
              {displayStop.stopCategory === "destination" && (
                <>
                  <Flag className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="font-medium text-sm">Parada de Destino</p>
                    <p className="text-xs text-muted-foreground">
                      Punto final del viaje. Solo permite descarga de mercancía.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {displayStop.stopCategory === "waypoint" && (
            <div className="space-y-3">
              <Label>Operaciones en esta Parada *</Label>
              <div className="grid grid-cols-2 gap-3">
                {getAvailableOperations().map((option) => {
                  const OpIcon = option.icon;
                  const isChecked =
                    displayStop.stopType?.includes(
                      option.value as TripStopFormValues["stopType"][number],
                    ) ?? false;

                  return (
                    <div
                      key={option.value}
                      className={cn(
                        "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                        isChecked && "border-primary bg-primary/5",
                      )}
                      onClick={() => handleOperationToggle(option.value)}
                    >
                      <Checkbox
                        id={`operation-${option.value}`}
                        checked={isChecked}
                        onCheckedChange={() => {}}
                      />
                      <label
                        htmlFor={`operation-${option.value}`}
                        className="flex items-center gap-2 text-sm font-medium leading-none cursor-pointer"
                      >
                        <OpIcon className={cn("h-4 w-4", option.color)} />
                        {option.label}
                      </label>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">Seleccione al menos una operación</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Cliente (opcional)
              </Label>
              <Select value={displayStop.clientId || "no-client"} onValueChange={handleClientChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-client">Sin cliente</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.legalName}
                      {client.tradeName && ` (${client.tradeName})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {displayStop.clientId && addresses.length > 0 && (
              <div className="space-y-2">
                <Label>Dirección del Cliente</Label>
                <Select
                  value={displayStop.clientAddressId || "manual-entry"}
                  onValueChange={handleAddressSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar dirección..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual-entry">Ingresar manualmente</SelectItem>
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
                {isAddressLocked && (
                  <p className="text-xs text-muted-foreground">
                    Los campos de ubicacion SAT se precargan desde la direccion seleccionada. Usa
                    &quot;Ingresar manualmente&quot; para editarlos.
                  </p>
                )}
              </div>
            )}

            {displayStop.clientId && addresses.length === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center gap-2 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                Este cliente no tiene direcciones registradas. Ingrese la dirección manualmente.
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Ubicación</span>
              <Badge variant="secondary" className="text-xs">
                SAT
              </Badge>
            </div>

            <div className="space-y-2">
              <Label>Nombre del Lugar</Label>
              <Controller
                name="locationName"
                control={control}
                render={({ field }) => (
                  <Input
                    placeholder="Ej: Bodega Central, CEDIS Norte, Planta Monterrey..."
                    disabled={isAddressLocked}
                    {...field}
                  />
                )}
              />
            </div>

            <AddressInput<StopDialogFormValues>
              mode={addressInputMode}
              control={control}
              namePrefix=""
              layout="compact"
              showLatLng
              disabled={isAddressLocked}
            />
            {stopHasUnifiedAddressId({ addressId }) && (
              <p className="text-xs text-muted-foreground">
                Ubicación ligada a un domicilio del cliente: el SAT se toma de ese registro; no hace
                falta capturarlo de nuevo aquí.
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">
                {displayStop.stopCategory === "origin" || displayStop.stopType?.includes("pickup")
                  ? "Datos del Remitente"
                  : "Datos del Destinatario"}
              </span>
            </div>

            {isAddressLocked && (
              <div className="flex items-start justify-between gap-3 rounded-md border bg-muted/30 p-3">
                <div className="space-y-1">
                  <Label htmlFor="useAddressFiscalData" className="cursor-pointer">
                    Usar datos fiscales de la direccion seleccionada
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Activo: RFC y razon social se heredan de la direccion del cliente. Desactiva
                    esta opcion para capturar un remitente/destinatario distinto para esta parada.
                  </p>
                </div>
                <Switch
                  id="useAddressFiscalData"
                  checked={useAddressFiscalData}
                  onCheckedChange={setUseAddressFiscalData}
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>RFC</Label>
                <Controller
                  name="rfcRemitenteDestinatario"
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="XAXX010101000"
                      className="uppercase"
                      maxLength={13}
                      disabled={isFiscalDataLocked}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre / Razón Social</Label>
                <Controller
                  name="nombreRemitenteDestinatario"
                  control={control}
                  render={({ field }) => (
                    <Input
                      placeholder="Nombre completo o razón social"
                      disabled={isFiscalDataLocked}
                      {...field}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Contacto</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre Contacto</Label>
                <Controller
                  name="contactName"
                  control={control}
                  render={({ field }) => (
                    <Input placeholder="Nombre del contacto en sitio" {...field} />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono Contacto</Label>
                <Controller
                  name="contactPhone"
                  control={control}
                  render={({ field }) => <Input placeholder="Teléfono" {...field} />}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas / Instrucciones</Label>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <Textarea
                    placeholder="Instrucciones especiales de entrega, horarios, acceso..."
                    rows={3}
                    {...field}
                  />
                )}
              />
            </div>
          </div>

          {displayStop.stopCategory !== "origin" && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>
                  {displayStop.stopCategory === "destination"
                    ? "Hora Estimada de Llegada"
                    : "Hora Estimada de Llegada a esta Escala"}
                  {displayStop.stopCategory === "destination" && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <Controller
                  name="estimatedArrival"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="datetime-local"
                      value={field.value ? field.value.slice(0, 16) : ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? `${e.target.value}:00` : undefined)
                      }
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {displayStop.stopCategory === "destination"
                    ? "Requerido para Carta Porte 3.1. Se usará como FechaHoraLlegada del nodo Ubicacion."
                    : "Opcional. Si se omite, se calculará automáticamente al generar la Carta Porte."}
                </p>
                {showWaypointArrivalWarning && (
                  <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-950 dark:border-yellow-800">
                    <AlertCircle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Sin hora estimada, el XML de Carta Porte interpolará este tiempo automáticamente.
                      Se recomienda capturarlo para mayor precisión fiscal.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {displayStop.stopCategory !== "origin" && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>
                  Distancia desde parada anterior (km) <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="distanceFromPreviousKm"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="number"
                      placeholder="0"
                      min={0}
                      step={0.1}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Obligatorio para el complemento Carta Porte. Distancia en kilómetros desde la parada
                  anterior.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void submitDialog()} disabled={!isFormValid}>
            {mode === "edit" ? "Guardar Cambios" : "Agregar Parada"}
          </Button>
        </DialogFooter>
        {!isFormValid && (
          <p className="mt-2 text-xs text-destructive">
            Completa los campos requeridos: {missingRequiredFields.join(", ")}.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
