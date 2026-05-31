/**
 * ClientEditPage
 * Clean Architecture - Presentation Layer
 *
 * Edición de datos generales del cliente (mismo patrón que DriverEditPage / EditVehiclePage).
 * Las direcciones se gestionan en el detalle del cliente (tab Direcciones).
 * Excepción UX (Opción A): edición del padre en `/clients/:id/edit` (página completa),
 * no Sheet en detalle. Direcciones solo en `ClientDetailPage` (tab master-detail).
 * Decisión: `erp-transport/docs/auditorias/clientes-ux-edicion-padre.md`
 *
 * Ubicación: src/features/clients/presentation/pages/ClientEditPage.tsx
 */

import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, Building2 } from "lucide-react";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";

import { useClient, useUpdateClient } from "../../application";
import { getClientDisplayName } from "../../domain";
import { ClientForm } from "../components";
import {
  clientFormDataToUpdateDto,
  type ClientFormData,
} from "../validation/clientSchema";

export function ClientEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clientId = id ?? "";

  const { data: client, isLoading, isError } = useClient(clientId || undefined);

  const updateMutation = useUpdateClient();

  const clientUnavailable = !client;

  const handleSubmit = (data: ClientFormData) => {
    if (!clientId || clientUnavailable) return;
    updateMutation.mutate(
      { clientId, data: clientFormDataToUpdateDto(data) },
      { onSuccess: () => navigate(`/clients/${clientId}`) },
    );
  };

  const handleCancel = () => {
    navigate(`/clients/${clientId}`);
  };

  return (
    <FormPageShell
      isLoading={isLoading}
      notFound={!isLoading && (isError || clientUnavailable)}
      notFoundConfig={{
        icon: <AlertCircle />,
        title: "Cliente no disponible",
        description:
          "No se pudo cargar la información del cliente para edición.",
        backHref: "/clients",
        backLabel: "Volver a clientes",
      }}
      header={{
        backHref: clientId ? `/clients/${clientId}` : "/clients",
        icon: <Building2 className="h-5 w-5" />,
        title: "Editar Cliente",
        subtitle: client ? getClientDisplayName(client) : undefined,
      }}
      className="p-6"
    >
      {client ? (
        <ClientForm
          key={client.id}
          mode="edit"
          client={client}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={updateMutation.isPending}
          disabled={updateMutation.isPending}
        />
      ) : null}
    </FormPageShell>
  );
}

export default ClientEditPage;
