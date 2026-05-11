/**
 * CargoStep - Paso 3 del Wizard
 * Cargas: Mercancías a transportar con soporte para Carta Porte 3.1
 *
 * Modelo Carga → Movimientos (pickup/delivery):
 * - Cada parada con operación de carga (pickup) es un contenedor visual.
 * - Al agregar una carga se crea automáticamente un movimiento "pickup".
 * - El usuario puede asignar opcionalmente puntos de entrega (delivery)
 *   con soporte de entregas parciales (dividir peso/unidades).
 * - Validación: todas las paradas pickup deben tener al menos una carga.
 *
 * Campos Carta Porte 3.1:
 * - satProductCode: Clave del producto SAT (c_ClaveProdServCP)
 * - satUnitCode: Clave de unidad SAT (c_ClaveUnidad)
 * - weightInKg: Peso en kg (obligatorio para CP)
 * - hazardousMaterial: Bandera de material peligroso
 * - hazardousMaterialCode: Clave del material peligroso
 * - packagingType: Tipo de embalaje
 *
 * Validación de capacidad:
 * - Se valida que el peso total de las cargas no exceda la capacidad del vehículo
 * - Se muestra un indicador visual de capacidad utilizada
 * - Se alerta si se excede la capacidad para sugerir cambiar de vehículo
 *
 * Ubicación: src/pages/trips/create/components/CargoStep.tsx
 */

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  type ComponentType,
  type ReactNode,
} from "react";
import { useToast } from "@shared/hooks";
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Input } from "@shared/ui/input";
import { Button } from "@shared/ui/button";
import { Textarea } from "@shared/ui/text-area";
import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shared/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  MapPin,
  ShieldCheck,
  Navigation,
  Flag,
  AlertTriangle,
  Truck,
  AlertCircle,
  ChevronDown,
  Scale,
  Box,
  FileText,
  Gauge,
  MessageSquare,
  User,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";
import type {
  TripWizardFormValues,
  TripCargoFormValues,
  CargoMovementFormValues,
  TripStopFormValues,
} from "./validation";
import { StopType } from "@features/trips";
import { useVehicle } from "@features/vehicles/application";
import {
  ProductoServicioCPSearch,
  UnidadMedidaSearch,
  MaterialPeligrosoSearch,
  TipoEmbalajeSelect,
} from "@features/catalogs";
import {
  extractCargoRegulatoryFlags,
  getMissingSectorRequiredFields,
  hasAnySectorFieldValue,
  isHazmatRequired,
  sectorFieldLabels,
} from "./cargoRegulatory";
import { fetchRegulatoryFlagsForSatProductCp } from "@shared/cfdi";

// ============================================================================
// TYPES
// ============================================================================

interface CargoStepProps {
  form: UseFormReturn<TripWizardFormValues>;
  cargosFieldArray: UseFieldArrayReturn<TripWizardFormValues, "cargos">;
  clients: Array<{ id: string; legalName: string }>;
  isLoadingClients: boolean;
}

interface PickupStopInfo {
  index: number;
  address: string;
  city: string;
  state?: string;
  clientId?: string;
  clientName?: string;
  locationName?: string;
  category: "origin" | "waypoint" | "destination";
}

interface DeliveryStopInfo {
  index: number;
  address: string;
  city: string;
  locationName?: string;
  clientId?: string;
  clientName?: string;
  category: "origin" | "waypoint" | "destination";
}

function sectorRequirementsHasNoActiveFlags(
  req: Record<string, boolean> | undefined,
): boolean {
  if (!req || Object.keys(req).length === 0) return true;
  return !Object.values(req).some(Boolean);
}

interface CargoDialogSectionProps {
  step: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

const CARGO_DIALOG_SECTION_SURFACE =
  "overflow-hidden rounded-xl border border-border/60 bg-card/70 shadow-sm";

function CargoDialogSection({
  step,
  title,
  icon: Icon,
  children,
  className,
  contentClassName,
}: CargoDialogSectionProps) {
  return (
    <section className={cn(CARGO_DIALOG_SECTION_SURFACE, className)}>
      <header className="flex items-center gap-3 border-b border-border/60 bg-muted/30 px-4 py-3">
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-primary/30 bg-primary/10 px-1 text-[11px] font-semibold text-primary">
          {step}
        </span>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-background text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <h4 className="text-sm font-semibold tracking-tight text-foreground">{title}</h4>
      </header>
      <div className={cn("space-y-4 p-4 sm:p-5", contentClassName)}>{children}</div>
    </section>
  );
}

function formatWizardStopAddressLine(stop: TripStopFormValues): string {
  const streetLine = [stop.street, stop.exteriorNumber]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (streetLine)
    return [streetLine, stop.reference].filter(Boolean).join(" · ");
  return stop.postalCode ? `CP ${stop.postalCode}` : "—";
}

function formatWizardStopCityLine(stop: TripStopFormValues): string {
  const line = [stop.cityName, stop.neighborhoodName].filter(Boolean).join(" · ");
  if (line) return line;
  return stop.postalCode ?? "—";
}

// ============================================================================
// CATÁLOGOS SAT (Estáticos — solo monedas, los demás son dinámicos)
// ============================================================================


// ============================================================================
// COMPONENT
// ============================================================================

export function CargoStep({
  form,
  cargosFieldArray,
  clients,
  isLoadingClients,
}: CargoStepProps) {
  const { fields, append, remove, update } = cargosFieldArray;
  const [isCargoDialogOpen, setIsCargoDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newCargo, setNewCargo] = useState<Partial<TripCargoFormValues>>({});

  // Estado para entregas parciales en el dialog
  const [deliveryAssignments, setDeliveryAssignments] = useState<
    CargoMovementFormValues[]
  >([]);

  // Estado para sección colapsable de material peligroso
  const [hazmatSectionOpen, setHazmatSectionOpen] = useState(false);
  const { error: showErrorToast } = useToast();
  const catalogHydrateKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isCargoDialogOpen) {
      catalogHydrateKeyRef.current = null;
      return;
    }
    const code = newCargo.satProductCode?.trim();
    if (!code) return;
    if (!sectorRequirementsHasNoActiveFlags(newCargo.sectorRequirements)) {
      return;
    }

    const key = `${editingIndex ?? "new"}:${code}`;
    if (catalogHydrateKeyRef.current === key) return;
    catalogHydrateKeyRef.current = key;

