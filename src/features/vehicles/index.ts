export {
  useAssignableVehicles,
  useCreateVehicle,
  useDeleteVehicle,
  useUpdateVehicle,
  useUpdateVehicleStatus,
  useVehicle,
  useVehicles,
} from "./application";

export {
  type AssignableVehicleItem,
  type CreateVehiclePayload,
  type UpdateVehiclePayload,
  type Vehicle,
  type VehicleFiltersType,
  type VehicleListItem,
  type VehicleQueryParams,
  type VehicleStatusType,
  type VehicleTypeValue,
  VALID_STATUS_TRANSITIONS,
  VEHICLE_STATUS_LABELS,
  VEHICLE_TYPE_LABELS,
  VehicleStatus,
  VehicleType,
  vehicleQueryKeys,
} from "./domain";

export {
  type ApiVehicleListItemResponse,
  type ApiVehicleResponse,
  vehiclesApi,
} from "./infrastructure";

export {
  VEHICLE_STATUS_CONFIG,
  type CreateVehicleFormData,
  type UpdateVehicleFormData,
  CreateVehiclePage,
  EditVehiclePage,
  VehicleActions,
  VehicleCard,
  VehicleCardSkeleton,
  VehicleDetailPage,
  VehicleFilters,
  VehicleForm,
  VehicleListPage,
  VehicleStatusBadge,
  VehicleTable,
  getVehicleStatusConfig,
  getVehicleStatusLabel,
  createVehicleSchema,
  updateVehicleSchema,
} from "./presentation";
