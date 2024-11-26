import fastifyCors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { configurePassport } from "./config/passport";
import { createAccountGenerationWorker } from "./queues/workers/account.worker";
import { createMnemonicWorker } from "./queues/workers/mnemonic.worker";
import { userRoutes } from "./routes/user";
import { walletRoutes } from "./routes/wallet";
import type { RawRequestWithUser } from "./types/auth";

const DEFAULT_PORT = 3000;
const HOST = "0.0.0.0";

async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: true,
  });

  const workers = {
    mnemonicWorker: createMnemonicWorker(),
    accountWorker: createAccountGenerationWorker(),
  };

  await fastify.register(fastifyCors);

  const passport = configurePassport();

  fastify.addHook("preHandler", async (request, reply) => {
    try {
      await new Promise((resolve, reject) => {
        passport.authenticate("dynamicStrategy", {
          session: false,
          failWithError: true,
        })(request.raw, reply.raw, (err: Error | null) => {
          (request as unknown as RawRequestWithUser).user = (
            request.raw as unknown as RawRequestWithUser
          ).user;
          if (err) reject(err);
          else resolve(void 0);
        });
      });
    } catch (err: unknown) {
      fastify.log.error({ err }, "Authentication failed");
      reply.code(401).send({ error: "Unauthorized" });
    }
  });

  await fastify.register(walletRoutes);
  await fastify.register(userRoutes);

  const shutdown = async () => {
    fastify.log.info("Initiating graceful shutdown...");

    try {
      await Promise.all([
        workers.mnemonicWorker.close(),
        workers.accountWorker.close(),
        fastify.close(),
      ]);
      fastify.log.info("Graceful shutdown completed");
      process.exit(0);
    } catch (err) {
      fastify.log.error({ err }, "Error during shutdown");
      process.exit(1);
    }
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return fastify;
}

async function startServer() {
  try {
    const app = await buildApp();
    const port = process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT;

    await app.listen({ port, host: HOST });

    const address = app.server.address();
    const serverPort = typeof address === "string" ? address : address?.port;
    app.log.info(`🚀 Server ready at http://${HOST}:${serverPort}`);
  } catch (err) {
    console.error("Fatal error during server startup:", err);
    process.exit(1);
  }
}

startServer();
