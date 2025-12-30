import { useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '@/shared/api/axiosConfig';
import { useAuthContext } from '@/app/providers/AuthProvider';

export const useProfile = () => {
  const { user, setAuthUser } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const updateProfile = async (userData) => {
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.put('/auth/profile', userData);
      
      // Actualizar usuario en el contexto (mantener token)
      const currentToken = localStorage.getItem('token');
      setAuthUser(data.user, currentToken);
      
      toast.success('Perfil actualizado');
      return { success: true, user: data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar perfil';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAvatar = async (file) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const { data } = await axiosInstance.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const currentToken = localStorage.getItem('token');
      setAuthUser(data.user, currentToken);
      
      toast.success('Avatar actualizado');
      return { success: true, avatarUrl: data.user.avatarUrl };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al subir avatar';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    updateProfile,
    uploadAvatar,
    isLoading,
  };
};