import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, Building2, Loader2 } from "lucide-react";
import { FormPageShell } from "@shared/ui/page-shells";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Card, CardContent } from "@shared/ui/card";
import { Button } from "@shared/ui/button";

import {
  useClient,
  useUpdateClient,
} from "../../application";
import { getClientDisplayName } from "../../domain";
import {
  ClientAddressMasterDetail,
  ClientForm,
} from "../components";
import type { ClientFormData } from "../validation/clientSchema";

export function ClientEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const clientId = id ?? "";
  const [activeTab, setActiveTab] = useState("informacion");
  const [formData, setFormData] = useState<ClientFormData | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const {
    data: client,
    isLoading,
    isError,
  } = useClient(clientId || undefined);
  const updateMutation = useUpdateClient();

  const clientUnavailable = !client || Boolean(client.deletedAt);
  const isBusy = updateMutation.isPending;

  const handleFormChange = useCallback(
    (data: ClientFormData, valid: boolean) => {
      setFormData(data);
      setIsFormValid(valid);
    },
    [],
  );

  const handleSave = useCallback(() => {
    if (!formData || !isFormValid || !clientId) return;
    updateMutation.mutate(
      {
        clientId,
        data: {
          type: formData.type,
          legalName: formData.legalName,
          tradeName: formData.tradeName || undefined,
          taxId: formData.taxId,
          taxRegime: formData.taxRegime || undefined,
          contactName: formData.contactName || undefined,
          contactPosition: formData.contactPosition || undefined,
          phone: formData.phone || undefined,
          secondaryPhone: formData.secondaryPhone || undefined,
          email: formData.email || undefined,
          billingEmail: formData.billingEmail || undefined,
          paymentTerms: formData.paymentTerms,
          creditDays: formData.creditDays,
          creditLimit: formData.creditLimit,
          notes: formData.notes || undefined,
        },
      },
      {
        onSuccess: () => navigate(`/clients/${clientId}`),
      },
    );
  }, [formData, isFormValid, clientId, updateMutation, navigate]);

  const defaults = useMemo<Partial<ClientFormData> | undefined>(() => {
    if (!client || clientUnavailable) return undefined;
    return {
      type: client.type,
      legalName: client.legalName,
      tradeName: client.tradeName ?? "",
      taxId: client.taxId,
      taxRegime: client.taxRegime ?? "",
      contactName: client.contactName ?? "",
      contactPosition: client.contactPosition ?? "",
      phone: client.phone ?? "",
      secondaryPhone: client.secondaryPhone ?? "",
      email: client.email ?? "",
      billingEmail: client.billingEmail ?? "",
      paymentTerms: client.paymentTerms,
      creditDays: client.creditDays,
      creditLimit: client.creditLimit ?? undefined,
      notes: client.notes ?? "",
    };
  }, [client, clientUnavailable]);

  return (
    <FormPageShell
      className="mx-auto w-full max-w-6xl p-4 sm:p-6"
      isLoading={isLoading}
      notFound={isError || clientUnavailable}
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
        backLabel: "Volver al detalle del cliente",
        icon: <Building2 className="h-5 w-5" />,
        title: "Editar cliente",
        subtitle: client
          ? `${getClientDisplayName(client)} · ${client.clientCode}`
          : "Actualiza datos generales y direcciones",
      }}
    >
      {client ? (
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="informacion">Datos del cliente</TabsTrigger>
              <TabsTrigger value="addresses">
                Direcciones asociadas al cliente
              </TabsTrigger>
            </TabsList>

            <TabsContent value="informacion" className="space-y-4">
              <Card>
                <CardContent className="space-y-4 p-4 sm:p-6">
                  <p className="text-xs text-muted-foreground">
                    Los cambios en datos fiscales, contacto y terminos
                    comerciales se guardan al confirmar.
                  </p>
                  <ClientForm
                    defaultValues={defaults}
                    onChange={handleFormChange}
                    disabled={isBusy}
                  />
                  <div className="flex items-center justify-end gap-2 border-t pt-4">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/clients/${clientId}`)}
                      disabled={isBusy}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={!isFormValid || isBusy}>
                      {isBusy ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        "Guardar cambios"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="addresses" className="space-y-4">
              <ClientAddressMasterDetail
                clientId={client.id}
                clientRfc={client.taxId}
                clientName={client.legalName}
              />
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </FormPageShell>
  );
}

export default ClientEditPage;
