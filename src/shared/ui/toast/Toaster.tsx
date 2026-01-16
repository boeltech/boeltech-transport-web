import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "@app/providers/ThemeProvider";

/**
 * Toaster
 *
 * Componente para mostrar notificaciones toast.
 * Usa la librería 'sonner' para las notificaciones.
 */
export const Toaster = () => {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={resolvedTheme}
      position="top-right"
      toastOptions={{
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
        },
      }}
      richColors
      closeButton
    />
  );
};

// Re-exportar toast para uso fácil
export { toast } from "sonner";
