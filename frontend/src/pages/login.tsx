import { DynamicConnectButton, useIsLoggedIn, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useState } from "react";

export default function LoginPage() {
  const isLoggedIn = useIsLoggedIn();
  const { user, authToken } = useDynamicContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateWallet = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3000/wallet/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate wallet');
      }

      const wallet = await response.json();
      console.log('Generated wallet:', wallet);
    } catch (error) {
      console.error('Error generating wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md w-full p-6">
        {isLoggedIn ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-6">You are logged in!</h1>
            {user?.email && (
              <p className="text-gray-600 mb-4">Email: {user.email}</p>
            )}
            <button
              onClick={handleGenerateWallet}
              disabled={isLoading}
              className="w-full rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
              type="button"
            >
              {isLoading ? 'Generating...' : 'Generate Wallet'}
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6 text-center">Welcome Back</h1>
            <DynamicConnectButton
              buttonClassName="w-full rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 transition-colors"
            >
              Login
            </DynamicConnectButton>
          </>
        )}
      </div>
    </div>
  );
}