import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '@/shared/api/axiosConfig';
import { useAuthContext } from '@/app/providers/AuthProvider';

export const useLogin = () => {
  const { setAuthUser } = useAuthContext();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post('/auth/login', {
        email,
        password,
      });

      setAuthUser(data.user, data.token);
      toast.success('¡Bienvenido!');
      navigate('/dashboard');
      
      return { success: true, user: data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading };
};