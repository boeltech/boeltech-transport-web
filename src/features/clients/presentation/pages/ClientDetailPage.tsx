/**
 * ClientDetailPage
 * Clean Architecture - Presentation Layer
 *
 * Página de detalle de un cliente.
 * Muestra información del cliente y sus direcciones.
 *
 * Ubicación: src/features/clients/presentation/pages/ClientDetailPage.tsx
 */

import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Separator } from "@shared/ui/separator";
import { Skeleton } from "@shared/ui/skeleton";
import {
  ArrowLeft,
  Edit,
  Building2,
  User,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Calendar,
  Hash,
  //   MapPin,
  AlertCircle,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

import { useClient } from "../../application";
import {
  //   CLIENT_TYPE_LABELS,
  //   PAYMENT_TERMS_LABELS,
  TAX_REGIME_OPTIONS,
  getClientDisplayName,
} from "../../domain";
import { ClientActions, ClientAddressSection } from "../components";
import {
  getClientTypeConfig,
  getPaymentTermsConfig,
  getStatusConfig,
} from "../config/clientConfig";

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading, isError } = useClient(id);

  // Loading state
  if (isLoading) {
    return <ClientDetailSkeleton />;
  }

  // Error state
  if (isError || !client) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium">Cliente no encontrado</p>
            <p className="text-sm text-muted-foreground mb-4">
              El cliente que buscas no existe o fue eliminado.
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

  // Config
  const typeConfig = getClientTypeConfig(client.type);
  const paymentConfig = getPaymentTermsConfig(client.paymentTerms);
  const statusConfig = getStatusConfig(client.isActive);
  const TypeIcon = typeConfig.icon;
  const PaymentIcon = paymentConfig.icon;
  const StatusIcon = statusConfig.icon;

  // Obtener label del régimen fiscal
  const taxRegimeLabel = client.taxRegime
    ? TAX_REGIME_OPTIONS.find((r) => r.value === client.taxRegime)?.label ||
      client.taxRegime
    : null;

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/clients")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-lg",
                typeConfig.bgColor,
              )}
            >
              <TypeIcon className={cn("h-6 w-6", typeConfig.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {getClientDisplayName(client)}
                </h1>
                <Badge variant={statusConfig.variant}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {client.clientCode} · {typeConfig.label}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to={`/clients/${client.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <ClientActions client={client} />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info - 2 columns */}
        <div className="space-y-6 lg:col-span-2">
          {/* Información Fiscal */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Información Fiscal</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem
                  label="Razón Social"
                  value={client.legalName}
                  icon={Building2}
                />
                {client.tradeName && (
                  <InfoItem
                    label="Nombre Comercial"
                    value={client.tradeName}
                    icon={Building2}
                  />
                )}
                <InfoItem label="RFC" value={client.taxId} icon={Hash} />
                {taxRegimeLabel && (
                  <InfoItem
                    label="Régimen Fiscal"
                    value={taxRegimeLabel}
                    icon={FileText}
                    className="sm:col-span-2"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contacto */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Contacto Principal</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {client.contactName && (
                  <InfoItem
                    label="Nombre"
                    value={client.contactName}
                    icon={User}
                  />
                )}
                {client.contactPosition && (
                  <InfoItem
                    label="Puesto"
                    value={client.contactPosition}
                    icon={User}
                  />
                )}
                {client.phone && (
                  <InfoItem
                    label="Teléfono"
                    value={client.phone}
                    icon={Phone}
                    href={`tel:${client.phone}`}
                  />
                )}
                {client.secondaryPhone && (
                  <InfoItem
                    label="Teléfono Secundario"
                    value={client.secondaryPhone}
                    icon={Phone}
                    href={`tel:${client.secondaryPhone}`}
                  />
                )}
                {client.email && (
                  <InfoItem
                    label="Email"
                    value={client.email}
                    icon={Mail}
                    href={`mailto:${client.email}`}
                  />
                )}
                {client.billingEmail && (
                  <InfoItem
                    label="Email Facturación"
                    value={client.billingEmail}
                    icon={Mail}
                    href={`mailto:${client.billingEmail}`}
                  />
                )}
              </div>
              {!client.contactName && !client.phone && !client.email && (
                <p className="text-sm text-muted-foreground">
                  No hay información de contacto registrada.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Direcciones */}
          <ClientAddressSection
            clientId={client.id}
            clientRfc={client.taxId}
            clientName={client.legalName}
          />
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Términos Comerciales */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Términos Comerciales</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Forma de pago
                </span>
                <Badge variant={paymentConfig.variant}>
                  <PaymentIcon className="mr-1 h-3 w-3" />
                  {paymentConfig.label}
                </Badge>
              </div>

              {client.paymentTerms === "credit" && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Días de crédito
                      </span>
                      <span className="font-medium">
                        {client.creditDays} días
                      </span>
                    </div>
                    {client.creditLimit !== undefined &&
                      client.creditLimit > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Límite de crédito
                          </span>
                          <span className="font-medium">
                            ${client.creditLimit.toLocaleString("es-MX")}
                          </span>
                        </div>
                      )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Notas */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Información del registro */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Registro</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Creado</span>
                <span>
                  {new Date(client.createdAt).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Actualizado</span>
                <span>
                  {new Date(client.updatedAt).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface InfoItemProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  className?: string;
}

function InfoItem({
  label,
  value,
  icon: Icon,
  href,
  className,
}: InfoItemProps) {
  const content = (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className={cn("text-sm", href && "text-primary hover:underline")}>
          {value}
        </span>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
}

function ClientDetailSkeleton() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ClientDetailPage;
