import { ServerCrash } from "lucide-react";
import { ErrorPage } from "../../ui/ErrorPage";

/**
 * ServerErrorPage (500)
 *
 * Se muestra cuando ocurre un error inesperado en el servidor
 * o en la aplicación.
 */
const ServerErrorPage = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <ErrorPage
      code={500}
      title="Error del servidor"
      description="Ocurrió un error inesperado. Nuestro equipo ha sido notificado y estamos trabajando para solucionarlo."
      icon={ServerCrash}
      iconVariant="destructive"
      showRetry
      onRetry={handleRetry}
      footer={
        <p className="text-xs text-muted-foreground">
          Si el problema persiste, contacta a soporte técnico.
        </p>
      }
    />
  );
};

export default ServerErrorPage;
