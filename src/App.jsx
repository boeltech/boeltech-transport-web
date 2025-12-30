// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }
// export default App;

// src/App.jsx

import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Providers
import { QueryProvider } from '@/app/providers/QueryProvider';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { PermissionsProvider } from '@/app/providers/PermissionsProvider';

// Router
import { AppRouter } from '@/app/router/AppRouter';

// Estilos globales
import '@/app/styles/globals.css';

/**
 * Componente principal de la aplicación
 * Configura todos los providers y el routing
 */
function App() {
  return (
    <BrowserRouter>
      {/* React Query Provider - Gestión de estado del servidor */}
      <QueryProvider>
        {/* Auth Provider - Gestión de autenticación */}
        <AuthProvider>
          {/* Permissions Provider - Gestión de permisos RBAC */}
          <PermissionsProvider>
            {/* Router Principal */}
            <AppRouter />

            {/* Notificaciones Toast */}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={true}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </PermissionsProvider>
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  );
}

export default App;