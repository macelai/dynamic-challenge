import { useMutation, useQuery } from "@tanstack/react-query"
import { z } from "zod"

const BASE_URL = import.meta.env.VITE_API_BASE_URL

const walletSchema = z.object({
  id: z.string(),
  derivationPath: z.string(),
  currentIndex: z.number(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  accounts: z.array(z.object({
    id: z.string(),
    address: z.string(),
    name: z.string().nullable(),
    index: z.number(),
    createdAt: z.string()
  }))
})

const balanceResponseSchema = z.object({
  balance: z.string()
})

const signMessageResponseSchema = z.object({
  signedMessage: z.string()
})

const sendTransactionResponseSchema = z.object({
  transactionHash: z.string()
})

export type Wallet = z.infer<typeof walletSchema>

export function useGenerateWallet(authToken: string) {
  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      const response = await fetch(`${BASE_URL}/wallet/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      })

      if (!response.ok) {
        throw new Error('Failed to generate wallet')
      }

      const data = await response.json()
      return data as { jobId: string }
    }
  })
}

export function useWallet(authToken: string) {
  const fiveSeconds = 5000
  return useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await fetch(`${BASE_URL}/wallet`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch wallet')
      }

      const data = await response.json()
      return walletSchema.parse(data)
    },
    refetchInterval: fiveSeconds
  })
}

export function useWalletBalance(index: number | undefined, authToken: string) {
  return useQuery({
    queryKey: ["balance", index],
    queryFn: async () => {
      const response = await fetch(`${BASE_URL}/wallet/balance/${index}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }

      const data = await response.json();
      const validated = balanceResponseSchema.parse(data);
      return validated.balance;
    },
    enabled: false,
  });
}

export function useSignMessage(authToken: string) {
  return useMutation({
    mutationFn: async ({ walletId, message }: { walletId: string; message: string }) => {
      const response = await fetch(`${BASE_URL}/wallet/sign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletId, message })
      })

      if (!response.ok) {
        throw new Error('Failed to sign message')
      }

      const data = await response.json()
      const validated = signMessageResponseSchema.parse(data)
      return validated
    }
  })
}

export function useSendTransaction(authToken: string) {
  return useMutation({
    mutationFn: async ({ to, amount }: { to: string; amount: string }) => {
      console.log(JSON.stringify({ to, amount }));
      const response = await fetch(`${BASE_URL}/wallet/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to, amount })
      })

      if (!response.ok) {
        throw new Error('Failed to send transaction')
      }

      const data = await response.json()
      const validated = sendTransactionResponseSchema.parse(data)
      return validated
    }
  })
}