/**
 * StopFormSheet - Sheet lateral para agregar/editar paradas
 * Clean Architecture - Presentation Layer
 *
 * Fase C: ubicación capturada con `AddressInput` + validación `tripStopSchema` / paquete SAT
 * y mapeo a `TripStopFormValues` del wizard.
 *
 * Patrón UI: Sheet lateral derecho con secciones en `FormSectionCard` (alineado con
 * `ClientAddressForm` / `EmployeeFormInner`). Reemplaza al antiguo `StopFormDialog`,
 * que estaba acotado por el tamaño máximo de un Dialog.
 *
 * Ubicación: src/features/trips/presentation/pages/create/components/StopFormSheet.tsx
 */

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Switch } from "@shared/ui/switch";
import {
  AddressGeocodingSectionContent,
  AddressGeocodingSectionTitle,
  EntityAddressForm,
  GEOCODING_SECTION_ID,
  resolveGeolocationPanelMode,
  type EntityAddressFormSection,
} from "@shared/ui/address-input";
import { ADDRESS_FORM_COPY } from "@shared/ui/address-input/addressFormCopy";
import {
  MapPin,
  AlertCircle,
  Building2,
  Phone,
  ScrollText,
  ChevronDown,
} from "lucide-react";
import {
  FormFieldShell,
  FormValidationSummary,
  RHFTextField,
  RHFTextareaField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { DetailAlertCard } from "@shared/ui/data-display/DetailAlertCard";
import { StopFormSheetCategorySection, StopFormSheetAddressOriginSection } from "./stop-form";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { cn } from "@shared/lib/utils/cn";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import AddressInput from "@shared/ui/address-input/AddressInput";
import { useToast } from "@shared/hooks";

import { useActiveClients } from "@features/clients/application/hooks/useClients";
import { useClientAddress } from "@features/clients/application/hooks/useClientAddresses";
import { useUpdateClientAddress } from "@features/clients/application/hooks/useUpdateClientAddress";
import type {
  AddressSearchListItem,
  SearchableOwnerType,
} from "@shared/ui/address-picker/types";

import type { TripStopFormValues } from "./validation";
import { stopHasUnifiedAddressId } from "./validation";
import {
  type StopFormData,
  type StopDialogFormValues,
  type StopAddressPrefillRef,
  getEmptyStopDialogValues,
  tripStopToDialogValues,
  mergeDialogWithClientCatalog,
  resolveRemitenteFiscalFromClientAddress,
  addressSearchItemToDialogSlice,
  applyAddressPickerClearSlice,
  buildStopPrefillRefFromSearchItem,
  clientAddressCatalogHydrationSlice,
  shouldShowPrefillMissingGeolocationNotice,
} from "./stopDialogAddressMapper";
import {
  detachStopFromClientCatalog,
  resolveClientAddressFormContextForCatalog,
  stopDialogDiffersFromClientCatalog,
  stopDialogToClientAddressFormData,
  stopDialogToClientAddressUpdateDto,
} from "./stopClientAddressWriteBack";
import { validateClientAddressFormComplete } from "@features/clients/presentation/validation/clientAddressSchema";
import {
  getTripStopFiscalMissingLabels,
  validateTripStopAddressComplete,
} from "../validation/tripStopAddressValidation";
import { LOCATION_CAPTURE_LABELS } from "./wizardCopy";
import { wizardCopy } from "../../../copy";

const stopForm = wizardCopy.route.stopForm;
import {
  RFC_PUBLICO_GENERAL,
  getDeliveryFiscalCopy,
  getPrimaryFiscalSectionCopy,
  publicGeneralRfcNotice,
  resolveStopFiscalUiContext,
  type CfdiDocumentIntent,
} from "./stopDialogFiscalCopy";
import { PartnerSnapshotPicker } from "@features/partners";
// Separator removed — escala mixta usa bloques separados en el desplegable

export type {
  StopCategory,
  StopFormData,
  StopDialogFormValues,
} from "./stopDialogAddressMapper";

// ============================================================================
// TYPES
// ============================================================================

export interface StopFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: StopFormData) => void;
  initialData?: StopFormData;
  mode?: "create" | "edit";
  /** Intención CFDI elegida en el paso 1 — orienta copy de esta parada. */
  cfdiDocumentIntent?: CfdiDocumentIntent;
  /** Cliente contratante del viaje (paso 1) — fallback fiscal cuando la precarga no es de ese cliente. */
  tripContractingClientId?: string;
  /** Sucursal de origen operativa del viaje — aviso si difiere de la sucursal precargada. */
  originBranchId?: string;
}

const STOP_OPERATION_OPTIONS = [
  { value: "pickup" as const, label: stopForm.operation.pickup, icon: MapPin, color: "text-info" },
  {
    value: "delivery" as const,
    label: stopForm.operation.delivery,
    icon: MapPin,
    color: "text-warning",
  },
];

