import type { Wallet } from "@/hooks/use-wallet";

export type WalletAccount = Wallet["accounts"][number];

export interface WalletSelectorProps {
  wallets: WalletAccount[] | undefined;
  selectedWallet: WalletAccount | null;
  onWalletSelect: (wallet: WalletAccount) => void;
  isLoading: boolean;
}

export interface WalletGeneratorProps {
  onGenerate: (name: string) => void;
  isGenerating: boolean;
}

export interface WalletBalanceProps {
  balance: string | undefined;
  isLoading: boolean;
  isFetching: boolean;
  onRefetch: () => void;
}

export interface WalletSignMessageProps {
  onSign: (message: string) => void;
  signedMessage: { signedMessage: string } | undefined;
  isSigningMessage: boolean;
}

export interface WalletSendTransactionProps {
  wallets: WalletAccount[] | undefined;
  selectedWallet: WalletAccount | null;
  onSend: (to: string, amount: string) => void;
  transactionHash: { transactionHash: string } | undefined;
  isSendingTransaction: boolean;
}