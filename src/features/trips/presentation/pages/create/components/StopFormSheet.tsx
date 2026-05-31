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
  AlertCircle,
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
import { useUpdateClientAddress } from "@features/clients/application/hooks/useUpdateClientAddress";
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
import { validateTripStopInlineAddress } from "@shared/cfdi/addressPayloadBridge";
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
  { value: "pickup" as const, label: "Carga", icon: MapPin, color: "text-info" },
  {
    value: "delivery" as const,
    label: "Descarga",
    icon: MapPin,
    color: "text-warning",
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
  /** Se mantiene para compatibilidad pero ya no se renderiza. */
  step?: string;
  title: string;
  icon?: ComponentType<{ className?: string }>;
  headerExtra?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/**
 * Sección ligera: solo un título con icono y espacio debajo.
 * Menos pesado que cards anidadas — optimizado para formularios en diálogos.
 */
const StopDialogSection = forwardRef<HTMLElement, StopDialogSectionProps>(
  function StopDialogSection(
    { title, icon: Icon, headerExtra, children, className, contentClassName },
    ref,
  ) {
    return (
      <section ref={ref} className={cn("space-y-4", className)}>
        <header className="flex items-center gap-2">
          {Icon ? (
            <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          ) : null}
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {headerExtra ? <div className="ml-auto shrink-0">{headerExtra}</div> : null}
        </header>
        <div className={cn("space-y-4", contentClassName)}>{children}</div>
      </section>
    );
  },
);
StopDialogSection.displayName = "StopDialogSection";

/** Superficie anidada suave (sin borde grueso, solo fondo ligerísimo). */
const STOP_NESTED_SURFACE =
  "rounded-md bg-muted/30 px-3 py-2.5 dark:bg-muted/20";

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
  const [inlineSatError, setInlineSatError] = useState<string | null>(null);
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
  const writeBackAddressMutation = useUpdateClientAddress({ silent: true });
  const selectedAddress = selectedAddressFull ?? undefined;
  const eligibleAddresses = useMemo(
    () =>
      addresses.filter(
        (address) =>
          address.isCartaPorteReady !== false &&
          !address.geolocationPending &&
          address.latitude != null &&
          address.longitude != null,
      ),
    [addresses],
  );
  const ineligibleAddressCount = addresses.length - eligibleAddresses.length;

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
  const selectedIneligibleAddress = useMemo(
    () =>
      addresses.find(
        (address) =>
          address.id === displayStop.clientAddressId &&
          (address.geolocationPending ||
            address.latitude == null ||
            address.longitude == null),
      ),
    [addresses, displayStop.clientAddressId],
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
        setAddressDetailsOpen(false);
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

  const resetDialogUiState = useCallback(() => {
    setAttemptedSubmitValidation(false);
    setAddressDetailsOpen(false);
    setInlineSatError(null);
  }, []);

  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetDialogUiState();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetDialogUiState],
  );

  const closeDialog = useCallback(() => {
    resetDialogUiState();
    onOpenChange(false);
  }, [onOpenChange, resetDialogUiState]);

  const submitDialog = handleSubmit(async (values) => {
    const merged = mergeDialogWithClientCatalog(
      values,
      selectedAddress,
      useAddressFiscalData,
      clientFiscalFallback,
    );

    if (!stopHasUnifiedAddressId(merged)) {
      const sat = await validateTripStopInlineAddress(
        merged as unknown as Record<string, unknown>,
        { requireCoordinates: true },
      );
      if (!sat.ok) {
        setInlineSatError(
          sat.errors[0]?.message ??
            "Completa los campos SAT obligatorios para este código postal.",
        );
        setAttemptedSubmitValidation(true);
        return;
      }
    }
    setInlineSatError(null);

    const shouldWriteBackCoords =
      Boolean(merged.clientId) &&
      stopHasUnifiedAddressId(merged) &&
      merged.latitude != null &&
      merged.longitude != null &&
      (
        selectedAddress?.latitude == null ||
        selectedAddress?.longitude == null ||
        selectedAddress.latitude !== merged.latitude ||
        selectedAddress.longitude !== merged.longitude
      );

    if (shouldWriteBackCoords) {
      try {
        await writeBackAddressMutation.mutateAsync({
          clientId: merged.clientId as string,
          addressId: merged.addressId as string,
          data: {
            latitude: merged.latitude,
            longitude: merged.longitude,
          },
        });
      } catch {
        // No bloquear la captura de la parada si falla el write-back.
      }
    }

    onSubmit(merged);
    closeDialog();
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

  const validationActive =
    attemptedSubmitValidation && missingRequiredFields.length > 0;

  const handlePrimaryFooterAction = useCallback(() => {
    const missing = getMissingRequiredFields();
    if (missing.length > 0) {
      setAttemptedSubmitValidation(true);
      const keys = missingMessagesToHighlightKeys(missing);
      if (
        useClientAddressPrefill &&
        (keys.has("addressSat") ||
          keys.has("geolocation") ||
          keys.has("distance"))
      ) {
        setAddressDetailsOpen(true);
      }
      return;
    }
    setAttemptedSubmitValidation(false);
    void submitDialog();
  }, [getMissingRequiredFields, submitDialog, useClientAddressPrefill]);

  useEffect(() => {
    if (!validationActive) return;
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
  }, [validationActive, missingRequiredFields, highlightKeys, sectionRefs]);

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
    validationActive,
    highlightKeys,
    "addressSat",
  );
  const geoDistanceHighlightClass = cn(
    sectionHighlightClass(validationActive, highlightKeys, "geolocation"),
    sectionHighlightClass(validationActive, highlightKeys, "distance"),
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
          title: "Nombre del lugar",
          content: (
            <div className="space-y-1.5">
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
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-8">
              {mode === "edit" ? "Editar parada" : "Agregar parada"}
            </DialogTitle>
            <DialogDescription>
              Ubicación, operaciones y datos fiscales de la parada.
            </DialogDescription>
          </DialogHeader>
          <div className="divide-y divide-border/50 [&>*]:pt-5 [&>*:first-child]:pt-0">
          {validationActive ? (
            <Alert ref={validationAlertRef} variant="destructive" aria-live="polite">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Faltan datos obligatorios</p>
                <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-sm">
                  {missingRequiredFields.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}
          {inlineSatError ? (
            <Alert variant="destructive" aria-live="polite">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{inlineSatError}</AlertDescription>
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
              "flex items-center gap-3 rounded-md px-3 py-2.5",
              displayStop.stopCategory === "origin" &&
                "bg-success-soft/60",
              displayStop.stopCategory === "waypoint" &&
                "bg-muted/40",
              displayStop.stopCategory === "destination" &&
                "bg-destructive-soft/60",
              sectionHighlightClass(
                validationActive,
                highlightKeys,
                "stopCategory",
              ),
            )}
          >
              {displayStop.stopCategory === "origin" && (
                <>
                  <Navigation className="h-5 w-5 shrink-0 text-success" />
                  <div>
                    <p className="text-sm font-medium">Parada de origen</p>
                    <p className="text-xs text-muted-foreground">Solo carga de mercancía</p>
                  </div>
                </>
              )}
              {displayStop.stopCategory === "waypoint" && (
                <>
                  <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Escala intermedia</p>
                    <p className="text-xs text-muted-foreground">Carga, descarga o ambas</p>
                  </div>
                </>
              )}
              {displayStop.stopCategory === "destination" && (
                <>
                  <Flag className="h-5 w-5 shrink-0 text-destructive" />
                  <div>
                    <p className="text-sm font-medium">Parada de destino</p>
                    <p className="text-xs text-muted-foreground">Solo descarga de mercancía</p>
                  </div>
                </>
              )}
          </div>

          {displayStop.stopCategory === "waypoint" && (
            <div
              ref={waypointOperationsSectionRef}
              className={cn(
                "space-y-2",
                sectionHighlightClass(
                  validationActive,
                  highlightKeys,
                  "waypointOperations",
                ),
              )}
            >
              <Label className="text-sm">Operaciones en esta parada *</Label>
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
              <Label htmlFor="useClientAddressPrefill" className="cursor-pointer text-sm">
                Precargar dirección desde cliente
              </Label>
              <Switch
                id="useClientAddressPrefill"
                checked={useClientAddressPrefill}
                onCheckedChange={handleClientAddressPrefillToggle}
              />
            </div>

            {useClientAddressPrefill && (
              <div className={cn("space-y-3", STOP_NESTED_SURFACE)}>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Cliente y domicilio
                </p>

                <div className="space-y-1.5">
                  <Label>Cliente</Label>
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

                {displayStop.clientId && eligibleAddresses.length > 0 && (
                  <div className="space-y-1.5">
                    <Label>Dirección del cliente</Label>
                    <Select
                      value={displayStop.clientAddressId || "manual-entry"}
                      onValueChange={handleAddressSelect}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar dirección..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual-entry">Ingresar manualmente</SelectItem>
                        {selectedIneligibleAddress ? (
                          <SelectItem value={selectedIneligibleAddress.id}>
                            {selectedIneligibleAddress.locationName || "Dirección seleccionada"} ·
                            Geo pendiente
                          </SelectItem>
                        ) : null}
                        {eligibleAddresses.map((address) => (
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
                    {ineligibleAddressCount > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {ineligibleAddressCount} dirección(es) ocultas por geolocalización
                        pendiente.
                      </p>
                    ) : null}
                  </div>
                )}

                {displayStop.clientId && eligibleAddresses.length === 0 && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Sin direcciones elegibles (geo completa) — captura manualmente.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {useClientAddressPrefill ? (
              <Collapsible open={addressDetailsOpen} onOpenChange={setAddressDetailsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between gap-2 text-muted-foreground"
                  >
                    <span className="text-xs">Domicilio, mapa y distancia</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        addressDetailsOpen && "rotate-180",
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-3">{entityAddressForm}</CollapsibleContent>
              </Collapsible>
            ) : (
              entityAddressForm
            )}
          </div>
          </StopDialogSection>

          <StopDialogSection step="03" title="Datos fiscales" icon={ScrollText} contentClassName="space-y-4">
            <p className="text-xs text-muted-foreground">
              {primaryFiscalCopy.sectionHint ?? primaryFiscalCopy.sectionTitle}
            </p>

            {(showPublicGeneralWarningPrimary || showPublicGeneralWarningDelivery) && (
              <p className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{publicGeneralRfcNotice()}</span>
              </p>
            )}

            {isAddressLocked && (
              <div className={cn("flex items-center justify-between gap-3", STOP_NESTED_SURFACE)}>
                <Label htmlFor="useAddressFiscalData" className="cursor-pointer text-sm">
                  Usar datos fiscales de la dirección
                </Label>
                <Switch
                  id="useAddressFiscalData"
                  checked={useAddressFiscalData}
                  onCheckedChange={setUseAddressFiscalData}
                />
              </div>
            )}

            {displayStop.stopCategory !== "waypoint" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
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
                    <div className="sm:col-span-2">
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
                    <div className="sm:col-span-2">
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

            <div className="space-y-1.5">
              <Label>Notas / instrucciones</Label>
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
                  "space-y-2",
                  sectionHighlightClass(
                    validationActive,
                    highlightKeys,
                    "estimatedArrival",
                  ),
                )}
              >
                <Label>
                  {displayStop.stopCategory === "destination"
                    ? "Hora estimada de llegada"
                    : "Hora estimada en esta escala"}
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
                {showWaypointArrivalWarning ? (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
                    Se interpolará automáticamente si no se captura.
                  </p>
                ) : null}
              </div>
          ) : null}
          </StopDialogSection>

        </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => closeDialog()}>
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
