/**
 * DriverEditPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Edición de conductor existente (FormPageShell + DriverForm).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useIncomingWayfinding } from "@shared/utils/listQueueFrom";
import {
  MODULE_LIST_PATH_LABELS,
  navigatePreservingFrom,
  resolveDetailCrumbs,
} from "@shared/utils/masterWayfinding";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { UnsavedChangesDialog } from "@shared/ui/form";
import { User } from "lucide-react";
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

const DRIVERS_LIST_PATH = "/drivers";
const DRIVERS_MODULE_LABEL =
  MODULE_LIST_PATH_LABELS[DRIVERS_LIST_PATH] ?? "Conductores";

export function DriverEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const incoming = useIncomingWayfinding();
  const incomingFrom = incoming?.from;
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

  const detailHref = driverId ? `/drivers/${driverId}` : DRIVERS_LIST_PATH;
  const crumbs = useMemo(
    () =>
      resolveDetailCrumbs({
        from: incomingFrom ?? detailHref,
        fromLabel: incoming?.fromLabel ?? (driver ? fullName : undefined),
        module: {
          listPath: DRIVERS_LIST_PATH,
          label: DRIVERS_MODULE_LABEL,
        },
        current: { label: "Editar" },
      }),
    [detailHref, driver, fullName, incoming?.fromLabel, incomingFrom],
  );

  return (
    <FormPageShell
      isLoading={isLoading}
      notFound={!isLoading && (isError || !driver)}
      notFoundConfig={{
        icon: <User />,
        title: copy.state.notFoundTitle,
        description: copy.state.notFoundDescription,
        backHref: DRIVERS_LIST_PATH,
        backLabel: copy.state.backToList,
      }}
      header={{
        crumbs,
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
