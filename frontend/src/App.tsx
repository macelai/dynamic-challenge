import { DynamicContextProvider, getAuthToken, type UserProfile, type Wallet } from "@dynamic-labs/sdk-react-core";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/login";

export default function App() {

    const handleUserAuthenticated = async (params: {
      handleLogOut: () => Promise<void>;
      isAuthenticated: boolean;
      primaryWallet: Wallet | null;
      user: UserProfile;
    }) => {
      try {
        const authToken = getAuthToken();
        const response = await fetch("http://localhost:3000/auth/login", {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: params.user.userId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to authenticate with backend");
        }
      } catch (error) {
        console.error("Authentication error:", error);
      }
    };

  return (
    <DynamicContextProvider
      settings={{
        environmentId: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID,
        walletConnectors: [],
        socialProvidersFilter: (providers) => providers,
        initialAuthenticationMode: 'connect-and-sign',
        events: {
          onAuthSuccess: handleUserAuthenticated,
        },
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
