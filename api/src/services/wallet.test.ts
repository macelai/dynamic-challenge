import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../../db";
import { DEFAULT_DERIVATION_PATH } from "../constants";
import {
  createNewAccount,
  createWalletWithMnemonic
} from "./wallet";

describe("Wallet Service", () => {
  const createTestUser = async () => {
    const userId = `user-${Date.now()}-${Math.random()}`;
    await db.user.create({
      data: {
        id: userId,
        email: `test-${userId}@example.com`,
      },
    });
    return userId;
  };

  const createTestWallet = async (userId: string) => {
    const mnemonic = await createWalletWithMnemonic(userId);
    const wallet = await db.wallet.findFirstOrThrow({
      where: { userId },
    });
    return { mnemonic, wallet };
  };

  describe("createWalletWithMnemonic", () => {
    it("should create a wallet and account with mnemonic", async () => {
      const userId = await createTestUser();
      const { mnemonic } = await createTestWallet(userId);

      // Verify mnemonic is valid
      expect(mnemonic.split(" ").length).toBe(12);

      const createdWallet = await db.wallet.findFirst({
        where: {
          userId,
          derivationPath: DEFAULT_DERIVATION_PATH,
          currentIndex: 1,
        },
        include: {
          accounts: true,
        },
      });

      expect(createdWallet).not.toBeNull();
      expect(createdWallet?.userId).toBe(userId);
      expect(createdWallet?.derivationPath).toBe(DEFAULT_DERIVATION_PATH);
      expect(createdWallet?.currentIndex).toBe(1);
      expect(createdWallet?.encryptedMnemonic).toBeDefined();
      expect(createdWallet?.iv).toBeDefined();

      // Verify account was created
      expect(createdWallet?.accounts).toHaveLength(1);
      expect(createdWallet?.accounts[0].index).toBe(0);
      expect(createdWallet?.accounts[0].userId).toBe(userId);
      expect(createdWallet?.accounts[0].address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it("should throw error if user does not exist", async () => {
      await expect(
        createWalletWithMnemonic("nonexistent-user")
      ).rejects.toThrow();
    });
  });

  describe("createNewAccount", () => {
    it("should create a new account for existing wallet", async () => {
      const userId = await createTestUser();
      const { wallet } = await createTestWallet(userId);

      const accountName = "Account 1";
      const newAddress = await createNewAccount(
        userId,
        wallet.id,
        accountName
      );

      expect(newAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);

      const createdAccount = await db.account.findFirst({
        where: {
          walletId: wallet.id,
          address: newAddress,
          index: 1,
          userId,
          name: accountName,
        },
      });

      expect(createdAccount).not.toBeNull();
    });

    it("should throw error if wallet not found", async () => {
      const userId = await createTestUser();
      await expect(
        createNewAccount(userId, "nonexistent-wallet", "Account 1")
      ).rejects.toThrow("Wallet not found");
    });

    it("should create multiple accounts with different indices", async () => {
      const userId = await createTestUser();
      const { wallet } = await createTestWallet(userId);

      const address1 = await createNewAccount(
        userId,
        wallet.id,
        "Account 1"
      );
      const address2 = await createNewAccount(
        userId,
        wallet.id,
        "Account 2"
      );

      expect(address1).not.toBe(address2);

      const accounts = await db.account.findMany({
        where: { walletId: wallet.id },
        orderBy: { index: "asc" },
      });

      expect(accounts).toHaveLength(3); // Including initial account
      expect(accounts[0].index).toBe(0);
      expect(accounts[1].index).toBe(1);
      expect(accounts[2].index).toBe(2);
    });
  });
});
