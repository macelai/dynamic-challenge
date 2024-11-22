import { DynamicConnectButton, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const isLoggedIn = useIsLoggedIn();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);

  if (isLoggedIn) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md w-full p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Welcome Back</h1>
        <DynamicConnectButton
          buttonClassName="w-full rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 transition-colors"
        >
          Login
        </DynamicConnectButton>
      </div>
    </div>
  );
}