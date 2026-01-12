import { ErrorBoundary } from "@pages/errors/components/ErrorBoundary";
// import "./styles/App.css";
import { RouterProvider } from "@app/providers";
import ServerErrorPage from "@pages/errors/server-error";

const App = () => {
  return (
    <ErrorBoundary fallback={<ServerErrorPage />}>
      <RouterProvider />
    </ErrorBoundary>
  );
};

export default App;
