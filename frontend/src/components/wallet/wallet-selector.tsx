import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CopyIcon } from "@dynamic-labs/sdk-react-core";
import type { WalletSelectorProps } from "./types";

export function WalletSelector({
  wallets,
  selectedWallet,
  onWalletSelect,
  isLoading,
}: WalletSelectorProps) {
  if (isLoading) {
    return <div>Loading wallets...</div>;
  }

  return (
    <div>
      <Label htmlFor="wallet-select">Select Wallet</Label>
      <Select
        onValueChange={(value) => {
          const selected = wallets?.find((wallet) => wallet.id === value);
          if (selected) {
            onWalletSelect(selected);
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
              <span className="font-medium">Address:</span> {selectedWallet.address}
            </p>
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
    </div>
  );
}