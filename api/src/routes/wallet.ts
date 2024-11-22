import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { db } from "../../db";
import { generateMnemonic } from "../services/wallet";
import { DEFAULT_DERIVATION_PATH } from "../constants";

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

        const { mnemonic } = await generateMnemonic();

        await db.wallet.create({
          data: {
            mnemonic,
            userId: user.userId,
            derivationPath: DEFAULT_DERIVATION_PATH,
          },
        });

        return {
          mnemonic,
        };
      } catch (error) {
        console.error("Error generating wallet:", error);
        return reply.status(500).send("Error generating wallet");
      }
    }
  );
};
