import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/login";

export default function App() {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID,
        walletConnectors: [],
        socialProvidersFilter: (providers) => providers,
        initialAuthenticationMode: 'connect-and-sign',
      }}
    >
      <BrowserRouter>
        <div className="container mx-auto px-4">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            {/* Add more routes here as needed */}
          </Routes>
        </div>
      </BrowserRouter>
    </DynamicContextProvider>
  );
}
