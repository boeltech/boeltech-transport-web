/**
 * useToast Hook
 *
 * Hook para mostrar notificaciones toast.
 * Usa Sonner internamente pero abstrae la implementación.
 *
 * Ubicación: src/shared/hooks/useToast.ts
 *
 * @example
 * // En componentes React
 * const { toast, success, error } = useToast();
 *
 * // Toast genérico
 * toast({ title: 'Mensaje', variant: 'info' });
 *
 * // Helpers rápidos
 * success('Guardado correctamente');
 * error('Ocurrió un error', 'Intente nuevamente');
 *
 * // Con promise
 * promise(saveData(), {
 *   loading: 'Guardando...',
 *   success: 'Guardado',
 *   error: 'Error al guardar'
 * });
 */

import { useCallback } from "react";
import { toast as sonnerToast } from "sonner";
import type {
  ToastVariant,
  ToastOptions,
  ToastPromiseMessages,
  UseToastReturn,
} from "@/shared/ui/toast/types";

// ============================================
// Helper para obtener la función de toast correcta
// ============================================

/**
 * Obtiene la función de toast según la variante
 */
function getToastFunction(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return sonnerToast.success;
    case "error":
      return sonnerToast.error;
    case "warning":
      return sonnerToast.warning;
    case "info":
      return sonnerToast.info;
    case "default":
    default:
      // Para "default", usamos sonnerToast directamente como función
      return (message: string, options?: Parameters<typeof sonnerToast>[1]) =>
        sonnerToast(message, options);
  }
}

// ============================================
// Hook
// ============================================

export function useToast(): UseToastReturn {
  /**
   * Muestra un toast con opciones completas
   */
  const toast = useCallback((options: ToastOptions): string | number => {
    const {
      title,
      description,
      variant = "default",
      duration,
      action,
      onClose,
      dismissible = true,
    } = options;

    const toastFn = getToastFunction(variant);

    return toastFn(title, {
      description,
      duration,
      dismissible,
      onDismiss: onClose,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
    });
  }, []);

  /**
   * Cierra un toast específico o todos
   */
  const dismiss = useCallback((toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  }, []);

  /**
   * Toast con promise (loading → success/error)
   */
  const promise = useCallback(
    <T>(
      promiseToResolve: Promise<T>,
      messages: ToastPromiseMessages<T>,
    ): Promise<T> => {
      return sonnerToast.promise(promiseToResolve, messages);
    },
    [],
  );

  /**
   * Helper: Toast de éxito
   */
  const success = useCallback((title: string, description?: string) => {
    return sonnerToast.success(title, { description });
  }, []);

  /**
   * Helper: Toast de error
   */
  const error = useCallback((title: string, description?: string) => {
    return sonnerToast.error(title, { description });
  }, []);

  /**
   * Helper: Toast de advertencia
   */
  const warning = useCallback((title: string, description?: string) => {
    return sonnerToast.warning(title, { description });
  }, []);

  /**
   * Helper: Toast de información
   */
  const info = useCallback((title: string, description?: string) => {
    return sonnerToast.info(title, { description });
  }, []);

  return {
    toast,
    dismiss,
    promise,
    success,
    error,
    warning,
    info,
  };
}

// ============================================
// Funciones standalone (para uso fuera de componentes)
// ============================================

/**
 * Muestra un toast de éxito
 * @example toastSuccess('Guardado', 'Los cambios se aplicaron');
 */
export function toastSuccess(title: string, description?: string) {
  return sonnerToast.success(title, { description });
}

/**
 * Muestra un toast de error
 * @example toastError('Error', 'No se pudo guardar');
 */
export function toastError(title: string, description?: string) {
  return sonnerToast.error(title, { description });
}

/**
 * Muestra un toast de advertencia
 * @example toastWarning('Atención', 'Revise los datos');
 */
export function toastWarning(title: string, description?: string) {
  return sonnerToast.warning(title, { description });
}

/**
 * Muestra un toast de información
 * @example toastInfo('Info', 'Proceso en curso');
 */
export function toastInfo(title: string, description?: string) {
  return sonnerToast.info(title, { description });
}

/**
 * Muestra un toast con promise
 * @example
 * toastPromise(fetchData(), {
 *   loading: 'Cargando...',
 *   success: 'Datos cargados',
 *   error: (err) => `Error: ${err.message}`
 * });
 */
export function toastPromise<T>(
  promise: Promise<T>,
  messages: ToastPromiseMessages<T>,
): Promise<T> {
  return sonnerToast.promise(promise, messages);
}

/**
 * Cierra un toast específico o todos
 * @example toastDismiss(); // Cierra todos
 * @example toastDismiss(toastId); // Cierra uno específico
 */
export function toastDismiss(toastId?: string | number) {
  sonnerToast.dismiss(toastId);
}

// Re-exportar tipos
export type {
  ToastVariant,
  ToastOptions,
  ToastPromiseMessages,
  UseToastReturn,
} from "@/shared/ui/toast/types";
