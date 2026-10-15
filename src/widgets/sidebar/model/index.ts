/**
 * Sidebar Model - Public API
 *
 * Ubicación: src/widgets/sidebar/model/index.ts
 */

export { navigationConfig } from "./navigation";
export { useNavigation, type UseNavigationReturn } from "./useNavigation";
export {
  SIDEBAR_COLLAPSED_WIDTH_PX,
  SIDEBAR_WIDTH_PX,
} from "./sidebarLayout";
export type {
  NavItem,
  NavGroup,
  SidebarState,
  SidebarActions,
  SidebarContextValue,
} from "./types";
