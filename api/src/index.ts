import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import { configurePassport } from "./config/passport";
import { type RawRequestWithUser, walletRoutes } from "./routes/wallet";
import { userRoutes } from "./routes/user";

const fastify = Fastify();

const passport = configurePassport();

await fastify.register(fastifyCors);

fastify.addHook('preHandler', async (request, reply) => {
  try {
    await new Promise((resolve, reject) => {
      passport.authenticate('dynamicStrategy', {
        session: false,
        failWithError: true
      })(request.raw, reply.raw, (err: Error | null) => {
        // Type assertion since we know passport adds the user property
        (request as unknown as RawRequestWithUser).user = (request.raw as unknown as RawRequestWithUser).user;
        if (err) reject(err);
        else resolve(void 0);
      });
    });

  } catch (err: unknown) {
    console.log({err});
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

fastify.register(walletRoutes);
fastify.register(userRoutes);

try {
  await fastify.listen({ port: 3000 });
  const address = fastify.server.address();
  const port = typeof address === 'string' ? address : address?.port;
  console.log(`🚀 Server ready at http://localhost:${port}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
