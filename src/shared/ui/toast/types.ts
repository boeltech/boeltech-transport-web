import { type ReactNode } from "react";

/**
 * Variantes visuales del toast
 */
export type ToastVariant =
  | "default"
  | "success"
  | "destructive"
  | "warning"
  | "info";

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
 * Datos de un toast individual
 */
export interface Toast {
  /** ID único del toast */
  id: string;

  /** Título principal */
  title?: ReactNode;

  /** Descripción o mensaje secundario */
  description?: ReactNode;

  /** Variante visual */
  variant?: ToastVariant;

  /** Duración en ms (0 = no auto-dismiss) */
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
 * Props para crear un nuevo toast
 */
export type ToastProps = Omit<Toast, "id">;

/**
 * Estado del contexto
 */
export interface ToastState {
  toasts: Toast[];
}

/**
 * Acciones del contexto
 */
export interface ToastActions {
  /** Muestra un nuevo toast */
  toast: (props: ToastProps) => string;

  /** Cierra un toast específico */
  dismiss: (id: string) => void;

  /** Cierra todos los toasts */
  dismissAll: () => void;

  // Helpers con variantes predefinidas
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
}

/**
 * Contexto completo
 */
export interface ToastContextType extends ToastState, ToastActions {}

/**
 * Configuración del provider
 */
export interface ToastProviderConfig {
  /** Máximo de toasts visibles */
  maxToasts?: number;

  /** Duración por defecto en ms */
  defaultDuration?: number;

  /** Posición de los toasts */
  position?: ToastPosition;
}
