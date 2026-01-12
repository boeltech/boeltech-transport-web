export { RouterProvider } from "./RouterProvider";

export { useAuth } from "./AuthProvider";

export { usePermissions } from "./PermissionProvider";

// interface AppProvidersProps {
//   children: ReactNode;
// }

// export const AppProviders = ({ children }: AppProvidersProps) => {
//   return (
//     <RouterProvider>
//       {" "}
//       {/* 1️⃣ Primer nivel - habilita navegación */}
//       <QueryProvider>
//         {" "}
//         {/* 2️⃣ React Query - data fetching */}
//         <AuthProvider>
//           {" "}
//           {/* 3️⃣ Auth - necesita Query para validar token */}
//           <PermissionProvider>
//             {" "}
//             {/* 4️⃣ Permissions Provider - Gestión de permisos RBAC */}
//             <ThemeProvider>
//               {" "}
//               {/* 4️⃣ Tema - independiente */}
//               <ToastProvider>
//                 {" "}
//                 {/* 5️⃣ Toasts - último, puede mostrar errores de auth */}
//                 {children}
//               </ToastProvider>
//             </ThemeProvider>
//           </PermissionProvider>
//         </AuthProvider>
//       </QueryProvider>
//     </RouterProvider>
//   );
// };

// export const AppRouterProvider = () => {
//   return <RouterProvider />;
// };
