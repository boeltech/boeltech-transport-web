/**
 * StopFormDialog - Dialog para agregar/editar paradas
 * Clean Architecture - Presentation Layer
 *
 * REFACTORIZADO: Campos de dirección unificados con Carta Porte 3.1
 *
 * CARTA PORTE 3.1 - Campos de ubicación (TODOS INTEGRADOS):
 * - Estado SAT (c_Estado) - Obligatorio
 * - Municipio SAT (c_Municipio) - Obligatorio, filtrado por estado
 * - Código Postal (c_CodigoPostal) - Obligatorio
 * - Localidad SAT (c_Localidad) - Opcional, filtrado por estado
 * - Colonia SAT (c_Colonia) - Opcional, filtrado por código postal
 * - Dirección desglosada: Calle, NumExt, NumInt, Referencia
 * - RFC y Nombre Remitente/Destinatario
 * - Distancia desde parada anterior (km)
 *
 * CASCADE CORRECTO:
 * - Estado → habilita Municipio y Localidad
 * - Código Postal → habilita Colonia
 *
 * Ubicación: src/features/trips/presentation/pages/create/components/StopFormDialog.tsx
 */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

// Hooks de clientes
import { useActiveClients } from "@features/clients/application/hooks/useClients";
import {
  useClientAddresses,
  useClientAddress,
} from "@features/clients/application/hooks/useClientAddresses";
import { ADDRESS_TYPE_LABELS } from "@features/clients/domain/entities";

// Componente unificado de campos SAT
import {
  AddressFields,
  type SatAddressValues,
} from "@features/catalogs/presentation/components";

import type { TripStopFormValues } from "./validation";

// ============================================================================
// TYPES
// ============================================================================

export type StopCategory = "origin" | "waypoint" | "destination";

export interface StopFormData extends Partial<TripStopFormValues> {
  stopCategory?: StopCategory;
}

export interface StopFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StopFormData) => void;
  initialData?: StopFormData;
  mode?: "create" | "edit";
}

// Tipos de operación en la parada
const STOP_OPERATION_OPTIONS = [
  { value: "pickup" as const, label: "Carga", icon: MapPin, color: "text-blue-600" },
  {
    value: "delivery" as const,
    label: "Descarga",
    icon: MapPin,
    color: "text-orange-600",
  },
];

