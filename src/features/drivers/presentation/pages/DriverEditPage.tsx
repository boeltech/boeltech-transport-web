/**
 * DriverEditPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Edición de conductor existente (FormPageShell + DriverForm).
 */

import { useParams, useNavigate } from "react-router-dom";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { UserCog, User } from "lucide-react";
import { useToast } from "@shared/hooks";
import { useDriver, useUpdateDriver } from "../../application";
import { DriverForm } from "../components/DriverForm";
import {
  driverFormDataToUpdateDriverDTO,
  type DriverFormData,
} from "../validation/driverSchema";
import {
  formatDriverName,
  DriverStatusBadge,
} from "../config/driverStatusConfig";
import { LICENSE_TYPE_LABELS, type LicenseTypeValue } from "../../domain";
import { driversCopy } from "../copy";

const copy = driversCopy.form;

export function DriverEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const driverId = id || "";

  const { data: driver, isLoading, isError } = useDriver(driverId);

  const updateMutation = useUpdateDriver({
    onSuccess: () => {
      toast({
        title: copy.edit.toast.successTitle,
        description: copy.edit.toast.successDescription,
        variant: "success",
      });
      navigate(`/drivers/${driverId}`);
    },
    onError: (error) => {
      toast({
        title: copy.edit.toast.errorTitle,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: DriverFormData) => {
    if (!driver) return;
    updateMutation.mutate({
      id: driverId,
      data: driverFormDataToUpdateDriverDTO(data, {
        status: driver.status,
        isActive: driver.isActive,
      }),
    });
  };

  const handleCancel = () => {
    navigate(`/drivers/${driverId}`);
  };

  const fullName = driver?.employee
    ? formatDriverName(driver.employee)
    : driversCopy.detail.title.fallback;

  const licenseTypeLabel = driver
    ? LICENSE_TYPE_LABELS[driver.licenseType as LicenseTypeValue] ||
      driver.licenseType
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
              driver.licenseNumber,
            )
          : undefined,
        trailing: driver ? (
          <DriverStatusBadge status={driver.status} showIcon size="sm" />
        ) : undefined,
      }}
    >
      {driver ? (
        <DriverForm
          key={driver.id}
          mode="edit"
          driver={driver}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={updateMutation.isPending}
        />
      ) : null}
    </FormPageShell>
  );
}

export default DriverEditPage;
