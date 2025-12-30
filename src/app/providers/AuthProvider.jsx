// src/app/providers/AuthProvider.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/shared/api/axiosConfig';

// Crear Context
const AuthContext = createContext(null);

/**
 * AuthProvider - Proveedor de autenticación global
 * Maneja login, logout, registro y estado del usuario
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Verificar si hay una sesión activa al cargar la app
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Verificar autenticación con el token almacenado
   */
  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // Verificar token con el backend
      const { data } = await axiosInstance.get('/auth/me');
      
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      // Token inválido o expirado
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login - Iniciar sesión
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} Usuario autenticado
   */
  const login = async (email, password) => {
    try {
      const { data } = await axiosInstance.post('/auth/login', {
        email,
        password,
      });

      // Guardar token y usuario
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setUser(data.user);
      setIsAuthenticated(true);

      return { success: true, user: data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      console.error('Error en login:', message);
      
      return { success: false, error: message };
    }
  };

  /**
   * Logout - Cerrar sesión
   */
  const logout = async () => {
    try {
      // Opcional: notificar al backend
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      // Limpiar estado local
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  /**
   * Register - Registrar nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} Usuario registrado
   */
  const register = async (userData) => {
    try {
      const { data } = await axiosInstance.post('/auth/register', userData);

      // Auto-login después del registro
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setUser(data.user);
      setIsAuthenticated(true);

      return { success: true, user: data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al registrar';
      console.error('Error en registro:', message);
      
      return { success: false, error: message };
    }
  };

  /**
   * Update User - Actualizar datos del usuario
   * @param {Object} userData - Datos a actualizar
   */
  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  /**
   * Refresh Token - Refrescar token de autenticación
   */
  const refreshToken = async () => {
    try {
      const { data } = await axiosInstance.post('/auth/refresh');
      
      localStorage.setItem('token', data.token);
      return { success: true };
    } catch (error) {
      console.error('Error refrescando token:', error);
      // Si falla, hacer logout
      await logout();
      return { success: false };
    }
  };

  /**
   * Request Password Reset - Solicitar reseteo de contraseña
   * @param {string} email - Email del usuario
   */
  const requestPasswordReset = async (email) => {
    try {
      await axiosInstance.post('/auth/forgot-password', { email });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al solicitar reseteo';
      return { success: false, error: message };
    }
  };

  /**
   * Reset Password - Resetear contraseña
   * @param {string} token - Token de reseteo
   * @param {string} newPassword - Nueva contraseña
   */
  const resetPassword = async (token, newPassword) => {
    try {
      await axiosInstance.post('/auth/reset-password', {
        token,
        password: newPassword,
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al resetear contraseña';
      return { success: false, error: message };
    }
  };

  /**
   * Change Password - Cambiar contraseña (usuario autenticado)
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axiosInstance.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Error al cambiar contraseña';
      return { success: false, error: message };
    }
  };

  // Valores y funciones expuestas en el Context
  const value = {
    // Estado
    user,
    isLoading,
    isAuthenticated,

    // Funciones de autenticación
    login,
    logout,
    register,
    updateUser,
    refreshToken,

    // Funciones de contraseña
    requestPasswordReset,
    resetPassword,
    changePassword,

    // Helper functions
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook personalizado para usar el AuthContext
 * @returns {Object} Contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};

// Export del contexto (opcional, para casos avanzados)
export { AuthContext };