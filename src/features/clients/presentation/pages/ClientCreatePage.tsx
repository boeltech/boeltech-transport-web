import {
  startTransition,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Info, MapPinOff, User, Users } from "lucide-react";
import {
  WizardPageShell,
  type WizardFormRef,
} from "@shared/ui/page-shells/WizardPageShell";
import { Switch } from "@shared/ui/switch";
import { Label } from "@shared/ui/label";
import { cn } from "@shared/lib/utils/cn";

import { useCreateClient, useCreateClientOnly } from "../../application";
import {
  CLIENT_TYPE_LABELS,
  CLIENT_WIZARD_STEPS,
} from "../../domain";
import { ClientForm, ClientAddressForm } from "../components";
import type { ClientFormData } from "../validation/clientSchema";
import {
  clientAddressFormDataToCreateDto,
  type ClientAddressFormData,
} from "../validation/clientAddressSchema";

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

function ClientCreateReviewSummary({
  clientData,
  addressData,
  skipAddress,
}: {
  clientData: ClientFormData | null;
  addressData: ClientAddressFormData | null;
  skipAddress: boolean;
}) {
  if (!clientData) {
    return (
      <p className="text-sm text-muted-foreground">
        Completa los pasos anteriores para ver el resumen.
      </p>
    );
  }

  const isIndividual = clientData.type === "individual";
  const Icon = isIndividual ? User : Building2;

  const addressLine = addressData
    ? [
        addressData.street,
        addressData.exteriorNumber,
        addressData.interiorNumber,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <div className="space-y-4 text-sm">
      {/* ── Cliente — header visual con icon ─────────────────────────────── */}
      <div className="flex items-start gap-4 rounded-lg border bg-muted/30 p-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center bg-primary/10 text-primary",
            isIndividual ? "rounded-full" : "rounded-lg",
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Cliente
          </p>
          <p className="font-semibold text-foreground">{clientData.legalName}</p>
          {clientData.tradeName?.trim() ? (
            <p className="text-xs text-muted-foreground">
              {clientData.tradeName}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-muted-foreground">
            RFC {clientData.taxId.toUpperCase()} ·{" "}
            {CLIENT_TYPE_LABELS[clientData.type]}
          </p>
        </div>
      </div>

      {/* ── Dirección fiscal — o nota de "sin dirección" ─────────────────── */}
      {skipAddress || !addressData ? (
        <div className="flex items-start gap-3 rounded-lg border border-dashed bg-muted/20 p-4">
          <MapPinOff className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Dirección fiscal
            </p>
            <p className="text-sm text-foreground">Sin dirección registrada</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Podrás agregarla después desde el detalle del cliente.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Dirección fiscal
          </p>
          <p className="font-medium">{addressLine || "—"}</p>
          <p className="text-muted-foreground">
            C.P. {addressData.postalCode}
            {addressData.neighborhoodName
              ? ` · ${addressData.neighborhoodName}`
              : ""}
          </p>
        </div>
      )}
    </div>
  );
}

export function ClientCreatePage() {
  const navigate = useNavigate();
  const createClientMutation = useCreateClient();
  const createClientOnlyMutation = useCreateClientOnly();
  const formRef = useRef<WizardFormRef | null>(null);
  const clientDraftRef = useRef<ClientFormData | null>(null);
  const addressDraftRef = useRef<ClientAddressFormData | null>(null);

  const [clientData, setClientData] = useState<ClientFormData | null>(null);
  const [addressData, setAddressData] = useState<ClientAddressFormData | null>(
    null,
  );
  const [isClientValid, setIsClientValid] = useState(false);
  const [isAddressValid, setIsAddressValid] = useState(false);

  // Toggle "Crear sin dirección" — permite alta rápida sin captura de
  // dirección fiscal. El usuario puede agregarla después desde el detalle.
  const [skipAddress, setSkipAddress] = useState(false);

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
      startTransition(() => setAddressData(data));
    },
    [],
  );

  const submitCreate = useCallback(() => {
    const clientSnapshot = clientDraftRef.current ?? clientData;
    if (!clientSnapshot || !isClientValid) return;

    const clientPayload = {
      type: clientSnapshot.type,
      legalName: clientSnapshot.legalName,
      tradeName: clientSnapshot.tradeName || undefined,
      taxId: clientSnapshot.taxId,
      taxRegime: clientSnapshot.taxRegime || undefined,
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

    if (skipAddress) {
      // Modo "sin dirección" — solo crea el cliente, sin paso 2.
      createClientOnlyMutation.mutate(clientPayload, {
        onSuccess: ({ id }) => navigate(`/clients/${id}`),
      });
      return;
    }

    const addressSnapshot = addressDraftRef.current ?? addressData;
    if (!addressSnapshot || !isAddressValid) return;

    createClientMutation.mutate(
      {
        client: clientPayload,
        billingAddress: clientAddressFormDataToCreateDto(addressSnapshot, {
          context: "billingOnCreate",
        }),
      },
      {
        onSuccess: (result) => navigate(`/clients/${result.clientId}`),
      },
    );
  }, [
    clientData,
    addressData,
    isClientValid,
    isAddressValid,
    skipAddress,
    createClientMutation,
    createClientOnlyMutation,
    navigate,
  ]);

  useLayoutEffect(() => {
    formRef.current = {
      triggerStepValidation: async (stepIndex: number) => {
        if (stepIndex === 0) return isClientValid;
        // Paso "Dirección" → si el usuario eligió omitir, pasa automáticamente.
        if (stepIndex === 1) return skipAddress || isAddressValid;
        return true;
      },
      requestSubmit: () => {
        submitCreate();
      },
    };
    return () => {
      formRef.current = null;
    };
  }, [isClientValid, isAddressValid, skipAddress, submitCreate]);

  const isSubmitting =
    createClientMutation.isPending || createClientOnlyMutation.isPending;
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
    (currentStep: number) => (
      <>
        {currentStep === 0 && !isClientValid ? (
          <p className="max-w-md text-sm text-muted-foreground">
            Completa los campos obligatorios (RFC según tipo de persona y
            términos de pago si aplica) para continuar.
          </p>
        ) : null}
        {currentStep === 1 && !skipAddress && !isAddressValid ? (
          <p className="max-w-md text-sm text-muted-foreground">
            Completa la dirección fiscal y corrige los errores indicados para
            continuar.
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
                  {" "}
                  · {clientData.tradeName}
                </span>
              ) : null}
              <span className="mt-1 block text-muted-foreground">
                RFC {clientData.taxId.toUpperCase()} ·{" "}
                {CLIENT_TYPE_LABELS[clientData.type]}
              </span>
            </div>
          </div>
        ) : null}

        {currentStep === 0 ? (
          <ClientForm
            defaultValues={clientData ?? undefined}
            onChange={handleClientChange}
            disabled={isSubmitting}
          />
        ) : null}

        {currentStep === 1 ? (
          <>
            {/* Toggle "Crear sin dirección" — alta rápida sin captura ahora */}
            <div className="mb-4 flex flex-col gap-2 rounded-md border bg-card p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="flex items-start gap-2.5">
                <MapPinOff className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <Label
                    htmlFor="skipAddress"
                    className="cursor-pointer text-sm font-medium"
                  >
                    Crear cliente sin dirección
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Útil para altas rápidas. Podrás agregar la dirección
                    después desde el detalle del cliente.
                  </p>
                </div>
              </div>
              <Switch
                id="skipAddress"
                checked={skipAddress}
                onCheckedChange={setSkipAddress}
                disabled={isSubmitting}
              />
            </div>

            {skipAddress ? (
              <div className="rounded-md border border-dashed bg-muted/20 p-6 text-center">
                <MapPinOff className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm font-medium">Sin dirección registrada</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pasa al siguiente paso para revisar y crear el cliente.
                </p>
              </div>
            ) : (
              <ClientAddressForm
                formContext="billingOnCreate"
                hideLocationSectionTitle
                defaultValues={addressData ?? undefined}
                clientRfc={clientData?.taxId}
                clientName={clientData?.legalName}
                onChange={handleAddressChange}
                disabled={isSubmitting}
              />
            )}
          </>
        ) : null}

        {currentStep === 2 ? (
          <ClientCreateReviewSummary
            clientData={clientData}
            addressData={addressData}
            skipAddress={skipAddress}
          />
        ) : null}
      </>
    ),
    [
      isClientValid,
      isAddressValid,
      skipAddress,
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
