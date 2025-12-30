import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '@/shared/api/axiosConfig';
import { useAuthContext } from '@/app/providers/AuthProvider';

export const useRegister = () => {
  const { setAuthUser } = useAuthContext();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post('/auth/register', userData);

      setAuthUser(data.user, data.token);
      toast.success('Cuenta creada exitosamente');
      navigate('/dashboard');
      
      return { success: true, user: data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al registrar';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading };
};