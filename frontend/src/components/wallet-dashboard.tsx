import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWalletBalance, useSignMessage, useGenerateWallet, useWallet, useSendTransaction, type Wallet } from "@/hooks/use-wallet"
import { CopyIcon, useDynamicContext } from "@dynamic-labs/sdk-react-core"
import { formatUnits, parseUnits } from "viem";

export function WalletDashboard() {
  const { authToken } = useDynamicContext();
  const [message, setMessage] = useState("")
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [selectedWallet, setSelectedWallet] = useState<Wallet['accounts'][0] | null>(null)

  const {
    data: balance,
    refetch: refetchBalance,
    isLoading: isBalanceLoading,
  } = useWalletBalance(selectedWallet?.index, authToken || '')

  const signMessageMutation = useSignMessage(authToken || '')
  const sendTransactionMutation = useSendTransaction(authToken || '')
  const generateWalletMutation = useGenerateWallet(authToken || '')
  const { data: walletData, isLoading: isWalletLoading } = useWallet(authToken || '')

  const wallets = walletData?.accounts

  if (!authToken) {
    return <div>Please login to continue</div>
  }

  const handleSignMessage = () => {
    if (!selectedWallet?.id || !message) return
    signMessageMutation.mutate({ walletId: selectedWallet.id, message })
  }


  const handleSendTransaction = () => {
    if (!recipient || !amount) return
    sendTransactionMutation.mutate({
      to: recipient,
      amount: parseUnits(amount, 18).toString()
    })
  }

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
                    const selectedWallet = wallets?.find(wallet => wallet.id === value);
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
                        {wallet.name || `Account ${wallet.index}`} ({wallet.address.slice(0,6)}...{wallet.address.slice(-4)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedWallet && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <p><span className="font-medium">Address:</span> {selectedWallet.address}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(selectedWallet.address)}
                      >
                        <CopyIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <Button
            onClick={() => generateWalletMutation.mutate()}
            className="w-full"
            disabled={isWalletLoading}
          >
            {isWalletLoading ? "Loading..." : "Generate New Wallet"}
          </Button>
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
                    <p className="text-2xl font-bold">{formatUnits(BigInt(balance), 18)} ETH</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={() => refetchBalance()} disabled={isBalanceLoading}>
                    {isBalanceLoading ? "Fetching..." : "Get Balance"}
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
                  {signMessageMutation.data && (
                    <div className="space-y-1">
                      <Label>Signed Message</Label>
                      <p className="text-sm break-all">{signMessageMutation.data.signedMessage}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleSignMessage}
                    disabled={signMessageMutation.isPending || !message}
                  >
                    {signMessageMutation.isPending ? "Signing..." : "Sign Message"}
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
                    <Input
                      id="recipient"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                    />
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
                  {sendTransactionMutation.data && (
                    <div className="space-y-1">
                      <Label>Transaction Hash</Label>
                      <p className="text-sm">{sendTransactionMutation.data.transactionHash}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleSendTransaction}
                    disabled={sendTransactionMutation.isPending || !recipient || !amount}
                  >
                    {sendTransactionMutation.isPending ? "Sending..." : "Send Transaction"}
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
  )
}
