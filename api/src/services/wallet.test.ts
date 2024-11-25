import { beforeEach, describe, expect, it } from "vitest";
import { db } from "../../db";
import { DEFAULT_DERIVATION_PATH } from "../constants";
import {
  createNewAccount,
  createWalletWithMnemonic
} from "./wallet";

describe("Wallet Service", () => {
  const mockUserId = "user123";

  beforeEach(async () => {
    await db.user.create({
      data: {
        id: mockUserId,
        email: "test@example.com",
      },
    });
  });

  describe("createWalletWithMnemonic", () => {
    it("should create a wallet and account with mnemonic", async () => {
      const mnemonic = await createWalletWithMnemonic(mockUserId);

      // Verify mnemonic is valid
      expect(mnemonic.split(" ").length).toBe(12);

      const createdWallet = await db.wallet.findFirst({
        where: {
          userId: mockUserId,
          derivationPath: DEFAULT_DERIVATION_PATH,
          currentIndex: 1,
        },
        include: {
          accounts: true,
        },
      });

      expect(createdWallet).not.toBeNull();
      expect(createdWallet?.userId).toBe(mockUserId);
      expect(createdWallet?.derivationPath).toBe(DEFAULT_DERIVATION_PATH);
      expect(createdWallet?.currentIndex).toBe(1);
      expect(createdWallet?.encryptedMnemonic).toBeDefined();
      expect(createdWallet?.iv).toBeDefined();

      // Verify account was created
      expect(createdWallet?.accounts).toHaveLength(1);
      expect(createdWallet?.accounts[0].index).toBe(0);
      expect(createdWallet?.accounts[0].userId).toBe(mockUserId);
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
      const mnemonic = await createWalletWithMnemonic(mockUserId);
      const wallet = await db.wallet.findFirstOrThrow({
        where: { userId: mockUserId },
      });

      const accountName = "Account 1";
      const newAddress = await createNewAccount(
        mockUserId,
        wallet.id,
        accountName
      );

      expect(newAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);

      const createdAccount = await db.account.findFirst({
        where: {
          walletId: wallet.id,
          address: newAddress,
          index: 1,
          userId: mockUserId,
          name: accountName,
        },
      });

      expect(createdAccount).not.toBeNull();
    });

    it("should throw error if wallet not found", async () => {
      await expect(
        createNewAccount(mockUserId, "nonexistent-wallet", "Account 1")
      ).rejects.toThrow("Wallet not found");
    });

    it("should throw error if unauthorized access", async () => {
      const otherUserId = "other-user123";
      await db.user.create({
        data: {
          id: otherUserId,
          email: "other@example.com",
        },
      });

      await createWalletWithMnemonic(otherUserId);
      const wallet = await db.wallet.findFirstOrThrow({
        where: { userId: otherUserId },
      });

      await expect(
        createNewAccount(mockUserId, wallet.id, "Account 1")
      ).rejects.toThrow("Unauthorized access to wallet");
    });

    it("should create multiple accounts with different indices", async () => {
      await createWalletWithMnemonic(mockUserId);
      const wallet = await db.wallet.findFirstOrThrow({
        where: { userId: mockUserId },
      });

      const address1 = await createNewAccount(
        mockUserId,
        wallet.id,
        "Account 1"
      );
      const address2 = await createNewAccount(
        mockUserId,
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