/**
 * Mapea cada label de campo faltante al nombre del campo RHF correspondiente
 * (cuando aplique). Devuelve `null` para mensajes sin control 1:1 (categorías,
 * operaciones, dirección SAT, geolocalización, distancia); esos siguen apareciendo
 * en el `FormValidationSummary` al final del formulario.
 */
function missingLabelToFieldName(
  missing: string,
): keyof StopDialogFormValues | null {
  switch (missing) {
    case stopForm.label.locationName:
      return "locationName";
    case LOCATION_CAPTURE_LABELS.country:
      return "satCountryCode";
    case LOCATION_CAPTURE_LABELS.state:
      return "satStateCode";
    case LOCATION_CAPTURE_LABELS.postalCode:
      return "postalCode";
    case stopForm.validation.geolocation:
      // En el contexto `trip_stop` (SoT: matriz-reglas-cp31-por-capas.md) lat/lng son
      // obligatorias; `AddressInput` ya muestra error inline en ambos campos cuando
      // `profileUx.requireCoordinates` es true. Aquí mapeamos a `latitude`; el handler
      // también setea error en `longitude` para resaltar ambos controles.
      return "latitude";
    case stopForm.validation.estimatedArrival:
      return "estimatedArrival";
    case "RFC remitente/destinatario":
      return "rfcRemitenteDestinatario";
    case "Nombre remitente/destinatario":
      return "nombreRemitenteDestinatario";
    case "RFC destinatario (descarga)":
      return "deliveryRfcRemitenteDestinatario";
    case "Nombre destinatario (descarga)":
      return "deliveryNombreRemitenteDestinatario";
    default:
      return null;
  }
}

/** Lista cerrada de campos RHF que `handlePrimaryFooterAction` administra al marcar
 * errores. Se limpian primero para evitar mensajes obsoletos en re-submits. */
const STOP_MANAGED_FIELD_ERRORS: readonly (keyof StopDialogFormValues)[] = [
  "locationName",
  "satCountryCode",
  "satStateCode",
  "postalCode",
  "latitude",
  "longitude",
  "estimatedArrival",
  "rfcRemitenteDestinatario",
  "nombreRemitenteDestinatario",
  "deliveryRfcRemitenteDestinatario",
  "deliveryNombreRemitenteDestinatario",
];

// ============================================================================
// COMPONENT
// ============================================================================

