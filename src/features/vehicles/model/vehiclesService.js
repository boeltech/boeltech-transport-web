import axiosInstance from '@/shared/api/axiosConfig';

export const vehiclesService = {
  getAll: async (filters) => {
    const { data } = await axiosInstance.get('/vehicles', { params: filters });
    return data;
  },

  getById: async (id) => {
    const { data } = await axiosInstance.get(`/vehicles/${id}`);
    return data;
  },

  create: async (vehicle) => {
    const { data } = await axiosInstance.post('/vehicles', vehicle);
    return data;
  },

  update: async (id, vehicle) => {
    const { data } = await axiosInstance.put(`/vehicles/${id}`, vehicle);
    return data;
  },

  delete: async (id) => {
    const { data } = await axiosInstance.delete(`/vehicles/${id}`);
    return data;
  },
};
