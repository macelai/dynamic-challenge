import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import type { WalletGeneratorProps } from "./types";

export function WalletGenerator({ onGenerate, isGenerating }: WalletGeneratorProps) {
  const [newWalletName, setNewWalletName] = useState("");

  return (
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
        onClick={() => onGenerate(newWalletName)}
        className="w-full"
        disabled={isGenerating}
      >
        {isGenerating ? "Generating..." : "Generate New Wallet"}
      </Button>
    </div>
  );
}