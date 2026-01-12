// Componente base reutilizable
export { ErrorPage } from "./ui/ErrorPage";

// Páginas de error específicas (lazy loaded en routes.tsx)
// Los exports default se importan con lazy() en routes.tsx:
// const NotFoundPage = lazy(() => import('@pages/errors/not-found'));
// const ForbiddenPage = lazy(() => import('@pages/errors/forbidden'));
// const ServerErrorPage = lazy(() => import('@pages/errors/server-error'));
// const MaintenancePage = lazy(() => import('@pages/errors/maintenance'));
