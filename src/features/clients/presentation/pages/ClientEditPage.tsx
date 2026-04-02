/**
 * ClientEditPage
 * Clean Architecture - Presentation Layer
 *
 * Página de edición de un cliente existente.
 * Solo edita la información del cliente, NO las direcciones.
 * Las direcciones se editan desde ClientDetailPage > ClientAddressSection.
 *
 * Ubicación: src/features/clients/presentation/pages/ClientEditPage.tsx
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { ScrollArea } from "@shared/ui/scroll-area";
import { ArrowLeft, Save, Loader2, Building2, AlertCircle } from "lucide-react";

import { useClient, useUpdateClient } from "../../application";
import { getClientDisplayName } from "../../domain";
import { ClientForm } from "../components";
import type { ClientFormData } from "../validation/clientSchema";

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Queries & Mutations
  const { data: client, isLoading, isError } = useClient(id);
  const updateMutation = useUpdateClient();

  // Form state
  const [formData, setFormData] = useState<ClientFormData | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  // Handlers
  const handleFormChange = (data: ClientFormData, isValid: boolean) => {
    setFormData(data);
    setIsFormValid(isValid);
  };

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

  // Loading state
  if (isLoading) {
    return <ClientEditSkeleton />;
  }

  // Error state
  if (isError || !client) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium">Cliente no encontrado</p>
            <p className="text-sm text-muted-foreground mb-4">
              El cliente que intentas editar no existe o fue eliminado.
            </p>
            <Button variant="outline" onClick={() => navigate("/clients")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a clientes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default values for form
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
    creditLimit: client.creditLimit ?? 0,
    notes: client.notes ?? "",
  };

  const isSubmitting = updateMutation.isPending;

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Editar Cliente
            </h1>
            <p className="text-sm text-muted-foreground">
              {getClientDisplayName(client)} · {client.clientCode}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            <div className="pr-4">
              <ClientForm
                defaultValues={defaultValues}
                onChange={handleFormChange}
                disabled={isSubmitting}
              />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancelar
        </Button>

        <Button onClick={handleSave} disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function ClientEditSkeleton() {
  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Form skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full sm:col-span-2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  );
}

export default ClientEditPage;
