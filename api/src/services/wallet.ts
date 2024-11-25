import { randomBytes } from "node:crypto";
import { HDKey } from "@scure/bip32";
import {
  generateMnemonic as generateMnemonicBip39,
  mnemonicToSeed,
} from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { privateKeyToAccount } from "viem/accounts";
import { db } from "../../db";
import { DEFAULT_DERIVATION_PATH } from "../constants";
import { decrypt, encrypt } from "../lib/crypto";

export async function createWalletWithMnemonic(userId: string) {
  const mnemonic = generateMnemonicBip39(wordlist);
  const address = await deriveAccountFromMnemonic(mnemonic, 0);
  const iv = randomBytes(16);
  const { encryptedData } = encrypt(mnemonic, iv);
  const nextIndex = 1;

  const wallet = await db.wallet.create({
    data: {
      userId,
      encryptedMnemonic: encryptedData,
      iv: iv.toString("hex"),
      derivationPath: DEFAULT_DERIVATION_PATH,
      currentIndex: nextIndex,
    },
  });

  await db.account.create({
    data: {
      address,
      index: 0,
      wallet: {
        connect: {
          id: wallet.id,
        },
      },
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });

  return mnemonic;
}

/**
 * Creates a new account for an existing wallet
 * @param userId The ID of the user who owns the wallet
 * @param walletId The ID of the wallet to generate a new account from
 * @param name The name of the account to generate
 * @returns The generated account address
 * @throws {Error} If wallet not found or unauthorized access
 */
export async function createNewAccount(
  userId: string,
  walletId: string,
  name: string
) {
  const wallet = await db.wallet.findUnique({
    where: {
      id: walletId,
    },
  });

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  if (wallet.userId !== userId) {
    throw new Error("Unauthorized access to wallet");
  }

  const mnemonic = decrypt(wallet.encryptedMnemonic, wallet.iv);
  const newAccount = await deriveAccountFromMnemonic(
    mnemonic,
    wallet.currentIndex
  );

  await db.$transaction(async (trx) => {
    await db.account.create({
      data: {
        walletId,
        address: newAccount,
        index: wallet.currentIndex,
        userId,
        name,
      },
    });

    await db.wallet.update({
      where: { id: walletId },
      data: {
        currentIndex: wallet.currentIndex + 1,
      },
    });
  });

  return newAccount;
}

/**
 * Derives a new account address from a mnemonic phrase at the specified index
 * @param mnemonic The mnemonic phrase to derive the account from
 * @param index The index to derive the account at
 * @returns The generated account address
 */
export async function deriveAccountFromMnemonic(
  mnemonic: string,
  index: number
) {
  const seed = await mnemonicToSeed(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);

  const derivationPath = `${DEFAULT_DERIVATION_PATH}/${index}`;
  const child = hdKey.derive(derivationPath);

  if (!child.privateKey) {
    throw new Error("Failed to generate private key");
  }

  const privateKey = `0x${Buffer.from(child.privateKey).toString("hex")}`;
  const account = privateKeyToAccount(privateKey as `0x${string}`);

  return account.address;
}
