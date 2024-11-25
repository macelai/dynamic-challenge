import type { FastifyInstance } from "fastify";
import { build } from "../test-utils/build-server";
import { db } from "../../db";
import { mnemonicQueue } from "../config/queue";
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getBalance, sendTransaction, signMessage } from "../lib/viem-client";
import { randomBytes } from "node:crypto";
import { decrypt, derivePrivateKey } from "../lib/crypto";
import { queueAccountGeneration } from "../queues/producers/account.queue";

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

vi.mock("../queues/producers/account.queue", () => ({
  queueAccountGeneration: vi.fn(),
}));

vi.mock("../lib/crypto", () => ({
  decrypt: vi.fn(),
  derivePrivateKey: vi.fn(),
}));



describe("Wallet Routes", () => {
  let app: FastifyInstance;
  const mockUser = {
    userId: "test-user-id",
    email: "test@example.com"
  };

  const mockAccount = {
    id: "test-account-id",
    name: null,
    address: "0xaddress",
    userId: mockUser.userId,
    index: 0,
    walletId: "test-wallet-id",
    wallet: {
      id: "test-wallet-id",
      encryptedMnemonic: "encrypted-test-mnemonic",
      iv: randomBytes(16).toString("hex"),
      derivationPath: "m/44'/60'/0'/0",
      currentIndex: 0,
      userId: mockUser.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await build();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("POST /wallet/generate", () => {
    it("should generate a new account successfully", async () => {
      const mockJobId = "test-job-id";
      const mockWallet = {
        id: "test-wallet-id",
        encryptedMnemonic: "encrypted-test-mnemonic",
        iv: randomBytes(16).toString("hex"),
        derivationPath: "m/44'/60'/0'/0",
        currentIndex: 0,
        userId: mockUser.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(db.wallet.findFirst).mockResolvedValue(mockWallet);
      vi.mocked(queueAccountGeneration).mockResolvedValue(mockJobId);

      const response = await app.inject({
        method: "POST",
        url: "/wallet/generate",
        payload: {
          name: "Test Account",
        },
        headers: {
          "x-mock-user": JSON.stringify(mockUser),
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({ jobId: mockJobId });
      expect(db.wallet.findFirst).toHaveBeenCalledWith({
        where: { userId: mockUser.userId }
      });
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
        payload: {
          name: "Test Wallet",
        },
      });

      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.payload)).toEqual({ error: "Unauthorized" });
    });
  });

  describe("POST /wallet/send", () => {
    it("should send transaction successfully", async () => {
      vi.mocked(db.account.findFirst).mockResolvedValue(mockAccount);
      vi.mocked(decrypt).mockReturnValue("test-mnemonic");
      vi.mocked(derivePrivateKey).mockResolvedValue("0xprivatekey" as `0x${string}`);
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
          index: 0,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({
        transactionHash: "0xtxhash",
      });

      expect(decrypt).toHaveBeenCalledWith(mockAccount.wallet.encryptedMnemonic, mockAccount.wallet.iv);
      expect(derivePrivateKey).toHaveBeenCalledWith("test-mnemonic", 0);
      expect(sendTransaction).toHaveBeenCalledWith(
        "0xrecipient",
        BigInt("1000000000000000000"),
        "0xprivatekey"
      );
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
    it("should sign message successfully", async () => {
      vi.mocked(db.account.findFirst).mockResolvedValue(mockAccount);
      vi.mocked(decrypt).mockReturnValue("test-mnemonic");
      vi.mocked(derivePrivateKey).mockResolvedValue("0xprivatekey" as `0x${string}`);
      vi.mocked(signMessage).mockResolvedValue("0xsignature");

      const response = await app.inject({
        method: "POST",
        url: "/wallet/sign",
        headers: {
          "x-mock-user": JSON.stringify(mockUser),
        },
        payload: {
          message: "Hello World",
          index: 0,
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
      encryptedMnemonic: "encrypted-test-mnemonic",
      iv: randomBytes(16).toString("hex"),
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
});
