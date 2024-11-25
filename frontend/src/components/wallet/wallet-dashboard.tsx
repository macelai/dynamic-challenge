import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useGenerateWallet,
  useSendTransaction,
  useSignMessage,
  useWallet,
  useWalletBalance,
} from "@/hooks/use-wallet";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseUnits } from "viem";
import type { WalletAccount } from "./types";
import { WalletBalance } from "./wallet-balance";
import { WalletGenerator } from "./wallet-generator";
import { WalletSelector } from "./wallet-selector";
import { WalletSendTransaction } from "./wallet-send-transaction";
import { WalletSignMessage } from "./wallet-sign-message";

export function WalletDashboard() {
  const { authToken } = useDynamicContext();
  const navigate = useNavigate();
  const [selectedWallet, setSelectedWallet] = useState<WalletAccount | null>(
    null
  );

  const {
    data: balance,
    refetch: refetchBalance,
    isLoading: isBalanceLoading,
    isFetching: isBalanceFetching,
  } = useWalletBalance(selectedWallet?.index, authToken || "");

  const {
    data: signedMessage,
    mutateAsync: signMessage,
    isPending: isSigningMessage,
  } = useSignMessage(authToken || "");
  const {
    data: transactionHash,
    mutateAsync: sendTransaction,
    isPending: isSendingTransaction,
  } = useSendTransaction(authToken || "");
  const { mutateAsync: generateWallet, isPending: isGeneratingWallet } =
    useGenerateWallet(authToken || "");
  const { data: walletData, isLoading: isWalletLoading } = useWallet(
    authToken || ""
  );

  if (!authToken) {
    navigate("/login");
    return null;
  }

  const handleSignMessage = (message: string) => {
    if (!selectedWallet?.id) return;
    signMessage({
      walletId: selectedWallet.id,
      message,
      index: selectedWallet.index,
    });
  };

  const handleSendTransaction = (to: string, amount: string) => {
    sendTransaction({
      to,
      amount: parseUnits(amount, 18).toString(),
      index: selectedWallet?.index || 0,
    });
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Wallet Dashboard</CardTitle>
        <CardDescription>Manage your crypto wallets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <WalletSelector
            wallets={walletData?.accounts}
            selectedWallet={selectedWallet}
            onWalletSelect={setSelectedWallet}
            isLoading={isWalletLoading}
          />
          <WalletGenerator
            onGenerate={(name) => generateWallet({ name })}
            isGenerating={isGeneratingWallet}
          />
        </div>
        {selectedWallet ? (
          <Tabs defaultValue="balance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="balance">Balance</TabsTrigger>
              <TabsTrigger value="sign">Sign Message</TabsTrigger>
              <TabsTrigger value="send">Send Transaction</TabsTrigger>
            </TabsList>
            <TabsContent value="balance">
              <WalletBalance
                balance={balance}
                isLoading={isBalanceLoading}
                isFetching={isBalanceFetching}
                onRefetch={refetchBalance}
              />
            </TabsContent>
            <TabsContent value="sign">
              <WalletSignMessage
                onSign={handleSignMessage}
                signedMessage={signedMessage}
                isSigningMessage={isSigningMessage}
              />
            </TabsContent>
            <TabsContent value="send">
              <WalletSendTransaction
                wallets={walletData?.accounts}
                selectedWallet={selectedWallet}
                onSend={handleSendTransaction}
                transactionHash={transactionHash}
                isSendingTransaction={isSendingTransaction}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <p>Please select a wallet to continue.</p>
        )}
      </CardContent>
    </Card>
  );
}
