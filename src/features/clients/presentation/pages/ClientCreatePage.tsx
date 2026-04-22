/**
 * ClientCreatePage
 * Clean Architecture - Presentation Layer
 *
 * Página de creación de cliente usando un wizard de 2 pasos:
 * 1. Información del cliente (ClientForm)
 * 2. Dirección fiscal (ClientAddressForm)
 *
 * Ubicación: src/features/clients/presentation/pages/ClientCreatePage.tsx
 */

import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Progress } from "@shared/ui/progress";
import { ScrollArea } from "@shared/ui/scroll-area";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Building2,
  MapPin,
  Users,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

import { useCreateClient } from "../../application";
import { CLIENT_WIZARD_STEPS, type ClientWizardStep } from "../../domain";
import { ClientForm, ClientAddressForm } from "../components";
import type { ClientFormData } from "../validation/clientSchema";
import type { ClientAddressFormData } from "../validation/clientAddressSchema";

// ============================================================================
// TYPES
// ============================================================================

interface WizardState {
  currentStep: ClientWizardStep;
  clientData: ClientFormData | null;
  addressData: ClientAddressFormData | null;
  isClientValid: boolean;
  isAddressValid: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientCreatePage() {
  const navigate = useNavigate();
  const createClientMutation = useCreateClient();

  // Wizard state
  const [state, setState] = useState<WizardState>({
    currentStep: "info",
    clientData: null,
    addressData: null,
    isClientValid: false,
    isAddressValid: false,
  });

  // Current step index
  const currentStepIndex = CLIENT_WIZARD_STEPS.findIndex(
    (s) => s.id === state.currentStep,
  );
  const progress = ((currentStepIndex + 1) / CLIENT_WIZARD_STEPS.length) * 100;

  // Handlers (useCallback evita bucles: los formularios sincronizan vía useEffect/useWatch
  // y una función nueva en cada render re-dispara esos efectos → Maximum update depth exceeded)
  const handleClientChange = useCallback(
    (data: ClientFormData, isValid: boolean) => {
      setState((prev) => ({
        ...prev,
        clientData: data,
        isClientValid: isValid,
      }));
    },
    [],
  );

  const handleAddressChange = useCallback(
    (data: ClientAddressFormData, isValid: boolean) => {
      setState((prev) => ({
        ...prev,
        addressData: data,
        isAddressValid: isValid,
      }));
    },
    [],
  );

  const handleNext = () => {
    if (state.currentStep === "info" && state.isClientValid) {
      setState((prev) => ({ ...prev, currentStep: "address" }));
    }
  };

  const handleBack = () => {
    if (state.currentStep === "address") {
      setState((prev) => ({ ...prev, currentStep: "info" }));
    } else {
      navigate("/clients");
    }
  };

  const handleSubmit = async () => {
    if (!state.clientData || !state.addressData) return;
    if (!state.isClientValid || !state.isAddressValid) return;

    createClientMutation.mutate(
      {
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
        billingAddress: {
          addressType: "billing",
          isPrimary: true,
          locationName: state.addressData.locationName || undefined,
          satEstadoCode: state.addressData.satEstadoCode,
          satMunicipioCode: state.addressData.satMunicipioCode,
          postalCode: state.addressData.postalCode,
          satLocalidadCode: state.addressData.satLocalidadCode || undefined,
          satColoniaCode: state.addressData.satColoniaCode || undefined,
          street: state.addressData.street || undefined,
          exteriorNumber: state.addressData.exteriorNumber || undefined,
          interiorNumber: state.addressData.interiorNumber || undefined,
          reference: state.addressData.reference || undefined,
          rfcRemitenteDestinatario:
            state.addressData.rfcRemitenteDestinatario ||
            state.clientData.taxId,
          nombreRemitenteDestinatario:
            state.addressData.nombreRemitenteDestinatario ||
            state.clientData.legalName,
          latitude: state.addressData.latitude ?? undefined,
          longitude: state.addressData.longitude ?? undefined,
          contactName: state.addressData.contactName || undefined,
          contactPhone: state.addressData.contactPhone || undefined,
          contactEmail: state.addressData.contactEmail || undefined,
          businessHours: state.addressData.businessHours || undefined,
          notes: state.addressData.notes || undefined,
          specialInstructions:
            state.addressData.specialInstructions || undefined,
        },
      },
      {
        onSuccess: (result) => {
          navigate(`/clients/${result.clientId}`);
        },
      },
    );
  };

  const isSubmitting = createClientMutation.isPending;
  const canGoNext = state.currentStep === "info" && state.isClientValid;
  const canSubmit =
    state.currentStep === "address" &&
    state.isClientValid &&
    state.isAddressValid;

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nuevo Cliente</h1>
            <p className="text-sm text-muted-foreground">
              Completa la información para crear un nuevo cliente
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Progress bar */}
            <Progress value={progress} className="h-2" />

            {/* Steps */}
            <div className="flex justify-between">
              {CLIENT_WIZARD_STEPS.map((step, index) => {
                const isCurrent = step.id === state.currentStep;
                const isCompleted = index < currentStepIndex;
                const StepIcon = index === 0 ? Building2 : MapPin;

                return (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-center gap-2",
                      index > 0 && "flex-1 justify-end",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                        isCompleted &&
                          "border-primary bg-primary text-primary-foreground",
                        isCurrent && "border-primary text-primary",
                        !isCurrent &&
                          !isCompleted &&
                          "border-muted text-muted-foreground",
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isCurrent && "text-primary",
                          !isCurrent && "text-muted-foreground",
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {state.currentStep === "info" ? (
              <>
                <Building2 className="h-5 w-5" />
                Información del Cliente
              </>
            ) : (
              <>
                <MapPin className="h-5 w-5" />
                Dirección Fiscal
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            <div className="pr-4">
              {state.currentStep === "info" ? (
                <ClientForm
                  defaultValues={state.clientData ?? undefined}
                  onChange={handleClientChange}
                  disabled={isSubmitting}
                />
              ) : (
                <ClientAddressForm
                  isBillingAddress
                  defaultValues={state.addressData ?? undefined}
                  clientRfc={state.clientData?.taxId}
                  clientName={state.clientData?.legalName}
                  onChange={handleAddressChange}
                  disabled={isSubmitting}
                />
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {state.currentStep === "info" ? "Cancelar" : "Anterior"}
        </Button>

        <div className="flex items-center gap-2">
          {state.currentStep === "info" ? (
            <Button onClick={handleNext} disabled={!canGoNext || isSubmitting}>
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Crear Cliente
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientCreatePage;
