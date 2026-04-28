import { memo, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@shared/ui/button";
import {
  WizardNavigationBar,
  WizardProgressCard,
  WizardSteps,
} from "@shared/ui/wizard";
import type { WizardStep } from "@shared/ui/wizard";
import { ArrowLeft, Check, Loader2, Users, Info } from "lucide-react";

import { useCreateClient } from "../../application";
import { CLIENT_TYPE_LABELS, CLIENT_WIZARD_STEPS, type ClientWizardStep } from "../../domain";
import { ClientForm, ClientAddressForm } from "../components";
import type { ClientFormData } from "../validation/clientSchema";
import { clientAddressFormDataToCreateDto, type ClientAddressFormData } from "../validation/clientAddressSchema";

interface WizardState {
  currentStep: ClientWizardStep;
  clientData: ClientFormData | null;
  addressData: ClientAddressFormData | null;
  isClientValid: boolean;
  isAddressValid: boolean;
}

function clientStepToIndex(step: ClientWizardStep): number { return step === "info" ? 0 : 1; }
function indexToClientStep(index: number): ClientWizardStep { return index <= 0 ? "info" : "address"; }

const ClientCreateWizardProgress = memo(function ClientCreateWizardProgress({ currentStep, onStepClick }: { currentStep: ClientWizardStep; onStepClick: (index: number) => void; }) {
  const steps: WizardStep[] = useMemo(() => CLIENT_WIZARD_STEPS.map((s) => ({ id: s.id, title: s.title, description: s.description })), []);
  return (
    <WizardProgressCard>
      <WizardSteps steps={steps} currentStep={clientStepToIndex(currentStep)} onStepClick={onStepClick} allowNavigation ariaLabel="Pasos para dar de alta un cliente" />
    </WizardProgressCard>
  );
});

export function ClientCreatePage() {
  const navigate = useNavigate();
  const createClientMutation = useCreateClient();
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const prevWizardStepRef = useRef<ClientWizardStep | null>(null);
  const nextStepHelpId = useId();
  const submitHelpId = useId();

  const [state, setState] = useState<WizardState>({ currentStep: "info", clientData: null, addressData: null, isClientValid: false, isAddressValid: false });

  useEffect(() => {
    const prev = prevWizardStepRef.current;
    prevWizardStepRef.current = state.currentStep;
    if (prev && prev !== state.currentStep) requestAnimationFrame(() => stepHeadingRef.current?.focus({ preventScroll: true }));
  }, [state.currentStep]);

  const handleClientChange = useCallback((data: ClientFormData, isValid: boolean) => setState((prev) => ({ ...prev, clientData: data, isClientValid: isValid })), []);
  const handleAddressChange = useCallback((data: ClientAddressFormData, isValid: boolean) => setState((prev) => ({ ...prev, addressData: data, isAddressValid: isValid })), []);

  const handleStepClick = useCallback((stepIndex: number) => {
    const target = indexToClientStep(stepIndex);
    const currentIdx = clientStepToIndex(state.currentStep);
    if (stepIndex <= currentIdx) return setState((prev) => ({ ...prev, currentStep: target }));
    if (state.currentStep === "info" && state.isClientValid) setState((prev) => ({ ...prev, currentStep: "address" }));
  }, [state.currentStep, state.isClientValid]);

  const handleNext = () => { if (state.currentStep === "info" && state.isClientValid) setState((prev) => ({ ...prev, currentStep: "address" })); };
  const handleBack = () => { if (state.currentStep === "address") setState((prev) => ({ ...prev, currentStep: "info" })); else navigate("/clients"); };
  const handlePrevious = () => {
    if (state.currentStep === "address") {
      setState((prev) => ({ ...prev, currentStep: "info" }));
    }
  };

  const handleSubmit = () => {
    if (!state.clientData || !state.addressData || !state.isClientValid || !state.isAddressValid) return;
    createClientMutation.mutate({
      client: {
        type: state.clientData.type,
        legalName: state.clientData.legalName,
        tradeName: state.clientData.tradeName || undefined,
        taxId: state.clientData.taxId,
        taxRegime: state.clientData.taxRegime || undefined,
        contactName: state.clientData.contactName || undefined,
        contactPosition: state.clientData.contactPosition || undefined,
        phone: state.clientData.phone || undefined,
        secondaryPhone: state.clientData.secondaryPhone || undefined,
        email: state.clientData.email || undefined,
        billingEmail: state.clientData.billingEmail || undefined,
        paymentTerms: state.clientData.paymentTerms,
        creditDays: state.clientData.creditDays,
        creditLimit: state.clientData.creditLimit,
        notes: state.clientData.notes || undefined,
      },
      billingAddress: clientAddressFormDataToCreateDto(state.addressData),
    }, { onSuccess: (result) => navigate(`/clients/${result.clientId}`) });
  };

  const isSubmitting = createClientMutation.isPending;
  const canGoNext = state.currentStep === "info" && state.isClientValid;
  const canSubmit = state.currentStep === "address" && state.isClientValid && state.isAddressValid;

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button type="button" variant="ghost" size="icon" onClick={handleBack} disabled={isSubmitting}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
          <div><h1 className="text-2xl font-bold tracking-tight">Nuevo Cliente</h1><p className="text-sm text-muted-foreground">Completa la información para crear un nuevo cliente</p></div>
        </div>
      </div>

      <ClientCreateWizardProgress currentStep={state.currentStep} onStepClick={handleStepClick} />

      <section
        ref={stepHeadingRef}
        tabIndex={-1}
        className="space-y-4 outline-none"
        aria-label={state.currentStep === "info" ? "Información del cliente" : "Dirección fiscal"}
      >
        {state.currentStep === "address" && state.clientData && (
          <div className="flex gap-3 rounded-lg border bg-muted/30 p-4 text-sm" role="status" aria-live="polite">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <span className="font-medium text-foreground">Cliente: {state.clientData.legalName}</span>
              {state.clientData.tradeName?.trim() ? <span className="text-muted-foreground"> · {state.clientData.tradeName}</span> : null}
              <span className="mt-1 block text-muted-foreground">RFC {state.clientData.taxId.toUpperCase()} · {CLIENT_TYPE_LABELS[state.clientData.type]}</span>
            </div>
          </div>
        )}

        {state.currentStep === "info" ? (
          <ClientForm defaultValues={state.clientData ?? undefined} onChange={handleClientChange} disabled={isSubmitting} />
        ) : (
          <ClientAddressForm
            isBillingAddress
            hideLocationSectionTitle
            defaultValues={state.addressData ?? undefined}
            clientRfc={state.clientData?.taxId}
            clientName={state.clientData?.legalName}
            onChange={handleAddressChange}
            disabled={isSubmitting}
          />
        )}
      </section>

      <div className="space-y-2">
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {state.currentStep === "info" && !canGoNext && <p id={nextStepHelpId} className="max-w-md text-right text-sm text-muted-foreground">Completa los campos obligatorios (RFC según tipo de persona y términos de pago si aplica) para continuar.</p>}
          {state.currentStep === "address" && !canSubmit && <p id={submitHelpId} className="max-w-md text-right text-sm text-muted-foreground">Completa la dirección fiscal y corrige los errores indicados para crear el cliente.</p>}
        </div>
        <WizardNavigationBar
          canGoBack={state.currentStep === "address" && !isSubmitting}
          isLastStep={state.currentStep === "address"}
          onPrevious={handlePrevious}
          onCancel={() => navigate("/clients")}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disableNext={!canGoNext}
          disableSubmit={!canSubmit}
          submitLabel="Crear Cliente"
          submittingContent={<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</>}
          submitIcon={<Check className="mr-2 h-4 w-4" />}
        />
      </div>
    </div>
  );
}

export default ClientCreatePage;

