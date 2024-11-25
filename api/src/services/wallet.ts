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
import { encrypt } from "../lib/crypto";

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
