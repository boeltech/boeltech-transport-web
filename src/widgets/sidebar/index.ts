/**
 * Sidebar Widget - Public API
 * Feature-Sliced Design
 *
 * Widget de navegación lateral con soporte para permisos.
 *
 * Ubicación: src/widgets/sidebar/index.ts
 *
 * ============================================================================
 * ESTRUCTURA:
 * ============================================================================
 *
 * src/widgets/sidebar/
 * ├── model/              → Lógica y datos
 * │   ├── types.ts        → Tipos
 * │   ├── navigation.ts   → Configuración de navegación
 * │   └── useNavigation.ts → Hook con filtrado por permisos
 * │
 * ├── ui/                 → Componentes
 * │   ├── Sidebar.tsx     → Sidebar desktop
 * │   └── MobileSidebar.tsx → Sidebar móvil
 * │
 * └── index.ts            → Public API
 *
 * ============================================================================
 * USO:
 * ============================================================================
 *
 * // En tu layout
 * import { Sidebar, MobileSidebar } from '@/widgets/sidebar';
 *
 * function Layout() {
 *   return (
 *     <div className="flex h-screen">
 *       <Sidebar />
 *       <MobileSidebar />
 *       <main>{children}</main>
 *     </div>
 *   );
 * }
 *
 * // Usar el hook para navegación custom
 * import { useNavigation } from '@/widgets/sidebar';
 *
 * function Breadcrumb() {
 *   const { currentBreadcrumb } = useNavigation();
 *   return <span>{currentBreadcrumb.item?.label}</span>;
 * }
 */

// UI Components
export { Sidebar, MobileSidebar } from "./ui";

// Model
export {
  useNavigation,
  navigationConfig,
  publicRoutes,
  defaultAuthenticatedRoute,
  loginRoute,
  type UseNavigationReturn,
} from "./model";

// Types
export type {
  NavItem,
  NavGroup,
  SidebarState,
  SidebarActions,
  SidebarContextValue,
} from "./model";
