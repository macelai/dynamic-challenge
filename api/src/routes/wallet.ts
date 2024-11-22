import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { mnemonicQueue } from "../config/queue";
import { queueMnemonicGeneration } from "../services/wallet";
import { db } from "../../db";
import { getBalance } from "../lib/viem-client";

export type RawRequestWithUser = {
  user: {
    userId: string;
    kid: string;
    aud: string;
    iss: string;
    sub: string;
    sid: string;
    email: string;
    environment_id: string;
    lists: unknown[];
    missing_fields: unknown[];
    verified_credentials: Array<{
      address: string;
      chain: string;
      id: string;
      name_service: unknown;
      public_identifier: string;
      wallet_name: string;
      wallet_provider: string;
      format: string;
    }>;
  };
};

export const walletRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    "/wallet/generate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request.raw as unknown as RawRequestWithUser).user;

        if (!user) {
          return reply.status(401).send({ error: "Unauthorized" });
        }

        const jobId = await queueMnemonicGeneration(user.userId);

        return {
          jobId,
        };
      } catch (error) {
        console.error("Error generating wallet:", error);
        return reply.status(500).send("Error generating wallet");
      }
    }
  );

  fastify.get(
    "/wallet/balance/:index",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { index } = request.params as { index: string };
        const user = (request.raw as unknown as RawRequestWithUser).user;

        if (!user) {
          return reply.status(401).send({ error: "Unauthorized" });
        }

        const account = await db.account.findFirst({
          where: {
            userId: user.userId,
            index: Number(index)
          }
        });

        if (!account) {
          return reply.status(404).send({ error: "Account not found for given index" });
        }

        const balance = await getBalance(account.address);

        return reply.send({
          balance: balance.toString()
        });

      } catch (error) {
        console.error("Error fetching balance:", error);
        return reply.status(500).send({ error: "Error fetching balance" });
      }
    }
  );

  fastify.get(
    "/wallet",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request.raw as unknown as RawRequestWithUser).user;

        if (!user) {
          return reply.status(401).send({ error: "Unauthorized" });
        }

        const wallet = await db.wallet.findUnique({
          where: { userId: user.userId },
          select: {
            id: true,
            derivationPath: true,
            currentIndex: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
            accounts: {
              orderBy: {
                index: "asc",
              },
              select: {
                id: true,
                address: true,
                name: true,
                index: true,
                createdAt: true,
              },
            },
          },
        });

        if (!wallet) {
          return reply.status(404).send({ error: "Wallet not found" });
        }

        return reply.send(wallet);
      } catch (error) {
        console.error("Error fetching wallet:", error);
        return reply.status(500).send({ error: "Error fetching wallet" });
      }
    }
  );

  fastify.get("/mnemonic-status/:jobId", async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const job = await mnemonicQueue.getJob(jobId);

    if (!job) {
      reply.code(404).send({ error: "Job not found" });
      return;
    }

    const state = await job.getState();
    const result = job.returnvalue;

    reply.send({
      status: state,
      result: state === "completed" ? result : null,
    });
  });
};
