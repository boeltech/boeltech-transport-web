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

import { useState, useEffect, useCallback } from "react";
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
import { useClientAddresses } from "@features/clients/application/hooks/useClientAddresses";
import { ADDRESS_TYPE_LABELS } from "@features/clients/domain/entities";

// Selects de catálogos SAT
import {
  EstadoSelect,
  MunicipioSelect,
} from "@features/catalogs/presentation/components/CatalogSelect";
import {
  LocalidadCombobox,
  ColoniaCombobox,
  CodigoPostalCombobox,
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
  { value: "pickup", label: "Carga", icon: MapPin, color: "text-blue-600" },
  {
    value: "delivery",
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
  // Distancia
  distanceToNextKm: undefined,
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

  // ══════════════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ══════════════════════════════════════════════════════════════════════════

  const { data: clients = [] } = useActiveClients();
  const { data: addresses = [] } = useClientAddresses(formData.clientId);

  // ══════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ══════════════════════════════════════════════════════════════════════════

  // Inicializar formulario cuando se abre el dialog
  useEffect(() => {
    if (open && initialData) {
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
      setFormData(INITIAL_FORM_DATA);
    }
  }, [open]);

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
  const handleAddressSelect = useCallback(
    (addressId: string) => {
      if (addressId === "manual-entry") {
        setFormData((prev) => ({
          ...prev,
          clientAddressId: "",
        }));
        return;
      }

      const selectedAddress = addresses.find((addr) => addr.id === addressId);
      if (selectedAddress) {
        setFormData((prev) => ({
          ...prev,
          clientAddressId: addressId,
          locationName: selectedAddress.locationName || "",
          // Precargar campos SAT de la dirección del cliente
          satEstadoCode: selectedAddress.satEstadoCode || "",
          satMunicipioCode: selectedAddress.satMunicipioCode || "",
          postalCode: selectedAddress.postalCode || "",
          satLocalidadCode: selectedAddress.satLocalidadCode || "",
          satColoniaCode: selectedAddress.satColoniaCode || "",
          street: selectedAddress.street || "",
          exteriorNumber: selectedAddress.exteriorNumber || "",
          interiorNumber: selectedAddress.interiorNumber || "",
          reference: selectedAddress.reference || "",
          // Precargar datos del cliente como remitente/destinatario
          rfcRemitenteDestinatario:
            selectedAddress.rfcRemitenteDestinatario || "",
          nombreRemitenteDestinatario:
            selectedAddress.nombreRemitenteDestinatario || "",
          contactName: selectedAddress.contactName || "",
          contactPhone: selectedAddress.contactPhone || "",
        }));
      }
    },
    [addresses],
  );

  // ══════════════════════════════════════════════════════════════════════════
  // CASCADE HANDLERS - Flujo correcto de dependencias
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * CASCADE: Estado
   * - Habilita: Municipio, Localidad
   * - Limpia: Municipio, Localidad (Colonia NO porque depende de CP)
   */
  const handleEstadoChange = useCallback((estadoCode: string) => {
    setFormData((prev) => ({
      ...prev,
      satEstadoCode: estadoCode,
      satMunicipioCode: "", // Limpiar - depende de Estado
      satLocalidadCode: "", // Limpiar - depende de Estado
      // satColoniaCode NO se limpia - depende de CP, no de Estado
    }));
  }, []);

  /**
   * CASCADE: Municipio
   * - No tiene dependientes directos en este formulario
   */
  const handleMunicipioChange = useCallback((municipioCode: string) => {
    setFormData((prev) => ({
      ...prev,
      satMunicipioCode: municipioCode,
    }));
  }, []);

  /**
   * CASCADE: Código Postal
   * - Habilita: Colonia
   * - Limpia: Colonia
   */
  const handleCodigoPostalChange = useCallback((codigoPostal: string) => {
    setFormData((prev) => ({
      ...prev,
      postalCode: codigoPostal,
      satColoniaCode: "", // Limpiar - depende de CP
    }));
  }, []);

  /**
   * CASCADE: Localidad
   * - Sin dependientes
   */
  const handleLocalidadChange = useCallback((localidadCode: string) => {
    setFormData((prev) => ({
      ...prev,
      satLocalidadCode: localidadCode,
    }));
  }, []);

  /**
   * CASCADE: Colonia
   * - Sin dependientes
   */
  const handleColoniaChange = useCallback((coloniaCode: string) => {
    setFormData((prev) => ({
      ...prev,
      satColoniaCode: coloniaCode,
    }));
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // OPERATION HANDLERS
  // ══════════════════════════════════════════════════════════════════════════

  const handleOperationToggle = useCallback(
    (operation: string) => {
      const currentTypes = formData.stopType || [];
      let newTypes: typeof currentTypes;

      if (currentTypes.includes(operation as any)) {
        newTypes = currentTypes.filter((t) => t !== operation);
      } else {
        newTypes = [...currentTypes, operation as any];
      }

      setFormData((prev) => ({
        ...prev,
        stopType: newTypes,
      }));
    },
    [formData.stopType],
  );

  const handleSubmit = useCallback(() => {
    onSubmit(formData);
    onOpenChange(false);
  }, [formData, onSubmit, onOpenChange]);

  // ══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  const getAvailableOperations = () => {
    if (!formData.stopCategory) return [];

    switch (formData.stopCategory) {
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

  const isFormValid = () => {
    // Validaciones básicas
    if (!formData.stopCategory) return false;

    // Waypoints requieren al menos una operación
    if (
      formData.stopCategory === "waypoint" &&
      (!formData.stopType || formData.stopType.length === 0)
    ) {
      return false;
    }

    // Campos Carta Porte obligatorios
    if (!formData.satEstadoCode) return false;
    if (!formData.satMunicipioCode) return false;
    if (!formData.postalCode) return false;

    return true;
  };

  const dialogTitle =
    mode === "edit"
      ? "Editar Parada"
      : formData.stopCategory === "origin"
        ? "Agregar Parada de Origen"
        : formData.stopCategory === "waypoint"
          ? "Agregar Escala"
          : formData.stopCategory === "destination"
            ? "Agregar Parada de Destino"
            : "Agregar Parada";

  // Verificar si los campos de dirección están bloqueados (por selección de dirección de cliente)
  const isAddressLocked = !!formData.clientAddressId;

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
              formData.stopCategory === "origin" &&
                "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
              formData.stopCategory === "waypoint" &&
                "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900",
              formData.stopCategory === "destination" &&
                "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
            )}
          >
            <div className="flex items-center gap-3">
              {formData.stopCategory === "origin" && (
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
              {formData.stopCategory === "waypoint" && (
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
              {formData.stopCategory === "destination" && (
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
          {formData.stopCategory === "waypoint" && (
            <div className="space-y-3">
              <Label>Operaciones en esta Parada *</Label>
              <div className="grid grid-cols-2 gap-3">
                {getAvailableOperations().map((option) => {
                  const OpIcon = option.icon;
                  const isChecked =
                    formData.stopType?.includes(option.value as any) ?? false;

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
                value={formData.clientId || "no-client"}
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
            {formData.clientId && addresses.length > 0 && (
              <div className="space-y-2">
                <Label>Dirección del Cliente</Label>
                <Select
                  value={formData.clientAddressId || "manual-entry"}
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
                    Los campos de dirección están precargados. Seleccione
                    "Ingresar manualmente" para editarlos.
                  </p>
                )}
              </div>
            )}

            {formData.clientId && addresses.length === 0 && (
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
                value={formData.locationName || ""}
                onChange={(e) => updateField("locationName", e.target.value)}
                disabled={isAddressLocked}
              />
            </div>

            {/* Estado + Municipio (Row 1) */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Estado <span className="text-destructive">*</span>
                </Label>
                <EstadoSelect
                  value={formData.satEstadoCode}
                  onValueChange={handleEstadoChange}
                  displayFormat="code-name"
                  disabled={isAddressLocked}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Municipio <span className="text-destructive">*</span>
                </Label>
                <MunicipioSelect
                  value={formData.satMunicipioCode}
                  onValueChange={handleMunicipioChange}
                  estadoCode={formData.satEstadoCode}
                  displayFormat="code-name"
                  disabled={isAddressLocked}
                />
              </div>
            </div>

            {/* Código Postal + Localidad (Row 2) */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Código Postal <span className="text-destructive">*</span>
                </Label>
                <CodigoPostalCombobox
                  value={formData.postalCode}
                  onValueChange={handleCodigoPostalChange}
                  estadoCode={formData.satEstadoCode}
                  placeholder="Buscar CP..."
                  disabled={isAddressLocked}
                />
              </div>
              <div className="space-y-2">
                <Label>Localidad</Label>
                <LocalidadCombobox
                  value={formData.satLocalidadCode}
                  onValueChange={handleLocalidadChange}
                  estadoCode={formData.satEstadoCode}
                  displayFormat="code-name"
                  disabled={isAddressLocked}
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. Para zonas rurales.
                </p>
              </div>
            </div>

            {/* Colonia (Row 3) */}
            <div className="space-y-2">
              <Label>Colonia</Label>
              <ColoniaCombobox
                value={formData.satColoniaCode}
                onValueChange={handleColoniaChange}
                codigoPostal={formData.postalCode}
                displayFormat="code-name"
                disabled={isAddressLocked}
              />
              <p className="text-xs text-muted-foreground">
                Opcional. Se habilita al ingresar código postal.
              </p>
            </div>
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
                  value={formData.street || ""}
                  onChange={(e) => updateField("street", e.target.value)}
                  disabled={isAddressLocked}
                />
              </div>
              <div className="space-y-2">
                <Label>Núm. Exterior</Label>
                <Input
                  placeholder="123"
                  value={formData.exteriorNumber || ""}
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
                  value={formData.interiorNumber || ""}
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
                  value={formData.reference || ""}
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
                {formData.stopCategory === "origin" ||
                formData.stopType?.includes("pickup" as any)
                  ? "Datos del Remitente"
                  : "Datos del Destinatario"}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>RFC</Label>
                <Input
                  placeholder="XAXX010101000"
                  value={formData.rfcRemitenteDestinatario || ""}
                  onChange={(e) =>
                    updateField(
                      "rfcRemitenteDestinatario",
                      e.target.value.toUpperCase(),
                    )
                  }
                  className="uppercase"
                  maxLength={13}
                  disabled={isAddressLocked}
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre / Razón Social</Label>
                <Input
                  placeholder="Nombre completo o razón social"
                  value={formData.nombreRemitenteDestinatario || ""}
                  onChange={(e) =>
                    updateField("nombreRemitenteDestinatario", e.target.value)
                  }
                  disabled={isAddressLocked}
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
                  value={formData.contactName || ""}
                  onChange={(e) => updateField("contactName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono Contacto</Label>
                <Input
                  placeholder="Teléfono"
                  value={formData.contactPhone || ""}
                  onChange={(e) => updateField("contactPhone", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas / Instrucciones</Label>
              <Textarea
                placeholder="Instrucciones especiales de entrega, horarios, acceso..."
                value={formData.notes || ""}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* DISTANCIA (solo para no-origen)                                 */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {formData.stopCategory !== "origin" && (
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
                  value={formData.distanceToNextKm ?? ""}
                  onChange={(e) =>
                    updateField(
                      "distanceToNextKm",
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
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid()}
          >
            {mode === "edit" ? "Guardar Cambios" : "Agregar Parada"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default StopFormDialog;