export function StopFormSheet({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = "create",
  cfdiDocumentIntent = "ingreso",
  tripContractingClientId,
  originBranchId,
}: StopFormSheetProps) {
  const [attemptedSubmitValidation, setAttemptedSubmitValidation] = useState(false);
  const validationAlertRef = useRef<HTMLDivElement | null>(null);
  const [useAddressFiscalData, setUseAddressFiscalData] = useState(true);
  const [selectedPrefillItem, setSelectedPrefillItem] =
    useState<AddressSearchListItem | null>(null);
  const [prefillCatalogRef, setPrefillCatalogRef] =
    useState<StopAddressPrefillRef | null>(null);
  const [inlineSatError, setInlineSatError] = useState<string | null>(null);
  const [clientAddressPersistDialogOpen, setClientAddressPersistDialogOpen] =
    useState(false);
  const [pendingStopSubmit, setPendingStopSubmit] = useState<{
    merged: StopFormData;
    formValues: StopDialogFormValues;
  } | null>(null);
  const [isPersistingClientAddress, setIsPersistingClientAddress] = useState(false);
  const { toast } = useToast();
  const hasInitializedFiscalModeRef = useRef(false);
  const wasDialogOpenRef = useRef(false);
  const lastSyncedCatalogIdRef = useRef<string | null>(null);

  const form = useForm<StopDialogFormValues>({
    defaultValues: getEmptyStopDialogValues(),
    mode: "onChange",
  });

  const { control, reset, setValue, getValues, handleSubmit, setError, clearErrors } =
    form;

  const clientId = useWatch({ control, name: "clientId" }) ?? "";
  const clientAddressId = useWatch({ control, name: "clientAddressId" }) ?? "";

  const catalogClientId =
    prefillCatalogRef?.ownerType === "client"
      ? prefillCatalogRef.ownerId
      : clientAddressId
        ? clientId
        : "";
  const catalogAddressId =
    prefillCatalogRef?.ownerType === "client"
      ? prefillCatalogRef.catalogAddressId
      : clientAddressId;

  const { data: clients = [] } = useActiveClients();
  const { data: selectedAddressFull } = useClientAddress(
    catalogClientId,
    catalogAddressId,
  );
  const writeBackAddressMutation = useUpdateClientAddress();
  const selectedAddress = selectedAddressFull ?? undefined;

  const clientFiscalFallback = useMemo(() => {
    const resolveClient = (id: string) => {
      const c = clients.find((item) => item.id === id);
      if (!c) return null;
      return { taxId: c.taxId, legalName: c.legalName };
    };

    if (prefillCatalogRef?.ownerId) {
      return resolveClient(prefillCatalogRef.ownerId);
    }
    if (clientId) {
      return resolveClient(clientId);
    }
    if (tripContractingClientId && tripContractingClientId !== "no-client") {
      return resolveClient(tripContractingClientId);
    }
    return null;
  }, [clientId, clients, prefillCatalogRef?.ownerId, tripContractingClientId]);

  const stopCategory =
    useWatch({ control, name: "stopCategory" }) ??
    initialData?.stopCategory;

  const defaultOwnerTypes = useMemo((): SearchableOwnerType[] => {
    if (stopCategory === "origin") {
      return ["client", "branch", "tenant"];
    }
    return ["client", "tenant"];
  }, [stopCategory]);

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
      setSelectedPrefillItem(null);
      setPrefillCatalogRef(null);
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
      !catalogAddressId ||
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
    catalogAddressId,
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
    if (!useAddressFiscalData || !catalogAddressId || !selectedAddress) {
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
    catalogAddressId,
    clientFiscalFallback,
    mode,
    selectedAddress,
    setValue,
    useAddressFiscalData,
  ]);

  // Detalle de catálogo tras picker (ADR-0053): localidad, interior, contacto, etc.
  useEffect(() => {
    if (
      !catalogAddressId ||
      !selectedAddress ||
      !prefillCatalogRef ||
      prefillCatalogRef.ownerType !== "client"
    ) {
      if (!clientAddressId || !selectedAddress) {
        lastSyncedCatalogIdRef.current = null;
      }
      return;
    }
    if (lastSyncedCatalogIdRef.current === selectedAddress.id) return;
    lastSyncedCatalogIdRef.current = selectedAddress.id;

    const hydration = clientAddressCatalogHydrationSlice(selectedAddress);
    (Object.keys(hydration) as (keyof typeof hydration)[]).forEach((key) => {
      const val = hydration[key];
      if (val !== undefined) {
        setValue(key, val as never, { shouldValidate: true });
      }
    });
  }, [catalogAddressId, clientAddressId, prefillCatalogRef, selectedAddress, setValue]);

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
        selectedPrefillItem ? prefillCatalogRef : null,
      ),
    [
      clientFiscalFallback,
      prefillCatalogRef,
      selectedPrefillItem,
      watched,
      selectedAddress,
      useAddressFiscalData,
    ],
  );

  const applyDialogSlice = useCallback(
    (slice: Partial<StopDialogFormValues>) => {
      (Object.keys(slice) as (keyof typeof slice)[]).forEach((key) => {
        const val = slice[key];
        if (val !== undefined) {
          setValue(key, val as never, { shouldDirty: true, shouldValidate: true });
        }
      });
    },
    [setValue],
  );

  const handlePrefillSelect = useCallback(
    (item: AddressSearchListItem) => {
      hasInitializedFiscalModeRef.current = false;
      lastSyncedCatalogIdRef.current = null;
      setSelectedPrefillItem(item);
      setPrefillCatalogRef(buildStopPrefillRefFromSearchItem(item));
      applyDialogSlice(addressSearchItemToDialogSlice(item));
      setUseAddressFiscalData(item.ownerType === "client");

      if (item.ownerType === "branch" && getValues("stopCategory") === "origin") {
        const currentTypes = getValues("stopType") || [];
        if (!currentTypes.includes("pickup")) {
          setValue("stopType", [...currentTypes, "pickup"], {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      }
    },
    [applyDialogSlice, getValues, setValue],
  );

  const handlePrefillClear = useCallback(() => {
    setSelectedPrefillItem(null);
    setPrefillCatalogRef(null);
    hasInitializedFiscalModeRef.current = false;
    lastSyncedCatalogIdRef.current = null;
    setUseAddressFiscalData(false);
    applyDialogSlice(applyAddressPickerClearSlice());
  }, [applyDialogSlice]);

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

  const applyStopFieldErrors = useCallback(
    (fieldErrors: Record<string, string>) => {
      for (const [key, message] of Object.entries(fieldErrors)) {
        setError(key as keyof StopDialogFormValues, {
          type: "manual",
          message,
        });
      }
    },
    [setError],
  );

  const completeStopSubmit = useCallback(
    (payload: StopFormData) => {
      onSubmit(payload);
      closeDialog();
    },
    [closeDialog, onSubmit],
  );

  const submitDialog = handleSubmit(async (values) => {
    const merged = mergeDialogWithClientCatalog(
      values,
      selectedAddress,
      useAddressFiscalData,
      clientFiscalFallback,
      selectedPrefillItem ? prefillCatalogRef : null,
    );

    const validation = await validateTripStopAddressComplete(
      merged as unknown as Record<string, unknown>,
      { requireCoordinates: true },
    );
    if (!validation.ok) {
      applyStopFieldErrors(validation.fieldErrors);
      const satKeys = [
        "satCountryCode",
        "satStateCode",
        "satMunicipalityCode",
        "postalCode",
        "latitude",
        "longitude",
      ];
      const hasSatFieldError = satKeys.some((k) => validation.fieldErrors[k]);
      setInlineSatError(
        hasSatFieldError
          ? (validation.errors[0]?.message ??
              stopForm.validation.satFieldsFallback)
          : null,
      );
      setAttemptedSubmitValidation(true);
      return;
    }
    setInlineSatError(null);

    const shouldAskSnapshotPersistChoice =
      prefillCatalogRef != null &&
      selectedAddress != null &&
      stopDialogDiffersFromClientCatalog(values, selectedAddress);

    const shouldAskLegacyPersistChoice =
      prefillCatalogRef == null &&
      selectedPrefillItem == null &&
      Boolean(merged.clientId) &&
      stopHasUnifiedAddressId(merged) &&
      selectedAddress != null &&
      stopDialogDiffersFromClientCatalog(values, selectedAddress);

    if (shouldAskSnapshotPersistChoice || shouldAskLegacyPersistChoice) {
      setPendingStopSubmit({ merged, formValues: values });
      setClientAddressPersistDialogOpen(true);
      return;
    }

    completeStopSubmit(merged);
  });

  const resetClientAddressPersistDialog = useCallback(() => {
    setClientAddressPersistDialogOpen(false);
    setPendingStopSubmit(null);
    setIsPersistingClientAddress(false);
  }, []);

  const handlePersistClientAddress = useCallback(async () => {
    if (!pendingStopSubmit) return;
    const persistClientId =
      prefillCatalogRef?.ownerId ?? pendingStopSubmit.merged.clientId;
    if (!persistClientId || !selectedAddress) return;

    setIsPersistingClientAddress(true);
    try {
      const formData = stopDialogToClientAddressFormData(
        pendingStopSubmit.formValues,
        selectedAddress,
      );
      const clientValidation = await validateClientAddressFormComplete(formData, {
        context: resolveClientAddressFormContextForCatalog(selectedAddress),
        intent: "update",
        requireCoordinates: false,
      });
      if (!clientValidation.ok) {
        applyStopFieldErrors(clientValidation.fieldErrors);
        setAttemptedSubmitValidation(true);
        resetClientAddressPersistDialog();
        toast({
          title: stopForm.toast.persistFailedTitle,
          description: stopForm.toast.persistFailedBody,
          variant: "destructive",
        });
        return;
      }

      await writeBackAddressMutation.mutateAsync({
        clientId: persistClientId,
        addressId: selectedAddress.id,
        data: stopDialogToClientAddressUpdateDto(
          pendingStopSubmit.formValues,
          selectedAddress,
        ),
      });

      completeStopSubmit(pendingStopSubmit.merged);
      resetClientAddressPersistDialog();
    } catch {
      toast({
        title: stopForm.toast.persistErrorTitle,
        description: stopForm.toast.persistErrorBody,
        variant: "destructive",
      });
      resetClientAddressPersistDialog();
    }
  }, [
    applyStopFieldErrors,
    completeStopSubmit,
    pendingStopSubmit,
    prefillCatalogRef?.ownerId,
    resetClientAddressPersistDialog,
    selectedAddress,
    toast,
    writeBackAddressMutation,
  ]);

  const handleUseAddressForStopOnly = useCallback(() => {
    if (!pendingStopSubmit) return;
    completeStopSubmit(detachStopFromClientCatalog(pendingStopSubmit.merged));
    resetClientAddressPersistDialog();
  }, [completeStopSubmit, pendingStopSubmit, resetClientAddressPersistDialog]);

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
      missing.push(stopForm.validation.missingField);
      return missing;
    }

    if (d.stopCategory === "waypoint" && (!d.stopType || d.stopType.length === 0)) {
      missing.push(stopForm.validation.waypointOperation);
    }

    if (!stopHasUnifiedAddressId(d)) {
      if (!d.locationName?.trim()) missing.push(stopForm.label.locationName);
      if (!d.satCountryCode?.trim()) missing.push(LOCATION_CAPTURE_LABELS.country);
      if (!d.satStateCode?.trim()) missing.push(LOCATION_CAPTURE_LABELS.state);
      if (!/^\d{5}$/.test(d.postalCode?.trim() ?? "")) {
        missing.push(LOCATION_CAPTURE_LABELS.postalCode);
      }
    }

    if (d.stopCategory === "destination" && !d.estimatedArrival) {
      missing.push(stopForm.validation.estimatedArrival);
    }

    if (d.latitude == null || d.longitude == null) {
      missing.push(stopForm.validation.geolocation);
    }

    missing.push(...getTripStopFiscalMissingLabels(d));

    return missing;
  }, [displayStop]);

  const missingRequiredFields = useMemo(
    () => getMissingRequiredFields(),
    [getMissingRequiredFields],
  );

  const validationActive =
    attemptedSubmitValidation && missingRequiredFields.length > 0;

  const handlePrimaryFooterAction = useCallback(() => {
    clearErrors(STOP_MANAGED_FIELD_ERRORS as unknown as Parameters<typeof clearErrors>[0]);

    const missing = getMissingRequiredFields();
    if (missing.length > 0) {
      setAttemptedSubmitValidation(true);
      for (const label of missing) {
        const fieldName = missingLabelToFieldName(label);
        if (!fieldName) continue;
        setError(fieldName, { type: "manual", message: stopForm.validation.fieldRequired(label) });
      }
      if (missing.includes(stopForm.validation.geolocation)) {
        setError("longitude", {
          type: "manual",
          message: stopForm.validation.fieldRequired(stopForm.validation.geolocation),
        });
      }
      return;
    }
    setAttemptedSubmitValidation(false);
    void submitDialog();
  }, [
    clearErrors,
    getMissingRequiredFields,
    setError,
    submitDialog,
  ]);

  useEffect(() => {
    if (!validationActive && !inlineSatError) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        validationAlertRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
    });
    return () => cancelAnimationFrame(id);
  }, [validationActive, inlineSatError]);

  const showWaypointArrivalWarning =
    displayStop.stopCategory === "waypoint" && !displayStop.estimatedArrival;

  const hasAddressPrefill =
    selectedPrefillItem != null ||
    prefillCatalogRef != null ||
    Boolean(displayStop.clientAddressId);
  /** Solo datos fiscales opcionales desde catálogo; domicilio y geo siempre editables con prefill. */
  const isFiscalDataLocked =
    ((prefillCatalogRef?.ownerType === "client" ||
      Boolean(displayStop.clientAddressId)) &&
      useAddressFiscalData);
  const showMissingGeolocationNotice = shouldShowPrefillMissingGeolocationNotice({
    hasAddressPrefill,
    latitude: displayStop.latitude,
    longitude: displayStop.longitude,
  });

  const isBranchOriginPrefill =
    selectedPrefillItem?.ownerType === "branch" &&
    displayStop.stopCategory === "origin";
  const showBranchOriginMismatch =
    isBranchOriginPrefill &&
    Boolean(originBranchId?.trim()) &&
    selectedPrefillItem?.ownerId !== originBranchId?.trim();
  const geolocationPanelMode = resolveGeolocationPanelMode({
    isOriginStop:
      displayStop.stopCategory === "origin" ||
      Boolean(displayStop.stopType?.includes("origin")),
  });

  const fiscalUiContext = useMemo(
    () =>
      resolveStopFiscalUiContext(
        displayStop.stopCategory,
        displayStop.stopType as import("@features/trips/domain").StopTypeValue[],
      ),
    [displayStop.stopCategory, displayStop.stopType],
  );

  const sheetTitle = useMemo(() => {
    const cat = displayStop.stopCategory;
    if (cat === "origin") {
      return mode === "edit" ? stopForm.title.originEdit : stopForm.title.originCreate;
    }
    if (cat === "destination") {
      return mode === "edit"
        ? stopForm.title.destinationEdit
        : stopForm.title.destinationCreate;
    }
    if (cat === "waypoint") {
      return mode === "edit"
        ? stopForm.title.waypointEdit
        : stopForm.title.waypointCreate;
    }
    return mode === "edit" ? stopForm.title.edit : stopForm.title.create;
  }, [displayStop.stopCategory, mode]);

  const sheetDescription = useMemo(() => {
    const cat = displayStop.stopCategory;
    if (cat === "origin") return stopForm.description.origin;
    if (cat === "destination") return stopForm.description.destination;
    if (cat === "waypoint") return stopForm.description.waypoint;
    return stopForm.description.fallback;
  }, [displayStop.stopCategory]);

  const counterpartySectionTitle = useMemo(() => {
    switch (fiscalUiContext) {
      case "origin":
        return stopForm.section.counterparty.origin;
      case "destination":
        return stopForm.section.counterparty.destination;
      case "waypoint_pickup_only":
        return stopForm.section.counterparty.waypointPickup;
      case "waypoint_delivery_only":
        return stopForm.section.counterparty.waypointDelivery;
      case "waypoint_pickup_and_delivery":
        return stopForm.section.counterparty.waypointBoth;
      default:
        return stopForm.section.counterparty.fallback;
    }
  }, [fiscalUiContext]);

  const fiscalMissingLabels = useMemo(
    () => getTripStopFiscalMissingLabels(displayStop),
    [displayStop],
  );

  const [billingOpen, setBillingOpen] = useState(false);

  useEffect(() => {
    if (fiscalMissingLabels.length > 0 || validationActive) {
      setBillingOpen(true);
    }
  }, [fiscalMissingLabels.length, validationActive]);

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

  const addressInputVariant = "carta-porte" as const;

  const preAddressSections: EntityAddressFormSection[] = [
    {
      id: "stop-location-context",
      title: stopForm.section.locationName,
      icon: <MapPin className="h-4 w-4" />,
      content: (
        <Controller
          name="locationName"
          control={control}
          render={({ field, fieldState }) => {
            const fieldId = "stop-locationName";
            const errorMessage = fieldState.error?.message;
            return (
              <FormFieldShell
                fieldId={fieldId}
                label={stopForm.label.locationName}
                required
                errorMessage={errorMessage}
              >
                <Input
                  id={fieldId}
                  placeholder={stopForm.placeholder.locationName}
                  error={Boolean(fieldState.error)}
                  {...field}
                  value={field.value ?? ""}
                  {...getFieldErrorAriaProps(fieldId, errorMessage)}
                />
              </FormFieldShell>
            );
          }}
        />
      ),
    },
  ];

  const postAddressSections: EntityAddressFormSection[] = [
    {
      id: GEOCODING_SECTION_ID,
      title: <AddressGeocodingSectionTitle required />,
      icon: <MapPin className="h-4 w-4" />,
      contentClassName: "space-y-4",
      content: (
        <AddressGeocodingSectionContent
          required
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
          panelMode={geolocationPanelMode}
        />
      ),
    },
  ];

  const entityAddressForm = (
    <EntityAddressForm
      asForm={false}
      className="space-y-4"
      formContext="tripStop"
      addressVariant={addressInputVariant}
      infoMessage={ADDRESS_FORM_COPY.tripStop.globalInfoMessage}
      satStateCode={noticeSatStateCode}
      satMunicipalityCode={noticeSatMunicipalityCode}
      postalCode={noticePostalCode}
      showGlobalNotice={!hasAddressPrefill}
      locationSectionTitle={stopForm.section.domicile}
      preAddressSections={preAddressSections}
      addressInputSection={
        <AddressInput<StopDialogFormValues>
          variant={addressInputVariant}
          formContext="tripStop"
          control={control}
          setValue={setValue}
          namePrefix=""
          layout="compact"
          hideInformativeAlerts={hasAddressPrefill}
        />
      }
      postAddressSections={postAddressSections}
    />
  );

  return (
    <>
    <Sheet open={open} onOpenChange={handleDialogOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="shrink-0 space-y-1 border-b px-6 py-4">
          <SheetTitle className="pr-8">{sheetTitle}</SheetTitle>
          <SheetDescription>{sheetDescription}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          <StopFormSheetCategorySection
            displayStop={displayStop}
            getAvailableOperations={getAvailableOperations}
            onOperationToggle={handleOperationToggle}
          />

          <p className="text-sm font-semibold text-foreground">
            {stopForm.section.location}
          </p>

          <StopFormSheetAddressOriginSection
            selectedPrefill={selectedPrefillItem}
            onPrefillSelect={handlePrefillSelect}
            onPrefillClear={handlePrefillClear}
            defaultOwnerTypes={defaultOwnerTypes}
          />

          {isBranchOriginPrefill ? (
            <DetailAlertCard
              severity="info"
              icon={<Building2 className="h-4 w-4" />}
              title={stopForm.alert.branchCrossDockTitle}
              items={[{ text: stopForm.alert.branchCrossDockBody }]}
            />
          ) : null}

          {showBranchOriginMismatch ? (
            <DetailAlertCard
              severity="warning"
              icon={<AlertCircle className="h-4 w-4" />}
              title={stopForm.alert.branchOriginMismatchTitle}
              items={[{ text: stopForm.alert.branchOriginMismatch }]}
            />
          ) : null}

          {showMissingGeolocationNotice ? (
            <Alert variant="warning">
              <AlertTitle>{stopForm.alert.missingGeolocationTitle}</AlertTitle>
              <AlertDescription>
                {stopForm.alert.missingGeolocationBody}
              </AlertDescription>
            </Alert>
          ) : null}

          {entityAddressForm}

          <FormSectionCard
            title={counterpartySectionTitle}
            icon={<ScrollText className="h-4 w-4" />}
            contentClassName="space-y-4"
          >
            <p className="text-xs text-muted-foreground">
              {primaryFiscalCopy.sectionHint || primaryFiscalCopy.sectionTitle}
            </p>

            {(showPublicGeneralWarningPrimary || showPublicGeneralWarningDelivery) && (
              <p className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{publicGeneralRfcNotice()}</span>
              </p>
            )}

            {hasAddressPrefill && (
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="useAddressFiscalData" className="cursor-pointer text-sm">
                  {stopForm.label.useAddressFiscalData}
                </Label>
                <Switch
                  id="useAddressFiscalData"
                  checked={useAddressFiscalData}
                  onCheckedChange={setUseAddressFiscalData}
                />
              </div>
            )}

            {displayStop.stopCategory !== "waypoint" ? (
              <div className="space-y-4">
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
                <Collapsible open={billingOpen} onOpenChange={setBillingOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto w-full justify-between px-0 text-sm font-medium"
                    >
                      {stopForm.section.billingDetails}
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          billingOpen && "rotate-180",
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Controller
                        name="rfcRemitenteDestinatario"
                        control={control}
                        render={({ field, fieldState }) => {
                          const fieldId = "stop-rfcRemitenteDestinatario";
                          const errorMessage = fieldState.error?.message;
                          return (
                            <FormFieldShell
                              fieldId={fieldId}
                              label={primaryFiscalCopy.rfcLabel}
                              required
                              errorMessage={errorMessage}
                            >
                              <Input
                                id={fieldId}
                                placeholder={primaryFiscalCopy.rfcPlaceholder}
                                className="uppercase"
                                maxLength={13}
                                disabled={isFiscalDataLocked}
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value.toUpperCase())
                                }
                                error={Boolean(fieldState.error)}
                                {...getFieldErrorAriaProps(fieldId, errorMessage)}
                              />
                            </FormFieldShell>
                          );
                        }}
                      />
                      <RHFTextField
                        control={control}
                        name="nombreRemitenteDestinatario"
                        fieldId="stop-nombreRemitenteDestinatario"
                        label={stopForm.label.legalName}
                        required
                        placeholder={primaryFiscalCopy.nombrePlaceholder}
                        disabled={isFiscalDataLocked}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ) : (
              <div className="space-y-4">
                {waypointHasPickup ? (
                  <div className="space-y-4">
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
                ) : null}

                {waypointHasDelivery ? (
                  <div className="space-y-4">
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
                          setValue(
                            "deliveryNombreRemitenteDestinatario",
                            p.legalName,
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            },
                          );
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
                ) : null}

                <Collapsible open={billingOpen} onOpenChange={setBillingOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto w-full justify-between px-0 text-sm font-medium"
                    >
                      {stopForm.section.billingDetails}
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          billingOpen && "rotate-180",
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    {waypointHasPickup ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Controller
                          name="rfcRemitenteDestinatario"
                          control={control}
                          render={({ field, fieldState }) => {
                            const fieldId = "stop-rfcRemitenteDestinatario";
                            const errorMessage = fieldState.error?.message;
                            return (
                              <FormFieldShell
                                fieldId={fieldId}
                                label={primaryFiscalCopy.rfcLabel}
                                required
                                errorMessage={errorMessage}
                              >
                                <Input
                                  id={fieldId}
                                  placeholder={primaryFiscalCopy.rfcPlaceholder}
                                  className="uppercase"
                                  maxLength={13}
                                  disabled={isFiscalDataLocked}
                                  {...field}
                                  value={field.value ?? ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value.toUpperCase())
                                  }
                                  error={Boolean(fieldState.error)}
                                  {...getFieldErrorAriaProps(fieldId, errorMessage)}
                                />
                              </FormFieldShell>
                            );
                          }}
                        />
                        <RHFTextField
                          control={control}
                          name="nombreRemitenteDestinatario"
                          fieldId="stop-nombreRemitenteDestinatario"
                          label={stopForm.label.legalName}
                          required
                          placeholder={primaryFiscalCopy.nombrePlaceholder}
                          disabled={isFiscalDataLocked}
                        />
                      </div>
                    ) : null}

                    {waypointHasDelivery ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {(() => {
                          const isDualField = waypointHasPickup;
                          const rfcName = isDualField
                            ? ("deliveryRfcRemitenteDestinatario" as const)
                            : ("rfcRemitenteDestinatario" as const);
                          const nombreName = isDualField
                            ? ("deliveryNombreRemitenteDestinatario" as const)
                            : ("nombreRemitenteDestinatario" as const);
                          const rfcLabel = isDualField
                            ? deliveryFiscalCopy.rfcLabel
                            : primaryFiscalCopy.rfcLabel;
                          const rfcPlaceholder = isDualField
                            ? deliveryFiscalCopy.rfcPlaceholder
                            : primaryFiscalCopy.rfcPlaceholder;
                          const nombreLabel = isDualField
                            ? stopForm.label.legalNameDelivery
                            : stopForm.label.legalName;
                          const nombrePlaceholder = isDualField
                            ? deliveryFiscalCopy.nombrePlaceholder
                            : primaryFiscalCopy.nombrePlaceholder;
                          const fieldsDisabled = isDualField
                            ? false
                            : isFiscalDataLocked;
                          const rfcFieldId = `stop-${rfcName}`;
                          const nombreFieldId = `stop-${nombreName}`;
                          return (
                            <>
                              <Controller
                                name={rfcName}
                                control={control}
                                render={({ field, fieldState }) => {
                                  const errorMessage = fieldState.error?.message;
                                  return (
                                    <FormFieldShell
                                      fieldId={rfcFieldId}
                                      label={rfcLabel}
                                      required
                                      errorMessage={errorMessage}
                                    >
                                      <Input
                                        id={rfcFieldId}
                                        placeholder={rfcPlaceholder}
                                        className="uppercase"
                                        maxLength={13}
                                        disabled={fieldsDisabled}
                                        {...field}
                                        value={field.value ?? ""}
                                        onChange={(e) =>
                                          field.onChange(
                                            e.target.value.toUpperCase(),
                                          )
                                        }
                                        error={Boolean(fieldState.error)}
                                        {...getFieldErrorAriaProps(
                                          rfcFieldId,
                                          errorMessage,
                                        )}
                                      />
                                    </FormFieldShell>
                                  );
                                }}
                              />
                              <RHFTextField
                                control={control}
                                name={nombreName}
                                fieldId={nombreFieldId}
                                label={nombreLabel}
                                required
                                placeholder={nombrePlaceholder}
                                disabled={fieldsDisabled}
                              />
                            </>
                          );
                        })()}
                      </div>
                    ) : null}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </FormSectionCard>

          <FormSectionCard
            title={stopForm.section.contactPlanning}
            icon={<Phone className="h-4 w-4" />}
            contentClassName="space-y-4"
          >

            <div className="grid gap-4 sm:grid-cols-2">
              <RHFTextField
                control={control}
                name="contactName"
                fieldId="stop-contactName"
                label={stopForm.label.contactName}
                placeholder={stopForm.placeholder.contactName}
              />
              <RHFTextField
                control={control}
                name="contactPhone"
                fieldId="stop-contactPhone"
                label={stopForm.label.contactPhone}
                placeholder={stopForm.placeholder.contactPhone}
              />
            </div>

            <RHFTextareaField
              control={control}
              name="notes"
              fieldId="stop-notes"
              label={stopForm.label.notes}
              placeholder={stopForm.placeholder.notes}
              rows={3}
            />

          {displayStop.stopCategory !== "origin" ? (
              <Controller
                name="estimatedArrival"
                control={control}
                render={({ field, fieldState }) => {
                    const fieldId = "stop-estimatedArrival";
                    const errorMessage = fieldState.error?.message;
                    const isDestination =
                      displayStop.stopCategory === "destination";
                    const label = isDestination
                      ? stopForm.label.estimatedArrivalDestination
                      : stopForm.label.estimatedArrivalWaypoint;
                    return (
                      <FormFieldShell
                        fieldId={fieldId}
                        label={label}
                        required={isDestination}
                        errorMessage={errorMessage}
                        description={
                          !errorMessage && showWaypointArrivalWarning
                            ? stopForm.hint.waypointArrivalInterpolation
                            : undefined
                        }
                      >
                        <Input
                          id={fieldId}
                          type="datetime-local"
                          value={field.value ? field.value.slice(0, 16) : ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? `${e.target.value}:00` : undefined,
                            )
                          }
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          error={Boolean(fieldState.error)}
                          {...getFieldErrorAriaProps(fieldId, errorMessage)}
                        />
                      </FormFieldShell>
                    );
                  }}
                />
          ) : null}
          </FormSectionCard>

          {validationActive || inlineSatError ? (
            <div ref={validationAlertRef}>
              <FormValidationSummary
                title={
                  validationActive
                    ? stopForm.validation.missingRequiredTitle
                    : stopForm.validation.reviewAddressTitle
                }
                messages={
                  validationActive
                    ? missingRequiredFields
                    : inlineSatError
                      ? [inlineSatError]
                      : []
                }
              />
            </div>
          ) : null}
        </div>

        <SheetFooter className="shrink-0 flex-col gap-3 border-t bg-background px-6 py-4 sm:flex-col">
          <p className="w-full text-xs text-muted-foreground">
            {missingRequiredFields.length === 0
              ? wizardCopy.route.format.allReady
              : wizardCopy.route.format.missingCount(missingRequiredFields.length)}
          </p>
          <div className="flex w-full flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => closeDialog()}>
              {stopForm.action.cancel}
            </Button>
            <Button type="button" onClick={() => handlePrimaryFooterAction()}>
              {stopForm.action.save}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>

      <AlertDialog
        open={clientAddressPersistDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) resetClientAddressPersistDialog();
          else setClientAddressPersistDialogOpen(true);
        }}
      >
        <AlertDialogContent className="max-w-[min(100vw-2rem,24rem)] gap-5 overflow-hidden sm:max-w-md">
          <AlertDialogHeader className="space-y-3 text-left">
            <AlertDialogTitle className="text-balance leading-snug">
              {stopForm.persistDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-pretty leading-relaxed">
              {stopForm.persistDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
            <AlertDialogAction
              className="mt-0 w-full sm:mt-0"
              disabled={isPersistingClientAddress}
              onClick={(event) => {
                event.preventDefault();
                void handlePersistClientAddress();
              }}
            >
              {isPersistingClientAddress ? stopForm.persistDialog.saving : stopForm.persistDialog.updateClient}
            </AlertDialogAction>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isPersistingClientAddress}
              onClick={handleUseAddressForStopOnly}
            >
              {stopForm.persistDialog.stopOnly}
            </Button>
            <AlertDialogCancel
              className="mt-0 w-full sm:mt-0"
              disabled={isPersistingClientAddress}
            >
              {stopForm.persistDialog.backToForm}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
