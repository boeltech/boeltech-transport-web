/**
 * Toast Types
 *
 * Tipos compartidos para el sistema de notificaciones.
 * Ubicación: src/shared/ui/toast/types.ts
 */

// import type { ReactNode } from 'react';

/**
 * Variantes visuales del toast
 */
export type ToastVariant =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "destructive";

/**
 * Posición del toast en la pantalla
 */
export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

/**
 * Opciones para mostrar un toast
 */
export interface ToastOptions {
  /** Título principal del toast */
  title: string;
  /** Descripción opcional */
  description?: string;
  /** Variante visual */
  variant?: ToastVariant;
  /** Duración en ms (default: 4000, 0 = sin auto-dismiss) */
  duration?: number;
  /** Acción opcional (botón) */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Callback cuando se cierra */
  onClose?: () => void;
  /** Si se puede cerrar manualmente */
  dismissible?: boolean;
}

/**
 * Mensajes para toast con promise
 */
export interface ToastPromiseMessages<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: unknown) => string);
}

/**
 * Retorno del hook useToast
 */
export interface UseToastReturn {
  /** Muestra un toast genérico */
  toast: (options: ToastOptions) => string | number;
  /** Cierra un toast específico o todos */
  dismiss: (toastId?: string | number) => void;
  /** Toast con promise (loading → success/error) */
  promise: <T>(
    promise: Promise<T>,
    messages: ToastPromiseMessages<T>,
  ) => Promise<T>;
  /** Helpers con variantes predefinidas */
  success: (title: string, description?: string) => string | number;
  error: (title: string, description?: string) => string | number;
  warning: (title: string, description?: string) => string | number;
  info: (title: string, description?: string) => string | number;
}

/**
 * Configuración del Toaster
 */
export interface ToasterConfig {
  /** Posición de los toasts */
  position?: ToastPosition;
  /** Duración por defecto en ms */
  duration?: number;
  /** Expandir toasts */
  expand?: boolean;
  /** Mostrar botón de cerrar */
  closeButton?: boolean;
  /** Colores enriquecidos (verde éxito, rojo error, etc.) */
  richColors?: boolean;
}
