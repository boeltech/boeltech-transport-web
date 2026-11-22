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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useIncomingWayfinding } from "@shared/utils/listQueueFrom";
import {
  MODULE_LIST_PATH_LABELS,
  navigatePreservingFrom,
  resolveDetailCrumbs,
} from "@shared/utils/masterWayfinding";
import { AlertCircle } from "lucide-react";
import { FormPageShell } from "@shared/ui/page-shells/FormPageShell";
import { UnsavedChangesDialog } from "@shared/ui/form";
import { useToast, useUnsavedChangesGuard } from "@shared/hooks";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";

import { useClient, useUpdateClient } from "../../application";
import { getClientDisplayName } from "../../domain";
import { ClientForm, type ClientFormRef } from "../components";
import {
  clientFormDataToUpdateDto,
  type ClientFormData,
} from "../validation/clientSchema";

const CLIENTS_LIST_PATH = "/clients";
const CLIENTS_MODULE_LABEL =
  MODULE_LIST_PATH_LABELS[CLIENTS_LIST_PATH] ?? "Clientes";

export function ClientEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const incoming = useIncomingWayfinding();
  const incomingFrom = incoming?.from;
  const { toast } = useToast();
  const formRef = useRef<ClientFormRef>(null);
  const clientId = id ?? "";
  const [isDirty, setIsDirty] = useState(false);
  const { blocker, allowLeave, resetAllowLeave } = useUnsavedChangesGuard({
    isDirty,
  });
  const wasSubmittingRef = useRef(false);

  const { data: client, isLoading, isError } = useClient(clientId || undefined);

  const updateMutation = useUpdateClient({
    onSuccess: () => {
      toast({
        title: "Cliente actualizado",
        description: "Los cambios han sido guardados exitosamente.",
      });
      navigatePreservingFrom(navigate, `/clients/${clientId}`, incomingFrom);
    },
    onError: (error) => {
      if (isApiError(error) && error.hasValidationErrors()) {
        formRef.current?.applyApiValidationErrors(
          error.validationErrors.map((entry) => ({
            field: entry.field,
            message: entry.message,
          })),
        );
        toast({
          title: "Error al actualizar",
          description: error.getToastMessage(),
          variant: "destructive",
        });
        return;
      }

      const description = isApiError(error)
        ? error.getDetailedMessage()
        : getErrorMessage(error);
      formRef.current?.setApiAlertMessages(
        description ? [description] : [getErrorMessage(error)],
      );
      toast({
        title: "Error al actualizar",
        description,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (updateMutation.isPending) {
      wasSubmittingRef.current = true;
      return;
    }
    if (wasSubmittingRef.current) {
      wasSubmittingRef.current = false;
      resetAllowLeave();
    }
  }, [updateMutation.isPending, resetAllowLeave]);

  const clientUnavailable = !client;

  const handleSubmit = useCallback(
    (data: ClientFormData) => {
      if (!clientId || clientUnavailable) return;
      formRef.current?.clearApiErrors();
      allowLeave();
      updateMutation.mutate({
        clientId,
        data: clientFormDataToUpdateDto(data),
      });
    },
    [allowLeave, clientId, clientUnavailable, updateMutation],
  );

  const handleCancel = useCallback(() => {
    navigatePreservingFrom(navigate, `/clients/${clientId}`, incomingFrom);
  }, [navigate, clientId, incomingFrom]);

  const displayName = client ? getClientDisplayName(client) : undefined;
  const detailHref = clientId ? `/clients/${clientId}` : CLIENTS_LIST_PATH;
  const crumbs = useMemo(
    () =>
      resolveDetailCrumbs({
        from: incomingFrom ?? detailHref,
        fromLabel: incoming?.fromLabel ?? displayName,
        module: {
          listPath: CLIENTS_LIST_PATH,
          label: CLIENTS_MODULE_LABEL,
        },
        current: { label: "Editar" },
      }),
    [detailHref, displayName, incoming?.fromLabel, incomingFrom],
  );

  return (
    <FormPageShell
      isLoading={isLoading}
      notFound={!isLoading && (isError || clientUnavailable)}
      notFoundConfig={{
        icon: <AlertCircle />,
        title: "Cliente no disponible",
        description:
          "No se pudo cargar la información del cliente para edición.",
        backHref: CLIENTS_LIST_PATH,
        backLabel: "Volver a clientes",
      }}
      header={{
        crumbs,
        title: "Editar Cliente",
        subtitle: displayName,
      }}
      className="p-6"
    >
      {client ? (
        <ClientForm
          ref={formRef}
          key={client.id}
          mode="edit"
          client={client}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDirtyChange={setIsDirty}
          isSubmitting={updateMutation.isPending}
          disabled={updateMutation.isPending}
        />
      ) : null}
      <UnsavedChangesDialog blocker={blocker} />
    </FormPageShell>
  );
}

export default ClientEditPage;
