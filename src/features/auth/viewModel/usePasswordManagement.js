import { useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '@/shared/api/axiosConfig';

export const usePasswordManagement = () => {
  const [isLoading, setIsLoading] = useState(false);

  const requestPasswordReset = async (email) => {
    setIsLoading(true);
    try {
      await axiosInstance.post('/auth/forgot-password', { email });
      toast.success('Email de recuperación enviado');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al solicitar reseteo';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    setIsLoading(true);
    try {
      await axiosInstance.post('/auth/reset-password', {
        token,
        password: newPassword,
      });
      toast.success('Contraseña actualizada');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al resetear contraseña';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setIsLoading(true);
    try {
      await axiosInstance.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast.success('Contraseña cambiada exitosamente');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al cambiar contraseña';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    requestPasswordReset,
    resetPassword,
    changePassword,
    isLoading,
  };
};