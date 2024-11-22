import type { FastifyInstance } from "fastify";
import Fastify from "fastify";
import { userRoutes } from "../routes/user";
import { walletRoutes } from "../routes/wallet";

// Custom type for the mock user in request
declare module "fastify" {
  interface FastifyRequest {
    raw: {
      user?: {
        userId: string;
        email: string;
      };
    };
  }
}

export async function build(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  // Add hook to inject mock user data from headers for testing
  app.addHook("preHandler", async (request) => {
    const mockUserHeader = request.headers["x-mock-user"];
    if (mockUserHeader && typeof mockUserHeader === "string") {
      request.raw.user = JSON.parse(mockUserHeader);
    }
  });

  // Register routes
  await app.register(userRoutes);
  await app.register(walletRoutes);

  return app;
}