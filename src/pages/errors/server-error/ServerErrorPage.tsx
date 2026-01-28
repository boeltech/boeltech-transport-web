import { useNavigate } from "react-router-dom";
import { ServerCrash, Home, RefreshCw } from "lucide-react";
import { Button } from "@shared/ui/button";

/**
 * ServerErrorPage (500)
 *
 * Se muestra cuando ocurre un error inesperado en el servidor
 * o en la aplicación.
 */
const ServerErrorPage = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Ilustración */}
      <div className="relative mb-8">
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-destructive/10">
          <ServerCrash className="h-16 w-16 text-destructive" />
        </div>
        <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-sm font-bold text-destructive-foreground">
          500
        </div>
      </div>

      {/* Texto */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Error del servidor
        </h1>
        <p className="max-w-md text-muted-foreground">
          Ocurrió un error inesperado. Nuestro equipo ha sido notificado y
          estamos trabajando para solucionarlo.
        </p>
      </div>

      {/* Acciones */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" onClick={handleRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
        <Button onClick={() => navigate("/dashboard")}>
          <Home className="mr-2 h-4 w-4" />
          Ir al Dashboard
        </Button>
      </div>

      {/* Footer */}
      <p className="mt-12 text-xs text-muted-foreground">
        Si el problema persiste,{" "}
        <a
          href="mailto:soporte@boeltech.com"
          className="text-primary hover:underline"
        >
          contacta a soporte técnico
        </a>
      </p>
    </div>
  );
};

export default ServerErrorPage;
