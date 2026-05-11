/**
 * StopFormDialog - Dialog para agregar/editar paradas
 * Clean Architecture - Presentation Layer
 *
 * Fase C: ubicación capturada con `AddressInput` compartido (addressSchema / SAT en inglés)
 * y mapeo a `TripStopFormValues` del wizard.
 *
 * Ubicación: src/features/trips/presentation/pages/create/components/StopFormDialog.tsx
 */

import {
  forwardRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type RefObject,
  type ReactNode,
  type ComponentType,
} from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@shared/ui/badge";
import { Switch } from "@shared/ui/switch";
import { Alert, AlertDescription } from "@shared/ui/alert";
import {
  EntityAddressForm,
  AddressGeolocationPanel,
  resolveGeolocationPanelMode,
} from "@shared/ui/address-input";
import {
  MapPin,
  Navigation,
  Flag,
  Building2,
  AlertCircle,
  User,
  Phone,
  ChevronDown,
  Milestone,
  MapPinned,
  ScrollText,
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
  resolveRemitenteFiscalFromClientAddress,
} from "./stopDialogAddressMapper";
import { LOCATION_CAPTURE_LABELS } from "./wizardCopy";
import {
  RFC_PUBLICO_GENERAL,
  getDeliveryFiscalCopy,
  getPrimaryFiscalSectionCopy,
  publicGeneralRfcNotice,
  resolveStopFiscalUiContext,
  type CfdiDocumentIntent,
} from "./stopDialogFiscalCopy";
import { PartnerSnapshotPicker } from "@features/partners";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { HintIcon, SectionHeadingWithHint } from "@shared/ui/hint-icon";
import { Separator } from "@shared/ui/separator";

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
  /** Intención CFDI elegida en el paso 1 — orienta copy de esta parada. */
  cfdiDocumentIntent?: CfdiDocumentIntent;
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

type StopDialogHighlightKey =
  | "stopCategory"
  | "waypointOperations"
  | "addressSat"
  | "geolocation"
  | "estimatedArrival"
  | "distance";

function missingMessagesToHighlightKeys(missing: string[]): Set<StopDialogHighlightKey> {
  const keys = new Set<StopDialogHighlightKey>();
  for (const m of missing) {
    switch (m) {
      case "Tipo de parada":
        keys.add("stopCategory");
        break;
      case "Operación de escala":
        keys.add("waypointOperations");
        break;
      case LOCATION_CAPTURE_LABELS.country:
      case LOCATION_CAPTURE_LABELS.state:
      case LOCATION_CAPTURE_LABELS.municipality:
      case "Código postal":
        keys.add("addressSat");
        break;
      case "Geolocalización en mapa":
        keys.add("geolocation");
        break;
      case "Hora estimada de llegada":
        keys.add("estimatedArrival");
        break;
      case "Distancia desde parada anterior":
        keys.add("distance");
        break;
      default:
        break;
    }
  }
  return keys;
}

function sectionHighlightClass(
  attempted: boolean,
  keys: Set<StopDialogHighlightKey>,
  section: StopDialogHighlightKey,
): string | undefined {
  if (!attempted || !keys.has(section)) return undefined;
  return "rounded-lg ring-2 ring-destructive ring-offset-2 ring-offset-background";
}

/** Orden visual del formulario: primer error con resaltado activo recibe scroll. */
const HIGHLIGHT_SCROLL_ORDER: StopDialogHighlightKey[] = [
  "stopCategory",
  "waypointOperations",
  "addressSat",
  "geolocation",
  "distance",
  "estimatedArrival",
];

type StopSectionRefs = {
  stopCategory: RefObject<HTMLDivElement | null>;
  waypointOperations: RefObject<HTMLDivElement | null>;
  addressSat: RefObject<HTMLDivElement | null>;
  geoDistance: RefObject<HTMLDivElement | null>;
  estimatedArrival: RefObject<HTMLDivElement | null>;
};

