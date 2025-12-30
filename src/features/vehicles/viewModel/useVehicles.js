import { useQuery } from '@tanstack/react-query';
import { vehiclesService } from '../model/vehiclesService';

export const useVehicles = (filters = {}) => {
  return useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => vehiclesService.getAll(filters),
  });
};
