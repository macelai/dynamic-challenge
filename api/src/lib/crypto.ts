import { createCipheriv, createDecipheriv } from "node:crypto";
import { mnemonicToSeed } from "@scure/bip39";
import { HDKey } from "viem/accounts";
import { DEFAULT_DERIVATION_PATH } from "../constants";

const key = Buffer.from(process.env.ENCRYPTION_KEY || "", "hex");


/**
 * Derives a private key from a mnemonic
 * @param mnemonic - The mnemonic to derive the private key from
 * @returns The private key
 */
export const derivePrivateKey = async (mnemonic: string) => {
  const seed = await mnemonicToSeed(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const child = hdKey.derive(DEFAULT_DERIVATION_PATH);

  if (!child.privateKey) {
    throw new Error("Failed to generate private key");
  }

  return `0x${Buffer.from(child.privateKey).toString("hex")}` as `0x${string}`;
};

/**
 * Encrypts text using AES-256-CBC encryption
 * @param text - The text to encrypt
 * @returns Object containing the encrypted data and IV in hex format
 */
export function encrypt(text: string, iv: Buffer) {
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    encryptedData: encrypted,
    iv: iv.toString("hex"),
  };
}

/**
 * Decrypts AES-256-CBC encrypted data
 * @param encryptedData - The encrypted data in hex format
 * @param ivHex - The initialization vector in hex format
 * @returns The decrypted text
 */
export function decrypt(encryptedData: string, iv: string): string {
  const decipher = createDecipheriv("aes-256-cbc", key, Buffer.from(iv, "hex"));
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
