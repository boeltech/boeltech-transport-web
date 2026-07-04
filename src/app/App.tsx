import { ErrorBoundary } from "@pages/errors/components/ErrorBoundary";
// import "./styles/App.css";
import {
  QueryProvider,
  RouterProvider,
  ThemeProvider,
  ToastProvider,
} from "@app/providers";

/**
 * App
 *
 * Componente raíz de la aplicación.
 * Envuelto en ErrorBoundary para capturar cualquier error no manejado.
 */
const App = () => {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <ThemeProvider defaultMode="system">
          <ToastProvider>
            <RouterProvider />
          </ToastProvider>
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
};

export default App;
