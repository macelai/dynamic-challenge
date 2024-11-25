import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { db } from "../../db";
import { decrypt, derivePrivateKey } from "../lib/crypto";
import { getBalance, sendTransaction, signMessage } from "../lib/viem-client";
import { queueAccountGeneration } from "../queues/producers/account.queue";
import type { RawRequestWithUser, User } from "../types/auth";

const handleAuthenticatedRequest = (
  user: User | undefined,
  reply: FastifyReply
) => {
  if (!user) {
    reply.status(401).send({ error: "Unauthorized" });
    return false;
  }
  return true;
};

export const walletRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    "/wallet/generate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request.raw as unknown as RawRequestWithUser).user;
        const { name } = request.body as { name: string };

        if (!handleAuthenticatedRequest(user, reply)) return;

        if (!name) {
          return reply.status(400).send({ error: "Name is required" });
        }

        const wallet = await db.wallet.findFirst({
          where: { userId: user.userId },
        });

        if (!wallet) {
          return reply.status(404).send({ error: "Wallet not found" });
        }

        const jobId = await queueAccountGeneration(user.userId, wallet.id, name);
        return { jobId };
      } catch (error) {
        console.error("Error generating wallet:", error);
        return reply.status(500).send("Error generating wallet");
      }
    }
  );

  fastify.post(
    "/wallet/send",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request.raw as unknown as RawRequestWithUser).user;

        if (!handleAuthenticatedRequest(user, reply)) return;

        const { to, amount, index } = request.body as { to: string; amount: string; index: number };

        if (!to || !amount || typeof index !== 'number') {
          return reply
            .status(400)
            .send({ error: "Missing required parameters" });
        }

        const account = await db.account.findFirst({
          where: {
            userId: user.userId,
            index
          },
          include: {
            wallet: true
          }
        });

        if (!account?.wallet) {
          return reply.status(404).send({ error: "Account not found" });
        }

        const mnemonic = decrypt(account.wallet.encryptedMnemonic, account.wallet.iv);

        const privateKey = await derivePrivateKey(mnemonic, index);
        const hash = await sendTransaction(
          to as `0x${string}`,
          BigInt(amount),
          privateKey
        );

        return reply.send({ transactionHash: hash });
      } catch (error) {
        console.error("Error sending transaction:", error);
        return reply.status(500).send({ error: "Error sending transaction" });
      }
    }
  );

  fastify.post(
    "/wallet/sign",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request.raw as unknown as RawRequestWithUser).user;

        if (!handleAuthenticatedRequest(user, reply)) return;

        const { message, index } = request.body as { message: string; index: number };

        if (!message || typeof index !== 'number') {
          return reply
            .status(400)
            .send({ error: "Missing required parameters" });
        }

        const account = await db.account.findFirst({
          where: {
            userId: user.userId,
            index,
          },
          include: {
            wallet: true,
          },
        });

        if (!account?.wallet) {
          return reply.status(404).send({ error: "Account not found" });
        }

        const mnemonic = decrypt(
          account.wallet.encryptedMnemonic,
          account.wallet.iv
        );

        const privateKey = await derivePrivateKey(mnemonic, index);
        const signedMessage = await signMessage(message, privateKey);

        return reply.send({ signedMessage });
      } catch (error) {
        console.error("Error signing message:", error);
        return reply.status(500).send({ error: "Error signing message" });
      }
    }
  );

  fastify.get(
    "/wallet/balance/:index",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { index } = request.params as { index: string };
        const user = (request.raw as unknown as RawRequestWithUser).user;

        if (!handleAuthenticatedRequest(user, reply)) return;

        const account = await db.account.findFirst({
          where: {
            userId: user.userId,
            index: Number(index),
          },
        });

        if (!account) {
          return reply
            .status(404)
            .send({ error: "Account not found for given index" });
        }

        const balance = await getBalance(account.address);
        return reply.send({ balance: balance.toString() });
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

        if (!handleAuthenticatedRequest(user, reply)) return;

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
              orderBy: { index: "asc" },
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
};
