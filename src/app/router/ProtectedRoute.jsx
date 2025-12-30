// src/app/router/ProtectedRoute.jsx

import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/app/providers/AuthProvider';

/**
 * ProtectedRoute - Componente para proteger rutas que requieren autenticación
 * Redirige a /login si el usuario no está autenticado
 * 
 * @param {Object} props
 * @param {ReactNode} props.children - Componentes hijos a renderizar si está autenticado
 * @param {string} props.redirectTo - Ruta a la que redirigir si no está autenticado (default: /login)
 */
export const ProtectedRoute = ({ children, redirectTo = '/login' }) => {
  const { isAuthenticated, isLoading } = useAuthContext();

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si está autenticado, renderizar children
  return children;
};