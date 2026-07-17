/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface PlatformSidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean;
}

interface PlatformSidebarContextValue extends PlatformSidebarState {
  toggle: () => void;
  collapse: () => void;
  expand: () => void;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
}

const PlatformSidebarContext = createContext<PlatformSidebarContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = "boeltech-platform-sidebar-collapsed";
const MOBILE_BREAKPOINT = 1024;

interface PlatformSidebarProviderProps {
  children: ReactNode;
  defaultCollapsed?: boolean;
}

export function PlatformSidebarProvider({
  children,
  defaultCollapsed = false,
}: PlatformSidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultCollapsed;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored !== null ? stored === "true" : defaultCollapsed;
    } catch {
      return defaultCollapsed;
    }
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isCollapsed));
    } catch {
      // localStorage no disponible
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileOpen]);

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

  const value = useMemo<PlatformSidebarContextValue>(
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
    <PlatformSidebarContext.Provider value={value}>
      {children}
    </PlatformSidebarContext.Provider>
  );
}

export function usePlatformSidebar(): PlatformSidebarContextValue {
  const context = useContext(PlatformSidebarContext);

  if (!context) {
    throw new Error(
      "usePlatformSidebar debe usarse dentro de PlatformSidebarProvider.",
    );
  }

  return context;
}
