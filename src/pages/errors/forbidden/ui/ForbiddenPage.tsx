import { useNavigate } from "react-router-dom";
import { ShieldX, Home, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@shared/ui/button";

/**
 * ForbiddenPage (403)
 *
 * Se muestra cuando el usuario intenta acceder a un recurso
 * para el cual no tiene permisos.
 */
const ForbiddenPage = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Ilustración */}
      <div className="relative mb-8">
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-destructive/10">
          <ShieldX className="h-16 w-16 text-destructive" />
        </div>
        <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-sm font-bold text-destructive-foreground">
          403
        </div>
      </div>

      {/* Texto */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Acceso denegado
        </h1>
        <p className="max-w-md text-muted-foreground">
          No tienes los permisos necesarios para acceder a esta sección.
        </p>
      </div>

      {/* Acciones */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Regresar
        </Button>
        <Button onClick={() => navigate("/dashboard")}>
          <Home className="mr-2 h-4 w-4" />
          Ir al Dashboard
        </Button>
      </div>

      {/* Card de ayuda */}
      <div className="mt-12 max-w-md rounded-lg border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">
          ¿Necesitas acceso a esta sección?
        </p>
        <Button
          variant="link"
          size="sm"
          className="mt-1"
          onClick={() =>
            (window.location.href =
              "mailto:admin@boeltech.com?subject=Solicitud de permisos")
          }
        >
          <Mail className="mr-2 h-3 w-3" />
          Contactar al administrador
        </Button>
      </div>
    </div>
  );
};

export default ForbiddenPage;
