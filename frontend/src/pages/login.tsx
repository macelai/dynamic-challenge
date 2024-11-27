import { Button } from "@/components/ui/button";
import { DynamicConnectButton, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const isLoggedIn = useIsLoggedIn();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      console.log("Attempting to navigate to dashboard...");
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);

  if (isLoggedIn) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md w-full p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Dynamic Challenge</h1>
        <DynamicConnectButton
          buttonClassName="w-full"
          buttonContainerClassName="w-full"
        >
          <Button className="w-full" size="lg">
            Login
          </Button>
        </DynamicConnectButton>
      </div>
    </div>
  );
}