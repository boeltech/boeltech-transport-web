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
  Phone,
  ScrollText,
} from "lucide-react";
import {
  FormFieldShell,
  FormValidationSummary,
  RHFTextField,
  RHFTextareaField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { StopFormSheetCategorySection, StopFormSheetAddressOriginSection } from "./stop-form";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
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
import {
  useClientAddresses,
  useClientAddress,
} from "@features/clients/application/hooks/useClientAddresses";
import { useUpdateClientAddress } from "@features/clients/application/hooks/useUpdateClientAddress";

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
import {
  RFC_PUBLICO_GENERAL,
  getDeliveryFiscalCopy,
  getPrimaryFiscalSectionCopy,
  publicGeneralRfcNotice,
  resolveStopFiscalUiContext,
  type CfdiDocumentIntent,
} from "./stopDialogFiscalCopy";
import { PartnerSnapshotPicker } from "@features/partners";
import { Separator } from "@shared/ui/separator";

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
    case "Nombre del lugar":
      return "locationName";
    case LOCATION_CAPTURE_LABELS.country:
      return "satCountryCode";
    case LOCATION_CAPTURE_LABELS.state:
      return "satStateCode";
    case LOCATION_CAPTURE_LABELS.postalCode:
      return "postalCode";
    case "Confirmación Geográfica":
      // En el contexto `trip_stop` (SoT: matriz-reglas-cp31-por-capas.md) lat/lng son
      // obligatorias; `AddressInput` ya muestra error inline en ambos campos cuando
      // `profileUx.requireCoordinates` es true. Aquí mapeamos a `latitude`; el handler
      // también setea error en `longitude` para resaltar ambos controles.
      return "latitude";
    case "Hora estimada de llegada":
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
}: StopFormSheetProps) {
  const [attemptedSubmitValidation, setAttemptedSubmitValidation] = useState(false);
  const validationAlertRef = useRef<HTMLDivElement | null>(null);
  const [useAddressFiscalData, setUseAddressFiscalData] = useState(true);
  const [useClientAddressPrefill, setUseClientAddressPrefill] = useState(false);
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

  const { data: clients = [] } = useActiveClients();
  const { data: addresses = [] } = useClientAddresses(clientId);
  const { data: selectedAddressFull } = useClientAddress(clientId, clientAddressId);
  const writeBackAddressMutation = useUpdateClientAddress();
  const selectedAddress = selectedAddressFull ?? undefined;
  const clientAddresses = addresses;

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
      setValue("localityName", null);
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
        setValue("localityName", null);
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

      if (checked) return;

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
              "Completa los campos SAT obligatorios para este código postal.")
          : null,
      );
      setAttemptedSubmitValidation(true);
      return;
    }
    setInlineSatError(null);

    const shouldAskPersistChoice =
      Boolean(merged.clientId) &&
      stopHasUnifiedAddressId(merged) &&
      selectedAddress != null &&
      stopDialogDiffersFromClientCatalog(values, selectedAddress);

    if (shouldAskPersistChoice) {
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
    if (!pendingStopSubmit?.merged.clientId || !selectedAddress) return;

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
          title: "No se pudo actualizar la dirección del cliente",
          description:
            "Revisa los campos del domicilio antes de guardar en el catálogo.",
          variant: "destructive",
        });
        return;
      }

      await writeBackAddressMutation.mutateAsync({
        clientId: pendingStopSubmit.merged.clientId,
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
        title: "Error al actualizar la dirección",
        description: "La parada no se guardó. Intenta de nuevo.",
        variant: "destructive",
      });
      resetClientAddressPersistDialog();
    }
  }, [
    applyStopFieldErrors,
    completeStopSubmit,
    pendingStopSubmit,
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
      missing.push("Tipo de parada");
      return missing;
    }

    if (d.stopCategory === "waypoint" && (!d.stopType || d.stopType.length === 0)) {
      missing.push("Operación de escala");
    }

    if (!stopHasUnifiedAddressId(d)) {
      if (!d.locationName?.trim()) missing.push("Nombre del lugar");
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
      missing.push("Confirmación Geográfica");
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
        setError(fieldName, { type: "manual", message: `${label} es obligatorio` });
      }
      if (missing.includes("Confirmación Geográfica")) {
        setError("longitude", {
          type: "manual",
          message: "Confirmación Geográfica es obligatorio",
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
    useClientAddressPrefill,
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

  const hasClientAddressPrefill =
    useClientAddressPrefill && Boolean(displayStop.clientAddressId);
  const catalogMissingCoordinates =
    hasClientAddressPrefill &&
    (selectedAddress?.latitude == null || selectedAddress?.longitude == null);
  /** Solo datos fiscales opcionales desde catálogo; domicilio y geo siempre editables con prefill. */
  const isFiscalDataLocked = hasClientAddressPrefill && useAddressFiscalData;
  const showMissingGeolocationNotice = catalogMissingCoordinates;
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
      title: "Nombre del lugar",
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
                label="Nombre del lugar"
                required
                errorMessage={errorMessage}
              >
                <Input
                  id={fieldId}
                  placeholder="Ej: Bodega Central, CEDIS Norte, Planta Monterrey..."
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
      title: <AddressGeocodingSectionTitle />,
      icon: <MapPin className="h-4 w-4" />,
      contentClassName: "space-y-4",
      content: (
        <AddressGeocodingSectionContent
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
            setValue("distanceSource", meta.source, { shouldDirty: true });
            setValue("distanceProvider", meta.provider, { shouldDirty: true });
            setValue("distanceConfidence", meta.confidence, { shouldDirty: true });
            setValue("distanceComputedAt", meta.computedAt, { shouldDirty: true });
          }}
          panelMode={geolocationPanelMode}
          distanceDisabled={!geolocationPanelMode.distanceEditable}
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
      showGlobalNotice={!hasClientAddressPrefill}
      locationSectionTitle="Domicilio"
      preAddressSections={preAddressSections}
      addressInputSection={
        <AddressInput<StopDialogFormValues>
          variant={addressInputVariant}
          formContext="tripStop"
          control={control}
          setValue={setValue}
          namePrefix=""
          layout="compact"
          hideInformativeAlerts={hasClientAddressPrefill}
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
          <SheetTitle className="pr-8">
            {mode === "edit" ? "Editar parada" : "Agregar parada"}
          </SheetTitle>
          <SheetDescription>
            Ubicación, operaciones y datos fiscales de la parada.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          <StopFormSheetCategorySection
            displayStop={displayStop}
            getAvailableOperations={getAvailableOperations}
            onOperationToggle={handleOperationToggle}
          />

          <StopFormSheetAddressOriginSection
            useClientAddressPrefill={useClientAddressPrefill}
            onClientAddressPrefillToggle={handleClientAddressPrefillToggle}
            displayStop={displayStop}
            clients={clients}
            clientAddresses={clientAddresses}
            onClientChange={handleClientChange}
            onAddressSelect={handleAddressSelect}
          />

          {showMissingGeolocationNotice ? (
            <Alert variant="warning">
              <AlertTitle>Falta geolocalización en la dirección precargada</AlertTitle>
              <AlertDescription>
                Esta dirección del cliente no tiene latitud / longitud registradas.
                Captúralas desde el mapa o ingrésalas manualmente para calcular distancias y
                cumplir Carta Porte 3.1.
              </AlertDescription>
            </Alert>
          ) : null}

          {entityAddressForm}

          <FormSectionCard
            title="Datos fiscales"
            icon={<ScrollText className="h-4 w-4" />}
            contentClassName="space-y-4"
          >
            <p className="text-xs text-muted-foreground">
              {primaryFiscalCopy.sectionHint ?? primaryFiscalCopy.sectionTitle}
            </p>

            {(showPublicGeneralWarningPrimary || showPublicGeneralWarningDelivery) && (
              <p className="flex items-start gap-2 rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{publicGeneralRfcNotice()}</span>
              </p>
            )}

            {hasClientAddressPrefill && (
              <div className="flex items-center justify-between gap-3">
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
                  label="Nombre / razón social"
                  required
                  placeholder={primaryFiscalCopy.nombrePlaceholder}
                  disabled={isFiscalDataLocked}
                />
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
                      label="Nombre / razón social"
                      required
                      placeholder={primaryFiscalCopy.nombrePlaceholder}
                      disabled={isFiscalDataLocked}
                    />
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
                        ? "Nombre / razón social (descarga)"
                        : "Nombre / razón social";
                      const nombrePlaceholder = isDualField
                        ? deliveryFiscalCopy.nombrePlaceholder
                        : primaryFiscalCopy.nombrePlaceholder;
                      const fieldsDisabled = isDualField ? false : isFiscalDataLocked;
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
                                      field.onChange(e.target.value.toUpperCase())
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
              </div>
            )}
          </FormSectionCard>

          <FormSectionCard
            title="Contacto y planificación"
            icon={<Phone className="h-4 w-4" />}
            contentClassName="space-y-4"
          >

            <div className="grid gap-4 sm:grid-cols-2">
              <RHFTextField
                control={control}
                name="contactName"
                fieldId="stop-contactName"
                label="Nombre contacto"
                placeholder="Nombre del contacto en sitio"
              />
              <RHFTextField
                control={control}
                name="contactPhone"
                fieldId="stop-contactPhone"
                label="Teléfono"
                placeholder="Teléfono"
              />
            </div>

            <RHFTextareaField
              control={control}
              name="notes"
              fieldId="stop-notes"
              label="Notas / instrucciones"
              placeholder="Instrucciones especiales de entrega, horarios, acceso..."
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
                      ? "Hora estimada de llegada"
                      : "Hora estimada en esta escala";
                    return (
                      <FormFieldShell
                        fieldId={fieldId}
                        label={label}
                        required={isDestination}
                        errorMessage={errorMessage}
                        description={
                          !errorMessage && showWaypointArrivalWarning
                            ? "Se interpolará automáticamente si no se captura."
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
                    ? "Faltan datos obligatorios en la parada"
                    : "Revisa la dirección de la parada"
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

        <SheetFooter className="shrink-0 gap-2 border-t bg-background px-6 py-4">
          <Button type="button" variant="outline" onClick={() => closeDialog()}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => handlePrimaryFooterAction()}>
            {mode === "edit" ? "Guardar Cambios" : "Agregar Parada"}
          </Button>
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
              ¿Actualizar la dirección del cliente?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-pretty leading-relaxed">
              Modificaste el domicilio precargado del cliente. Puedes guardar los cambios en
              el catálogo del cliente o usar esta versión solo para esta parada del viaje.
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
              {isPersistingClientAddress ? "Guardando…" : "Actualizar en el cliente"}
            </AlertDialogAction>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isPersistingClientAddress}
              onClick={handleUseAddressForStopOnly}
            >
              Solo en esta parada
            </Button>
            <AlertDialogCancel
              className="mt-0 w-full sm:mt-0"
              disabled={isPersistingClientAddress}
            >
              Volver al formulario
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
