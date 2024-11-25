import type { FastifyInstance } from "fastify";
import { db } from "../../db";
import { queueMnemonicGeneration } from "../queues/producers/mnemonic.queue";
import type { RawRequestWithUser } from "../types/auth";

export const userRoutes = async (fastify: FastifyInstance) => {
  fastify.post("/auth/login", async (request, reply) => {
    try {
      const user = (request.raw as unknown as RawRequestWithUser).user;

      const dbUser = await db.user.findUnique({
        where: { id: user.userId },
      });

      if (!dbUser) {
        await db.user.create({
          data: { id: user.userId, email: user.email },
        });
        await queueMnemonicGeneration(user.userId);
      }

      return reply.status(200).send("Login successful");
    } catch (error) {
      return reply.status(500).send("Internal server error");
    }
  });
};
