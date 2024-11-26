import type { FastifyInstance, HTTPMethods } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from "../../db";
import { build } from "../test-utils/build-server";
import { getBalance, sendTransaction, signMessage } from "../lib/viem-client";
import { decrypt, derivePrivateKey } from "../lib/crypto";
import { queueAccountGeneration } from "../queues/producers/account.queue";
import { randomBytes } from "node:crypto";
import type { Wallet } from "@prisma/client";

// Mock external dependencies
vi.mock("../lib/viem-client", () => ({
  getBalance: vi.fn(),
  sendTransaction: vi.fn(),
  signMessage: vi.fn(),
}));

vi.mock("../lib/crypto", () => ({
  decrypt: vi.fn(),
  derivePrivateKey: vi.fn(),
}));

vi.mock("../queues/producers/account.queue", () => ({
  queueAccountGeneration: vi.fn(),
}));

describe("Wallet Routes", () => {
  let app: FastifyInstance;
  let mockWallet: Wallet;
  const mockUser = {
    userId: `user-${Date.now()}-${Math.random()}`,
    email: `test-${Date.now()}@example.com`,
  };

  // Helper functions
  const createTestAccount = async (index = 0) => {
    return await db.account.create({
      data: {
        userId: mockUser.userId,
        walletId: mockWallet.id,
        address: "0xaddress",
        index,
      }
    });
  };

  const makeAuthenticatedRequest = async (method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH", url: string, payload = {}) => {
    return app.inject({
      method,
      url,
      headers: {
        "x-mock-user": JSON.stringify(mockUser),
      },
      payload,
    });
  };

  beforeEach(async () => {
    app = await build();
    vi.clearAllMocks();

    await db.user.create({
      data: {
        id: mockUser.userId,
        email: mockUser.email,
      },
    });

    mockWallet = await db.wallet.create({
      data: {
        userId: mockUser.userId,
        encryptedMnemonic: "encrypted-test-mnemonic",
        iv: randomBytes(16).toString("hex"),
        derivationPath: "m/44'/60'/0'/0",
        currentIndex: 1,
      }
    });
  });

  afterEach(async () => {
    await app.close();
  });

  describe("POST /wallet/generate", () => {
    it("should generate a new account successfully", async () => {
      vi.mocked(queueAccountGeneration).mockResolvedValue("test-job-id");

      const response = await makeAuthenticatedRequest("POST", "/wallet/generate", {
        name: "Test Account",
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({ jobId: "test-job-id" });
      expect(queueAccountGeneration).toHaveBeenCalledWith(
        mockUser.userId,
        mockWallet.id,
        "Test Account"
      );
    });

    it("should return 401 when user is not authenticated", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/wallet/generate",
        payload: { name: "Test Wallet" },
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.payload)).toEqual({ error: "Unauthorized" });
    });
  });

  describe("POST /wallet/send", () => {
    it("should send transaction successfully", async () => {
      await createTestAccount();

      vi.mocked(decrypt).mockReturnValue("test-mnemonic");
      vi.mocked(derivePrivateKey).mockResolvedValue("0xprivatekey" as `0x${string}`);
      vi.mocked(sendTransaction).mockResolvedValue("0xtxhash");

      const response = await makeAuthenticatedRequest("POST", "/wallet/send", {
        to: "0xrecipient",
        amount: "1000000000000000000",
        index: 0,
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        transactionHash: "0xtxhash",
      });

      expect(decrypt).toHaveBeenCalledWith(mockWallet.encryptedMnemonic, mockWallet.iv);
      expect(derivePrivateKey).toHaveBeenCalledWith("test-mnemonic", 0);
      expect(sendTransaction).toHaveBeenCalledWith(
        "0xrecipient",
        BigInt("1000000000000000000"),
        "0xprivatekey"
      );
    });

    it("should return 400 when parameters are missing", async () => {
      const response = await makeAuthenticatedRequest("POST", "/wallet/send");

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toEqual({
        error: "Missing required parameters",
      });
    });
  });

  describe("POST /wallet/sign", () => {
    it("should sign message successfully", async () => {
      await createTestAccount();

      vi.mocked(decrypt).mockReturnValue("test-mnemonic");
      vi.mocked(derivePrivateKey).mockResolvedValue("0xprivatekey" as `0x${string}`);
      vi.mocked(signMessage).mockResolvedValue("0xsignature");

      const response = await makeAuthenticatedRequest("POST", "/wallet/sign", {
        message: "Hello World",
        index: 0,
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        signedMessage: "0xsignature",
      });
    });

    it("should return 400 when message is missing", async () => {
      const response = await makeAuthenticatedRequest("POST", "/wallet/sign");

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toEqual({
        error: "Missing required parameters",
      });
    });
  });

  describe("GET /wallet/balance/:index", () => {
    it("should fetch balance successfully", async () => {
      await createTestAccount();
      vi.mocked(getBalance).mockResolvedValue(BigInt(1000000000000000000));

      const response = await makeAuthenticatedRequest("GET", "/wallet/balance/0");

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        balance: "1000000000000000000",
      });
    });

    it("should return 404 when account is not found", async () => {
      const response = await makeAuthenticatedRequest("GET", "/wallet/balance/0");

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toEqual({
        error: "Account not found for given index",
      });
    });
  });

  describe("GET /wallet", () => {
    it("should fetch wallet successfully", async () => {
      const response = await makeAuthenticatedRequest("GET", "/wallet");

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload).toEqual({
        id: mockWallet.id,
        derivationPath: mockWallet.derivationPath,
        currentIndex: mockWallet.currentIndex,
        userId: mockWallet.userId,
        createdAt: mockWallet.createdAt.toISOString(),
        updatedAt: mockWallet.updatedAt.toISOString(),
        accounts: [],
      });
    });
  });
});
