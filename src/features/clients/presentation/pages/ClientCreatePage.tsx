import {
  startTransition,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { Info, Users } from "lucide-react";
import {
  WizardPageShell,
  type WizardFormRef,
} from "@shared/ui/page-shells/WizardPageShell";
import { AlertWithIcon } from "@shared/ui/alert";
import { cn } from "@shared/lib/utils/cn";
import { useWizardFormRef } from "@shared/ui/page-shells/useWizardFormRef";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";
import { useCreateClient } from "../../application";
import {
  CLIENT_TYPE_LABELS,
  CLIENT_WIZARD_STEPS,
} from "../../domain";
import {
  ClientForm,
  ClientAddressForm,
  ClientCreateReviewSummary,
  type ClientFormRef,
  type ClientAddressFormRef,
} from "../components";
import {
  applyClientAddressFormContext,
  billingAddressFormSchema,
  clientAddressFormDataToCreateDto,
  clientFormSchema,
  validateClientAddressFormComplete,
  type ClientAddressFormData,
} from "../validation";
import type { ClientFormData } from "../validation/clientSchema";
import { resolveClientCreateApiField } from "../helpers/applyClientApiFieldErrors";

const WIZARD_STEPS = [
  ...CLIENT_WIZARD_STEPS.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
  })),
  {
    id: "review",
    title: "Revisión",
    description: "Confirmar antes de crear el cliente",
  },
];

/** Solo marca el paso de revisión (sin campos). La validación real es full-form vía refs. */
const CLIENT_CREATE_WIZARD_STEP_FIELDS: ReadonlyArray<readonly string[]> = [
  ["type", "legalName", "taxId", "taxRegime", "paymentTerms", "creditDays"],
  [
    "locationName",
    "street",
    "exteriorNumber",
    "postalCode",
    "satStateCode",
    "satMunicipalityCode",
  ],
  [],
];

function validateClientDraft(data: ClientFormData | null | undefined): boolean {
  if (!data) return false;
  return clientFormSchema.safeParse(data).success;
}

function validateAddressDraft(
  data: ClientAddressFormData | null | undefined,
): boolean {
  if (!data) return false;
  const contextual = applyClientAddressFormContext(data, "billingOnCreate");
  return billingAddressFormSchema.safeParse(contextual).success;
}

