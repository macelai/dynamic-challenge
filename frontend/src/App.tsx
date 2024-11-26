import {
  DynamicContextProvider,
  type UserProfile,
  type Wallet,
  getAuthToken,
} from "@dynamic-labs/sdk-react-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import DashboardPage from "./pages/dashboard";
import LoginPage from "./pages/login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function App() {
  const handleUserAuthenticated = async (params: {
    handleLogOut: () => Promise<void>;
    isAuthenticated: boolean;
    primaryWallet: Wallet | null;
    user: UserProfile;
  }) => {
    const authToken = getAuthToken();
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: params.user.userId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to authenticate with backend");
    }
  };

  return (
    <DynamicContextProvider
      settings={{
        environmentId: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID,
        // BUG: if no wallet connectors are provided, modal doesn't close after authentication
        walletConnectors: [],
        events: {
          onAuthSuccess: handleUserAuthenticated,
        },
      }}
    >
      <BrowserRouter>
        <ThemeProvider defaultTheme="dark">
          <QueryClientProvider client={queryClient}>
            <div className="container mx-auto px-4">
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
              </Routes>
            </div>
          </QueryClientProvider>
        </ThemeProvider>
      </BrowserRouter>
    </DynamicContextProvider>
  );
}
