import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useMediaQuery } from "@shared/hooks/useMediaQuery";

// ============================================
// Tipos
// ============================================
interface SidebarContextType {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  isMobile: boolean;
  toggleCollapsed: () => void;
  toggleMobile: () => void;
  openMobile: () => void;
  closeMobile: () => void;
  setIsCollapsed: (collapsed: boolean) => void;
}

// ============================================
// Contexto
// ============================================
const SidebarContext = createContext<SidebarContextType | null>(null);

// ============================================
// Constantes
// ============================================
const STORAGE_KEY = "erp-sidebar-collapsed";

// ============================================
// Provider
// ============================================
interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const isMobile = useMediaQuery("(max-width: 1024px)");

  // Estado colapsado (para desktop)
  const [isCollapsed, setIsCollapsedState] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  // Estado abierto en móvil
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Persistir estado colapsado
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  // Cerrar móvil cuando cambia a desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMobileOpen(false);
    }
  }, [isMobile]);

  // Acciones
  const toggleCollapsed = useCallback(() => {
    setIsCollapsedState((prev) => !prev);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const openMobile = useCallback(() => {
    setIsMobileOpen(true);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const setIsCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsedState(collapsed);
  }, []);

  // Valor del contexto
  const value = useMemo<SidebarContextType>(
    () => ({
      isCollapsed,
      isMobileOpen,
      isMobile,
      toggleCollapsed,
      toggleMobile,
      openMobile,
      closeMobile,
      setIsCollapsed,
    }),
    [
      isCollapsed,
      isMobileOpen,
      isMobile,
      toggleCollapsed,
      toggleMobile,
      openMobile,
      closeMobile,
      setIsCollapsed,
    ]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};

// ============================================
// Hook
// ============================================
export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  return context;
};
