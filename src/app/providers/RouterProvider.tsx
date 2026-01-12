import { RouterProvider as ReactRouterProvider } from "react-router-dom";
import { router } from "../router/routes";

/**
 * RouterProvider
 *
 * Este provider conecta la configuración de rutas (routes.tsx) con React Router.
 *
 * Flujo:
 * 1. routes.tsx define TODAS las rutas con createBrowserRouter()
 * 2. RouterProvider importa ese router y lo pasa a React Router
 * 3. React Router maneja la navegación y renderiza el componente correcto
 *
 * ¿Por qué no hay children?
 * - A diferencia de otros providers, RouterProvider de React Router v6.4+
 *   NO recibe children. Las rutas ya están definidas en el objeto router.
 * - El contenido se renderiza según la URL actual.
 */
export const RouterProvider = () => {
  return (
    <ReactRouterProvider
      router={router}
      // Opciones futuras de React Router v7
      // future={{
      //   v7_startTransition: true,
      // }}
    />
  );
};
