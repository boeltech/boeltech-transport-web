/**
 * App Router - Public API
 *
 * Ubicación: src/app/router/index.ts
 */

// Router
export { router } from "./routes";

// Guards
export {
  PrivateRoute,
  PermissionRoute,
  RoleRoute,
  AdminRoute,
  ModuleRoute,
  AnyModuleRoute,
} from "./guards";
