import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from "../../db";
import { build } from "../test-utils/build-server";
import { queueMnemonicGeneration } from "../queues/producers/mnemonic.queue";

vi.mock("../../db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn()
    }
  }
}));
vi.mock("../queues/producers/mnemonic.queue");

describe("User Routes", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await build();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("POST /auth/login", () => {
    const mockUser = {
      userId: "test-user-id",
      email: "test@example.com",
    };

    it("should create a new user and queue mnemonic generation if user doesn't exist", async () => {
      // Mock db.user.findUnique to return null (user doesn't exist)
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      // Mock db.user.create
      (db.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: mockUser.userId,
        email: mockUser.email,
      });

      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: {},
        // Simulate authenticated request
        headers: {
          "x-mock-user": JSON.stringify(mockUser),
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.payload).toBe("Login successful");

      // Verify database calls
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.userId },
      });
      expect(db.user.create).toHaveBeenCalledWith({
        data: {
          id: mockUser.userId,
          email: mockUser.email,
        },
      });
      expect(queueMnemonicGeneration).toHaveBeenCalledWith(mockUser.userId);
    });

    it("should handle existing user login without creating new user", async () => {
      // Mock db.user.findUnique to return existing user
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: mockUser.userId,
        email: mockUser.email,
      });

      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: {},
        headers: {
          "x-mock-user": JSON.stringify(mockUser),
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.payload).toBe("Login successful");

      // Verify database calls
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.userId },
      });
      expect(db.user.create).not.toHaveBeenCalled();
      expect(queueMnemonicGeneration).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      // Mock db.user.findUnique to throw error
      (db.user.findUnique as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Database error")
      );

      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: {},
        headers: {
          "x-mock-user": JSON.stringify(mockUser),
        },
      });

      expect(response.statusCode).toBe(500);
      expect(response.payload).toBe("Internal server error");
    });

    it("should handle missing user in request", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: {},
      });

      expect(response.statusCode).toBe(500);
      expect(response.payload).toBe("Internal server error");
    });
  });
});