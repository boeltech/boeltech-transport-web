/**
 * EditVehiclePage
 *
 * Edición de vehículo existente (FormPageShell + VehicleForm).
 */

import { useNavigate, useParams } from "react-router-dom";
import { Truck } from "lucide-react";
import { useToast } from "@shared/hooks";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
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

export function EditVehiclePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const vehicleId = id ?? "";

  const { data: vehicle, isLoading, isError } = useVehicle(vehicleId);

  const updateVehicle = useUpdateVehicle({
    onSuccess: () => {
      toast({
        title: copy.edit.toast.successTitle,
        description: copy.edit.toast.successDescription,
        variant: "success",
      });
      navigate(`/vehicles/${vehicleId}`);
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

  const handleSubmit = (data: CreateVehicleFormData) => {
    const rest = { ...data } as Record<string, unknown>;
    delete rest.unitNumber;
    rest.remolques = [];
    const payload: UpdateVehiclePayload = {};

    for (const [key, value] of Object.entries(rest)) {
      if (value !== "" && value !== undefined) {
        (payload as Record<string, unknown>)[key] = value;
      }
    }

    updateVehicle.mutate({ id: vehicleId, data: payload });
  };

  const handleCancel = () => {
    navigate(`/vehicles/${vehicleId}`);
  };

  const typeLabel = vehicle
    ? VEHICLE_TYPE_LABELS[vehicle.type as VehicleTypeValue] || vehicle.type
    : "";

  return (
    <FormPageShell
      isLoading={isLoading}
      notFound={!isLoading && (isError || !vehicle)}
      notFoundConfig={{
        icon: <Truck />,
        title: copy.state.notFoundTitle,
        description: copy.state.notFoundDescription,
        backHref: "/vehicles",
        backLabel: copy.state.backToList,
      }}
      header={{
        backHref: `/vehicles/${vehicleId}`,
        icon: <Truck className="h-5 w-5" />,
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
          isSubmitting={updateVehicle.isPending}
        />
      ) : null}
    </FormPageShell>
  );
}

export default EditVehiclePage;
