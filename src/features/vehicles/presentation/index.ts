// Components
export {
  VehicleActions,
  VehicleCard,
  VehicleCardSkeleton,
  VehicleFilters,
  VehicleForm,
  VehicleTable,
} from "./components";

// Config
export {
  VEHICLE_STATUS_CONFIG,
  VehicleStatusBadge,
  getVehicleStatusConfig,
  getVehicleStatusLabel,
} from "./config/vehicleStatusConfig";

// Pages
export { CreateVehiclePage } from "./pages/CreateVehiclePage";
export { EditVehiclePage } from "./pages/EditVehiclePage";
export { VehicleDetailPage } from "./pages/VehicleDetailPage";
export { VehicleListPage } from "./pages/VehicleListPage";

// Validations
export {
  type CreateVehicleFormData,
  type UpdateVehicleFormData,
  createVehicleSchema,
  updateVehicleSchema,
} from "./validation";
