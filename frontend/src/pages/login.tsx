import { DynamicConnectButton, useIsLoggedIn, useDynamicContext } from "@dynamic-labs/sdk-react-core";

export default function LoginPage() {
  const isLoggedIn = useIsLoggedIn();
  const { user } = useDynamicContext();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md w-full p-6">
        {isLoggedIn ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-6">You are logged in!</h1>
            {user?.email && (
              <p className="text-gray-600">Email: {user.email}</p>
            )}
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