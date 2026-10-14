/**
 * DriverEditPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Edición de conductor existente (FormPageShell + DriverForm).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useIncomingFrom } from "@shared/utils/listQueueFrom";
import { navigatePreservingFrom } from "@shared/utils/masterWayfinding";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { UnsavedChangesDialog } from "@shared/ui/form";
import { UserCog, User } from "lucide-react";
import { useToast, useUnsavedChangesGuard } from "@shared/hooks";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";
import { useDriver, useUpdateDriver } from "../../application";
import { DriverForm, type DriverFormRef } from "../components/DriverForm";
import {
  driverFormDataToUpdateDriverDTO,
  type DriverFormData,
} from "../validation/driverSchema";
import {
  formatDriverName,
  DriverStatusBadge,
} from "../config/driverStatusConfig";
import {
  getDriverPrimaryCategoryLabel,
  getDriverPrimaryLicenseNumber,
  LICENSE_TYPE_LABELS,
} from "../../domain";
import { driversCopy } from "../copy";

const copy = driversCopy.form;

export function DriverEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const incomingFrom = useIncomingFrom();
  const { toast } = useToast();
  const formRef = useRef<DriverFormRef>(null);
  const driverId = id || "";
  const [isDirty, setIsDirty] = useState(false);
  const { blocker, allowLeave, resetAllowLeave } = useUnsavedChangesGuard({
    isDirty,
  });
  const wasSubmittingRef = useRef(false);

  const { data: driver, isLoading, isError } = useDriver(driverId);

  const updateMutation = useUpdateDriver({
    onSuccess: () => {
      toast({
        title: copy.edit.toast.successTitle,
        description: copy.edit.toast.successDescription,
        variant: "success",
      });
      navigatePreservingFrom(navigate, `/drivers/${driverId}`, incomingFrom);
    },
    onError: (error) => {
      if (isApiError(error) && error.hasValidationErrors()) {
        formRef.current?.applyApiValidationErrors(
          error.validationErrors.map((entry) => ({
            field: entry.field,
            message: entry.message,
          })),
        );
        toast({
          title: copy.edit.toast.errorTitle,
          description: error.getToastMessage(),
          variant: "destructive",
        });
        return;
      }

      const description = isApiError(error)
        ? error.getDetailedMessage()
        : getErrorMessage(error);
      formRef.current?.setApiAlertMessages(
        description ? [description] : [getErrorMessage(error)],
      );
      toast({
        title: copy.edit.toast.errorTitle,
        description,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (updateMutation.isPending) {
      wasSubmittingRef.current = true;
      return;
    }
    if (wasSubmittingRef.current) {
      wasSubmittingRef.current = false;
      resetAllowLeave();
    }
  }, [updateMutation.isPending, resetAllowLeave]);

  const handleSubmit = useCallback(
    (data: DriverFormData) => {
      if (!driver) return;
      formRef.current?.clearApiErrors();
      allowLeave();
      updateMutation.mutate({
        id: driverId,
        data: driverFormDataToUpdateDriverDTO(data),
      });
    },
    [allowLeave, driver, driverId, updateMutation],
  );

  const handleCancel = useCallback(() => {
    navigatePreservingFrom(navigate, `/drivers/${driverId}`, incomingFrom);
  }, [navigate, driverId, incomingFrom]);

  const fullName = driver?.employee
    ? formatDriverName(driver.employee)
    : driversCopy.detail.title.fallback;

  const licenseTypeLabel = driver
    ? getDriverPrimaryCategoryLabel(driver, LICENSE_TYPE_LABELS)
    : "";
  const primaryLicenseNumber = driver
    ? getDriverPrimaryLicenseNumber(driver)
    : "";

  return (
    <FormPageShell
      isLoading={isLoading}
      notFound={!isLoading && (isError || !driver)}
      notFoundConfig={{
        icon: <User />,
        title: copy.state.notFoundTitle,
        description: copy.state.notFoundDescription,
        backHref: "/drivers",
        backLabel: copy.state.backToList,
      }}
      header={{
        backHref: `/drivers/${driverId}`,
        icon: <UserCog className="h-5 w-5" />,
        title: copy.edit.title,
        subtitle: driver
          ? copy.edit.subtitle(
              fullName,
              driver.employee?.employeeNumber ?? null,
              licenseTypeLabel,
              primaryLicenseNumber,
            )
          : undefined,
        trailing: driver ? (
          <DriverStatusBadge status={driver.status} showIcon size="sm" />
        ) : undefined,
      }}
    >
      {driver ? (
        <DriverForm
          ref={formRef}
          key={driver.id}
          mode="edit"
          driver={driver}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDirtyChange={setIsDirty}
          isSubmitting={updateMutation.isPending}
        />
      ) : null}
      <UnsavedChangesDialog blocker={blocker} />
    </FormPageShell>
  );
}

export default DriverEditPage;
