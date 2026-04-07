/**
 * ClientAddressSection Component
 * Clean Architecture - Presentation Layer
 *
 * Sección que muestra las direcciones del cliente en ClientDetailPage.
 * Permite agregar, editar y eliminar direcciones.
 *
 * Ubicación: src/features/clients/presentation/components/ClientAddressSection.tsx
 */

import { useState, useRef } from "react";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { ScrollArea } from "@shared/ui/scroll-area";
import { Plus, MapPin, Loader2 } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

import {
  useClientAddresses,
  useClientAddress,
  useCreateClientAddress,
  useUpdateClientAddress,
  useDeleteClientAddress,
} from "../../application";
import type {
  ClientAddressListItem,
  CreateClientAddressDTO,
} from "../../domain";
import { ClientAddressCard } from "./ClientAddressCard";
import {
  ClientAddressForm,
  type ClientAddressFormRef,
} from "./ClientAddressForm";
import type { ClientAddressFormData } from "../validation/clientAddressSchema";

// ============================================================================
// TYPES
// ============================================================================

interface ClientAddressSectionProps {
  clientId: string;
  clientRfc?: string;
  clientName?: string;
  className?: string;
}

type ModalMode = "create" | "edit" | null;

// ============================================================================
// COMPONENT
// ============================================================================

export function ClientAddressSection({
  clientId,
  clientRfc,
  clientName,
  className,
}: ClientAddressSectionProps) {
  // State
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedAddress, setSelectedAddress] =
    useState<ClientAddressListItem | null>(null);
  const [addressToDelete, setAddressToDelete] =
    useState<ClientAddressListItem | null>(null);
  const [formData, setFormData] = useState<ClientAddressFormData | null>(null);
  const formRef = useRef<ClientAddressFormRef>(null);

  // Queries & Mutations
  const { data: addresses, isLoading } = useClientAddresses(clientId);
  const { data: selectedAddressFull } = useClientAddress(
    clientId,
    selectedAddress?.id,
  );
  const createMutation = useCreateClientAddress();
  const updateMutation = useUpdateClientAddress();
  const deleteMutation = useDeleteClientAddress();

  // Handlers
  const handleOpenCreate = () => {
    setSelectedAddress(null);
    setFormData(null);
    setModalMode("create");
  };

  const handleOpenEdit = (address: ClientAddressListItem) => {
    setSelectedAddress(address);
    setFormData(null);
    setModalMode("edit");
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedAddress(null);
    setFormData(null);
  };

  const handleFormChange = (data: ClientAddressFormData) => {
    setFormData(data);
  };

  const handleSave = async () => {
    const valid = await formRef.current?.triggerValidation();
    if (!valid || !formData) return;

    if (modalMode === "create") {
      const createData: CreateClientAddressDTO = {
        addressType: formData.addressType,
        isPrimary: formData.isPrimary,
        locationName: formData.locationName || undefined,
        satEstadoCode: formData.satEstadoCode,
        satMunicipioCode: formData.satMunicipioCode,
        postalCode: formData.postalCode,
        satLocalidadCode: formData.satLocalidadCode || undefined,
        satColoniaCode: formData.satColoniaCode || undefined,
        street: formData.street || undefined,
        exteriorNumber: formData.exteriorNumber || undefined,
        interiorNumber: formData.interiorNumber || undefined,
        reference: formData.reference || undefined,
        rfcRemitenteDestinatario:
          formData.rfcRemitenteDestinatario || undefined,
        nombreRemitenteDestinatario:
          formData.nombreRemitenteDestinatario || undefined,
        latitude: formData.latitude ?? undefined,
        longitude: formData.longitude ?? undefined,
        contactName: formData.contactName || undefined,
        contactPhone: formData.contactPhone || undefined,
        contactEmail: formData.contactEmail || undefined,
        businessHours: formData.businessHours || undefined,
        notes: formData.notes || undefined,
        specialInstructions: formData.specialInstructions || undefined,
      };

      createMutation.mutate(
        { clientId, data: createData },
        {
          onSuccess: () => handleCloseModal(),
        },
      );
    } else if (modalMode === "edit" && selectedAddress) {
      updateMutation.mutate(
        {
          clientId,
          addressId: selectedAddress.id,
          data: formData,
        },
        {
          onSuccess: () => handleCloseModal(),
        },
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!addressToDelete) return;

    deleteMutation.mutate(
      { clientId, addressId: addressToDelete.id },
      {
        onSuccess: () => setAddressToDelete(null),
      },
    );
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Direcciones</CardTitle>
        </div>
        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !addresses || addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MapPin className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">
              No hay direcciones registradas
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleOpenCreate}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar primera dirección
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <ClientAddressCard
                key={address.id}
                address={address}
                onEdit={() => handleOpenEdit(address)}
                onDelete={() => setAddressToDelete(address)}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal Crear/Editar */}
      <Dialog open={modalMode !== null} onOpenChange={() => handleCloseModal()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="pl-2">
              <DialogTitle>
                {modalMode === "create"
                  ? "Agregar Dirección"
                  : "Editar Dirección"}
              </DialogTitle>
              <DialogDescription>
                {modalMode === "create"
                  ? "Complete los datos de la nueva dirección"
                  : "Modifique los datos de la dirección"}
              </DialogDescription>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[70vh]">
            <div className="pl-2 pr-4 pb-2">
              {modalMode === "edit" && !selectedAddressFull ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
              <ClientAddressForm
                ref={formRef}
                isBillingAddress={false}
                defaultValues={
                  selectedAddressFull
                    ? {
                        addressType: selectedAddressFull.addressType,
                        isPrimary: selectedAddressFull.isPrimary,
                        locationName: selectedAddressFull.locationName ?? "",
                        satEstadoCode: selectedAddressFull.satEstadoCode ?? "",
                        satMunicipioCode: selectedAddressFull.satMunicipioCode ?? "",
                        satLocalidadCode: selectedAddressFull.satLocalidadCode ?? "",
                        satColoniaCode: selectedAddressFull.satColoniaCode ?? "",
                        postalCode: selectedAddressFull.postalCode ?? "",
                        street: selectedAddressFull.street ?? "",
                        exteriorNumber: selectedAddressFull.exteriorNumber ?? "",
                        interiorNumber: selectedAddressFull.interiorNumber ?? "",
                        reference: selectedAddressFull.reference ?? "",
                        rfcRemitenteDestinatario: selectedAddressFull.rfcRemitenteDestinatario ?? "",
                        nombreRemitenteDestinatario: selectedAddressFull.nombreRemitenteDestinatario ?? "",
                        latitude: selectedAddressFull.latitude ?? null,
                        longitude: selectedAddressFull.longitude ?? null,
                        contactName: selectedAddressFull.contactName ?? "",
                        contactPhone: selectedAddressFull.contactPhone ?? "",
                        contactEmail: selectedAddressFull.contactEmail ?? "",
                        businessHours: selectedAddressFull.businessHours ?? "",
                        notes: selectedAddressFull.notes ?? "",
                        specialInstructions: selectedAddressFull.specialInstructions ?? "",
                      }
                    : undefined
                }
                clientRfc={clientRfc}
                clientName={clientName}
                onChange={handleFormChange}
                disabled={isPending}
              />
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {modalMode === "create" ? "Crear" : "Guardar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmación de eliminación */}
      <AlertDialog
        open={addressToDelete !== null}
        onOpenChange={() => setAddressToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar dirección?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La dirección será eliminada
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export default ClientAddressSection;