    let cancelled = false;
    void (async () => {
      try {
        const flags = await fetchRegulatoryFlagsForSatProductCp(code);
        if (cancelled) return;
        setNewCargo((prev) => {
          if (prev.satProductCode?.trim() !== code) return prev;
          if (!sectorRequirementsHasNoActiveFlags(prev.sectorRequirements)) {
            return prev;
          }
          return {
            ...prev,
            sectorRequirements: {
              ...prev.sectorRequirements,
              ...flags.sectorRequirements,
            },
            requiresHazmat: prev.requiresHazmat || flags.requiresHazmat,
            hazardousMaterial:
              prev.hazardousMaterial || flags.requiresHazmat,
          };
        });
        if (flags.requiresHazmat) {
          setHazmatSectionOpen(true);
        }
      } catch {
        catalogHydrateKeyRef.current = null;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isCargoDialogOpen,
    editingIndex,
    newCargo.satProductCode,
    newCargo.sectorRequirements,
  ]);

  const insuredCargoComplete = useMemo(() => {
    if (!newCargo.isInsured) return true;
    const dv = newCargo.declaredValue;
    if (
      dv === undefined ||
      dv === null ||
      Number.isNaN(Number(dv)) ||
      Number(dv) <= 0
    ) {
      return false;
    }
    if (!(newCargo.aseguraCarga?.trim())) return false;
    if (!(newCargo.polizaCarga?.trim())) return false;
    return true;
  }, [
    newCargo.isInsured,
    newCargo.declaredValue,
    newCargo.aseguraCarga,
    newCargo.polizaCarga,
  ]);

  const hazmatRequiredByCatalog = useMemo(
    () => isHazmatRequired(newCargo),
    [newCargo],
  );

  const missingSectorFields = useMemo(
    () =>
      getMissingSectorRequiredFields({
        requirements: newCargo.sectorRequirements,
        values: {
          sectorCofepris: newCargo.sectorCofepris,
          nombreIngredienteActivo: newCargo.nombreIngredienteActivo,
          nomQuimico: newCargo.nomQuimico,
          denominacionGenericaProd: newCargo.denominacionGenericaProd,
          denominacionDistintivaProd: newCargo.denominacionDistintivaProd,
          fabricante: newCargo.fabricante,
          fechaCaducidad: newCargo.fechaCaducidad,
          loteMedicamento: newCargo.loteMedicamento,
          formaFarmaceutica: newCargo.formaFarmaceutica,
          condicionesEspTransp: newCargo.condicionesEspTransp,
          registroSanitarioFolioAutorizacion:
            newCargo.registroSanitarioFolioAutorizacion,
          permisoImportacion: newCargo.permisoImportacion,
          folioImpoVucem: newCargo.folioImpoVucem,
          numCas: newCargo.numCas,
          razonSocialEmpImp: newCargo.razonSocialEmpImp,
          numRegSanPlagCofepris: newCargo.numRegSanPlagCofepris,
          datosFabricante: newCargo.datosFabricante,
          datosFormulador: newCargo.datosFormulador,
          datosMaquilador: newCargo.datosMaquilador,
          usoAutorizado: newCargo.usoAutorizado,
        },
      }),
    [newCargo],
  );

  const shouldShowSectorSection = useMemo(
    () =>
      Object.values(newCargo.sectorRequirements ?? {}).some(Boolean) ||
      hasAnySectorFieldValue({
        sectorCofepris: newCargo.sectorCofepris,
        nombreIngredienteActivo: newCargo.nombreIngredienteActivo,
        nomQuimico: newCargo.nomQuimico,
        denominacionGenericaProd: newCargo.denominacionGenericaProd,
        denominacionDistintivaProd: newCargo.denominacionDistintivaProd,
        fabricante: newCargo.fabricante,
        fechaCaducidad: newCargo.fechaCaducidad,
        loteMedicamento: newCargo.loteMedicamento,
        formaFarmaceutica: newCargo.formaFarmaceutica,
        condicionesEspTransp: newCargo.condicionesEspTransp,
        registroSanitarioFolioAutorizacion:
          newCargo.registroSanitarioFolioAutorizacion,
        permisoImportacion: newCargo.permisoImportacion,
        folioImpoVucem: newCargo.folioImpoVucem,
        numCas: newCargo.numCas,
        razonSocialEmpImp: newCargo.razonSocialEmpImp,
        numRegSanPlagCofepris: newCargo.numRegSanPlagCofepris,
        datosFabricante: newCargo.datosFabricante,
        datosFormulador: newCargo.datosFormulador,
        datosMaquilador: newCargo.datosMaquilador,
        usoAutorizado: newCargo.usoAutorizado,
      }),
    [newCargo],
  );

  // ============================================
  // Obtener vehículo seleccionado para validar capacidad
  // ============================================

  const vehicleId = form.watch("vehicleId");
  const { data: vehicle, isLoading: isLoadingVehicle } = useVehicle(vehicleId);

  // Capacidad del vehículo en kg (loadCapacity viene en toneladas)
  const vehicleCapacityKg = useMemo(() => {
    const tons = vehicle?.capacities?.loadCapacity;
    if (tons == null) return null;
    return tons * 1000;
  }, [vehicle]);

  // ============================================
  // Lectura de paradas desde el form (RouteStep)
  // ============================================

  const stops = form.watch("stops");

  /** Paradas con operación de carga (pickup) */
  const pickupStops: PickupStopInfo[] = useMemo(() => {
    if (!stops || stops.length === 0) return [];

    return stops.flatMap((stop, index) => {
      if (!stop.stopType.includes(StopType.PICKUP)) return [];

      const hasOrigin = stop.stopType.includes(StopType.ORIGIN);
      const hasDestination = stop.stopType.includes(StopType.DESTINATION);

      let category: "origin" | "waypoint" | "destination" = "waypoint";
      if (hasOrigin) category = "origin";
      else if (hasDestination) category = "destination";

      const client = stop.clientId
        ? clients.find((c) => c.id === stop.clientId)
        : undefined;

      const info: PickupStopInfo = {
        index,
        address: formatWizardStopAddressLine(stop),
        city: formatWizardStopCityLine(stop),
        state: stop.satStateCode,
        clientId: stop.clientId || undefined,
        clientName: client?.legalName,
        locationName: stop.locationName,
        category,
      };
      return [info];
    });
  }, [stops, clients]);

  /** Paradas con operación de descarga (delivery) */
  const deliveryStops: DeliveryStopInfo[] = useMemo(() => {
    if (!stops || stops.length === 0) return [];

    return stops.flatMap((stop, index) => {
      if (!stop.stopType.includes(StopType.DELIVERY)) return [];

      const hasOrigin = stop.stopType.includes(StopType.ORIGIN);
      const hasDestination = stop.stopType.includes(StopType.DESTINATION);

      let category: "origin" | "waypoint" | "destination" = "waypoint";
      if (hasDestination) category = "destination";
      else if (hasOrigin) category = "origin";

      const client = stop.clientId
        ? clients.find((c) => c.id === stop.clientId)
        : undefined;

      const info: DeliveryStopInfo = {
        index,
        address: formatWizardStopAddressLine(stop),
        city: formatWizardStopCityLine(stop),
        locationName: stop.locationName,
        clientId: stop.clientId || undefined,
        clientName: client?.legalName,
        category,
      };
      return [info];
    });
  }, [stops, clients]);

  /** Cargas cuyo primer movimiento pickup coincide con la parada */
  const getCargosForStop = (
    stopIndex: number,
  ): { cargo: (typeof fields)[number]; fieldIndex: number }[] => {
    return fields
      .map((cargo, fieldIndex) => ({ cargo, fieldIndex }))
      .filter(({ cargo }) => {
        const pickupMovement = cargo.movements?.find(
          (m) => m.movementType === "pickup",
        );
        return pickupMovement?.stopIndex === stopIndex;
      });
  };

  /** Paradas pickup sin cargas registradas */
  const stopsWithoutCargos: PickupStopInfo[] = useMemo(() => {
    return pickupStops.filter(
      (stop) => getCargosForStop(stop.index).length === 0,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupStops, fields]);

  /** Delivery stops después del pickup actual */
  const getAvailableDeliveryStops = (
    pickupStopIndex: number,
  ): DeliveryStopInfo[] => {
    return deliveryStops.filter((s) => s.index > pickupStopIndex);
  };

  // ============================================
  // Handlers
  // ============================================

  const handleOpenAddDialog = (pickupStop: PickupStopInfo) => {
    setEditingIndex(null);
    const clientId = pickupStop.clientId || "";
    setNewCargo({
      clientId,
      description: "",
      weight: undefined,
      units: undefined,
      currency: "MXN",
      isInsured: false,
      declaredValue: undefined,
      aseguraCarga: undefined,
      polizaCarga: undefined,
      movements: [{ stopIndex: pickupStop.index, movementType: "pickup" }],
      notes: "",
      specialInstructions: "",
      // Campos Carta Porte
      satProductCode: "",
      satUnitCode: "H87", // Default: Pieza
      satUnitName: "Pieza",
      weightInKg: undefined,
      hazardousMaterial: false,
      requiresHazmat: false,
      hazardousMaterialCode: "",
      packagingType: "",
      packagingDescription: "",
      sectorRequirements: {},
      sectorCofepris: "",
      nombreIngredienteActivo: "",
      nomQuimico: "",
      denominacionGenericaProd: "",
      denominacionDistintivaProd: "",
      fabricante: "",
      fechaCaducidad: "",
      loteMedicamento: "",
      formaFarmaceutica: "",
      condicionesEspTransp: "",
      registroSanitarioFolioAutorizacion: "",
      permisoImportacion: "",
      folioImpoVucem: "",
      numCas: "",
      razonSocialEmpImp: "",
      numRegSanPlagCofepris: "",
      datosFabricante: "",
      datosFormulador: "",
      datosMaquilador: "",
      usoAutorizado: "",
    });
    setDeliveryAssignments([]);
    setHazmatSectionOpen(false);
    setIsCargoDialogOpen(true);
  };

  const handleOpenEditDialog = (fieldIndex: number) => {
    setEditingIndex(fieldIndex);
    const cargo = fields[fieldIndex];
    setNewCargo({
      ...cargo,
      currency: cargo.currency || "MXN",
      requiresHazmat: cargo.requiresHazmat ?? false,
      sectorRequirements: cargo.sectorRequirements ?? {},
      sectorCofepris: cargo.sectorCofepris ?? "",
      nombreIngredienteActivo: cargo.nombreIngredienteActivo ?? "",
      nomQuimico: cargo.nomQuimico ?? "",
      denominacionGenericaProd: cargo.denominacionGenericaProd ?? "",
      denominacionDistintivaProd: cargo.denominacionDistintivaProd ?? "",
      fabricante: cargo.fabricante ?? "",
      fechaCaducidad: cargo.fechaCaducidad ?? "",
      loteMedicamento: cargo.loteMedicamento ?? "",
      formaFarmaceutica: cargo.formaFarmaceutica ?? "",
      condicionesEspTransp: cargo.condicionesEspTransp ?? "",
      registroSanitarioFolioAutorizacion:
        cargo.registroSanitarioFolioAutorizacion ?? "",
      permisoImportacion: cargo.permisoImportacion ?? "",
      folioImpoVucem: cargo.folioImpoVucem ?? "",
      numCas: cargo.numCas ?? "",
      razonSocialEmpImp: cargo.razonSocialEmpImp ?? "",
      numRegSanPlagCofepris: cargo.numRegSanPlagCofepris ?? "",
      datosFabricante: cargo.datosFabricante ?? "",
      datosFormulador: cargo.datosFormulador ?? "",
      datosMaquilador: cargo.datosMaquilador ?? "",
      usoAutorizado: cargo.usoAutorizado ?? "",
    });
    const existingDeliveries = (cargo.movements || []).filter(
      (m) => m.movementType === "delivery",
    );
    setDeliveryAssignments(existingDeliveries);
    setHazmatSectionOpen(!!cargo.hazardousMaterial);
    setIsCargoDialogOpen(true);
  };

  const handleAddDeliveryAssignment = () => {
    setDeliveryAssignments((prev) => [
      ...prev,
      { stopIndex: -1, movementType: "delivery" as const },
    ]);
  };

  const handleUpdateDeliveryAssignment = (
    index: number,
    field: keyof CargoMovementFormValues,
    value: string | number | undefined,
  ) => {
    setDeliveryAssignments((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    );
  };

  const handleRemoveDeliveryAssignment = (index: number) => {
    setDeliveryAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleHazmatChange = (checked: boolean) => {
    if (!checked && hazmatRequiredByCatalog) {
      showErrorToast(
        "Material peligroso requerido",
        "El producto seleccionado exige capturar información de material peligroso según catálogo SAT.",
      );
      return;
    }
    setNewCargo({
      ...newCargo,
      hazardousMaterial: checked,
      // Limpiar campos si se desmarca
      hazardousMaterialCode: checked ? newCargo.hazardousMaterialCode : "",
      packagingType: checked ? newCargo.packagingType : "",
      packagingDescription: checked ? newCargo.packagingDescription : "",
    });
    setHazmatSectionOpen(checked);
  };

  const handleSaveCargo = () => {
    if (
      !newCargo.clientId ||
      !newCargo.description ||
      !newCargo.movements ||
      newCargo.movements.length === 0
    ) {
      return;
    }

    const pickupMovement = newCargo.movements.find(
      (m) => m.movementType === "pickup",
    );
    if (!pickupMovement) return;

    if (newCargo.isInsured && !insuredCargoComplete) {
      showErrorToast(
        "Datos de seguro incompletos",
        "Si la mercancía está asegurada, indica valor declarado mayor a cero, aseguradora y póliza.",
      );
      return;
    }

    if (hazmatRequiredByCatalog && !newCargo.hazardousMaterial) {
      showErrorToast(
        "Material peligroso requerido",
        "Este producto requiere capturar material peligroso según catálogo SAT.",
      );
      return;
    }

    if (missingSectorFields.length > 0) {
      const firstMissingField = missingSectorFields[0];
      showErrorToast(
        "Datos regulatorios incompletos",
        `Completa "${sectorFieldLabels[firstMissingField]}" para esta mercancía.`,
      );
      return;
    }

    const validDeliveries: CargoMovementFormValues[] = deliveryAssignments
      .filter((d) => d.stopIndex >= 0)
      .map((d) => ({
        stopIndex: d.stopIndex,
        movementType: "delivery" as const,
        weight: d.weight,
        units: d.units,
        notes: d.notes,
      }));

    const allMovements: CargoMovementFormValues[] = [
      pickupMovement,
      ...validDeliveries,
    ];

    const cargoData: TripCargoFormValues = {
      id: newCargo.id,
      clientId: newCargo.clientId,
      description: newCargo.description,
      weight: newCargo.weight,
      units: newCargo.units,
      isInsured: newCargo.isInsured ?? false,
      declaredValue: newCargo.isInsured ? newCargo.declaredValue : undefined,
      aseguraCarga: newCargo.isInsured ? newCargo.aseguraCarga : undefined,
      polizaCarga: newCargo.isInsured ? newCargo.polizaCarga : undefined,
      movements: allMovements,
      notes: newCargo.notes,
      specialInstructions: newCargo.specialInstructions,
      // Campos Carta Porte
      satProductCode: newCargo.satProductCode,
      satProductDescription: newCargo.satProductDescription,
      satUnitCode: newCargo.satUnitCode,
      satUnitName: newCargo.satUnitName,
      currency: newCargo.currency || "MXN",
      weightInKg: newCargo.weightInKg,
      hazardousMaterial: newCargo.hazardousMaterial ?? false,
      requiresHazmat: newCargo.requiresHazmat ?? false,
      hazardousMaterialCode: newCargo.hazardousMaterial
        ? newCargo.hazardousMaterialCode
        : undefined,
      packagingType: newCargo.hazardousMaterial
        ? newCargo.packagingType
        : undefined,
      packagingDescription: newCargo.hazardousMaterial
        ? newCargo.packagingDescription
        : undefined,
      sectorRequirements: newCargo.sectorRequirements ?? {},
      sectorCofepris: newCargo.sectorCofepris || undefined,
      nombreIngredienteActivo: newCargo.nombreIngredienteActivo || undefined,
      nomQuimico: newCargo.nomQuimico || undefined,
      denominacionGenericaProd: newCargo.denominacionGenericaProd || undefined,
      denominacionDistintivaProd:
        newCargo.denominacionDistintivaProd || undefined,
      fabricante: newCargo.fabricante || undefined,
      fechaCaducidad: newCargo.fechaCaducidad || undefined,
      loteMedicamento: newCargo.loteMedicamento || undefined,
      formaFarmaceutica: newCargo.formaFarmaceutica || undefined,
      condicionesEspTransp: newCargo.condicionesEspTransp || undefined,
      registroSanitarioFolioAutorizacion:
        newCargo.registroSanitarioFolioAutorizacion || undefined,
      permisoImportacion: newCargo.permisoImportacion || undefined,
      folioImpoVucem: newCargo.folioImpoVucem || undefined,
      numCas: newCargo.numCas || undefined,
      razonSocialEmpImp: newCargo.razonSocialEmpImp || undefined,
      numRegSanPlagCofepris: newCargo.numRegSanPlagCofepris || undefined,
      datosFabricante: newCargo.datosFabricante || undefined,
      datosFormulador: newCargo.datosFormulador || undefined,
      datosMaquilador: newCargo.datosMaquilador || undefined,
      usoAutorizado: newCargo.usoAutorizado || undefined,
    };

    if (editingIndex !== null) {
      update(editingIndex, cargoData);
    } else {
      append(cargoData);
    }

    setNewCargo({});
    setDeliveryAssignments([]);
    setEditingIndex(null);
    setIsCargoDialogOpen(false);
  };

  // ============================================
  // UI Helpers
  // ============================================

  const getClientName = (clientId: string): string => {
    const client = clients.find((c) => c.id === clientId);
    return client?.legalName || "Sin cliente";
  };

  const getStopLabel = (stopIndex: number): string => {
    const stop = stops?.[stopIndex];
    if (!stop) return `Parada #${stopIndex + 1}`;
    return `#${stopIndex + 1} ${stop.locationName || formatWizardStopAddressLine(stop)}`;
  };

  const totalWeight = fields.reduce(
    (sum, cargo) => sum + (cargo.weightInKg || cargo.weight || 0),
    0,
  );

  // ============================================
  // Cálculos de capacidad del vehículo
  // ============================================

  const capacityPercentage = useMemo(() => {
    if (!vehicleCapacityKg || vehicleCapacityKg === 0) return 0;
    return Math.min((totalWeight / vehicleCapacityKg) * 100, 100);
  }, [totalWeight, vehicleCapacityKg]);

  const isOverCapacity = vehicleCapacityKg
    ? totalWeight > vehicleCapacityKg
    : false;
  const isNearCapacity = vehicleCapacityKg
    ? capacityPercentage >= 90 && !isOverCapacity
    : false;
  const isModerateCapacity = vehicleCapacityKg
    ? capacityPercentage >= 70 && capacityPercentage < 90
    : false;

  const getCapacityColor = (): string => {
    if (isOverCapacity) return "text-red-600";
    if (isNearCapacity) return "text-orange-600";
    if (isModerateCapacity) return "text-yellow-600";
    return "text-green-600";
  };

  const getProgressColor = (): string => {
    if (isOverCapacity) return "bg-red-500";
    if (isNearCapacity) return "bg-orange-500";
    if (isModerateCapacity) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatWeight = (weightKg: number): string => {
    if (weightKg >= 1000) {
      return `${(weightKg / 1000).toLocaleString("es-MX", { maximumFractionDigits: 2 })} t`;
    }
    return `${weightKg.toLocaleString("es-MX")} kg`;
  };

  const totalCargos = fields.length;
  const hasNoPickupStops = pickupStops.length === 0;
  const hasHazmatCargo = fields.some((c) => c.hazardousMaterial);

  // Dialog helpers
  const currentPickupStop = pickupStops.find((s) => {
    const pm = newCargo.movements?.find((m) => m.movementType === "pickup");
    return pm && s.index === pm.stopIndex;
  });
  const stopHasClient = !!currentPickupStop?.clientId;

  const availableDeliveryForDialog = currentPickupStop
    ? getAvailableDeliveryStops(currentPickupStop.index)
    : [];

  // ============================================
  // Render
  // ============================================

  return (
    <div className="space-y-6">
      {/* Alerta: no hay paradas con carga */}
      {hasNoPickupStops && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  No hay paradas con operación de carga
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Regrese al paso de Ruta y asegúrese de que al menos una parada
                  tenga la operación de &quot;Carga&quot; (pickup) para poder
                  registrar mercancías.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta: paradas sin cargas */}
      {stopsWithoutCargos.length > 0 && !hasNoPickupStops && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-900">
                  {stopsWithoutCargos.length === 1
                    ? "1 parada de carga sin mercancías registradas"
                    : `${stopsWithoutCargos.length} paradas de carga sin mercancías registradas`}
                </p>
                <ul className="text-xs text-orange-700 mt-1 space-y-0.5">
                  {stopsWithoutCargos.map((stop) => (
                    <li key={stop.index}>
                      • Parada #{stop.index + 1}:{" "}
                      {stop.locationName || stop.address} ({stop.city})
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-orange-700 mt-2">
                  Todas las paradas de carga deben tener al menos una mercancía
                  para continuar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============ INDICADOR DE CAPACIDAD DEL VEHÍCULO ============ */}
      {vehicleCapacityKg && vehicleCapacityKg > 0 && (
        <Card
          className={cn(
            "transition-colors",
            isOverCapacity && "border-red-300 bg-red-50/50",
            isNearCapacity && "border-orange-300 bg-orange-50/50",
          )}
        >
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Header con icono de camión */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex items-center justify-center h-10 w-10 rounded-lg",
                      isOverCapacity && "bg-red-100 text-red-600",
                      isNearCapacity && "bg-orange-100 text-orange-600",
                      isModerateCapacity && "bg-yellow-100 text-yellow-600",
                      !isOverCapacity &&
                        !isNearCapacity &&
                        !isModerateCapacity &&
                        "bg-green-100 text-green-600",
                    )}
                  >
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      Capacidad del Vehículo
                      {vehicle && (
                        <span className="text-xs font-normal text-muted-foreground">
                          ({vehicle.unitNumber} - {vehicle.brand} {vehicle.model})
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Capacidad máxima: {formatWeight(vehicleCapacityKg)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-2xl font-bold", getCapacityColor())}>
                    {capacityPercentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">utilizado</p>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="space-y-2">
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      getProgressColor(),
                    )}
                    style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                  />
                  {/* Indicador de exceso */}
                  {isOverCapacity && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-white drop-shadow-sm">
                        ¡EXCEDIDO!
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Cargado:{" "}
                    <span className={cn("font-medium", getCapacityColor())}>
                      {formatWeight(totalWeight)}
                    </span>
                  </span>
                  <span>
                    Disponible:{" "}
                    <span className="font-medium">
                      {isOverCapacity
                        ? `−${formatWeight(totalWeight - vehicleCapacityKg)} (excedido)`
                        : formatWeight(vehicleCapacityKg - totalWeight)}
                    </span>
                  </span>
                </div>
              </div>

              {/* Desglose por carga (solo si hay cargas) */}
              {fields.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Desglose de cargas:
                  </p>
                  <div className="space-y-1">
                    {fields.map((cargo, idx) => {
                      const cargoWeight = cargo.weightInKg || cargo.weight || 0;
                      const cargoPercentage =
                        vehicleCapacityKg > 0
                          ? (cargoWeight / vehicleCapacityKg) * 100
                          : 0;
                      return (
                        <div
                          key={cargo.id || idx}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="truncate max-w-[60%] text-muted-foreground">
                            {cargo.description || `Carga ${idx + 1}`}
                          </span>
                          <span className="font-medium">
                            {formatWeight(cargoWeight)} (
                            {cargoPercentage.toFixed(1)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta: Sobrepeso del vehículo */}
      {isOverCapacity && (
        <Card className="border-red-300 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  ¡Capacidad del vehículo excedida!
                </p>
                <p className="text-xs text-red-700 mt-1">
                  El peso total de las cargas ({formatWeight(totalWeight)})
                  excede la capacidad del vehículo (
                  {formatWeight(vehicleCapacityKg!)}). Exceso:{" "}
                  <strong>
                    {formatWeight(totalWeight - vehicleCapacityKg!)}
                  </strong>
                </p>
                <p className="text-xs text-red-700 mt-2">
                  Opciones: Reduzca el peso de las cargas o seleccione un
                  vehículo con mayor capacidad en el Paso 1 (Información).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta: Vehículo sin capacidad definida */}
      {vehicleId &&
        !isLoadingVehicle &&
        (!vehicleCapacityKg || vehicleCapacityKg === 0) && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Vehículo sin capacidad de carga definida
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    El vehículo seleccionado no tiene registrada su capacidad de
                    carga. No se podrá validar si las cargas exceden la
                    capacidad del vehículo.
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Puede continuar, pero se recomienda actualizar la capacidad
                    del vehículo en el módulo de Vehículos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Encabezado con resumen */}
      <div className="flex items-center justify-between">
        <div>
            <SectionHeadingWithHint
              title={
                <>
                  <Package className="h-5 w-5 shrink-0" />
                  Mercancías del viaje
                </>
              }
              titleClassName="inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
              hintLabel="Mercancías y movimientos"
              hint={
                <>
                  Cada punto de carga agrupa mercancías; al crear una carga se genera un movimiento de pickup. Puedes
                  asignar entregas parciales hacia otras paradas con descarga.
                </>
              }
            />
          <p className="text-sm text-muted-foreground">
            {totalCargos} carga{totalCargos !== 1 ? "s" : ""} en{" "}
            {pickupStops.length} punto
            {pickupStops.length !== 1 ? "s" : ""} de carga
            {totalWeight > 0 && ` • ${formatWeight(totalWeight)} total`}
          </p>
        </div>
        <div className="text-right space-y-1">
          {hasHazmatCargo && (
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Contiene material peligroso</span>
            </div>
          )}
        </div>
      </div>

      {/* ============ PARADAS COMO CONTENEDORES ============ */}
      {pickupStops.map((pickupStop) => {
        const stopCargos = getCargosForStop(pickupStop.index);
        const StopIcon =
          pickupStop.category === "origin"
            ? Navigation
            : pickupStop.category === "destination"
              ? Flag
              : MapPin;
        const hasMissing = stopCargos.length === 0;

        return (
          <Card
            key={pickupStop.index}
            className={cn(
              pickupStop.category === "origin" && "border-green-200",
              pickupStop.category === "destination" && "border-red-200",
              hasMissing && "border-orange-300",
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex items-center justify-center h-8 w-8 rounded-full flex-shrink-0",
                      pickupStop.category === "origin" &&
                        "bg-green-100 text-green-700",
                      pickupStop.category === "destination" &&
                        "bg-red-100 text-red-700",
                      pickupStop.category === "waypoint" &&
                        "bg-gray-100 text-gray-700",
                    )}
                  >
                    <StopIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base">
                        Parada #{pickupStop.index + 1}
                      </CardTitle>
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded",
                          pickupStop.category === "origin" &&
                            "bg-green-100 text-green-700",
                          pickupStop.category === "destination" &&
                            "bg-red-100 text-red-700",
                          pickupStop.category === "waypoint" &&
                            "bg-gray-100 text-gray-700",
                        )}
                      >
                        {pickupStop.category === "origin"
                          ? "Origen"
                          : pickupStop.category === "destination"
                            ? "Destino"
                            : "Escala"}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">
                        Carga
                      </span>
                      {hasMissing && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700">
                          Sin mercancías
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {pickupStop.locationName || pickupStop.address}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pickupStop.city}
                      {pickupStop.state && `, ${pickupStop.state}`}
                      {pickupStop.clientName && (
                        <span className="ml-1">
                          · Cliente:{" "}
                          <span className="font-medium">
                            {pickupStop.clientName}
                          </span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {stopCargos.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground border border-dashed border-orange-300 rounded-lg bg-orange-50/30">
                  <Package className="h-8 w-8 mx-auto mb-1 opacity-40" />
                  <p className="text-sm">Sin cargas registradas</p>
                  <p className="text-xs mt-0.5">
                    Debe registrar al menos una carga en esta parada
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stopCargos.map(({ cargo, fieldIndex }) => {
                    const deliveries = (cargo.movements || []).filter(
                      (m) => m.movementType === "delivery",
                    );

                    return (
                      <div
                        key={cargo.id || fieldIndex}
                        className={cn(
                          "flex items-start gap-3 p-3 border rounded-lg bg-muted/30",
                          cargo.hazardousMaterial &&
                            "border-orange-300 bg-orange-50/30",
                        )}
                      >
                        <Package
                          className={cn(
                            "h-4 w-4 mt-0.5 flex-shrink-0",
                            cargo.hazardousMaterial
                              ? "text-orange-600"
                              : "text-muted-foreground",
                          )}
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-medium truncate">
                              {cargo.description}
                            </h4>
                          </div>

                          {/* Badges de info */}
                          <div className="flex flex-wrap gap-1.5">
                            {cargo.satProductCode && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-blue-50 text-blue-700 border border-blue-200">
                                <FileText className="h-3 w-3" />
                              Clave {cargo.satProductCode}
                              </span>
                            )}
                            {cargo.hazardousMaterial && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded bg-orange-100 text-orange-700 border border-orange-200">
                                <AlertTriangle className="h-3 w-3" />
                                Mat. Peligroso
                              </span>
                            )}
                          </div>

                          {cargo.clientId &&
                            cargo.clientId !== pickupStop.clientId && (
                              <p className="text-xs text-muted-foreground">
                                Cliente: {getClientName(cargo.clientId)}
                              </p>
                            )}

                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {cargo.weightInKg && (
                              <span className="flex items-center gap-1">
                                <Scale className="h-3 w-3" />
                                {cargo.weightInKg} kg
                              </span>
                            )}
                            {!cargo.weightInKg && cargo.weight && (
                              <span>Peso: {cargo.weight} kg</span>
                            )}
                            {cargo.units && (
                              <span className="flex items-center gap-1">
                                <Box className="h-3 w-3" />
                                {cargo.units} {cargo.satUnitName || "uds"}
                              </span>
                            )}
                          </div>

                          {(cargo.aseguraCarga || cargo.polizaCarga) && (
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {cargo.aseguraCarga ? (
                                <span>Seguro: {cargo.aseguraCarga}</span>
                              ) : null}
                              {cargo.polizaCarga ? (
                                <span className="font-mono">
                                  Poliza: {cargo.polizaCarga}
                                </span>
                              ) : null}
                            </div>
                          )}

                          {/* Entregas asignadas */}
                          {deliveries.length > 0 && (
                            <div className="mt-1.5 space-y-1">
                              {deliveries.map((del, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 mr-2 px-1.5 py-0.5 text-xs rounded bg-orange-50 text-orange-700 border border-orange-200"
                                >
                                  <Truck className="h-3 w-3" />
                                  Entrega: {getStopLabel(del.stopIndex)}
                                  {del.weight != null && ` · ${del.weight} kg`}
                                  {del.units != null && ` · ${del.units} uds`}
                                </span>
                              ))}
                            </div>
                          )}

                          {cargo.notes && (
                            <p className="text-xs text-muted-foreground italic">
                              {cargo.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleOpenEditDialog(fieldIndex)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => remove(fieldIndex)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => handleOpenAddDialog(pickupStop)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar mercancía
              </Button>
            </CardContent>
          </Card>
        );
      })}


      {/* ============ DIALOG AGREGAR/EDITAR CARGA ============ */}
      <Dialog open={isCargoDialogOpen} onOpenChange={setIsCargoDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-8">
              <SectionHeadingWithHint
                noTitleWrap
                title={
                  <span>{editingIndex !== null ? "Editar mercancía" : "Agregar mercancía"}</span>
                }
                hintLabel="Qué incluye este formulario"
                hint={
                  <>
                    Complete el cliente de la parada de carga, el producto y la unidad de medida desde los catálogos
                    oficiales, cantidad y peso, seguro opcional, material peligroso si aplica, entregas posteriores en la
                    ruta y observaciones.                     El sistema enlaza las claves del catálogo al timbrado; no necesita transcribirlas.
                  </>
                }
              />
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulario de mercancía: cliente, producto y unidad de medida, cantidad y peso, seguro, material
              peligroso, entregas y observaciones.
            </DialogDescription>
            {currentPickupStop && (
              <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  Parada #{currentPickupStop.index + 1}
                </span>
                : {currentPickupStop.locationName || currentPickupStop.address}
                {currentPickupStop.clientName && ` · ${currentPickupStop.clientName}`}
              </div>
            )}
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* ========== SECCIÓN: CLIENTE ========== */}
            <CargoDialogSection step="01" title="Cliente en la parada" icon={User}>
              <div className="space-y-2">
                <SectionHeadingWithHint
                  noTitleWrap
                  title={<Label>Cliente *</Label>}
                  hintLabel="Cliente en esta parada"
                  hint={
                    <>
                      Se alinea con el cliente vinculado a esta parada de carga en el paso Ruta. Si la parada no tiene
                      cliente, puede seleccionarlo aquí.
                    </>
                  }
                />
                {stopHasClient ? (
                  <>
                    <Input
                      value={getClientName(newCargo.clientId || "")}
                      disabled
                      className="bg-muted"
                    />
                  </>
                ) : (
                  <Select
                    value={newCargo.clientId || ""}
                    onValueChange={(value) =>
                      setNewCargo({ ...newCargo, clientId: value })
                    }
                    disabled={isLoadingClients}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.legalName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CargoDialogSection>

            {/* ========== SECCIÓN: PRODUCTO Y UNIDAD (CATÁLOGO) ========== */}
            <CargoDialogSection
              step="02"
              title="Producto y unidad de medida"
              icon={FileText}
            >
              <div className="space-y-2">
                <Label>Producto o servicio transportado *</Label>
                <ProductoServicioCPSearch
                  value={newCargo.satProductCode || null}
                  onSelect={(item) => {
                    const flags = extractCargoRegulatoryFlags(item.metadata);
                    setNewCargo((prev) => ({
                      ...prev,
                      satProductCode: item.code,
                      satProductDescription: item.name,
                      description: prev.description || item.name,
                      requiresHazmat: flags.requiresHazmat,
                      hazardousMaterial:
                        prev.hazardousMaterial || flags.requiresHazmat,
                      sectorRequirements: flags.sectorRequirements,
                    }));
                    if (flags.requiresHazmat) {
                      setHazmatSectionOpen(true);
                    }
                  }}
                  onClear={() =>
                    setNewCargo((prev) => ({
                      ...prev,
                      satProductCode: "",
                      satProductDescription: "",
                      requiresHazmat: false,
                      sectorRequirements: {},
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Elija del catálogo de mercancías y servicios; puede buscar por nombre o por clave. No hace falta saber
                  cómo se codifica en la factura.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Descripción de la mercancía *</Label>
                <Input
                  placeholder="Se completa al elegir del catálogo; puede editarla..."
                  value={newCargo.description || ""}
                  onChange={(e) =>
                    setNewCargo({ ...newCargo, description: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Se completa al elegir el producto del catálogo; puede ajustarla para mayor detalle operativo.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Unidad de medida *</Label>
                <UnidadMedidaSearch
                  value={newCargo.satUnitCode || null}
                  onSelect={(item) =>
                    setNewCargo((prev) => ({
                      ...prev,
                      satUnitCode: item.code,
                      satUnitName: item.name,
                    }))
                  }
                  onClear={() =>
                    setNewCargo((prev) => ({
                      ...prev,
                      satUnitCode: "",
                      satUnitName: "",
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  El sistema conserva la unidad elegida del catálogo para la documentación fiscal; no tiene que copiar
                  claves a mano.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Moneda SAT</Label>
                <Input value={newCargo.currency || "MXN"} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  En v1 nacional se usa MXN por defecto para la mercancía.
                </p>
              </div>
            </CargoDialogSection>

            {/* ========== SECCIÓN: CANTIDAD Y PESO ========== */}
            <CargoDialogSection step="03" title="Cantidad y peso" icon={Scale}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Cantidad *</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="0"
                      min="1"
                      className={cn(
                        "flex-1",
                        (!newCargo.units || newCargo.units <= 0) &&
                          "border-orange-300 focus-visible:ring-orange-500",
                      )}
                      value={newCargo.units ?? ""}
                      onChange={(e) =>
                        setNewCargo({
                          ...newCargo,
                          units: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                    />
                    <span className="flex items-center text-sm text-muted-foreground min-w-[60px]">
                      {newCargo.satUnitName || "unidades"}
                    </span>
                  </div>
                  {(!newCargo.units || newCargo.units <= 0) && (
                    <p className="text-xs text-orange-600">
                      Ingrese la cantidad
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Peso total (kg) *
                    <span className="text-xs text-muted-foreground font-normal">
                      (documentación del envío)
                    </span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    className={cn(
                      (!newCargo.weightInKg || newCargo.weightInKg <= 0) &&
                        "border-orange-300 focus-visible:ring-orange-500",
                    )}
                    value={newCargo.weightInKg ?? ""}
                    onChange={(e) =>
                      setNewCargo({
                        ...newCargo,
                        weightInKg: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                        weight: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                  {(!newCargo.weightInKg || newCargo.weightInKg <= 0) && (
                    <p className="text-xs text-orange-600">Ingrese el peso</p>
                  )}
                </div>
              </div>

              {/* Advertencia de capacidad en el dialog */}
              {vehicleCapacityKg &&
                newCargo.weightInKg &&
                newCargo.weightInKg > 0 &&
                (() => {
                  // Calcular peso actual sin la carga que se está editando
                  const currentWeightWithoutEditing =
                    editingIndex !== null
                      ? totalWeight -
                        (fields[editingIndex]?.weightInKg ||
                          fields[editingIndex]?.weight ||
                          0)
                      : totalWeight;
                  const projectedWeight =
                    currentWeightWithoutEditing + newCargo.weightInKg;
                  const wouldExceed = projectedWeight > vehicleCapacityKg;
                  const projectedPercentage =
                    (projectedWeight / vehicleCapacityKg) * 100;

                  return wouldExceed ? (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-red-700">
                        <p className="font-medium">
                          ¡Esta carga excederá la capacidad del vehículo!
                        </p>
                        <p className="mt-1">
                          Peso proyectado: {formatWeight(projectedWeight)} /{" "}
                          {formatWeight(vehicleCapacityKg)}(
                          {projectedPercentage.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  ) : projectedPercentage >= 90 ? (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200">
                      <Gauge className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-orange-700">
                        <p className="font-medium">Capacidad casi al límite</p>
                        <p className="mt-1">
                          Peso proyectado: {formatWeight(projectedWeight)} /{" "}
                          {formatWeight(vehicleCapacityKg)}(
                          {projectedPercentage.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  ) : null;
                })()}

            </CargoDialogSection>

            {/* ========== SECCIÓN: SEGURO DE CARGA ========== */}
            <CargoDialogSection step="04" title="Seguro de mercancía" icon={ShieldCheck}>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="insured-checkbox"
                  checked={newCargo.isInsured || false}
                  onCheckedChange={(checked) =>
                    setNewCargo((prev) => ({
                      ...prev,
                      isInsured: !!checked,
                      declaredValue: checked ? prev.declaredValue : undefined,
                      aseguraCarga: checked ? prev.aseguraCarga : undefined,
                      polizaCarga: checked ? prev.polizaCarga : undefined,
                    }))
                  }
                />
                <Label htmlFor="insured-checkbox" className="cursor-pointer">
                  Esta mercancía está asegurada
                </Label>
              </div>

              {newCargo.isInsured && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Valor declarado (MXN) *</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={newCargo.declaredValue ?? ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          declaredValue: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Aseguradora de la carga *</Label>
                      <Input
                        placeholder="Ej: Qualitas"
                        value={newCargo.aseguraCarga ?? ""}
                        onChange={(e) =>
                          setNewCargo((prev) => ({
                            ...prev,
                            aseguraCarga: e.target.value || undefined,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Póliza de la carga *</Label>
                      <Input
                        placeholder="Ej: CARGA-123456"
                        value={newCargo.polizaCarga ?? ""}
                        onChange={(e) =>
                          setNewCargo((prev) => ({
                            ...prev,
                            polizaCarga: e.target.value || undefined,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Es el valor declarado de la mercancía para la documentación del envío. Si marca mercancía asegurada,
                    valor
                    declarado, aseguradora y póliza son obligatorios.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Captura la aseguradora y póliza específicas de esta mercancía
                    para el viaje.
                  </p>
                </div>
              )}
            </CargoDialogSection>

            {/* ========== SECCIÓN: MATERIAL PELIGROSO ========== */}
            <CargoDialogSection step="05" title="Material peligroso" icon={AlertTriangle}>
              <Collapsible
                open={hazmatSectionOpen}
                onOpenChange={setHazmatSectionOpen}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="hazmat-checkbox"
                      checked={newCargo.hazardousMaterial || false}
                      disabled={hazmatRequiredByCatalog}
                      onCheckedChange={handleHazmatChange}
                    />
                    <Label
                      htmlFor="hazmat-checkbox"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Esta mercancía es material peligroso
                    </Label>
                  </div>
                  {hazmatRequiredByCatalog && (
                    <p className="text-xs text-orange-700">
                      Este producto obliga captura de material peligroso según catálogo SAT.
                    </p>
                  )}
                  {newCargo.hazardousMaterial && (
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            hazmatSectionOpen && "rotate-180",
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>

                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="p-4 border border-orange-200 rounded-lg bg-orange-50/50 space-y-4">
                    <p className="text-sm text-orange-800">
                      Completa la información de material peligroso según catálogo oficial.
                    </p>

                    {/* Código de material peligroso - Búsqueda dinámica */}
                    <div className="space-y-2">
                      <Label>Clave Material Peligroso *</Label>
                      <MaterialPeligrosoSearch
                        value={newCargo.hazardousMaterialCode || null}
                        onSelect={(item) =>
                          setNewCargo((prev) => ({
                            ...prev,
                            hazardousMaterialCode: item.code,
                          }))
                        }
                        onClear={() =>
                          setNewCargo((prev) => ({
                            ...prev,
                            hazardousMaterialCode: "",
                          }))
                        }
                      />
                    </div>

                    {/* Tipo de embalaje */}
                    <div className="space-y-2">
                      <Label>Tipo de Embalaje *</Label>
                      <TipoEmbalajeSelect
                        value={newCargo.packagingType || ""}
                        onValueChange={(value) =>
                          setNewCargo((prev) => ({
                            ...prev,
                            packagingType: value,
                          }))
                        }
                        placeholder="Seleccionar tipo de embalaje"
                      />
                    </div>

                    {/* Descripción del embalaje */}
                    <div className="space-y-2">
                      <Label>Descripción del Embalaje</Label>
                      <Input
                        placeholder="Ej: Bidones de 20L, Tanque de 1000L..."
                        value={newCargo.packagingDescription || ""}
                        onChange={(e) =>
                          setNewCargo({
                            ...newCargo,
                            packagingDescription: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CargoDialogSection>

            {shouldShowSectorSection && (
              <CargoDialogSection
                step="06"
                title="Sectores regulados"
                icon={FileText}
              >
                <p className="text-xs text-muted-foreground">
                  Complete solo los campos regulatorios que marque el catálogo del
                  producto. Si no aplica, puede dejarlos vacíos.
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Sector COFEPRIS
                      {newCargo.sectorRequirements?.sectorCofepris ? " *" : ""}
                    </Label>
                    <Input
                      value={newCargo.sectorCofepris || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          sectorCofepris: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Ingrediente activo
                      {newCargo.sectorRequirements?.nombreIngredienteActivo
                        ? " *"
                        : ""}
                    </Label>
                    <Input
                      value={newCargo.nombreIngredienteActivo || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          nombreIngredienteActivo: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Nombre químico
                      {newCargo.sectorRequirements?.nomQuimico ? " *" : ""}
                    </Label>
                    <Input
                      value={newCargo.nomQuimico || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          nomQuimico: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Denominación genérica
                      {newCargo.sectorRequirements?.denominacionGenericaProd
                        ? " *"
                        : ""}
                    </Label>
                    <Input
                      value={newCargo.denominacionGenericaProd || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          denominacionGenericaProd: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Denominación distintiva
                      {newCargo.sectorRequirements?.denominacionDistintivaProd
                        ? " *"
                        : ""}
                    </Label>
                    <Input
                      value={newCargo.denominacionDistintivaProd || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          denominacionDistintivaProd: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Fabricante
                      {newCargo.sectorRequirements?.fabricante ? " *" : ""}
                    </Label>
                    <Input
                      value={newCargo.fabricante || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          fabricante: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Fecha de caducidad
                      {newCargo.sectorRequirements?.fechaCaducidad ? " *" : ""}
                    </Label>
                    <Input
                      type="date"
                      value={newCargo.fechaCaducidad || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          fechaCaducidad: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Lote medicamento
                      {newCargo.sectorRequirements?.loteMedicamento ? " *" : ""}
                    </Label>
                    <Input
                      value={newCargo.loteMedicamento || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          loteMedicamento: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Forma farmacéutica
                      {newCargo.sectorRequirements?.formaFarmaceutica ? " *" : ""}
                    </Label>
                    <Input
                      value={newCargo.formaFarmaceutica || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          formaFarmaceutica: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Condiciones especiales de transporte
                      {newCargo.sectorRequirements?.condicionesEspTransp
                        ? " *"
                        : ""}
                    </Label>
                    <Input
                      value={newCargo.condicionesEspTransp || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          condicionesEspTransp: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Registro sanitario / folio autorización
                      {newCargo.sectorRequirements
                        ?.registroSanitarioFolioAutorizacion
                        ? " *"
                        : ""}
                    </Label>
                    <Input
                      value={newCargo.registroSanitarioFolioAutorizacion || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          registroSanitarioFolioAutorizacion: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Permiso importación
                      {newCargo.sectorRequirements?.permisoImportacion
                        ? " *"
                        : ""}
                    </Label>
                    <Input
                      value={newCargo.permisoImportacion || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          permisoImportacion: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Folio VUCEM
                      {newCargo.sectorRequirements?.folioImpoVucem ? " *" : ""}
                    </Label>
                    <Input
                      value={newCargo.folioImpoVucem || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          folioImpoVucem: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Número CAS
                      {newCargo.sectorRequirements?.numCas ? " *" : ""}
                    </Label>
                    <Input
                      value={newCargo.numCas || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          numCas: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Razón social empresa importadora
                      {newCargo.sectorRequirements?.razonSocialEmpImp ? " *" : ""}
                    </Label>
                    <Input
                      value={newCargo.razonSocialEmpImp || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          razonSocialEmpImp: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Registro sanitario plaguicida COFEPRIS
                      {newCargo.sectorRequirements?.numRegSanPlagCofepris
                        ? " *"
                        : ""}
                    </Label>
                    <Input
                      value={newCargo.numRegSanPlagCofepris || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          numRegSanPlagCofepris: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Datos fabricante
                      {newCargo.sectorRequirements?.datosFabricante ? " *" : ""}
                    </Label>
                    <Input
                      value={newCargo.datosFabricante || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          datosFabricante: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Datos formulador
                      {newCargo.sectorRequirements?.datosFormulador ? " *" : ""}
                    </Label>
                    <Input
                      value={newCargo.datosFormulador || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          datosFormulador: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Datos maquilador
                      {newCargo.sectorRequirements?.datosMaquilador ? " *" : ""}
                    </Label>
                    <Input
                      value={newCargo.datosMaquilador || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          datosMaquilador: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Uso autorizado
                      {newCargo.sectorRequirements?.usoAutorizado ? " *" : ""}
                    </Label>
                    <Input
                      value={newCargo.usoAutorizado || ""}
                      onChange={(e) =>
                        setNewCargo((prev) => ({
                          ...prev,
                          usoAutorizado: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {missingSectorFields.length > 0 && (
                  <p className="text-xs text-orange-600">
                    Campos pendientes:{" "}
                    {missingSectorFields
                      .map((field) => sectorFieldLabels[field])
                      .join(", ")}
                  </p>
                )}
              </CargoDialogSection>
            )}

            {/* ========== SECCIÓN: ENTREGAS (DELIVERY ASSIGNMENTS) ========== */}
            {availableDeliveryForDialog.length > 0 && (
              <CargoDialogSection step="07" title="Entregas en la ruta" icon={Truck}>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Descargas posteriores en otras paradas
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddDeliveryAssignment}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Agregar Entrega
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Opcional: indique en qué paradas se entregará esta mercancía. Para entregas parciales, especifique peso
                  o unidades por punto.
                </p>

                {deliveryAssignments.length === 0 ? (
                  <div className="text-center py-3 border border-dashed rounded-lg text-xs text-muted-foreground">
                    Sin entregas asignadas. Puede asignarlas después.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deliveryAssignments.map((delivery, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-3 border rounded-lg bg-orange-50/30"
                      >
                        <div className="flex-1 space-y-2">
                          <Select
                            value={
                              delivery.stopIndex >= 0
                                ? String(delivery.stopIndex)
                                : ""
                            }
                            onValueChange={(val) =>
                              handleUpdateDeliveryAssignment(
                                idx,
                                "stopIndex",
                                Number(val),
                              )
                            }
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Seleccionar parada..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableDeliveryForDialog.map((s) => (
                                <SelectItem
                                  key={s.index}
                                  value={String(s.index)}
                                >
                                  #{s.index + 1} {s.locationName || s.address} (
                                  {s.city})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              placeholder="Peso (kg)"
                              className="h-8 text-xs"
                              value={delivery.weight ?? ""}
                              onChange={(e) =>
                                handleUpdateDeliveryAssignment(
                                  idx,
                                  "weight",
                                  e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                                )
                              }
                            />
                            <Input
                              type="number"
                              placeholder="Unidades"
                              className="h-8 text-xs"
                              value={delivery.units ?? ""}
                              onChange={(e) =>
                                handleUpdateDeliveryAssignment(
                                  idx,
                                  "units",
                                  e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                                )
                              }
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => handleRemoveDeliveryAssignment(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CargoDialogSection>
            )}

            {/* ========== SECCIÓN: NOTAS ========== */}
            <CargoDialogSection step="08" title="Notas y observaciones" icon={MessageSquare}>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Observaciones sobre la carga..."
                  value={newCargo.notes || ""}
                  onChange={(e) =>
                    setNewCargo({ ...newCargo, notes: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Instrucciones especiales</Label>
                <Textarea
                  placeholder="Manejo especial, temperatura, fragilidad..."
                  value={newCargo.specialInstructions || ""}
                  onChange={(e) =>
                    setNewCargo({
                      ...newCargo,
                      specialInstructions: e.target.value,
                    })
                  }
                />
              </div>
            </CargoDialogSection>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCargoDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveCargo}
              disabled={
                !newCargo.clientId ||
                !newCargo.satProductCode ||
                !newCargo.description ||
                !newCargo.satUnitCode ||
                !newCargo.units ||
                newCargo.units <= 0 ||
                !newCargo.weightInKg ||
                newCargo.weightInKg <= 0 ||
                !newCargo.movements ||
                newCargo.movements.length === 0 ||
                (hazmatRequiredByCatalog && !newCargo.hazardousMaterial) ||
                (newCargo.hazardousMaterial && !newCargo.hazardousMaterialCode) ||
                missingSectorFields.length > 0 ||
                (newCargo.isInsured && !insuredCargoComplete)
              }
            >
              {editingIndex !== null ? "Guardar cambios" : "Agregar mercancía"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
