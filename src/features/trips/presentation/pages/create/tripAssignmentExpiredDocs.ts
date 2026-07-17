import type { DriverListItem } from "@features/drivers/domain";
import type { VehicleListItem } from "@features/vehicles/domain";
import { isExpired } from "@shared/utils/dateUtils";

import type { TripWizardFormValues } from "./components/validation";

/**
 * Deriva si el request debe enviar allow_expired_docs=true según la selección
 * actual de vehículo y conductor (documentación vencida en alguno de los dos).
 */
export function deriveAllowExpiredDocs(
  vehicle: Pick<VehicleListItem, "insuranceExpiry" | "sctPermitExpiry"> | undefined,
  driver: Pick<DriverListItem, "isLicenseExpired"> | undefined,
): boolean {
  const vehicleHasExpiredDocs =
    vehicle != null &&
    (isExpired(vehicle.insuranceExpiry) || isExpired(vehicle.sctPermitExpiry));
  const driverHasExpiredLicense = driver?.isLicenseExpired === true;
  return vehicleHasExpiredDocs || driverHasExpiredLicense;
}

export function buildTripAssignmentContext(
  data: Pick<TripWizardFormValues, "vehicleId" | "driverId">,
  vehicles: ReadonlyArray<
    Pick<VehicleListItem, "id" | "insuranceExpiry" | "sctPermitExpiry">
  >,
  drivers: ReadonlyArray<Pick<DriverListItem, "id" | "isLicenseExpired">>,
) {
  const vehicle = vehicles.find((item) => item.id === data.vehicleId);
  const driver = drivers.find((item) => item.id === data.driverId);
  return {
    vehicle: vehicle
      ? {
          insuranceExpiry: vehicle.insuranceExpiry,
          sctPermitExpiry: vehicle.sctPermitExpiry,
        }
      : undefined,
    driver: driver ? { isLicenseExpired: driver.isLicenseExpired } : undefined,
  };
}
