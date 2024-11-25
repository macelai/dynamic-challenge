import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type Wallet,
  useGenerateWallet,
  useSendTransaction,
  useSignMessage,
  useWallet,
  useWalletBalance,
} from "@/hooks/use-wallet";
import { CopyIcon, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatUnits, parseUnits } from "viem";

export function WalletDashboard() {
  const { authToken } = useDynamicContext();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [newWalletName, setNewWalletName] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<
    Wallet["accounts"][0] | null
  >(null);
  const [customRecipient, setCustomRecipient] = useState("");

  const {
    data: balance,
    refetch: refetchBalance,
    isLoading: isBalanceLoading,
    isFetching: isBalanceFetching
  } = useWalletBalance(selectedWallet?.index, authToken || "");

  const { data: signedMessage, mutateAsync: signMessage, isPending: isSigningMessage } = useSignMessage(authToken || "");
  const { data: transactionHash, mutateAsync: sendTransaction, isPending: isSendingTransaction } = useSendTransaction(authToken || "");
  const { mutateAsync: generateWallet, isPending: isGeneratingWallet } =
    useGenerateWallet(authToken || "");
  const { data: walletData, isLoading: isWalletLoading } = useWallet(
    authToken || ""
  );

  const wallets = walletData?.accounts;

  if (!authToken) {
    navigate("/login");
    return null;
  }

  const handleSignMessage = () => {
    if (!selectedWallet?.id || !message) return;
    signMessage({ walletId: selectedWallet.id, message, index: selectedWallet.index });
  };

  const handleSendTransaction = () => {
    if (!amount) return;
    const recipientAddress = recipient === "custom" ? customRecipient : recipient;
    if (!recipientAddress) return;

    sendTransaction({
      to: recipientAddress,
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
          <div>
            <Label htmlFor="wallet-select">Select Wallet</Label>
            {isWalletLoading ? (
              <div>Loading wallets...</div>
            ) : (
              <>
                <Select
                  onValueChange={(value) => {
                    const selectedWallet = wallets?.find(
                      (wallet) => wallet.id === value
                    );
                    if (selectedWallet) {
                      setSelectedWallet(selectedWallet);
                    }
                  }}
                  value={selectedWallet?.id || ""}
                >
                  <SelectTrigger id="wallet-select">
                    <SelectValue placeholder="Select a wallet" />
                  </SelectTrigger>
                  <SelectContent>
                    {wallets?.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name || `Account ${wallet.index}`} (
                        {wallet.address.slice(0, 6)}...
                        {wallet.address.slice(-4)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedWallet && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <p>
                        <span className="font-medium">Address:</span>{" "}
                        {selectedWallet.address}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigator.clipboard.writeText(selectedWallet.address)
                        }
                      >
                        <CopyIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="new-wallet-name">New Wallet Name</Label>
              <Input
                id="new-wallet-name"
                placeholder="Enter wallet name"
                value={newWalletName}
                onChange={(e) => setNewWalletName(e.target.value)}
              />
            </div>
            <Button
              onClick={() => generateWallet({ name: newWalletName })}
              className="w-full"
              disabled={isGeneratingWallet}
            >
              {isGeneratingWallet ? "Generating..." : "Generate New Wallet"}
            </Button>
          </div>
        </div>
        {selectedWallet ? (
          <Tabs defaultValue="balance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="balance">Balance</TabsTrigger>
              <TabsTrigger value="sign">Sign Message</TabsTrigger>
              <TabsTrigger value="send">Send Transaction</TabsTrigger>
            </TabsList>
            <TabsContent value="balance">
              <Card>
                <CardHeader>
                  <CardTitle>Your Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  {balance && (
                    <p className="text-2xl font-bold">
                      {formatUnits(BigInt(balance), 18)} ETH
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => refetchBalance()}
                    disabled={isBalanceLoading || isBalanceFetching}
                  >
                    {isBalanceLoading || isBalanceFetching ? "Fetching..." : "Get Balance"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="sign">
              <Card>
                <CardHeader>
                  <CardTitle>Sign a Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="message">Message</Label>
                    <Input
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                  {signedMessage && (
                    <div className="space-y-1">
                      <Label>Signed Message</Label>
                      <p className="text-sm break-all">
                        {signedMessage.signedMessage}
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleSignMessage}
                    disabled={isSigningMessage || !message}
                  >
                    {isSigningMessage
                      ? "Signing..."
                      : "Sign Message"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="send">
              <Card>
                <CardHeader>
                  <CardTitle>Send Transaction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="recipient">Recipient Address</Label>
                    <div className="flex gap-2">
                      <Select value={recipient} onValueChange={setRecipient}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select recipient" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Your Accounts</SelectLabel>
                            {wallets
                              ?.filter((wallet) => wallet.id !== selectedWallet?.id)
                              .map((account) => (
                                <SelectItem
                                  key={account.id}
                                  value={account.address}
                                >
                                  {account.name || `Account ${account.index}`} (
                                  {account.address})
                                </SelectItem>
                            ))}
                            <SelectSeparator />
                            <SelectLabel>Custom Address</SelectLabel>
                            <SelectItem value="custom">
                              Enter custom address
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    {recipient === "custom" && (
                      <Input
                        id="custom-recipient"
                        placeholder="Enter recipient address"
                        value={customRecipient}
                        onChange={(e) => setCustomRecipient(e.target.value)}
                        className="mt-2"
                      />
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="amount">Amount (ETH)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  {transactionHash && (
                    <div className="space-y-1">
                      <Label>Transaction Hash</Label>
                      <p className="text-sm">
                        {transactionHash.transactionHash}
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleSendTransaction}
                    disabled={
                      isSendingTransaction ||
                      !amount ||
                      (recipient === "custom" ? !customRecipient : !recipient)
                    }
                  >
                    {isSendingTransaction
                      ? "Sending..."
                      : "Send Transaction"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <p>Please select a wallet to continue.</p>
        )}
      </CardContent>
    </Card>
  );
}
