/**
 * CreateVehiclePage
 *
 * Página para registrar un nuevo vehículo en la flota (wizard alineado a viajes).
 *
 * Ubicación: src/features/vehicles/presentation/pages/CreateVehiclePage.tsx
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WizardPageShell } from "@shared/ui/page-shells/WizardPageShell";
import { useToast, useUnsavedChangesGuard } from "@shared/hooks";
import { UnsavedChangesDialog } from "@shared/ui/form";
import { MODULE_LIST_PATH_LABELS } from "@shared/utils/masterWayfinding";
import {
  VehicleForm,
  type VehicleFormRef,
} from "../components/VehicleForm";
import { useCreateVehicle } from "@features/vehicles/application";
import type { CreateVehiclePayload } from "@features/vehicles/domain";
import type { CreateVehicleFormData } from "../validation";
import { vehiclesCopy } from "../copy";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";

const copy = vehiclesCopy.form.create;
const WIZARD_STEPS = [...copy.wizard.steps];

const VEHICLES_LIST_PATH = "/vehicles";
const VEHICLES_MODULE_LABEL =
  MODULE_LIST_PATH_LABELS[VEHICLES_LIST_PATH] ?? "Vehículos";

export function CreateVehiclePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const formRef = useRef<VehicleFormRef>(null);
  const [isDirty, setIsDirty] = useState(false);
  const { blocker, allowLeave, resetAllowLeave } = useUnsavedChangesGuard({
    isDirty,
  });
  const wasSubmittingRef = useRef(false);

  const createVehicle = useCreateVehicle({
    onSuccess: (data) => {
      toast({
        title: copy.toastSuccessTitle,
        description: copy.toastSuccessDescription(data.unitNumber),
        variant: "success",
      });
      navigate(`/vehicles/${data.id}`);
    },
    onError: (error) => {
      if (isApiError(error)) {
        toast({
          title: copy.toastErrorTitle,
          description: error.getDetailedMessage(3),
          variant: "destructive",
        });
      } else {
        toast({
          title: copy.toastErrorTitle,
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
    },
  });

  useEffect(() => {
    if (createVehicle.isPending) {
      wasSubmittingRef.current = true;
      return;
    }
    if (wasSubmittingRef.current) {
      wasSubmittingRef.current = false;
      resetAllowLeave();
    }
  }, [createVehicle.isPending, resetAllowLeave]);

  const handleSubmit = useCallback(
    (data: CreateVehicleFormData) => {
      const payload: CreateVehiclePayload = {
        ...data,
        remolques: [],
        currentMileage: data.currentMileage ?? 0,
      };
      allowLeave();
      createVehicle.mutate(payload);
    },
    [allowLeave, createVehicle],
  );

  const isSubmitting = createVehicle.isPending;

  const renderStep = useCallback(
    (currentStep: number) => (
      <div className="space-y-3">
        {currentStep < WIZARD_STEPS.length - 1 ? (
          <p className="max-w-md text-sm text-muted-foreground">
            {copy.stepHelp}
          </p>
        ) : null}
        <VehicleForm
          ref={formRef}
          onSubmit={handleSubmit}
          onDirtyChange={setIsDirty}
          isSubmitting={isSubmitting}
          wizardMode
          wizardStepIndex={currentStep}
        />
      </div>
    ),
    [handleSubmit, isSubmitting],
  );

  return (
    <>
      <WizardPageShell
        steps={WIZARD_STEPS}
        formRef={formRef}
        header={{
          crumbs: [
            { label: VEHICLES_MODULE_LABEL, to: VEHICLES_LIST_PATH },
            { label: copy.title },
          ],
          exitHref: VEHICLES_LIST_PATH,
          title: copy.title,
          subtitle: copy.subtitle,
        }}
        renderStep={renderStep}
        isSubmitting={isSubmitting}
        submitLabel={copy.submit}
        submittingLabel={copy.submitting}
        stepsAriaLabel={copy.stepsAriaLabel}
        onCancel={() => navigate(VEHICLES_LIST_PATH)}
      />
      <UnsavedChangesDialog blocker={blocker} />
    </>
  );
}
