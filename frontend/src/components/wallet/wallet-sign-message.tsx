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
import { useState } from "react";
import type { WalletSignMessageProps } from "./types";

export function WalletSignMessage({
  onSign,
  signedMessage,
  isSigningMessage,
}: WalletSignMessageProps) {
  const [message, setMessage] = useState("");

  return (
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
            <p className="text-sm break-all">{signedMessage.signedMessage}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => onSign(message)}
          disabled={isSigningMessage || !message}
        >
          {isSigningMessage ? "Signing..." : "Sign Message"}
        </Button>
      </CardFooter>
    </Card>
  );
}