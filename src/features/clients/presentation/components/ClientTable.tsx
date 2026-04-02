/**
 * ClientTable Component
 * Clean Architecture - Presentation Layer
 *
 * Tabla de listado de clientes con ordenamiento y acciones.
 *
 * Ubicación: src/features/clients/presentation/components/ClientTable.tsx
 */

import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
import { Phone, Mail } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

import type { ClientListItem } from "../../domain";
import {
  getClientTypeConfig,
  getPaymentTermsConfig,
  getStatusConfig,
  formatCreditDays,
} from "../config/clientConfig";
import { ClientActions } from "./ClientActions";

// ============================================================================
// TYPES
// ============================================================================

export interface ClientTableProps {
  clients: ClientListItem[];
  isLoading?: boolean;
  onSort?: (field: string) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientTable({
  clients,
  isLoading = false,
  onSort,
  sortBy,
  sortOrder,
}: ClientTableProps) {
  const navigate = useNavigate();

  // Handler para clic en fila
  const handleRowClick = (clientId: string) => {
    navigate(`/clients/${clientId}`);
  };

  // Handler para ordenamiento
  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field);
    }
  };

  // Render de header con ordenamiento
  const renderSortableHeader = (
    field: string,
    label: string,
    className?: string,
  ) => {
    const isActive = sortBy === field;
    const isAsc = sortOrder === "asc";

    return (
      <TableHead
        className={cn(
          "cursor-pointer select-none hover:bg-muted/50",
          className,
        )}
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          {label}
          {isActive && <span className="text-xs">{isAsc ? "↑" : "↓"}</span>}
        </div>
      </TableHead>
    );
  };

  // Loading state
  if (isLoading) {
    return <ClientTableSkeleton />;
  }

  // Empty state
  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No se encontraron clientes.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {renderSortableHeader("client_code", "Código", "w-24")}
            {renderSortableHeader("legal_name", "Razón Social")}
            <TableHead className="w-32">RFC</TableHead>
            {renderSortableHeader("type", "Tipo", "w-28")}
            <TableHead className="w-24">Pago</TableHead>
            <TableHead className="w-36">Contacto</TableHead>
            <TableHead className="w-24">Estado</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const typeConfig = getClientTypeConfig(client.type);
            const paymentConfig = getPaymentTermsConfig(client.paymentTerms);
            const statusConfig = getStatusConfig(client.isActive);
            const TypeIcon = typeConfig.icon;

            return (
              <TableRow
                key={client.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(client.id)}
              >
                {/* Código */}
                <TableCell className="font-mono text-sm">
                  {client.clientCode}
                </TableCell>

                {/* Razón Social */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{client.legalName}</span>
                    {client.tradeName && (
                      <span className="text-xs text-muted-foreground">
                        {client.tradeName}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* RFC */}
                <TableCell className="font-mono text-sm">
                  {client.taxId}
                </TableCell>

                {/* Tipo */}
                <TableCell>
                  <Badge variant={typeConfig.variant} className="gap-1">
                    <TypeIcon className="h-3 w-3" />
                    {typeConfig.labelShort}
                  </Badge>
                </TableCell>

                {/* Términos de Pago */}
                <TableCell>
                  <div className="flex flex-col">
                    <Badge variant={paymentConfig.variant} className="w-fit">
                      {paymentConfig.labelShort}
                    </Badge>
                    {client.paymentTerms === "credit" && (
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {formatCreditDays(client.creditDays)}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Contacto */}
                <TableCell>
                  <div className="flex flex-col gap-0.5 text-sm">
                    {client.phone && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </span>
                    )}
                    {client.email && (
                      <span className="flex items-center gap-1 text-muted-foreground truncate max-w-[150px]">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </span>
                    )}
                    {!client.phone && !client.email && (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>

                {/* Estado */}
                <TableCell>
                  <Badge variant={statusConfig.variant}>
                    {statusConfig.label}
                  </Badge>
                </TableCell>

                {/* Acciones */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <ClientActions client={client} variant="dropdown" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function ClientTableSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Código</TableHead>
            <TableHead>Razón Social</TableHead>
            <TableHead className="w-32">RFC</TableHead>
            <TableHead className="w-28">Tipo</TableHead>
            <TableHead className="w-24">Pago</TableHead>
            <TableHead className="w-36">Contacto</TableHead>
            <TableHead className="w-24">Estado</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8 rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default ClientTable;
