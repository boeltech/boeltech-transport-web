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
import { cn } from "@shared/lib/utils/cn";
import { useWizardFormRef } from "@shared/ui/page-shells/useWizardFormRef";
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

const WIZARD_STEPS = [
  ...CLIENT_WIZARD_STEPS.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
  })),
  {
    id: "review",
    title: "Revisi\u00f3n",
    description: "Confirmar antes de crear el cliente",
  },
];

const CLIENT_CREATE_WIZARD_STEP_FIELDS: ReadonlyArray<readonly string[]> = [
  ["type", "legalName", "taxId", "taxRegime", "paymentTerms", "creditDays"],
  ["street", "exteriorNumber", "postalCode", "satStateCode", "satMunicipalityCode"],
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

  const [clientData, setClientData] = useState<ClientFormData | null>(null);
  const [addressData, setAddressData] = useState<ClientAddressFormData | null>(
    null,
  );
  const [isClientValid, setIsClientValid] = useState(false);
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [satValidationError, setSatValidationError] = useState<string | null>(null);

  const handleClientChange = useCallback(
    (data: ClientFormData, isValid: boolean) => {
      clientDraftRef.current = data;
      setIsClientValid(isValid);
      startTransition(() => setClientData(data));
    },
    [],
  );

  const handleAddressChange = useCallback(
    (data: ClientAddressFormData, isValid: boolean) => {
      addressDraftRef.current = data;
      setIsAddressValid(isValid);
      setSatValidationError(null);
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
              "No se pudo validar la direccin fiscal."),
      );
      return false;
    }
    setSatValidationError(null);
    return true;
  }, [addressData]);

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
      },
    );
  }, [clientData, addressData, createClientMutation, navigate]);

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

  const requestWizardSubmit = useCallback(() => {
    void (async () => {
      const clientOk = await validateClientStep();
      if (!clientOk) return;
      const addressOk = await validateAddressStep();
      if (!addressOk) return;
      submitCreate();
    })();
  }, [submitCreate, validateAddressStep, validateClientStep]);

  useWizardFormRef({
    formRef,
    triggerStepValidation: validateWizardStep,
    requestSubmit: requestWizardSubmit,
  });

  const isSubmitting = createClientMutation.isPending;
  const handleCancel = useCallback(() => navigate("/clients"), [navigate]);

  const shellHeader = useMemo(
    () => ({
      backHref: "/clients",
      backLabel: "Volver a la lista de clientes",
      icon: <Users className="h-5 w-5" />,
      title: "Nuevo Cliente",
      subtitle: "Completa la informaci\u00f3n para crear un nuevo cliente",
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
          <div
            className={cn(currentStep !== 0 && "hidden")}
            aria-hidden={currentStep !== 0}
          >
            {currentStep === 0 && !isClientValid ? (
              <p className="mb-4 max-w-md text-sm text-muted-foreground">
                {"Completa los campos obligatorios (RFC seg\u00fan tipo de persona y t\u00e9rminos de pago si aplica) para continuar."}
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
                  {"Completa la direcci\u00f3n fiscal y corrige los errores indicados para continuar."}
                </p>
              ) : null}
              {currentStep === 1 && satValidationError ? (
                <p className="mb-4 max-w-md text-sm text-destructive">
                  {satValidationError}
                </p>
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
                        {" \u00b7 "}
                        {clientData.tradeName}
                      </span>
                    ) : null}
                    <span className="mt-1 block text-muted-foreground">
                      RFC {clientData.taxId.toUpperCase()}
                      {" \u00b7 "}
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
                clientRfc={clientData?.taxId}
                clientName={clientData?.legalName}
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
