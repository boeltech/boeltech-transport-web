import { useNavigate } from "react-router-dom";
import { ShieldX, Home, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@shared/ui/button";
import { useAuth } from "@app/providers/AuthProvider";

/**
 * ForbiddenPage (403)
 *
 * Se muestra cuando el usuario intenta acceder a un recurso
 * para el cual no tiene permisos.
 */
const ForbiddenPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
        {/* Badge 403 */}
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
          {user && (
            <span className="mt-1 block">
              Tu rol actual es:{" "}
              <strong className="capitalize">{user.rol}</strong>
            </span>
          )}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="outline"
          onClick={handleGoBack}
          leftIcon={<ArrowLeft />}
        >
          Regresar
        </Button>
        <Button onClick={() => navigate("/dashboard")} leftIcon={<Home />}>
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
          leftIcon={<Mail className="h-3 w-3" />}
          onClick={() =>
            (window.location.href =
              "mailto:admin@boeltech.com?subject=Solicitud de permisos")
          }
        >
          Contactar al administrador
        </Button>
      </div>
    </div>
  );
};

export default ForbiddenPage;
