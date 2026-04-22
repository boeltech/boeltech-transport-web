/**
 * ClientEditPage
 * Clean Architecture - Presentation Layer
 *
 * Edición de cliente con pestañas: datos generales y direcciones (misma UX que detalle).
 *
 * Ubicación: src/features/clients/presentation/pages/ClientEditPage.tsx
 */

import { useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import {
  ArrowLeft,
  Save,
  Loader2,
  Building2,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

import { useClient, useUpdateClient } from "../../application";
import { getClientDisplayName } from "../../domain";
import { ClientForm, ClientAddressSection } from "../components";
import type { ClientFormData } from "../validation/clientSchema";

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading, isError } = useClient(id);
  const updateMutation = useUpdateClient();

  const [activeTab, setActiveTab] = useState<"client" | "addresses">("client");
  const [formData, setFormData] = useState<ClientFormData | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  const handleFormChange = useCallback(
    (data: ClientFormData, isValid: boolean) => {
      setFormData(data);
      setIsFormValid(isValid);
    },
    [],
  );

  const handleCancel = () => {
    navigate(`/clients/${id}`);
  };

  const handleSave = () => {
    if (!formData || !isFormValid || !id) return;

    updateMutation.mutate(
      {
        clientId: id,
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
        onSuccess: () => {
          navigate(`/clients/${id}`);
        },
      },
    );
  };

  if (isLoading) {
    return <ClientEditSkeleton />;
  }

  if (isError || !client) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Cliente no encontrado</p>
        <p className="text-center text-sm text-muted-foreground">
          El cliente que intentas editar no existe o fue eliminado.
        </p>
        <Button variant="outline" onClick={() => navigate("/clients")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a clientes
        </Button>
      </div>
    );
  }

  const defaultValues: Partial<ClientFormData> = {
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

  const isSubmitting = updateMutation.isPending;
  const isClientTab = activeTab === "client";

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">Editar cliente</h1>
            <p className="text-sm text-muted-foreground">
              {getClientDisplayName(client)} · {client.clientCode}
            </p>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "client" | "addresses")}
      >
        <TabsList>
          <TabsTrigger value="client">Datos del cliente</TabsTrigger>
          <TabsTrigger value="addresses" className="gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Direcciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="client" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                Información del cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[min(70vh,720px)] overflow-y-auto pr-1">
              <ClientForm
                defaultValues={defaultValues}
                onChange={handleFormChange}
                disabled={isSubmitting}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Las direcciones se guardan al crear o editar desde cada formulario.
          </p>
          <ClientAddressSection
            clientId={client.id}
            clientRfc={client.taxId}
            clientName={client.legalName}
          />
        </TabsContent>
      </Tabs>

      <div
        className={cn(
          "flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between",
        )}
      >
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancelar
        </Button>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {!isClientTab ? (
            <p className="text-right text-xs text-muted-foreground sm:max-w-sm">
              Cambia a la pestaña &quot;Datos del cliente&quot; para guardar RFC,
              contacto y términos comerciales.
            </p>
          ) : null}
          <Button
            onClick={handleSave}
            disabled={!isFormValid || isSubmitting || !isClientTab}
            className="sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function ClientEditSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-md" />
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full sm:col-span-2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-between border-t pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  );
}

export default ClientEditPage;
