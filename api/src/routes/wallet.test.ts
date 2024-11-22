import type { FastifyInstance } from "fastify";
import { build } from "../test-utils/build-server";
import { db } from "../../db";
import { mnemonicQueue } from "../config/queue";
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getBalance, sendTransaction, signMessage } from "../lib/viem-client";
import { queueMnemonicGeneration } from "../services/wallet";

// Mock external dependencies
vi.mock("../../db", () => ({
  db: {
    wallet: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
    }
  }
}));

vi.mock("../lib/viem-client", () => ({
  getBalance: vi.fn(),
  sendTransaction: vi.fn(),
  signMessage: vi.fn(),
}));

vi.mock("../config/queue", () => ({
  mnemonicQueue: {
    getJob: vi.fn(),
  }
}));

vi.mock("../services/wallet", () => ({
  queueMnemonicGeneration: vi.fn(),
}));

const TEST_MNEMONIC = "test test test test test test test test test test test junk"; // Valid BIP39 mnemonic

describe("Wallet Routes", () => {
  let app: FastifyInstance;
  const mockUser = {
    userId: "test-user-id",
    email: "test@example.com",
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await build();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("POST /wallet/generate", () => {
    it("should generate a new wallet successfully", async () => {
      const mockJobId = "test-job-id";
      vi.mocked(queueMnemonicGeneration).mockResolvedValue(mockJobId);

      const response = await app.inject({
        method: "POST",
        url: "/wallet/generate",
        payload: {},
        headers: {
          "x-mock-user": JSON.stringify(mockUser),
        },
      });

      // expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({ jobId: mockJobId });
    });

    it("should return 401 when user is not authenticated", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/wallet/generate",
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.payload)).toEqual({ error: "Unauthorized" });
    });
  });

  describe("POST /wallet/send", () => {
    const mockWallet = {
      id: "test-wallet-id",
      mnemonic: TEST_MNEMONIC,
      derivationPath: "m/44'/60'/0'/0",
      currentIndex: 0,
      userId: mockUser.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it("should send transaction successfully", async () => {
      vi.mocked(db.wallet.findFirst).mockResolvedValue(mockWallet);
      vi.mocked(sendTransaction).mockResolvedValue("0xtxhash");

      const response = await app.inject({
        method: "POST",
        url: "/wallet/send",
        headers: {
          "x-mock-user": JSON.stringify(mockUser),
        },
        payload: {
          to: "0xrecipient",
          amount: "1000000000000000000",
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        transactionHash: "0xtxhash",
      });
    });

    it("should return 400 when parameters are missing", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/wallet/send",
        headers: {
          "x-mock-user": JSON.stringify(mockUser),
        },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toEqual({
        error: "Missing required parameters",
      });
    });
  });

  describe("POST /wallet/sign", () => {
    const mockWallet = {
      id: "test-wallet-id",
      mnemonic: TEST_MNEMONIC,
      derivationPath: "m/44'/60'/0'/0",
      currentIndex: 0,
      userId: mockUser.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it("should sign message successfully", async () => {
      vi.mocked(db.wallet.findFirst).mockResolvedValue(mockWallet);
      vi.mocked(signMessage).mockResolvedValue("0xsignature");

      const response = await app.inject({
        method: "POST",
        url: "/wallet/sign",
        headers: {
          "x-mock-user": JSON.stringify(mockUser),
        },
        payload: {
          message: "Hello World",
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        signedMessage: "0xsignature",
      });
    });

    it("should return 400 when message is missing", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/wallet/sign",
        headers: {
          "x-mock-user": JSON.stringify(mockUser),
        },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toEqual({
        error: "Missing required parameters",
      });
    });
  });

  describe("GET /wallet/balance/:index", () => {
    const mockAccount = {
      id: "test-account-id",
      name: null,
      address: "0xaddress",
      userId: mockUser.userId,
      index: 0,
      walletId: "test-wallet-id",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it("should fetch balance successfully", async () => {
      vi.mocked(db.account.findFirst).mockResolvedValue(mockAccount);
      vi.mocked(getBalance).mockResolvedValue(BigInt(1000000000000000000));

      const response = await app.inject({
        method: "GET",
        url: "/wallet/balance/0",
        headers: {
          "x-mock-user": JSON.stringify(mockUser),
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        balance: "1000000000000000000",
      });
    });

    it("should return 404 when account is not found", async () => {
      vi.mocked(db.account.findFirst).mockResolvedValue(null);

      const response = await app.inject({
        method: "GET",
        url: "/wallet/balance/0",
        headers: {
          "x-mock-user": JSON.stringify(mockUser),
        },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toEqual({
        error: "Account not found for given index",
      });
    });
  });

  describe("GET /wallet", () => {
    const mockWalletResponse = {
      id: "wallet-id",
      mnemonic: TEST_MNEMONIC,
      derivationPath: "m/44'/60'/0'/0",
      currentIndex: 0,
      userId: mockUser.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accounts: [],
    };
    it("should fetch wallet successfully", async () => {
      vi.mocked(db.wallet.findUnique).mockResolvedValue({
        ...mockWalletResponse,
        createdAt: new Date(mockWalletResponse.createdAt),
        updatedAt: new Date(mockWalletResponse.updatedAt)
      });

      const response = await app.inject({
        method: "GET",
        url: "/wallet",
        headers: {
          "x-mock-user": JSON.stringify(mockUser),
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual(mockWalletResponse);
    });

    it("should return 404 when wallet is not found", async () => {
      vi.mocked(db.wallet.findUnique).mockResolvedValue(null);

      const response = await app.inject({
        method: "GET",
        url: "/wallet",
        headers: {
          "x-mock-user": JSON.stringify(mockUser),
        },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toEqual({
        error: "Wallet not found",
      });
    });
  });

  describe("GET /mnemonic-status/:jobId", () => {
    it("should return job status when job exists", async () => {
      const mockJob = {
        getState: vi.fn().mockResolvedValue("completed"),
        returnvalue: { address: "0xaddress" },
      };
      vi.mocked(mnemonicQueue.getJob).mockResolvedValue(mockJob);

      const response = await app.inject({
        method: "GET",
        url: "/mnemonic-status/test-job-id",
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        status: "completed",
        result: { address: "0xaddress" },
      });
    });

    it("should return 404 when job is not found", async () => {
      vi.mocked(mnemonicQueue.getJob).mockResolvedValue(null);

      const response = await app.inject({
        method: "GET",
        url: "/mnemonic-status/test-job-id",
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toEqual({
        error: "Job not found",
      });
    });
  });
});