// Valores iniciales del formulario
const INITIAL_FORM_DATA: StopFormData = {
  stopCategory: undefined,
  stopType: [],
  clientId: "",
  clientAddressId: "",
  locationName: "",
  // Dirección Carta Porte (unificados)
  satEstadoCode: "",
  satMunicipioCode: "",
  postalCode: "",
  satLocalidadCode: "",
  satColoniaCode: "",
  colonia: "",
  street: "",
  exteriorNumber: "",
  interiorNumber: "",
  reference: "",
  // Remitente/Destinatario
  rfcRemitenteDestinatario: "",
  nombreRemitenteDestinatario: "",
  // Contacto
  contactName: "",
  contactPhone: "",
  notes: "",
  // Tiempos
  estimatedArrival: undefined,
  // Distancia
  distanceFromPreviousKm: undefined,
};

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
  // ══════════════════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════════════════

  const [formData, setFormData] = useState<StopFormData>(INITIAL_FORM_DATA);
  const [useAddressFiscalData, setUseAddressFiscalData] = useState(true);
  const hasInitializedFiscalModeRef = useRef(false);

  // ══════════════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ══════════════════════════════════════════════════════════════════════════

  const { data: clients = [] } = useActiveClients();
  const { data: addresses = [] } = useClientAddresses(formData.clientId);
  const { data: selectedAddressFull } = useClientAddress(
    formData.clientId,
    formData.clientAddressId,
  );

  // ══════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ══════════════════════════════════════════════════════════════════════════

  // Inicializar formulario cuando se abre el dialog
  useEffect(() => {
    if (open && initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        ...INITIAL_FORM_DATA,
        ...initialData,
        stopType: initialData.stopType || [],
      });
    }
  }, [open, initialData]);

  // Reset cuando se cierra
  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(INITIAL_FORM_DATA);
      setUseAddressFiscalData(true);
      hasInitializedFiscalModeRef.current = false;
    }
  }, [open]);

  // En modo edición, si la parada ya tiene override manual de RFC/Nombre,
  // iniciamos en modo manual para no sobrescribir historial.
  useEffect(() => {
    if (
      !open ||
      mode !== "edit" ||
      !formData.clientAddressId ||
      !selectedAddressFull ||
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

    const currentRfc = normalizeRfc(formData.rfcRemitenteDestinatario);
    const currentName = normalizeName(formData.nombreRemitenteDestinatario);
    const addressRfc = normalizeRfc(selectedAddressFull.rfcRemitenteDestinatario);
    const addressName = normalizeName(
      selectedAddressFull.nombreRemitenteDestinatario,
    );

    const hasCurrentValues = Boolean(currentRfc || currentName);
    const matchesAddressData =
      (!addressRfc || currentRfc === addressRfc) &&
      (!addressName || currentName === addressName);

    setUseAddressFiscalData(!hasCurrentValues || matchesAddressData);
    hasInitializedFiscalModeRef.current = true;
  }, [
    formData.clientAddressId,
    formData.nombreRemitenteDestinatario,
    formData.rfcRemitenteDestinatario,
    mode,
    open,
    selectedAddressFull,
  ]);

  // Cuando está activo, sincroniza RFC/Nombre con la dirección seleccionada.
  useEffect(() => {
    if (mode === "edit" && !hasInitializedFiscalModeRef.current) {
      return;
    }
    if (!useAddressFiscalData || !formData.clientAddressId || !selectedAddressFull) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      rfcRemitenteDestinatario:
        selectedAddressFull.rfcRemitenteDestinatario || "",
      nombreRemitenteDestinatario:
        selectedAddressFull.nombreRemitenteDestinatario || "",
    }));
  }, [formData.clientAddressId, mode, selectedAddressFull, useAddressFiscalData]);

  // ══════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const updateField = useCallback(
    <K extends keyof StopFormData>(field: K, value: StopFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  // Handler: Cambio de cliente
  const handleClientChange = useCallback((clientId: string) => {
    const actualClientId = clientId === "no-client" ? "" : clientId;
    hasInitializedFiscalModeRef.current = false;
    setUseAddressFiscalData(true);
    setFormData((prev) => ({
      ...prev,
      clientId: actualClientId,
      clientAddressId: "",
      locationName: "",
      // Limpiar todos los campos de dirección
      satEstadoCode: "",
      satMunicipioCode: "",
      postalCode: "",
      satLocalidadCode: "",
      satColoniaCode: "",
      cityName: "",
      colonia: "",
      street: "",
      exteriorNumber: "",
      interiorNumber: "",
      reference: "",
      rfcRemitenteDestinatario: "",
      nombreRemitenteDestinatario: "",
      contactName: "",
      contactPhone: "",
    }));
  }, []);

  // Handler: Selección de dirección del cliente
  // Solo guarda el ID — el effect de abajo popula los campos cuando llega el detalle completo
  const handleAddressSelect = useCallback((addressId: string) => {
    hasInitializedFiscalModeRef.current = false;

    if (addressId === "manual-entry") {
      setUseAddressFiscalData(false);
      setFormData((prev) => ({
        ...prev,
        clientAddressId: "",
        locationName: "",
        satEstadoCode: "",
        satMunicipioCode: "",
        postalCode: "",
        satLocalidadCode: "",
        satColoniaCode: "",
        cityName: "",
        colonia: "",
        street: "",
        exteriorNumber: "",
        interiorNumber: "",
        reference: "",
        rfcRemitenteDestinatario: "",
        nombreRemitenteDestinatario: "",
        contactName: "",
        contactPhone: "",
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, clientAddressId: addressId }));
  }, []);

  // Datos efectivos del formulario — mezcla el estado manual con los datos
  // de la dirección del cliente cuando hay una seleccionada.
  // Normaliza códigos compuestos "AGU-001" → "001" para los selects SAT.
  const displayFormData = useMemo((): StopFormData => {
    if (!formData.clientAddressId || !selectedAddressFull) return formData;

    const shortCode = (code: string | undefined) =>
      code?.includes("-") ? code.split("-")[1] : (code ?? "");

    return {
      ...formData,
      locationName: selectedAddressFull.locationName || "",
      satEstadoCode: selectedAddressFull.satEstadoCode || "",
      satMunicipioCode: shortCode(selectedAddressFull.satMunicipioCode),
      postalCode: selectedAddressFull.postalCode || "",
      satLocalidadCode: shortCode(selectedAddressFull.satLocalidadCode),
      satColoniaCode: shortCode(selectedAddressFull.satColoniaCode),
      street: selectedAddressFull.street || "",
      exteriorNumber: selectedAddressFull.exteriorNumber || "",
      interiorNumber: selectedAddressFull.interiorNumber || "",
      reference: selectedAddressFull.reference || "",
      rfcRemitenteDestinatario: useAddressFiscalData
        ? selectedAddressFull.rfcRemitenteDestinatario || ""
        : formData.rfcRemitenteDestinatario || "",
      nombreRemitenteDestinatario: useAddressFiscalData
        ? selectedAddressFull.nombreRemitenteDestinatario || ""
        : formData.nombreRemitenteDestinatario || "",
      contactName: selectedAddressFull.contactName || "",
      contactPhone: selectedAddressFull.contactPhone || "",
      latitude: selectedAddressFull.latitude ?? undefined,
      longitude: selectedAddressFull.longitude ?? undefined,
      // estimatedArrival siempre viene del estado manual (no de la dirección)
      estimatedArrival: formData.estimatedArrival,
    };
  }, [formData, selectedAddressFull, useAddressFiscalData]);

  // ══════════════════════════════════════════════════════════════════════════
  // ADDRESS HANDLER
  // ══════════════════════════════════════════════════════════════════════════

  /** Handler unificado para AddressFields — mapea SatAddressValues a campos del form */
  const handleAddressChange = useCallback((changes: Partial<SatAddressValues>) => {
    setFormData((prev) => ({
      ...prev,
      ...(changes.estadoCode !== undefined && { satEstadoCode: changes.estadoCode }),
      ...(changes.municipioCode !== undefined && { satMunicipioCode: changes.municipioCode }),
      ...(changes.municipioName !== undefined && { cityName: changes.municipioName }),
      ...(changes.postalCode !== undefined && { postalCode: changes.postalCode }),
      ...(changes.coloniaCode !== undefined && { satColoniaCode: changes.coloniaCode }),
      ...(changes.coloniaName !== undefined && { colonia: changes.coloniaName }),
      ...(changes.localidadCode !== undefined && { satLocalidadCode: changes.localidadCode }),
    }));
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // OPERATION HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const handleOperationToggle = useCallback(
    (operation: TripStopFormValues["stopType"][number]) => {
      const currentTypes = formData.stopType || [];
      let newTypes: typeof currentTypes;

      if (currentTypes.includes(operation)) {
        newTypes = currentTypes.filter((t) => t !== operation);
      } else {
        newTypes = [...currentTypes, operation];
      }

      setFormData((prev) => ({
        ...prev,
        stopType: newTypes,
      }));
    },
    [formData.stopType],
  );

  const handleSubmit = useCallback(() => {
    onSubmit(displayFormData);
    onOpenChange(false);
  }, [displayFormData, onSubmit, onOpenChange]);

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  const getAvailableOperations = () => {
    if (!displayFormData.stopCategory) return [];

    switch (displayFormData.stopCategory) {
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

    if (!displayFormData.stopCategory) {
      missing.push("Tipo de parada");
      return missing;
    }

    if (
      displayFormData.stopCategory === "waypoint" &&
      (!displayFormData.stopType || displayFormData.stopType.length === 0)
    ) {
      missing.push("Operación de escala");
    }

    if (!displayFormData.satEstadoCode) missing.push("Estado SAT");
    if (!displayFormData.satMunicipioCode) missing.push("Municipio SAT");
    if (!displayFormData.postalCode) missing.push("Código postal");

    // Llegada estimada obligatoria para destino (FechaHoraSalidaLlegada en CP 3.1)
    if (
      displayFormData.stopCategory === "destination" &&
      !displayFormData.estimatedArrival
    ) {
      missing.push("Hora estimada de llegada");
    }

    return missing;
  };

  const missingRequiredFields = getMissingRequiredFields();
  const isFormValid = missingRequiredFields.length === 0;

  const showWaypointArrivalWarning =
    displayFormData.stopCategory === "waypoint" &&
    !displayFormData.estimatedArrival;

  const dialogTitle =
    mode === "edit"
      ? "Editar Parada"
      : displayFormData.stopCategory === "origin"
        ? "Agregar Parada de Origen"
        : displayFormData.stopCategory === "waypoint"
          ? "Agregar Escala"
          : displayFormData.stopCategory === "destination"
            ? "Agregar Parada de Destino"
            : "Agregar Parada";

  const isAddressLocked = !!displayFormData.clientAddressId;
  const isFiscalDataLocked = isAddressLocked && useAddressFiscalData;

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

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
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TIPO DE PARADA                                                  */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div
            className={cn(
              "p-4 border-2 rounded-lg",
              displayFormData.stopCategory === "origin" &&
                "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
              displayFormData.stopCategory === "waypoint" &&
                "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900",
              displayFormData.stopCategory === "destination" &&
                "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
            )}
          >
            <div className="flex items-center gap-3">
              {displayFormData.stopCategory === "origin" && (
                <>
                  <Navigation className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Parada de Origen</p>
                    <p className="text-xs text-muted-foreground">
                      Punto de inicio del viaje. Solo permite carga de
                      mercancía.
                    </p>
                  </div>
                </>
              )}
              {displayFormData.stopCategory === "waypoint" && (
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
              {displayFormData.stopCategory === "destination" && (
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

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* OPERACIONES (solo waypoints)                                    */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {displayFormData.stopCategory === "waypoint" && (
            <div className="space-y-3">
              <Label>Operaciones en esta Parada *</Label>
              <div className="grid grid-cols-2 gap-3">
                {getAvailableOperations().map((option) => {
                  const OpIcon = option.icon;
                  const isChecked =
                    displayFormData.stopType?.includes(option.value as TripStopFormValues["stopType"][number]) ?? false;

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
              <p className="text-xs text-muted-foreground">
                Seleccione al menos una operación
              </p>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CLIENTE (Opcional)                                              */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Cliente (opcional)
              </Label>
              <Select
                value={displayFormData.clientId || "no-client"}
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
                      {client.tradeName && ` (${client.tradeName})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Direcciones del cliente */}
            {displayFormData.clientId && addresses.length > 0 && (
              <div className="space-y-2">
                <Label>Dirección del Cliente</Label>
                <Select
                  value={displayFormData.clientAddressId || "manual-entry"}
                  onValueChange={handleAddressSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar dirección..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual-entry">
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
                {isAddressLocked && (
                  <p className="text-xs text-muted-foreground">
                    Los campos de ubicacion SAT se precargan desde la direccion
                    seleccionada. Usa "Ingresar manualmente" para editarlos.
                  </p>
                )}
              </div>
            )}

            {displayFormData.clientId && addresses.length === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-center gap-2 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                Este cliente no tiene direcciones registradas. Ingrese la
                dirección manualmente.
              </div>
            )}
          </div>

          <Separator />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* UBICACIÓN CARTA PORTE - Campos Geográficos SAT                  */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Ubicación</span>
              <Badge variant="secondary" className="text-xs">
                SAT
              </Badge>
            </div>

            {/* Nombre del lugar */}
            <div className="space-y-2">
              <Label>Nombre del Lugar</Label>
              <Input
                placeholder="Ej: Bodega Central, CEDIS Norte, Planta Monterrey..."
                value={displayFormData.locationName || ""}
                onChange={(e) => updateField("locationName", e.target.value)}
                disabled={isAddressLocked}
              />
            </div>

            <AddressFields
              values={{
                estadoCode: displayFormData.satEstadoCode,
                municipioCode: displayFormData.satMunicipioCode,
                postalCode: displayFormData.postalCode,
                coloniaCode: displayFormData.satColoniaCode,
                localidadCode: displayFormData.satLocalidadCode,
              }}
              onChange={handleAddressChange}
              required={{ estado: true, municipio: true, postalCode: true }}
              displayFormat="code-name"
              disabled={isAddressLocked}
              showLocalidadHint
            />
          </div>

          <Separator />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* DIRECCIÓN DESGLOSADA                                            */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <span className="font-medium text-sm">Dirección Desglosada</span>

            {/* Calle + Número Exterior */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Label>Calle</Label>
                <Input
                  placeholder="Nombre de la calle"
                  value={displayFormData.street || ""}
                  onChange={(e) => updateField("street", e.target.value)}
                  disabled={isAddressLocked}
                />
              </div>
              <div className="space-y-2">
                <Label>Núm. Exterior</Label>
                <Input
                  placeholder="123"
                  value={displayFormData.exteriorNumber || ""}
                  onChange={(e) =>
                    updateField("exteriorNumber", e.target.value)
                  }
                  disabled={isAddressLocked}
                />
              </div>
            </div>

            {/* Número Interior + Referencia */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Núm. Interior</Label>
                <Input
                  placeholder="A, 1, etc."
                  value={displayFormData.interiorNumber || ""}
                  onChange={(e) =>
                    updateField("interiorNumber", e.target.value)
                  }
                  disabled={isAddressLocked}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Referencia</Label>
                <Input
                  placeholder="Entre calles, cerca de..."
                  value={displayFormData.reference || ""}
                  onChange={(e) => updateField("reference", e.target.value)}
                  disabled={isAddressLocked}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* REMITENTE / DESTINATARIO                                        */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">
                {displayFormData.stopCategory === "origin" ||
                displayFormData.stopType?.includes("pickup")
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
                    Activo: RFC y razon social se heredan de la direccion del
                    cliente. Desactiva esta opcion para capturar un
                    remitente/destinatario distinto para esta parada.
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
                <Input
                  placeholder="XAXX010101000"
                  value={displayFormData.rfcRemitenteDestinatario || ""}
                  onChange={(e) =>
                    updateField(
                      "rfcRemitenteDestinatario",
                      e.target.value.toUpperCase(),
                    )
                  }
                  className="uppercase"
                  maxLength={13}
                  disabled={isFiscalDataLocked}
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre / Razón Social</Label>
                <Input
                  placeholder="Nombre completo o razón social"
                  value={displayFormData.nombreRemitenteDestinatario || ""}
                  onChange={(e) =>
                    updateField("nombreRemitenteDestinatario", e.target.value)
                  }
                  disabled={isFiscalDataLocked}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CONTACTO Y NOTAS                                                */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Contacto</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre Contacto</Label>
                <Input
                  placeholder="Nombre del contacto en sitio"
                  value={displayFormData.contactName || ""}
                  onChange={(e) => updateField("contactName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono Contacto</Label>
                <Input
                  placeholder="Teléfono"
                  value={displayFormData.contactPhone || ""}
                  onChange={(e) => updateField("contactPhone", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas / Instrucciones</Label>
              <Textarea
                placeholder="Instrucciones especiales de entrega, horarios, acceso..."
                value={displayFormData.notes || ""}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TIEMPOS (Carta Porte 3.1 - FechaHoraSalidaLlegada)              */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {displayFormData.stopCategory !== "origin" && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>
                  {displayFormData.stopCategory === "destination"
                    ? "Hora Estimada de Llegada"
                    : "Hora Estimada de Llegada a esta Escala"}
                  {displayFormData.stopCategory === "destination" && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <Input
                  type="datetime-local"
                  value={
                    displayFormData.estimatedArrival
                      ? displayFormData.estimatedArrival.slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    updateField(
                      "estimatedArrival",
                      e.target.value ? `${e.target.value}:00` : undefined,
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {displayFormData.stopCategory === "destination"
                    ? "Requerido para Carta Porte 3.1. Se usará como FechaHoraLlegada del nodo Ubicacion."
                    : "Opcional. Si se omite, se calculará automáticamente al generar la Carta Porte."}
                </p>
                {showWaypointArrivalWarning && (
                  <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-950 dark:border-yellow-800">
                    <AlertCircle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Sin hora estimada, el XML de Carta Porte interpolará este tiempo automáticamente. Se recomienda capturarlo para mayor precisión fiscal.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* DISTANCIA (solo para no-origen)                                 */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {displayFormData.stopCategory !== "origin" && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>
                  Distancia desde parada anterior (km){" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="0"
                  min={0}
                  step={0.1}
                  value={displayFormData.distanceFromPreviousKm ?? ""}
                  onChange={(e) =>
                    updateField(
                      "distanceFromPreviousKm",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Obligatorio para el complemento Carta Porte. Distancia en
                  kilómetros desde la parada anterior.
                </p>
              </div>
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* FOOTER                                                              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!isFormValid}>
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

export default StopFormDialog;
