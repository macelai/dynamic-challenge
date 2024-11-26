import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../db";
import { queueMnemonicGeneration } from "../queues/producers/mnemonic.queue";
import { build } from "../test-utils/build-server";

vi.mock("../queues/producers/mnemonic.queue", () => ({
  queueMnemonicGeneration: vi.fn(),
}));

describe("User Routes", () => {
  let app: FastifyInstance;
  const mockUser = {
    userId: `user-${Date.now()}-${Math.random()}`,
    email: `test-${Date.now()}@example.com`,
  };

  // Helper function to make authenticated requests
  const makeAuthenticatedRequest = async (userHeader?: string) => {
    return app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {},
      headers: userHeader ? {
        "x-mock-user": userHeader
      } : undefined
    });
  };

  beforeEach(async () => {
    app = await build();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("POST /auth/login", () => {
    it("should queue mnemonic generation for new user", async () => {
      const response = await makeAuthenticatedRequest(JSON.stringify(mockUser));

      expect(response.statusCode).toBe(200);
      expect(queueMnemonicGeneration).toHaveBeenCalledWith(mockUser.userId);
      expect(queueMnemonicGeneration).toHaveBeenCalledTimes(1);
    });

    it("should not queue mnemonic generation for existing user", async () => {
      await db.user.create({
        data: {
          id: mockUser.userId,
          email: mockUser.email,
        },
      });

      const response = await makeAuthenticatedRequest(JSON.stringify(mockUser));

      expect(response.statusCode).toBe(200);
      expect(queueMnemonicGeneration).not.toHaveBeenCalled();
    });

    it("should not queue mnemonic generation when user data is missing", async () => {
      const response = await makeAuthenticatedRequest();

      expect(response.statusCode).toBe(500);
      expect(queueMnemonicGeneration).not.toHaveBeenCalled();
    });

    it("should not queue mnemonic generation with invalid user data", async () => {
      const response = await makeAuthenticatedRequest("invalid-json");

      expect(response.statusCode).toBe(500);
      expect(queueMnemonicGeneration).not.toHaveBeenCalled();
    });
  });
});
