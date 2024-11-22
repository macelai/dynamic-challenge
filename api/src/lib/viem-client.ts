import { createPublicClient, createWalletClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.RPC_URL),
});

function createWalletClientWithAccount(privateKey: `0x${string}`) {

  const account = privateKeyToAccount(privateKey)

  return {
    account,
    walletClient: createWalletClient({
      account,
      chain: sepolia,
      transport: http(process.env.RPC_URL),
    }),
  };
}

export async function getBalance(address: string) {
  return publicClient.getBalance({
    address: address as `0x${string}`
  })
}

export async function signMessage(message: string, privateKey: `0x${string}`) {
  return createWalletClientWithAccount(privateKey).walletClient.signMessage({
    message
  })
}

export async function sendTransaction(to: `0x${string}`, value: bigint, privateKey: `0x${string}`) {
  return createWalletClientWithAccount(privateKey).walletClient.sendTransaction({
    to,
    value,
  })
}