/**
 * SidebarProvider
 *
 * Provider que gestiona el estado del sidebar (colapsado, móvil).
 *
 * Ubicación: src/app/providers/SidebarProvider.tsx
 *
 * @example
 * // En tu App
 * <SidebarProvider>
 *   <Layout />
 * </SidebarProvider>
 *
 * // En componentes
 * const { isCollapsed, toggle, isMobileOpen, closeMobile } = useSidebar();
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";

// ============================================
// Types
// ============================================

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
}

interface SidebarContextValue extends SidebarState {
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
}

// ============================================
// Context
// ============================================

const SidebarContext = createContext<SidebarContextValue | undefined>(
  undefined,
);

// ============================================
// Constants
// ============================================

const STORAGE_KEY = "boeltech-sidebar-collapsed";
const MOBILE_BREAKPOINT = 1024; // lg breakpoint

// ============================================
// Provider
// ============================================

interface SidebarProviderProps {
  children: ReactNode;
  /** Estado inicial de colapsado */
  defaultCollapsed?: boolean;
}

export function SidebarProvider({
  children,
  defaultCollapsed = false,
}: SidebarProviderProps) {
  // Estado de colapsado (persistido)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultCollapsed;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null ? stored === "true" : defaultCollapsed;
    } catch {
      return defaultCollapsed;
    }
  });

  // Estado de móvil (no persistido)
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Persistir estado de colapsado
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isCollapsed));
    } catch {
      // localStorage no disponible
    }
  }, [isCollapsed]);

  // Cerrar móvil en resize a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileOpen]);

  // Acciones
  const toggle = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const collapse = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  const expand = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  const openMobile = useCallback(() => {
    setIsMobileOpen(true);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  // Valor del contexto
  const value = useMemo<SidebarContextValue>(
    () => ({
      isCollapsed,
      isMobileOpen,
      toggle,
      collapse,
      expand,
      openMobile,
      closeMobile,
      toggleMobile,
    }),
    [
      isCollapsed,
      isMobileOpen,
      toggle,
      collapse,
      expand,
      openMobile,
      closeMobile,
      toggleMobile,
    ],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error(
      "useSidebar debe usarse dentro de un SidebarProvider. " +
        "Asegúrate de envolver tu aplicación con <SidebarProvider>.",
    );
  }

  return context;
}
