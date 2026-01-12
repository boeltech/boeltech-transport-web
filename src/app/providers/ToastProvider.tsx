import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type {
  Toast,
  ToastProps,
  ToastContextType,
  ToastProviderConfig,
} from "@shared/ui/toast/types";

// ============================================
// Constantes
// ============================================
const DEFAULT_DURATION = 5000; // 5 segundos
const MAX_TOASTS = 5;

// ============================================
// Generador de IDs únicos
// ============================================
let toastCount = 0;
const generateId = (): string => {
  toastCount += 1;
  return `toast-${toastCount}-${Date.now()}`;
};

// ============================================
// Reducer
// ============================================
type ToastAction =
  | { type: "ADD"; toast: Toast }
  | { type: "DISMISS"; id: string }
  | { type: "DISMISS_ALL" };

interface ToastStateInternal {
  toasts: Toast[];
}

const toastReducer = (
  state: ToastStateInternal,
  action: ToastAction
): ToastStateInternal => {
  switch (action.type) {
    case "ADD":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, MAX_TOASTS),
      };
    case "DISMISS":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };
    case "DISMISS_ALL":
      return {
        ...state,
        toasts: [],
      };
    default:
      return state;
  }
};

// ============================================
// Contexto
// ============================================
const ToastContext = createContext<ToastContextType | null>(null);

// ============================================
// Provider
// ============================================
interface ToastProviderProps extends ToastProviderConfig {
  children: ReactNode;
}

export const ToastProvider = ({
  children,
  maxToasts = MAX_TOASTS,
  defaultDuration = DEFAULT_DURATION,
}: ToastProviderProps) => {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });

  // Map para almacenar los timeouts de auto-dismiss
  const timeoutsRef = useMemo(() => new Map<string, NodeJS.Timeout>(), []);

  // ============================================
  // Dismiss
  // ============================================
  const dismiss = useCallback(
    (id: string) => {
      // Limpiar timeout si existe
      const timeout = timeoutsRef.get(id);
      if (timeout) {
        clearTimeout(timeout);
        /**
         * Check error!
         */
        // timeoutsRef.delete(id);
      }

      // Encontrar el toast para ejecutar onClose
      const toast = state.toasts.find((t) => t.id === id);
      if (toast?.onClose) {
        toast.onClose();
      }

      dispatch({ type: "DISMISS", id });
    },
    [state.toasts, timeoutsRef]
  );

  // ============================================
  // Dismiss All
  // ============================================
  const dismissAll = useCallback(() => {
    // Limpiar todos los timeouts
    timeoutsRef.forEach((timeout) => clearTimeout(timeout));
    /**
     * Check error!
     */
    // timeoutsRef.clear();

    // Ejecutar onClose de todos
    state.toasts.forEach((toast) => {
      if (toast.onClose) {
        toast.onClose();
      }
    });

    dispatch({ type: "DISMISS_ALL" });
  }, [state.toasts, timeoutsRef]);

  // ============================================
  // Toast (crear nuevo)
  // ============================================
  const toast = useCallback(
    (props: ToastProps): string => {
      const id = generateId();
      const duration = props.duration ?? defaultDuration;

      const newToast: Toast = {
        ...props,
        id,
        dismissible: props.dismissible ?? true,
      };

      dispatch({ type: "ADD", toast: newToast });

      // Auto-dismiss si tiene duración
      if (duration > 0) {
        const timeout = setTimeout(() => {
          dismiss(id);
        }, duration);
        /**
         * Check error!
         */
        timeoutsRef.set(id, timeout);
      }

      return id;
    },
    [defaultDuration, dismiss, timeoutsRef]
  );

  // ============================================
  // Helpers con variantes
  // ============================================
  const success = useCallback(
    (title: string, description?: string): string => {
      return toast({ title, description, variant: "success" });
    },
    [toast]
  );

  const error = useCallback(
    (title: string, description?: string): string => {
      return toast({ title, description, variant: "destructive" });
    },
    [toast]
  );

  const warning = useCallback(
    (title: string, description?: string): string => {
      return toast({ title, description, variant: "warning" });
    },
    [toast]
  );

  const info = useCallback(
    (title: string, description?: string): string => {
      return toast({ title, description, variant: "info" });
    },
    [toast]
  );

  // ============================================
  // Valor del contexto
  // ============================================
  const value = useMemo<ToastContextType>(
    () => ({
      toasts: state.toasts,
      toast,
      dismiss,
      dismissAll,
      success,
      error,
      warning,
      info,
    }),
    [state.toasts, toast, dismiss, dismissAll, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};

// ============================================
// Hook para consumir el contexto
// ============================================
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
};
