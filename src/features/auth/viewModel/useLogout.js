import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '@/shared/api/axiosConfig';
import { useAuthContext } from '@/app/providers/AuthProvider';

export const useLogout = () => {
  const { clearAuth } = useAuthContext();
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      clearAuth();
      toast.success('Sesión cerrada');
      navigate('/login');
    }
  };

  return { logout };
};