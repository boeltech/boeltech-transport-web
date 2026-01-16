import { type ReactNode } from "react";
import { Toaster, toast } from "sonner";
import { useTheme } from "./ThemeProvider";

// ============================================
// Tipos
// ============================================

interface ToastProviderProps {
  children: ReactNode;
}

// ============================================
// Provider
// ============================================

/**
 * ToastProvider
 *
 * Provee el sistema de notificaciones toast usando Sonner.
 * El Toaster se renderiza aquí, los hijos pueden usar toast() directamente.
 */
export const ToastProvider = ({ children }: ToastProviderProps) => {
  return (
    <>
      {children}
      <ToasterComponent />
    </>
  );
};

/**
 * Componente Toaster interno
 * Separado para poder usar useTheme
 */
const ToasterComponent = () => {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme}
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
        },
        className: "shadow-lg",
      }}
    />
  );
};

// ============================================
// Utilidades de toast
// ============================================

/**
 * Helpers para mostrar toasts con estilos predefinidos
 */
export const showToast = {
  /**
   * Toast de éxito
   */
  success: (message: string, description?: string) => {
    toast.success(message, { description });
  },

  /**
   * Toast de error
   */
  error: (message: string, description?: string) => {
    toast.error(message, { description });
  },

  /**
   * Toast de información
   */
  info: (message: string, description?: string) => {
    toast.info(message, { description });
  },

  /**
   * Toast de advertencia
   */
  warning: (message: string, description?: string) => {
    toast.warning(message, { description });
  },

  /**
   * Toast de carga (con promise)
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },

  /**
   * Toast personalizado
   */
  custom: (message: string, options?: Parameters<typeof toast>[1]) => {
    toast(message, options);
  },

  /**
   * Cerrar todos los toasts
   */
  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },
};

// Re-exportar toast original para casos avanzados
export { toast };
