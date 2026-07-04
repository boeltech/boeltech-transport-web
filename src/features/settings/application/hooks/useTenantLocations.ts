import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@shared/hooks";
import type {
  ClientAddress,
  ClientAddressListItem,
  CreateClientAddressDTO,
  UpdateClientAddressDTO,
} from "@features/clients/domain";
import { settingsQueryKeys } from "../../domain";
import {
  createTenantLocation,
  deleteTenantLocation,
  fetchTenantLocationById,
  fetchTenantLocations,
  updateTenantLocation,
} from "../../infrastructure/tenantLocationApi";
import { tenantLocationsCopy } from "../../presentation/copy/tenantLocationsCopy";

export function useTenantLocations() {
  return useQuery({
    queryKey: settingsQueryKeys.locations(),
    queryFn: fetchTenantLocations,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTenantLocation(id: string | undefined) {
  return useQuery({
    queryKey: settingsQueryKeys.location(id ?? ""),
    queryFn: () => fetchTenantLocationById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateTenantLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ClientAddress, Error, CreateClientAddressDTO>({
    mutationFn: createTenantLocation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.locations() });
      toast({ title: tenantLocationsCopy.toast.created });
    },
    onError: () => {
      toast({
        title: tenantLocationsCopy.toast.error,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTenantLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    ClientAddress,
    Error,
    { id: string; data: UpdateClientAddressDTO }
  >({
    mutationFn: ({ id, data }) => updateTenantLocation(id, data),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.locations() });
      void queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.location(data.id),
      });
      toast({ title: tenantLocationsCopy.toast.updated });
    },
    onError: () => {
      toast({
        title: tenantLocationsCopy.toast.error,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTenantLocation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<void, Error, string>({
    mutationFn: deleteTenantLocation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.locations() });
      toast({ title: tenantLocationsCopy.toast.deleted });
    },
    onError: () => {
      toast({
        title: tenantLocationsCopy.toast.error,
        variant: "destructive",
      });
    },
  });
}

export type { ClientAddressListItem };
