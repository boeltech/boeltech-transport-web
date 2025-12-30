// src/shared/ui/layouts/MainLayout.jsx (temporal)
import { Outlet } from 'react-router-dom';

export const MainLayout = () => {
  return (
    <div>
      <header>Header aquí</header>
      <main>
        <Outlet /> {/* Aquí se renderizan las rutas hijas */}
      </main>
    </div>
  );
};