export function ClientCreatePage() {
  const navigate = useNavigate();
  const createClientMutation = useCreateClient();
  const formRef = useRef<WizardFormRef | null>(null);
  const clientFormRef = useRef<ClientFormRef>(null);
  const addressFormRef = useRef<ClientAddressFormRef>(null);
  const clientDraftRef = useRef<ClientFormData | null>(null);
  const addressDraftRef = useRef<ClientAddressFormData | null>(null);
  const visitedStepsRef = useRef<Set<number>>(new Set([0]));
  /** Cierra la ventana entre validación del shell y `isPending` de la mutación. */
  const [isCreateBusy, setIsCreateBusy] = useState(false);

  const [clientData, setClientData] = useState<ClientFormData | null>(null);
  const [addressData, setAddressData] = useState<ClientAddressFormData | null>(
    null,
  );
  const [isClientValid, setIsClientValid] = useState(false);
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [satValidationError, setSatValidationError] = useState<string | null>(null);
  const [pageApiAlertMessages, setPageApiAlertMessages] = useState<string[]>(
    [],
  );

  const handleClientChange = useCallback(
    (data: ClientFormData, isValid: boolean) => {
      clientDraftRef.current = data;
      setIsClientValid(isValid);
      setPageApiAlertMessages([]);
      startTransition(() => setClientData(data));
    },
    [],
  );

  const handleAddressChange = useCallback(
    (data: ClientAddressFormData, isValid: boolean) => {
      addressDraftRef.current = data;
      setIsAddressValid(isValid);
      setSatValidationError(null);
      setPageApiAlertMessages([]);
      startTransition(() => setAddressData(data));
    },
    [],
  );

  const validateClientStep = useCallback(async (): Promise<boolean> => {
    if (clientFormRef.current) {
      return (await clientFormRef.current.triggerValidation()) ?? false;
    }
    return validateClientDraft(clientDraftRef.current ?? clientData);
  }, [clientData]);

  const validateAddressStep = useCallback(async (): Promise<boolean> => {
    const localValid = addressFormRef.current
      ? ((await addressFormRef.current.triggerValidation()) ?? false)
      : validateAddressDraft(addressDraftRef.current ?? addressData);
    if (!localValid) return false;

    const snapshot = addressDraftRef.current ?? addressData;
    if (!snapshot) return false;

    const satResult = await validateClientAddressFormComplete(snapshot, {
      context: "billingOnCreate",
      requireCoordinates: false,
    });
    if (!satResult.ok) {
      addressFormRef.current?.applySatFieldErrors(satResult.fieldErrors);
      const hasInlineSatErrors = Object.keys(satResult.fieldErrors).length > 0;
      setSatValidationError(
        hasInlineSatErrors
          ? null
          : (satResult.errors[0]?.message ??
              "No se pudo validar la dirección fiscal."),
      );
      return false;
    }
    setSatValidationError(null);
    return true;
  }, [addressData]);

  const applyCreateApiError = useCallback((error: unknown) => {
    if (isApiError(error) && error.hasValidationErrors()) {
      const clientEntries: { field: string; message: string }[] = [];
      const addressEntries: { field: string; message: string }[] = [];
      const unmapped: string[] = [];

      for (const entry of error.validationErrors) {
        const target = resolveClientCreateApiField(entry.field);
        if (target?.form === "client") {
          clientEntries.push({
            field: entry.field,
            message: entry.message,
          });
        } else if (target?.form === "address") {
          addressEntries.push({
            field: entry.field,
            message: entry.message,
          });
        } else if (entry.message.trim()) {
          unmapped.push(entry.message.trim());
        }
      }

      if (clientEntries.length > 0) {
        clientFormRef.current?.applyApiValidationErrors(clientEntries);
      }
      if (addressEntries.length > 0) {
        const leftover =
          addressFormRef.current?.applyApiValidationErrors(addressEntries) ??
          addressEntries.map((e) => e.message);
        unmapped.push(...leftover);
      }

      const toastDetail = error.getToastMessage();
      if (unmapped.length === 0 && toastDetail) {
        // Campos ya tienen inline; reforzar con alert de página si no hubo unmapped.
        setPageApiAlertMessages([toastDetail]);
      } else {
        setPageApiAlertMessages(
          unmapped.length > 0 ? unmapped : [toastDetail || error.message],
        );
      }
      return;
    }

    const description = isApiError(error)
      ? error.getDetailedMessage()
      : getErrorMessage(error);
    clientFormRef.current?.setApiAlertMessages(
      description ? [description] : [getErrorMessage(error)],
    );
    setPageApiAlertMessages(
      description ? [description] : [getErrorMessage(error)],
    );
  }, []);

  const submitCreate = useCallback(() => {
    const clientSnapshot = clientDraftRef.current ?? clientData;
    if (!clientSnapshot || !validateClientDraft(clientSnapshot)) return;

    const clientPayload = {
      type: clientSnapshot.type,
      legalName: clientSnapshot.legalName,
      tradeName: clientSnapshot.tradeName || undefined,
      taxId: clientSnapshot.taxId,
      taxRegime: clientSnapshot.taxRegime,
      contactName: clientSnapshot.contactName || undefined,
      contactPosition: clientSnapshot.contactPosition || undefined,
      phone: clientSnapshot.phone || undefined,
      secondaryPhone: clientSnapshot.secondaryPhone || undefined,
      email: clientSnapshot.email || undefined,
      billingEmail: clientSnapshot.billingEmail || undefined,
      paymentTerms: clientSnapshot.paymentTerms,
      creditDays: clientSnapshot.creditDays,
      creditLimit: clientSnapshot.creditLimit,
      notes: clientSnapshot.notes || undefined,
    };

    const addressSnapshot = addressDraftRef.current ?? addressData;
    if (!addressSnapshot || !validateAddressDraft(addressSnapshot)) return;

    setIsCreateBusy(true);
    setPageApiAlertMessages([]);
    clientFormRef.current?.clearApiErrors();
    addressFormRef.current?.clearApiFieldErrors();

    createClientMutation.mutate(
      {
        client: clientPayload,
        billingAddress: clientAddressFormDataToCreateDto(addressSnapshot, {
          context: "billingOnCreate",
        }),
        primaryContact: clientSnapshot.contactName?.trim()
          ? {
              fullName: clientSnapshot.contactName.trim(),
              position: clientSnapshot.contactPosition?.trim() || null,
              phone: clientSnapshot.phone?.trim() || null,
              secondaryPhone: clientSnapshot.secondaryPhone?.trim() || null,
              email: clientSnapshot.email?.trim() || null,
              isPrimary: true,
            }
          : undefined,
      },
      {
        onSuccess: (result) => navigate(`/clients/${result.clientId}`),
        onError: (error) => {
          applyCreateApiError(error);
        },
        onSettled: () => {
          setIsCreateBusy(false);
        },
      },
    );
  }, [
    clientData,
    addressData,
    createClientMutation,
    navigate,
    applyCreateApiError,
  ]);

  const validateWizardStep = useCallback(
    async (stepIndex: number): Promise<boolean> => {
      const stepFields = CLIENT_CREATE_WIZARD_STEP_FIELDS[stepIndex] ?? [];
      if (stepFields.length === 0) return true;
      if (stepIndex === 0) return validateClientStep();
      if (stepIndex === 1) return validateAddressStep();
      return true;
    },
    [validateAddressStep, validateClientStep],
  );

  /**
   * El shell ya validó todos los pasos en `handleConfirm` y navega al paso
   * fallido. Aquí solo disparamos el mutate (sin re-validar async).
   */
  const requestWizardSubmit = useCallback(() => {
    submitCreate();
  }, [submitCreate]);

  useWizardFormRef({
    formRef,
    triggerStepValidation: validateWizardStep,
    requestSubmit: requestWizardSubmit,
  });

  const isSubmitting = createClientMutation.isPending || isCreateBusy;
  const handleCancel = useCallback(() => navigate("/clients"), [navigate]);

  const shellHeader = useMemo(
    () => ({
      backHref: "/clients",
      backLabel: "Volver a la lista de clientes",
      icon: <Users className="h-5 w-5" />,
      title: "Nuevo Cliente",
      subtitle: "Completa la información para crear un nuevo cliente",
    }),
    [],
  );

  const renderStep = useCallback(
    (currentStep: number) => {
      visitedStepsRef.current.add(currentStep);
      const shouldMountAddressStep =
        currentStep === 1 || visitedStepsRef.current.has(1);

      return (
        <>
          {pageApiAlertMessages.length > 0 ? (
            <div className="mb-4 max-w-2xl">
              <AlertWithIcon
                variant="destructive"
                title="No se pudo completar el alta"
              >
                <ul className="list-disc space-y-1 pl-4">
                  {pageApiAlertMessages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </AlertWithIcon>
            </div>
          ) : null}

          <div
            className={cn(currentStep !== 0 && "hidden")}
            aria-hidden={currentStep !== 0}
          >
            {currentStep === 0 && !isClientValid ? (
              <p className="mb-4 max-w-md text-sm text-muted-foreground">
                Completa los campos obligatorios (RFC según tipo de persona y
                términos de pago si aplica) para continuar.
              </p>
            ) : null}
            <ClientForm
              ref={clientFormRef}
              defaultValues={clientData ?? undefined}
              onChange={handleClientChange}
              disabled={isSubmitting}
            />
          </div>

          {shouldMountAddressStep ? (
            <div
              className={cn(currentStep !== 1 && "hidden")}
              aria-hidden={currentStep !== 1}
            >
              {currentStep === 1 && !isAddressValid ? (
                <p className="mb-4 max-w-md text-sm text-muted-foreground">
                  Completa el código postal fiscal del receptor. No hace falta
                  mapa ni RFC de Carta Porte.
                </p>
              ) : null}
              {currentStep === 1 && satValidationError ? (
                <div className="mb-4 max-w-md">
                  <AlertWithIcon
                    variant="destructive"
                    title="Dirección incompleta"
                  >
                    {satValidationError}
                  </AlertWithIcon>
                </div>
              ) : null}

              {currentStep === 1 && clientData ? (
                <div
                  className="mb-4 flex gap-3 rounded-lg border bg-muted/30 p-4 text-sm"
                  role="status"
                  aria-live="polite"
                >
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <span className="font-medium text-foreground">
                      Cliente: {clientData.legalName}
                    </span>
                    {clientData.tradeName?.trim() ? (
                      <span className="text-muted-foreground">
                        {" · "}
                        {clientData.tradeName}
                      </span>
                    ) : null}
                    <span className="mt-1 block text-muted-foreground">
                      RFC {clientData.taxId.toUpperCase()}
                      {" · "}
                      {CLIENT_TYPE_LABELS[clientData.type]}
                    </span>
                  </div>
                </div>
              ) : null}

              <ClientAddressForm
                ref={addressFormRef}
                formContext="billingOnCreate"
                hideLocationSectionTitle
                defaultValues={addressData ?? undefined}
                onChange={handleAddressChange}
                disabled={isSubmitting}
              />
            </div>
          ) : null}

          {currentStep === 2 ? (
            <ClientCreateReviewSummary
              clientData={clientData}
              addressData={addressData}
            />
          ) : null}
        </>
      );
    },
    [
      isClientValid,
      isAddressValid,
      satValidationError,
      pageApiAlertMessages,
      clientData,
      addressData,
      handleClientChange,
      handleAddressChange,
      isSubmitting,
    ],
  );

  return (
    <WizardPageShell
      steps={WIZARD_STEPS}
      formRef={formRef}
      header={shellHeader}
      renderStep={renderStep}
      isSubmitting={isSubmitting}
      submitLabel="Crear Cliente"
      submittingLabel="Creando..."
      stepsAriaLabel="Pasos para dar de alta un cliente"
      headerBackMode="wizard"
      onCancel={handleCancel}
    />
  );
}

export default ClientCreatePage;
