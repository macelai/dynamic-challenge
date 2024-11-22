import { HDKey } from "@scure/bip32";
import {
    generateMnemonic as generateMnemonicBip39,
    mnemonicToSeed,
} from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { privateKeyToAccount } from "viem/accounts";
import { DEFAULT_DERIVATION_PATH } from "../constants";

export const generateMnemonic = async () => {
  const mnemonic = generateMnemonicBip39(wordlist);

  return {
    mnemonic,
  };
};

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
