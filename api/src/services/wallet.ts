import { randomBytes } from "node:crypto";
import { HDKey } from "@scure/bip32";
import {
  generateMnemonic as generateMnemonicBip39,
  mnemonicToSeed,
} from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { privateKeyToAccount } from "viem/accounts";
import { db } from "../../db";
import { mnemonicQueue } from "../config/queue";
import { DEFAULT_DERIVATION_PATH } from "../constants";
import { encrypt } from "../lib/crypto";

export const recoverWallet = async (
  mnemonic: string,
  path = DEFAULT_DERIVATION_PATH
) => {
  const seed = await mnemonicToSeed(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const child = hdKey.derive(path);

  if (!child.privateKey) {
    throw new Error("Failed to recover private key");
  }

  const privateKey = `0x${Buffer.from(child.privateKey).toString("hex")}`;
  const account = privateKeyToAccount(privateKey as `0x${string}`);

  return {
    address: account.address,
    privateKey,
  };
};

export async function queueMnemonicGeneration(userId: string) {
  const job = await mnemonicQueue.add(
    "generate-mnemonic",
    {
      userId,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    }
  );

  return job.id;
}

export async function createWalletWithMnemonic(userId: string) {
  const mnemonic = generateMnemonicBip39(wordlist);
  const seed = await mnemonicToSeed(mnemonic);

  const hdKey = HDKey.fromMasterSeed(seed);
  const child = hdKey.derive(DEFAULT_DERIVATION_PATH);

  const currentIndex = 0;

  if (!child.privateKey) {
    throw new Error("Failed to generate private key");
  }

  const privateKey = `0x${Buffer.from(child.privateKey).toString("hex")}`;
  const account = privateKeyToAccount(privateKey as `0x${string}`);

  const iv = randomBytes(16);

  const { encryptedData } = encrypt(mnemonic, iv);

  const wallet = await db.wallet.create({
    data: {
      userId,
      encryptedMnemonic: encryptedData,
      iv: iv.toString("hex"),
      derivationPath: DEFAULT_DERIVATION_PATH,
      currentIndex,
    },
  });

  await db.account.create({
    data: {
      address: account.address,
      index: currentIndex,
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
