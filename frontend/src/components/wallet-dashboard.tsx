import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type  Wallet = {
  id: string
  name: string
  address: string
}

export function WalletDashboard() {
  const [balance, setBalance] = useState<number | null>(null)
  const [message, setMessage] = useState("")
  const [signedMessage, setSignedMessage] = useState("")
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [transactionHash, setTransactionHash] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)

  const wallets = [
    {
      id: "1",
      name: "Wallet 1",
      address: "0x1234567890abcdef",
    },
  ]

  const getBalance = async () => {
    setIsLoading(true)
    try {
      // Mocking the API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setBalance(Math.random() * 10)
    } catch (error) {
      console.error('Error getting balance:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const signMessage = async () => {
    setIsLoading(true)
    try {
      // Mocking the API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSignedMessage(`Mocked signed message for: ${message} from wallet: ${selectedWallet?.name}`)
    } catch (error) {
      console.error('Error signing message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendTransaction = async () => {
    setIsLoading(true)
    try {
      // Mocking the API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setTransactionHash(`Mocked transaction hash for sending ${amount} to ${recipient} from wallet: ${selectedWallet?.name}`)
    } catch (error) {
      console.error('Error sending transaction:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Wallet Dashboard</CardTitle>
        <CardDescription>Manage your crypto wallets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Label htmlFor="wallet-select">Select Wallet</Label>
          <Select onValueChange={(value) => setSelectedWallet(wallets.find((wallet) => wallet.id === value) || null)} value={selectedWallet?.id}>
            <SelectTrigger id="wallet-select">
              <SelectValue placeholder="Select a wallet" />
            </SelectTrigger>
            <SelectContent>
              {wallets.map((wallet) => (
                <SelectItem key={wallet.id} value={wallet.id}>
                  {wallet.name} ({wallet.address})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  {balance !== null ? (
                    <p className="text-2xl font-bold">{balance.toFixed(4)} ETH</p>
                  ) : (
                    <p>Click the button to fetch your balance</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={getBalance} disabled={isLoading}>
                    {isLoading ? "Fetching..." : "Get Balance"}
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
                      <p className="text-sm">{signedMessage}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={signMessage} disabled={isLoading || !message}>
                    {isLoading ? "Signing..." : "Sign Message"}
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
                  {transactionHash && (
                    <div className="space-y-1">
                      <Label>Transaction Hash</Label>
                      <p className="text-sm">{transactionHash}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={sendTransaction}
                    disabled={isLoading || !recipient || !amount}
                  >
                    {isLoading ? "Sending..." : "Send Transaction"}
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
