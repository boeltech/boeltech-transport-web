/**
 * Sidebar Model - Public API
 *
 * Ubicación: src/widgets/sidebar/model/index.ts
 */

export {
  navigationConfig,
  publicRoutes,
  defaultAuthenticatedRoute,
  loginRoute,
} from "./navigation";
export { useNavigation, type UseNavigationReturn } from "./useNavigation";
export type {
  NavItem,
  NavGroup,
  SidebarState,
  SidebarActions,
  SidebarContextValue,
} from "./types";