function scrollToFirstHighlightedSection(
  keys: Set<StopDialogHighlightKey>,
  refs: StopSectionRefs,
  fallbackEl: HTMLElement | null,
) {
  for (const key of HIGHLIGHT_SCROLL_ORDER) {
    if (!keys.has(key)) continue;
    const el =
      key === "stopCategory"
        ? refs.stopCategory.current
        : key === "waypointOperations"
          ? refs.waypointOperations.current
          : key === "addressSat"
            ? refs.addressSat.current
            : key === "geolocation" || key === "distance"
              ? refs.geoDistance.current
              : refs.estimatedArrival.current;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
  }
  fallbackEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

type StopDialogSectionProps = {
  /** Índice corto visual (p. ej. 01, 02). */
  step: string;
  title: string;
  icon?: ComponentType<{ className?: string }>;
  /** Contenido opcional alineado a la derecha del título (p. ej. ayuda). */
  headerExtra?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/**
 * Agrupa bloques del diálogo con jerarquía clara: número, icono, título y contenedor con borde suave.
 * Pensado para escaneo rápido en formularios densos (ERP / logística).
 */
const StopDialogSection = forwardRef<HTMLElement, StopDialogSectionProps>(
  function StopDialogSection(
    { step, title, icon: Icon, headerExtra, children, className, contentClassName },
    ref,
  ) {
    return (
      <section
        ref={ref}
        className={cn(
          "overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm ring-1 ring-black/[0.04] dark:bg-card/85 dark:ring-white/[0.06]",
          className,
        )}
      >
        <header className="flex items-start gap-3 border-b border-border/60 bg-muted/20 px-4 py-3 dark:bg-muted/15">
          <span
            className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-background font-mono text-[11px] font-semibold tabular-nums leading-none text-muted-foreground shadow-sm ring-1 ring-border/60"
            aria-hidden
          >
            {step}
          </span>
          {Icon ? (
            <Icon className="mt-1 h-4 w-4 shrink-0 text-primary/90" aria-hidden />
          ) : null}
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-sm font-semibold leading-tight tracking-tight text-foreground">{title}</h3>
          </div>
          {headerExtra ? <div className="shrink-0 pt-0.5">{headerExtra}</div> : null}
        </header>
        <div className={cn("space-y-4 p-4 sm:p-5", contentClassName)}>{children}</div>
      </section>
    );
  },
);
StopDialogSection.displayName = "StopDialogSection";

/** Superficie anidada única (paneles dentro de cada sección numerada). */
const STOP_NESTED_SURFACE =
  "rounded-lg border border-border/60 bg-muted/20 p-3 dark:border-border/50 dark:bg-muted/15";

// ============================================================================
// COMPONENT
// ============================================================================

export function StopFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = "create",
  cfdiDocumentIntent = "ingreso",
}: StopFormDialogProps) {
  const [attemptedSubmitValidation, setAttemptedSubmitValidation] = useState(false);
  const validationAlertRef = useRef<HTMLDivElement | null>(null);
  const stopCategorySectionRef = useRef<HTMLDivElement | null>(null);
  const waypointOperationsSectionRef = useRef<HTMLDivElement | null>(null);
  const addressSatSectionRef = useRef<HTMLDivElement | null>(null);
  const geoDistanceSectionRef = useRef<HTMLDivElement | null>(null);
  const estimatedArrivalSectionRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useMemo<StopSectionRefs>(
    () => ({
      stopCategory: stopCategorySectionRef,
      waypointOperations: waypointOperationsSectionRef,
      addressSat: addressSatSectionRef,
      geoDistance: geoDistanceSectionRef,
      estimatedArrival: estimatedArrivalSectionRef,
    }),
    [],
  );
  const [useAddressFiscalData, setUseAddressFiscalData] = useState(true);
  const [useClientAddressPrefill, setUseClientAddressPrefill] = useState(false);
  /** Con precarga desde cliente: formulario de dirección colapsado por defecto; el usuario puede expandirlo. */
  const [addressDetailsOpen, setAddressDetailsOpen] = useState(false);
  const prevClientPrefillRef = useRef(false);
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

  const clientFiscalFallback = useMemo(() => {
    if (!clientId) return null;
    const c = clients.find((item) => item.id === clientId);
    if (!c) return null;
    return { taxId: c.taxId, legalName: c.legalName };
  }, [clientId, clients]);

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
    queueMicrotask(() => {
      setUseClientAddressPrefill(Boolean(next.clientId || next.clientAddressId));
      setUseAddressFiscalData(true);
    });
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
    const catalogFiscal = resolveRemitenteFiscalFromClientAddress(
      selectedAddress,
      clientFiscalFallback,
    );
    const addressRfc = normalizeRfc(catalogFiscal.rfcRemitenteDestinatario);
    const addressName = normalizeName(catalogFiscal.nombreRemitenteDestinatario);

    const hasCurrentValues = Boolean(currentRfc || currentName);
    const matchesAddressData =
      (!addressRfc || currentRfc === addressRfc) &&
      (!addressName || currentName === addressName);

    queueMicrotask(() =>
      setUseAddressFiscalData(!hasCurrentValues || matchesAddressData),
    );
    hasInitializedFiscalModeRef.current = true;
  }, [
    clientAddressId,
    clientFiscalFallback,
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

    const fiscal = resolveRemitenteFiscalFromClientAddress(
      selectedAddress,
      clientFiscalFallback,
    );
    setValue("rfcRemitenteDestinatario", fiscal.rfcRemitenteDestinatario, {
      shouldValidate: true,
    });
    setValue("nombreRemitenteDestinatario", fiscal.nombreRemitenteDestinatario, {
      shouldValidate: true,
    });
  }, [
    clientAddressId,
    clientFiscalFallback,
    mode,
    selectedAddress,
    setValue,
    useAddressFiscalData,
  ]);

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
  const noticeSatStateCode = watched?.satStateCode ?? "";
  const noticeSatMunicipalityCode = watched?.satMunicipalityCode ?? "";
  const noticePostalCode = watched?.postalCode ?? "";

  const displayStop = useMemo(
    () =>
      mergeDialogWithClientCatalog(
        (watched ?? getEmptyStopDialogValues()) as StopDialogFormValues,
        selectedAddress,
        useAddressFiscalData,
        clientFiscalFallback,
      ),
    [clientFiscalFallback, watched, selectedAddress, useAddressFiscalData],
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
      setValue("satCountryCode", "MEX");
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
      setValue("latitude", null);
      setValue("longitude", null);
      setValue("rfcRemitenteDestinatario", "");
      setValue("nombreRemitenteDestinatario", "");
      setValue("deliveryRfcRemitenteDestinatario", "");
      setValue("deliveryNombreRemitenteDestinatario", "");
      setValue("remitentePartnerId", "");
      setValue("destinatarioPartnerId", "");
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
        setValue("satCountryCode", "MEX");
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
        setValue("latitude", null);
        setValue("longitude", null);
        setValue("rfcRemitenteDestinatario", "");
        setValue("nombreRemitenteDestinatario", "");
        setValue("deliveryRfcRemitenteDestinatario", "");
        setValue("deliveryNombreRemitenteDestinatario", "");
        setValue("remitentePartnerId", "");
        setValue("destinatarioPartnerId", "");
        setValue("contactName", "");
        setValue("contactPhone", "");
        return;
      }
      setUseAddressFiscalData(true);
      setValue("clientAddressId", selectedCatalogId, { shouldDirty: true });
      setValue("addressId", selectedCatalogId, { shouldDirty: true });

      const fromList = addresses.find((a) => a.id === selectedCatalogId);
      const prefName = fromList?.contactName?.trim() ?? "";
      const prefPhone = fromList?.contactPhone?.trim() ?? "";
      setValue("contactName", prefName, { shouldDirty: true, shouldValidate: true });
      setValue("contactPhone", prefPhone, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [addresses, setUseAddressFiscalData, setValue],
  );

  const handleClientAddressPrefillToggle = useCallback(
    (checked: boolean) => {
      setUseClientAddressPrefill(checked);

      if (checked) {
        return;
      }

      hasInitializedFiscalModeRef.current = false;
      lastSyncedCatalogIdRef.current = null;
      setUseAddressFiscalData(false);
      setValue("clientId", "", { shouldDirty: true, shouldValidate: true });
      setValue("clientAddressId", "", { shouldDirty: true, shouldValidate: true });
      setValue("addressId", "", { shouldDirty: true, shouldValidate: true });
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
    onSubmit(
      mergeDialogWithClientCatalog(
        values,
        selectedAddress,
        useAddressFiscalData,
        clientFiscalFallback,
      ),
    );
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

  const getMissingRequiredFields = useCallback((): string[] => {
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
      if (!d.satCountryCode?.trim()) missing.push(LOCATION_CAPTURE_LABELS.country);
      if (!d.satStateCode?.trim()) missing.push(LOCATION_CAPTURE_LABELS.state);
      if (!d.satMunicipalityCode?.trim()) {
        missing.push(LOCATION_CAPTURE_LABELS.municipality);
      }
      if (!/^\d{5}$/.test(d.postalCode?.trim() ?? "")) {
        missing.push(LOCATION_CAPTURE_LABELS.postalCode);
      }
    }

    if (d.stopCategory === "destination" && !d.estimatedArrival) {
      missing.push("Hora estimada de llegada");
    }

    if (d.latitude == null || d.longitude == null) {
      missing.push("Geolocalización en mapa");
    }

    return missing;
  }, [displayStop]);

  const missingRequiredFields = useMemo(
    () => getMissingRequiredFields(),
    [getMissingRequiredFields],
  );
  const highlightKeys = useMemo(
    () => missingMessagesToHighlightKeys(missingRequiredFields),
    [missingRequiredFields],
  );

  const handlePrimaryFooterAction = useCallback(() => {
    const missing = getMissingRequiredFields();
    if (missing.length > 0) {
      setAttemptedSubmitValidation(true);
      return;
    }
    setAttemptedSubmitValidation(false);
    void submitDialog();
  }, [getMissingRequiredFields, submitDialog]);

  useEffect(() => {
    if (!open) {
      setAttemptedSubmitValidation(false);
    }
  }, [open]);

  useEffect(() => {
    if (missingRequiredFields.length === 0) {
      setAttemptedSubmitValidation(false);
    }
  }, [missingRequiredFields.length]);

  useEffect(() => {
    if (!attemptedSubmitValidation || missingRequiredFields.length === 0) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToFirstHighlightedSection(
          highlightKeys,
          sectionRefs,
          validationAlertRef.current,
        );
      });
    });
    return () => cancelAnimationFrame(id);
  }, [attemptedSubmitValidation, missingRequiredFields, highlightKeys, sectionRefs]);

  useEffect(() => {
    if (!open) {
      setAddressDetailsOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (useClientAddressPrefill && !prevClientPrefillRef.current) {
      setAddressDetailsOpen(false);
    }
    prevClientPrefillRef.current = useClientAddressPrefill;
  }, [useClientAddressPrefill]);

  useEffect(() => {
    if (!useClientAddressPrefill || !attemptedSubmitValidation) return;
    if (
      highlightKeys.has("addressSat") ||
      highlightKeys.has("geolocation") ||
      highlightKeys.has("distance")
    ) {
      setAddressDetailsOpen(true);
    }
  }, [useClientAddressPrefill, attemptedSubmitValidation, highlightKeys]);

  const showWaypointArrivalWarning =
    displayStop.stopCategory === "waypoint" && !displayStop.estimatedArrival;

  const isAddressLocked = useClientAddressPrefill && !!displayStop.clientAddressId;
  const isFiscalDataLocked = isAddressLocked && useAddressFiscalData;
  const catalogHasStoredCoordinates =
    isAddressLocked &&
    selectedAddress?.latitude != null &&
    selectedAddress?.longitude != null;
  const geolocationPanelMode = resolveGeolocationPanelMode({
    isOriginStop:
      displayStop.stopCategory === "origin" ||
      Boolean(displayStop.stopType?.includes("origin")),
    hasClientPrefill: isAddressLocked,
    catalogHasStoredCoordinates,
  });

  const fiscalUiContext = useMemo(
    () =>
      resolveStopFiscalUiContext(
        displayStop.stopCategory,
        displayStop.stopType as import("@features/trips/domain").StopTypeValue[],
      ),
    [displayStop.stopCategory, displayStop.stopType],
  );

  const primaryFiscalCopy = useMemo(
    () => getPrimaryFiscalSectionCopy(fiscalUiContext, cfdiDocumentIntent),
    [cfdiDocumentIntent, fiscalUiContext],
  );

  const deliveryFiscalCopy = useMemo(() => getDeliveryFiscalCopy(), []);

  const watchedPrimaryRfc =
    useWatch({ control, name: "rfcRemitenteDestinatario" }) ?? "";
  const watchedDeliveryRfc =
    useWatch({ control, name: "deliveryRfcRemitenteDestinatario" }) ?? "";

  const showPublicGeneralWarningPrimary =
    watchedPrimaryRfc.trim().toUpperCase() === RFC_PUBLICO_GENERAL;
  const waypointHasPickup =
    displayStop.stopCategory === "waypoint" &&
    Boolean(displayStop.stopType?.includes("pickup"));
  const waypointHasDelivery =
    displayStop.stopCategory === "waypoint" &&
    Boolean(displayStop.stopType?.includes("delivery"));

  const showPublicGeneralWarningDelivery =
    displayStop.stopCategory === "waypoint" &&
    displayStop.stopType?.includes("delivery") &&
    (displayStop.stopType?.includes("pickup")
      ? watchedDeliveryRfc.trim().toUpperCase() === RFC_PUBLICO_GENERAL
      : watchedPrimaryRfc.trim().toUpperCase() === RFC_PUBLICO_GENERAL);

  useEffect(() => {
    if (displayStop.stopCategory !== "waypoint") return;
    const hasPickup = Boolean(displayStop.stopType?.includes("pickup"));
    const hasDelivery = Boolean(displayStop.stopType?.includes("delivery"));
    // Los campos secundarios de descarga solo viven en escala mixta (carga + descarga).
    if (hasPickup && hasDelivery) return;
    const deliveryRfc = (getValues("deliveryRfcRemitenteDestinatario") ?? "").trim();
    const deliveryName = (getValues("deliveryNombreRemitenteDestinatario") ?? "").trim();
    const deliveryPartnerId = (getValues("destinatarioPartnerId") ?? "").trim();
    if (!deliveryRfc && !deliveryName && !deliveryPartnerId) return;
    setValue("deliveryRfcRemitenteDestinatario", "");
    setValue("deliveryNombreRemitenteDestinatario", "");
    setValue("destinatarioPartnerId", "");
  }, [displayStop.stopCategory, displayStop.stopType, getValues, setValue]);

  const addressInputMode = stopHasUnifiedAddressId({ addressId }) ? "cfdi" : "carta-porte";

  const addressSatHighlightClass = sectionHighlightClass(
    attemptedSubmitValidation,
    highlightKeys,
    "addressSat",
  );
  const geoDistanceHighlightClass = cn(
    sectionHighlightClass(attemptedSubmitValidation, highlightKeys, "geolocation"),
    sectionHighlightClass(attemptedSubmitValidation, highlightKeys, "distance"),
  );

  const entityAddressForm = (
    <EntityAddressForm
      asForm={false}
      className="space-y-4"
      formContext="additional"
      addressMode={addressInputMode}
      infoMessage=""
      satStateCode={noticeSatStateCode}
      satMunicipalityCode={noticeSatMunicipalityCode}
      postalCode={noticePostalCode}
      showGlobalNotice={!isAddressLocked}
      hideLocationSectionTitle
      locationSectionTitle="Ubicación fiscal y domicilio"
      preAddressSections={[
        {
          id: "stop-location-context",
          title: (
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Contexto de direccion
              <Badge variant="secondary" className="text-xs">
                Fiscal
              </Badge>
            </span>
          ),
          content: (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label>Nombre del Lugar</Label>
                {stopHasUnifiedAddressId({ addressId }) ? (
                  <HintIcon label="Datos desde domicilio del cliente">
                    Ubicación ligada a un domicilio del cliente: los datos fiscales se toman de ese registro y no hace
                    falta capturarlos de nuevo aquí.
                  </HintIcon>
                ) : null}
              </div>
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
          ),
        },
      ]}
      addressInputSection={
        <>
          <AddressInput<StopDialogFormValues>
            mode={addressInputMode}
            control={control}
            setValue={setValue}
            namePrefix=""
            layout="compact"
            showLatLng
            disabled={isAddressLocked}
            hideInformativeAlerts={isAddressLocked}
          />
          <div ref={geoDistanceSectionRef} className={cn(geoDistanceHighlightClass)}>
            <AddressGeolocationPanel
              address={{
                locationName: displayStop.locationName,
                street: displayStop.street,
                exteriorNumber: displayStop.exteriorNumber,
                interiorNumber: displayStop.interiorNumber,
                postalCode: displayStop.postalCode,
                satMunicipalityCode: displayStop.satMunicipalityCode,
                satStateCode: displayStop.satStateCode,
                satCountryCode: displayStop.satCountryCode,
              }}
              latitude={displayStop.latitude}
              longitude={displayStop.longitude}
              onCoordinatesChange={(coords) => {
                setValue("latitude", coords.latitude, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setValue("longitude", coords.longitude, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              previousPoint={{
                latitude: displayStop.previousStopLatitude,
                longitude: displayStop.previousStopLongitude,
                label: displayStop.previousStopLabel,
              }}
              distanceFromPreviousKm={displayStop.distanceFromPreviousKm}
              onDistanceChange={(distanceKm) => {
                setValue("distanceFromPreviousKm", distanceKm, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                if (distanceKm === undefined) {
                  setValue("distanceSource", undefined, { shouldDirty: true });
                  setValue("distanceProvider", undefined, { shouldDirty: true });
                  setValue("distanceConfidence", undefined, { shouldDirty: true });
                  setValue("distanceComputedAt", undefined, { shouldDirty: true });
                }
              }}
              onDistanceMetaChange={(meta) => {
                setValue("distanceSource", meta.source, {
                  shouldDirty: true,
                });
                setValue("distanceProvider", meta.provider, {
                  shouldDirty: true,
                });
                setValue("distanceConfidence", meta.confidence, {
                  shouldDirty: true,
                });
                setValue("distanceComputedAt", meta.computedAt, {
                  shouldDirty: true,
                });
              }}
              showSearchControls={geolocationPanelMode.showSearchControls}
              showDistanceSection={geolocationPanelMode.showDistanceSection}
              distanceEditable={geolocationPanelMode.distanceEditable}
            />
          </div>
        </>
      }
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-8">
              <SectionHeadingWithHint
                noTitleWrap
                title={<span>{mode === "edit" ? "Editar parada" : "Agregar parada"}</span>}
                hintLabel="Qué incluye este formulario"
                hint={
                  <>
                    Configura la ubicación, las operaciones de carga o descarga y la información fiscal necesaria para
                    esta parada del viaje.
                  </>
                }
              />
            </DialogTitle>
            <DialogDescription className="sr-only">
              Formulario de parada: ubicación, operaciones, datos fiscales y contacto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-8">
          {attemptedSubmitValidation && missingRequiredFields.length > 0 ? (
            <Alert ref={validationAlertRef} variant="destructive" aria-live="polite">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <SectionHeadingWithHint
                  noTitleWrap
                  title={<span className="font-medium">Faltan datos obligatorios</span>}
                  hintLabel="Cómo localizar los errores"
                  hint={<>Revisa los bloques marcados con borde rojo dentro del formulario.</>}
                />
                <ul className="mt-2 list-disc space-y-0.5 pl-4 text-sm">
                  {missingRequiredFields.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}
          <StopDialogSection
            ref={stopCategorySectionRef}
            step="01"
            title="Tipo de parada"
            icon={Milestone}
            contentClassName="space-y-4"
          >
          <div
            className={cn(
              "rounded-lg p-4 border-2",
              displayStop.stopCategory === "origin" &&
                "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950",
              displayStop.stopCategory === "waypoint" &&
                "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900",
              displayStop.stopCategory === "destination" &&
                "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
              sectionHighlightClass(
                attemptedSubmitValidation,
                highlightKeys,
                "stopCategory",
              ),
            )}
          >
            <div className="flex items-center gap-3">
              {displayStop.stopCategory === "origin" && (
                <>
                  <Navigation className="h-6 w-6 shrink-0 text-green-600" />
                  <SectionHeadingWithHint
                    className="min-w-0"
                    noTitleWrap
                    title={<p className="font-medium text-sm">Parada de origen</p>}
                    hintLabel="Parada de origen"
                    hint={<>Punto de inicio del viaje. Solo permite carga de mercancía.</>}
                  />
                </>
              )}
              {displayStop.stopCategory === "waypoint" && (
                <>
                  <MapPin className="h-6 w-6 shrink-0 text-gray-600" />
                  <SectionHeadingWithHint
                    className="min-w-0"
                    noTitleWrap
                    title={<p className="font-medium text-sm">Escala intermedia</p>}
                    hintLabel="Escala intermedia"
                    hint={<>Puede realizar carga, descarga o ambas operaciones.</>}
                  />
                </>
              )}
              {displayStop.stopCategory === "destination" && (
                <>
                  <Flag className="h-6 w-6 shrink-0 text-red-600" />
                  <SectionHeadingWithHint
                    className="min-w-0"
                    noTitleWrap
                    title={<p className="font-medium text-sm">Parada de destino</p>}
                    hintLabel="Parada de destino"
                    hint={<>Punto final del viaje. Solo permite descarga de mercancía.</>}
                  />
                </>
              )}
            </div>
          </div>

          {displayStop.stopCategory === "waypoint" && (
            <div
              ref={waypointOperationsSectionRef}
              className={cn(
                "space-y-3",
                sectionHighlightClass(
                  attemptedSubmitValidation,
                  highlightKeys,
                  "waypointOperations",
                ),
              )}
            >
              <SectionHeadingWithHint
                noTitleWrap
                title={<Label className="text-sm">Operaciones en esta parada *</Label>}
                hintLabel="Operaciones en escala"
                hint={<>Selecciona al menos una operación: carga, descarga o ambas.</>}
              />
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
            </div>
          )}
          </StopDialogSection>

          <StopDialogSection
            ref={addressSatSectionRef}
            step="02"
            title="Ubicación y recorrido"
            icon={MapPinned}
            className={cn(addressSatHighlightClass)}
            contentClassName="space-y-5"
          >
          <div className="space-y-4">
            <div className={cn("flex items-center justify-between gap-3", STOP_NESTED_SURFACE)}>
              <SectionHeadingWithHint
                className="min-w-0"
                noTitleWrap
                title={
                  <Label htmlFor="useClientAddressPrefill" className="cursor-pointer">
                    Precargar dirección desde cliente
                  </Label>
                }
                hintLabel="Precarga desde cliente"
                hint={
                  <>
                    Usa el domicilio fiscal del cliente para llenar código postal, estado, calle y datos en mapa cuando
                    eliges una dirección del catálogo.
                  </>
                }
              />
              <Switch
                id="useClientAddressPrefill"
                checked={useClientAddressPrefill}
                onCheckedChange={handleClientAddressPrefillToggle}
              />
            </div>

            {useClientAddressPrefill && (
              <div className={cn("space-y-4", STOP_NESTED_SURFACE)}>
                <SectionHeadingWithHint
                  noTitleWrap
                  title={
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Cliente y domicilio
                    </p>
                  }
                  hintLabel="Cliente y domicilio"
                  hint={
                    <>
                      Elige un cliente y una dirección guardada en su expediente, o captura la dirección manualmente.
                    </>
                  }
                />

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Cliente (opcional)
                  </Label>
                  <Select
                    value={displayStop.clientId || "no-client"}
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

                {displayStop.clientId && addresses.length > 0 && (
                  <div className="space-y-2">
                    <SectionHeadingWithHint
                      noTitleWrap
                      title={<Label>Dirección del cliente</Label>}
                      hintLabel="Dirección desde catálogo"
                      hint={
                        isAddressLocked ? (
                          <>
                            Los campos de ubicación fiscal se precargan desde la dirección seleccionada. Elige
                            &quot;Ingresar manualmente&quot; para editarlos con libertad.
                          </>
                        ) : undefined
                      }
                    />
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
                  </div>
                )}

                {displayStop.clientId && addresses.length === 0 && (
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                    <SectionHeadingWithHint
                      noTitleWrap
                      className="min-w-0 flex-1"
                      title={<span className="font-medium">Sin direcciones en catálogo</span>}
                      hintLabel="Sin direcciones"
                      hint={
                        <>
                          Este cliente no tiene direcciones registradas. Captura la dirección manualmente en el bloque
                          de ubicación.
                        </>
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4 border-t border-border/60 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Domicilio fiscal, mapa y distancia
            </p>
            {useClientAddressPrefill ? (
              <Collapsible open={addressDetailsOpen} onOpenChange={setAddressDetailsOpen}>
                <div
                  className={cn(
                    "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                    STOP_NESTED_SURFACE,
                  )}
                >
                  <SectionHeadingWithHint
                    className="min-w-0 text-sm text-muted-foreground"
                    noTitleWrap
                    title={<span>Dirección precargada desde cliente</span>}
                    hintLabel="Detalle de la dirección"
                    hint={
                      <>
                        Amplía esta sección para revisar domicilio fiscal, mapa y distancia respecto a la parada
                        anterior.
                      </>
                    }
                  />
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-2 self-start"
                    >
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          addressDetailsOpen && "rotate-180",
                        )}
                      />
                      {addressDetailsOpen ? "Ocultar dirección" : "Consultar dirección"}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="space-y-4 pt-4">{entityAddressForm}</CollapsibleContent>
              </Collapsible>
            ) : (
              entityAddressForm
            )}
          </div>
          </StopDialogSection>

          <StopDialogSection step="03" title="Datos fiscales" icon={ScrollText} contentClassName="space-y-4">
            <div className={cn("flex flex-wrap items-center gap-2", STOP_NESTED_SURFACE)}>
              <User className="h-4 w-4 text-muted-foreground" />
              <SectionHeadingWithHint
                noTitleWrap
                title={<span className="font-medium text-sm">{primaryFiscalCopy.sectionTitle}</span>}
                hintLabel="Datos fiscales de la parada"
                hint={primaryFiscalCopy.sectionHint ?? undefined}
              />
            </div>

            {(showPublicGeneralWarningPrimary || showPublicGeneralWarningDelivery) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="min-w-0 flex-1">{publicGeneralRfcNotice()}</span>
                    {showPublicGeneralWarningPrimary && showPublicGeneralWarningDelivery ? (
                      <HintIcon label="Varios RFC público en general">
                        Aplica a uno o ambos RFC capturados en esta parada.
                      </HintIcon>
                    ) : null}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {isAddressLocked && (
              <div className={cn("flex items-center justify-between gap-3", STOP_NESTED_SURFACE)}>
                <SectionHeadingWithHint
                  className="min-w-0"
                  noTitleWrap
                  title={
                    <Label htmlFor="useAddressFiscalData" className="cursor-pointer">
                      Usar datos fiscales de la dirección seleccionada
                    </Label>
                  }
                  hintLabel="Herencia de RFC y nombre"
                  hint={
                    <>
                      Activo: RFC y razón social se heredan de la dirección del cliente. Desactiva esta opción para
                      capturar un remitente o destinatario distinto en esta parada.
                    </>
                  }
                />
                <Switch
                  id="useAddressFiscalData"
                  checked={useAddressFiscalData}
                  onCheckedChange={setUseAddressFiscalData}
                />
              </div>
            )}

            {displayStop.stopCategory !== "waypoint" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
                  <PartnerSnapshotPicker
                    disabled={isFiscalDataLocked}
                    variant="remitente"
                    onPartnerApplied={(p) => {
                      setValue("remitentePartnerId", p.id, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue("rfcRemitenteDestinatario", p.taxId, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue("nombreRemitenteDestinatario", p.legalName, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  />
                  <HintIcon label="Partner en catálogo">
                    Vincula un partner del catálogo para guardar su identificador y un snapshot fiscal en esta parada.
                  </HintIcon>
                </div>
                <div className="space-y-2">
                  <Label>{primaryFiscalCopy.rfcLabel}</Label>
                  <Controller
                    name="rfcRemitenteDestinatario"
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder={primaryFiscalCopy.rfcPlaceholder}
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
                  <Label>Nombre / razón social</Label>
                  <Controller
                    name="nombreRemitenteDestinatario"
                    control={control}
                    render={({ field }) => (
                      <Input
                        placeholder={primaryFiscalCopy.nombrePlaceholder}
                        disabled={isFiscalDataLocked}
                        {...field}
                      />
                    )}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {waypointHasPickup ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
                      <PartnerSnapshotPicker
                        disabled={isFiscalDataLocked}
                        variant="remitente"
                        onPartnerApplied={(p) => {
                          setValue("remitentePartnerId", p.id, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          setValue("rfcRemitenteDestinatario", p.taxId, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          setValue("nombreRemitenteDestinatario", p.legalName, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                      />
                      <HintIcon label="Partner en catálogo">
                        Vincula un partner del catálogo para guardar su identificador y un snapshot fiscal en esta
                        parada.
                      </HintIcon>
                    </div>
                    <div className="space-y-2">
                      <Label>{primaryFiscalCopy.rfcLabel}</Label>
                      <Controller
                        name="rfcRemitenteDestinatario"
                        control={control}
                        render={({ field }) => (
                          <Input
                            placeholder={primaryFiscalCopy.rfcPlaceholder}
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
                      <Label>Nombre / razón social</Label>
                      <Controller
                        name="nombreRemitenteDestinatario"
                        control={control}
                        render={({ field }) => (
                          <Input
                            placeholder={primaryFiscalCopy.nombrePlaceholder}
                            disabled={isFiscalDataLocked}
                            {...field}
                          />
                        )}
                      />
                    </div>
                  </div>
                ) : null}

                {waypointHasPickup && waypointHasDelivery ? <Separator /> : null}

                {waypointHasDelivery ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
                      <PartnerSnapshotPicker
                        disabled={waypointHasPickup ? false : isFiscalDataLocked}
                        variant="destinatario"
                        onPartnerApplied={(p) => {
                          if (waypointHasPickup) {
                            setValue("destinatarioPartnerId", p.id, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            setValue("deliveryRfcRemitenteDestinatario", p.taxId, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            setValue("deliveryNombreRemitenteDestinatario", p.legalName, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          } else {
                            setValue("remitentePartnerId", p.id, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            setValue("rfcRemitenteDestinatario", p.taxId, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            setValue("nombreRemitenteDestinatario", p.legalName, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          }
                        }}
                      />
                      <HintIcon label="Partner en catálogo">
                        Vincula un partner del catálogo para guardar su identificador y un snapshot fiscal en esta
                        parada.
                      </HintIcon>
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {waypointHasPickup ? deliveryFiscalCopy.rfcLabel : primaryFiscalCopy.rfcLabel}
                      </Label>
                      <Controller
                        name={
                          waypointHasPickup
                            ? "deliveryRfcRemitenteDestinatario"
                            : "rfcRemitenteDestinatario"
                        }
                        control={control}
                        render={({ field }) => (
                          <Input
                            placeholder={
                              waypointHasPickup
                                ? deliveryFiscalCopy.rfcPlaceholder
                                : primaryFiscalCopy.rfcPlaceholder
                            }
                            className="uppercase"
                            maxLength={13}
                            disabled={waypointHasPickup ? false : isFiscalDataLocked}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        {waypointHasPickup ? "Nombre / razón social (descarga)" : "Nombre / razón social"}
                      </Label>
                      <Controller
                        name={
                          waypointHasPickup
                            ? "deliveryNombreRemitenteDestinatario"
                            : "nombreRemitenteDestinatario"
                        }
                        control={control}
                        render={({ field }) => (
                          <Input
                            placeholder={
                              waypointHasPickup
                                ? deliveryFiscalCopy.nombrePlaceholder
                                : primaryFiscalCopy.nombrePlaceholder
                            }
                            disabled={waypointHasPickup ? false : isFiscalDataLocked}
                            {...field}
                          />
                        )}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </StopDialogSection>

          <StopDialogSection step="04" title="Contacto y planificación" icon={Phone} contentClassName="space-y-4">
            <SectionHeadingWithHint
              noTitleWrap
              title={<span className="text-sm font-medium text-foreground">Datos de contacto en sitio</span>}
              hintLabel="Contacto en sitio"
              hint={
                <>
                  Persona y teléfono en el punto de la parada para coordinación operativa (opcional salvo políticas
                  internas).
                </>
              }
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nombre contacto</Label>
                <Controller
                  name="contactName"
                  control={control}
                  render={({ field }) => (
                    <Input placeholder="Nombre del contacto en sitio" {...field} />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Controller
                  name="contactPhone"
                  control={control}
                  render={({ field }) => <Input placeholder="Teléfono" {...field} />}
                />
              </div>
            </div>

            <div className="space-y-2">
              <SectionHeadingWithHint
                noTitleWrap
                title={<Label>Notas / instrucciones</Label>}
                hintLabel="Notas operativas"
                hint={
                  <>
                    Horarios de recepción, acceso a instalaciones, referencias para el conductor u otras indicaciones
                    puntuales.
                  </>
                }
              />
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

          {displayStop.stopCategory !== "origin" ? (
              <div
                ref={estimatedArrivalSectionRef}
                className={cn(
                  "space-y-3 border-t border-border/60 pt-5",
                  sectionHighlightClass(
                    attemptedSubmitValidation,
                    highlightKeys,
                    "estimatedArrival",
                  ),
                )}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Tiempo en ruta
                </p>
                <SectionHeadingWithHint
                  noTitleWrap
                  title={
                    <Label>
                      {displayStop.stopCategory === "destination"
                        ? "Hora estimada de llegada"
                        : "Hora estimada en esta escala"}
                      {displayStop.stopCategory === "destination" && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>
                  }
                  hintLabel={
                    displayStop.stopCategory === "destination"
                      ? "Hora de llegada obligatoria"
                      : "Hora estimada opcional"
                  }
                  hint={
                    displayStop.stopCategory === "destination"
                      ? "Requerida para documentar correctamente la llegada del viaje."
                      : "Opcional. Si se omite, se estimará automáticamente durante la preparación fiscal."
                  }
                />
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
                {showWaypointArrivalWarning ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <SectionHeadingWithHint
                      noTitleWrap
                      title={<span className="font-medium">Sin hora capturada</span>}
                      hintLabel="Interpolación de hora"
                      hint={
                        <>
                          Sin hora estimada, el sistema interpolará este tiempo automáticamente. Conviene capturarla para
                          mayor precisión en documentación y seguimiento.
                        </>
                      }
                    />
                  </div>
                ) : null}
              </div>
          ) : null}
          </StopDialogSection>

        </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => handlePrimaryFooterAction()}>
              {mode === "edit" ? "Guardar Cambios" : "Agregar Parada"}
            </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
