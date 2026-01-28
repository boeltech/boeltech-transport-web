import { Construction } from "lucide-react";
import { ErrorPage } from "../ErrorPage";

/**
 * MaintenancePage
 *
 * Se muestra cuando el sistema está en mantenimiento programado.
 */
const MaintenancePage = () => {
  return (
    <ErrorPage
      title="Sistema en mantenimiento"
      description={
        <div className="space-y-2">
          <p>
            Estamos realizando mejoras en el sistema para brindarte una mejor
            experiencia.
          </p>
          <p className="text-sm">
            Tiempo estimado: <strong>30 minutos</strong>
          </p>
        </div>
      }
      icon={Construction}
      iconVariant="warning"
      showBack={false}
      showHome={false}
      showRetry
      onRetry={() => window.location.reload()}
      footer={
        <p className="text-xs text-muted-foreground">
          Gracias por tu paciencia. — Equipo Boeltech
        </p>
      }
    />
  );
};

export default MaintenancePage;
