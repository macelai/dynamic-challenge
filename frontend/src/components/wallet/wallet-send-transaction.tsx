import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { useState } from "react";
import type { WalletSendTransactionProps } from "./types";

export function WalletSendTransaction({
  wallets,
  selectedWallet,
  onSend,
  transactionHash,
  isSendingTransaction,
}: WalletSendTransactionProps) {
  const [recipient, setRecipient] = useState("");
  const [customRecipient, setCustomRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const handleSendTransaction = () => {
    if (!amount) return;
    const recipientAddress = recipient === "custom" ? customRecipient : recipient;
    if (!recipientAddress) return;
    onSend(recipientAddress, amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Transaction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="recipient">Recipient Address</Label>
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
                    <SelectItem key={account.id} value={account.address}>
                      {account.name || `Account ${account.index}`} ({account.address})
                    </SelectItem>
                  ))}
                <SelectSeparator />
                <SelectLabel>Custom Address</SelectLabel>
                <SelectItem value="custom">Enter custom address</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
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
            <p className="text-sm">{transactionHash.transactionHash}</p>
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
          {isSendingTransaction ? "Sending..." : "Send Transaction"}
        </Button>
      </CardFooter>
    </Card>
  );
}