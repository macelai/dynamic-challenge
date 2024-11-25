import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatUnits } from "viem";
import type { WalletBalanceProps } from "./types";

export function WalletBalance({
  balance,
  isLoading,
  isFetching,
  onRefetch,
}: WalletBalanceProps) {
  return (
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
          onClick={onRefetch}
          disabled={isLoading || isFetching}
        >
          {isLoading || isFetching ? "Fetching..." : "Get Balance"}
        </Button>
      </CardFooter>
    </Card>
  );
}