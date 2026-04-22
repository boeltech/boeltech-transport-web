/**
 * ClientDetailPage
 * Clean Architecture - Presentation Layer
 *
 * Página de detalle de un cliente.
 * Layout homologado con VehicleDetailPage / DriverDetailPage: cabecera + pestañas.
 *
 * Ubicación: src/features/clients/presentation/pages/ClientDetailPage.tsx
 */

import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Calendar,
  Hash,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

import { useRegimenFiscalLabel } from "@features/catalogs";

import { useClient } from "../../application";
import type { Client } from "../../domain";
import { getClientDisplayName } from "../../domain";
import { ClientActions, ClientAddressSection } from "../components";
import {
  getClientTypeConfig,
  getPaymentTermsConfig,
  getStatusConfig,
} from "../config/clientConfig";

// ============================================================================
// SUB-COMPONENTS (patrón InfoRow como VehicleDetailPage)
// ============================================================================

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  className?: string;
}

function InfoRow({ icon, label, value, className }: InfoRowProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

function ClientDataTabContent({
  client,
  taxRegimeLabel,
  paymentConfig,
  PaymentIcon,
}: {
  client: Client;
  taxRegimeLabel: string | null;
  paymentConfig: ReturnType<typeof getPaymentTermsConfig>;
  PaymentIcon: React.ComponentType<{ className?: string }>;
}) {
  const hasContact =
    client.contactName ||
    client.contactPosition ||
    client.phone ||
    client.secondaryPhone ||
    client.email ||
    client.billingEmail;

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Información fiscal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow
            icon={<Building2 className="h-4 w-4" />}
            label="Razón social"
            value={client.legalName}
          />
          {client.tradeName ? (
            <InfoRow
              icon={<Building2 className="h-4 w-4" />}
              label="Nombre comercial"
              value={client.tradeName}
            />
          ) : null}
          <InfoRow
            icon={<Hash className="h-4 w-4" />}
            label="RFC"
            value={<span className="font-mono">{client.taxId}</span>}
          />
          {taxRegimeLabel ? (
            <InfoRow
              icon={<FileText className="h-4 w-4" />}
              label="Régimen fiscal"
              value={taxRegimeLabel}
            />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Contacto principal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasContact ? (
            <>
              {client.contactName ? (
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Nombre"
                  value={client.contactName}
                />
              ) : null}
              {client.contactPosition ? (
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Puesto"
                  value={client.contactPosition}
                />
              ) : null}
              {client.phone ? (
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Teléfono"
                  value={
                    <a
                      href={`tel:${client.phone}`}
                      className="text-primary hover:underline"
                    >
                      {client.phone}
                    </a>
                  }
                />
              ) : null}
              {client.secondaryPhone ? (
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Teléfono secundario"
                  value={
                    <a
                      href={`tel:${client.secondaryPhone}`}
                      className="text-primary hover:underline"
                    >
                      {client.secondaryPhone}
                    </a>
                  }
                />
              ) : null}
              {client.email ? (
                <InfoRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Correo"
                  value={
                    <a
                      href={`mailto:${client.email}`}
                      className="text-primary hover:underline"
                    >
                      {client.email}
                    </a>
                  }
                />
              ) : null}
              {client.billingEmail ? (
                <InfoRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Correo de facturación"
                  value={
                    <a
                      href={`mailto:${client.billingEmail}`}
                      className="text-primary hover:underline"
                    >
                      {client.billingEmail}
                    </a>
                  }
                />
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay información de contacto registrada.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Términos comerciales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow
            icon={<CreditCard className="h-4 w-4" />}
            label="Forma de pago"
            value={
              <Badge variant={paymentConfig.variant}>
                <PaymentIcon className="mr-1 h-3 w-3" />
                {paymentConfig.label}
              </Badge>
            }
          />
          {client.paymentTerms === "credit" ? (
            <>
              <Separator />
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="Días de crédito"
                value={`${client.creditDays} días`}
              />
              {client.creditLimit !== undefined && client.creditLimit > 0 ? (
                <InfoRow
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Límite de crédito"
                  value={`$${client.creditLimit.toLocaleString("es-MX")}`}
                />
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Notas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {client.notes ? (
            <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Sin notas</p>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Registro
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label="Creado"
            value={new Date(client.createdAt).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          />
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label="Actualizado"
            value={new Date(client.updatedAt).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading, isError } = useClient(id);
  const { label: taxRegimeLabel } = useRegimenFiscalLabel(client?.taxRegime);

  if (isLoading) {
    return <ClientDetailSkeleton />;
  }

  if (isError || !client) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Cliente no encontrado</p>
        <p className="text-center text-sm text-muted-foreground">
          El cliente que buscas no existe o fue eliminado.
        </p>
        <Button variant="outline" onClick={() => navigate("/clients")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a clientes
        </Button>
      </div>
    );
  }

  const typeConfig = getClientTypeConfig(client.type);
  const paymentConfig = getPaymentTermsConfig(client.paymentTerms);
  const statusConfig = getStatusConfig(client.isActive);
  const TypeIcon = typeConfig.icon;
  const PaymentIcon = paymentConfig.icon;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/clients")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
                typeConfig.bgColor,
              )}
            >
              <TypeIcon className={cn("h-6 w-6", typeConfig.color)} />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">
                {getClientDisplayName(client)}
              </h1>
              <p className="text-sm text-muted-foreground">
                {client.clientCode} · {typeConfig.label}
              </p>
            </div>
            <Badge variant={statusConfig.variant} className="shrink-0">
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        <ClientActions client={client} variant="buttons" />
      </div>

      <Tabs defaultValue="data">
        <TabsList>
          <TabsTrigger value="data">Datos</TabsTrigger>
          <TabsTrigger value="addresses" className="gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Direcciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data">
          <ClientDataTabContent
            client={client}
            taxRegimeLabel={taxRegimeLabel}
            paymentConfig={paymentConfig}
            PaymentIcon={PaymentIcon}
          />
        </TabsContent>

        <TabsContent value="addresses" className="mt-4">
          <ClientAddressSection
            clientId={client.id}
            clientRfc={client.taxId}
            clientName={client.legalName}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function ClientDetailSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ClientDetailPage;
