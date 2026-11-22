/**
 * EditVehiclePage
 *
 * Edición de vehículo existente (FormPageShell + VehicleForm).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useIncomingWayfinding } from "@shared/utils/listQueueFrom";
import {
  MODULE_LIST_PATH_LABELS,
  navigatePreservingFrom,
  resolveDetailCrumbs,
} from "@shared/utils/masterWayfinding";
import { Truck } from "lucide-react";
import { useToast, useUnsavedChangesGuard } from "@shared/hooks";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { UnsavedChangesDialog } from "@shared/ui/form";
import { VehicleForm } from "../components/VehicleForm";
import { useVehicle, useUpdateVehicle } from "@features/vehicles/application";
import type { CreateVehicleFormData } from "../validation";
import {
  VEHICLE_TYPE_LABELS,
  type UpdateVehiclePayload,
  type VehicleTypeValue,
} from "@features/vehicles/domain";
import { VehicleStatusBadge } from "../config/vehicleStatusConfig";
import { vehiclesCopy } from "../copy";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";

const copy = vehiclesCopy.form;

const VEHICLES_LIST_PATH = "/vehicles";
const VEHICLES_MODULE_LABEL =
  MODULE_LIST_PATH_LABELS[VEHICLES_LIST_PATH] ?? "Vehículos";

export function EditVehiclePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const incoming = useIncomingWayfinding();
  const incomingFrom = incoming?.from;
  const { toast } = useToast();
  const vehicleId = id ?? "";
  const [isDirty, setIsDirty] = useState(false);
  const { blocker, allowLeave, resetAllowLeave } = useUnsavedChangesGuard({
    isDirty,
  });
  const wasSubmittingRef = useRef(false);

  const { data: vehicle, isLoading, isError } = useVehicle(vehicleId);

  const updateVehicle = useUpdateVehicle({
    onSuccess: () => {
      toast({
        title: copy.edit.toast.successTitle,
        description: copy.edit.toast.successDescription,
        variant: "success",
      });
      navigatePreservingFrom(navigate, `/vehicles/${vehicleId}`, incomingFrom);
    },
    onError: (error) => {
      if (isApiError(error)) {
        toast({
          title: copy.edit.toast.errorTitle,
          description: error.getDetailedMessage(3),
          variant: "destructive",
        });
      } else {
        toast({
          title: copy.edit.toast.errorTitle,
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
    },
  });

  useEffect(() => {
    if (updateVehicle.isPending) {
      wasSubmittingRef.current = true;
      return;
    }
    if (wasSubmittingRef.current) {
      wasSubmittingRef.current = false;
      resetAllowLeave();
    }
  }, [updateVehicle.isPending, resetAllowLeave]);

  const handleSubmit = useCallback(
    (data: CreateVehicleFormData) => {
      const rest = { ...data } as Record<string, unknown>;
      delete rest.unitNumber;
      rest.remolques = [];
      const payload: UpdateVehiclePayload = {};

      for (const [key, value] of Object.entries(rest)) {
        if (value !== "" && value !== undefined) {
          (payload as Record<string, unknown>)[key] = value;
        }
      }

      allowLeave();
      updateVehicle.mutate({ id: vehicleId, data: payload });
    },
    [allowLeave, updateVehicle, vehicleId],
  );

  const handleCancel = () => {
    navigatePreservingFrom(navigate, `/vehicles/${vehicleId}`, incomingFrom);
  };

  const typeLabel = vehicle
    ? VEHICLE_TYPE_LABELS[vehicle.type as VehicleTypeValue] || vehicle.type
    : "";

  const detailHref = vehicleId ? `/vehicles/${vehicleId}` : VEHICLES_LIST_PATH;
  const crumbs = useMemo(
    () =>
      resolveDetailCrumbs({
        from: incomingFrom ?? detailHref,
        fromLabel: incoming?.fromLabel ?? vehicle?.unitNumber,
        module: {
          listPath: VEHICLES_LIST_PATH,
          label: VEHICLES_MODULE_LABEL,
        },
        current: { label: "Editar" },
      }),
    [
      detailHref,
      incoming?.fromLabel,
      incomingFrom,
      vehicle?.unitNumber,
    ],
  );

  // Unidad dada de baja: solo lectura (la API responde 409 VEHICLE_INACTIVE_READONLY).
  if (vehicle && !vehicle.isActive) {
    return (
      <Navigate
        to={`/vehicles/${vehicleId}`}
        replace
        state={incomingFrom ? { from: incomingFrom } : undefined}
      />
    );
  }

  return (
    <FormPageShell
      isLoading={isLoading}
      notFound={!isLoading && (isError || !vehicle)}
      notFoundConfig={{
        icon: <Truck />,
        title: copy.state.notFoundTitle,
        description: copy.state.notFoundDescription,
        backHref: VEHICLES_LIST_PATH,
        backLabel: copy.state.backToList,
      }}
      header={{
        crumbs,
        title: copy.edit.title,
        subtitle: vehicle
          ? copy.edit.subtitle(
              vehicle.unitNumber,
              typeLabel,
              vehicle.licensePlate,
              vehicle.brand,
              vehicle.model,
              vehicle.year,
            )
          : undefined,
        trailing: vehicle ? (
          <VehicleStatusBadge status={vehicle.status} showIcon size="sm" />
        ) : undefined,
      }}
    >
      {vehicle ? (
        <VehicleForm
          key={vehicle.id}
          vehicle={vehicle}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDirtyChange={setIsDirty}
          isSubmitting={updateVehicle.isPending}
        />
      ) : null}
      <UnsavedChangesDialog blocker={blocker} />
    </FormPageShell>
  );
}

export default EditVehiclePage;
