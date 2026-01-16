import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

// ============================================
// Tipos
// ============================================

interface SidebarContextType {
  /** Si el sidebar está colapsado (desktop) */
  collapsed: boolean;
  /** Si el sidebar móvil está abierto */
  mobileOpen: boolean;
  /** Toggle colapsar/expandir sidebar */
  toggle: () => void;
  /** Colapsar sidebar */
  collapse: () => void;
  /** Expandir sidebar */
  expand: () => void;
  /** Abrir sidebar móvil */
  openMobile: () => void;
  /** Cerrar sidebar móvil */
  closeMobile: () => void;
  /** Toggle sidebar móvil */
  toggleMobile: () => void;
}

// ============================================
// Constantes
// ============================================

const SIDEBAR_COLLAPSED_KEY = "erp_sidebar_collapsed";
const MOBILE_BREAKPOINT = 1024; // lg breakpoint

// ============================================
// Contexto
// ============================================

const SidebarContext = createContext<SidebarContextType | null>(null);

// ============================================
// Provider
// ============================================

interface SidebarProviderProps {
  children: ReactNode;
  /** Estado inicial del sidebar (default: false = expandido) */
  defaultCollapsed?: boolean;
}

export const SidebarProvider = ({
  children,
  defaultCollapsed = false,
}: SidebarProviderProps) => {
  // Estado del sidebar desktop (persistido)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return defaultCollapsed;

    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return defaultCollapsed;
  });

  // Estado del sidebar móvil
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persistir estado del sidebar en localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(collapsed));
  }, [collapsed]);

  // Cerrar sidebar móvil cuando se cambia a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cerrar sidebar móvil con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  // Prevenir scroll del body cuando el sidebar móvil está abierto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Acciones
  const toggle = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const collapse = useCallback(() => {
    setCollapsed(true);
  }, []);

  const expand = useCallback(() => {
    setCollapsed(false);
  }, []);

  const openMobile = useCallback(() => {
    setMobileOpen(true);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  // Memoizar valor del contexto
  const value = useMemo<SidebarContextType>(
    () => ({
      collapsed,
      mobileOpen,
      toggle,
      collapse,
      expand,
      openMobile,
      closeMobile,
      toggleMobile,
    }),
    [
      collapsed,
      mobileOpen,
      toggle,
      collapse,
      expand,
      openMobile,
      closeMobile,
      toggleMobile,
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
