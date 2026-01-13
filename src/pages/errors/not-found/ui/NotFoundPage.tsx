import { useNavigate } from "react-router-dom";
import { FileQuestion, Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@shared/ui/button";

/**
 * NotFoundPage (404)
 *
 * Se muestra cuando el usuario navega a una ruta que no existe.
 */
const NotFoundPage = () => {
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
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-16 w-16 text-muted-foreground" />
        </div>
        <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          404
        </div>
      </div>

      {/* Texto */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Página no encontrada
        </h1>
        <p className="max-w-md text-muted-foreground">
          Lo sentimos, la página que buscas no existe o fue movida. Verifica la
          URL o regresa al inicio.
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

      {/* Información adicional */}
      <p className="mt-12 text-xs text-muted-foreground">
        Si crees que esto es un error,{" "}
        <a
          href="mailto:soporte@boeltech.com"
          className="text-primary hover:underline"
        >
          contacta al administrador
        </a>
      </p>
    </div>
  );
};

export default NotFoundPage;
