// src/shared/ui/layouts/AuthLayout.jsx (temporal)
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Outlet /> {/* Login, Register, etc. */}
    </div>
  );
};