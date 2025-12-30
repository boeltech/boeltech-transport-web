import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesService } from '../model/vehiclesService';
import { toast } from 'react-toastify';

export const useCreateVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vehiclesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehículo creado exitosamente');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear vehículo');
    },
  });
};
