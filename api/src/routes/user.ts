import { t, type Elysia } from "elysia";
import { db } from "../../db";

export const userRoutes = (app: Elysia) => {
  return app.post("/auth/login", async ({ body }) => {
    try {
      if (!body.userId) {
        return new Response('Missing userId', { status: 400 });
      }

      await db.user.upsert({
        where: { userId: body.userId },
        update: {},
        create: { userId: body.userId }
      });

      return new Response('Login successful', { status: 200 });

    } catch (error) {
      console.error("Login error:", error);
      return new Response("Internal server error", { status: 500 });
    }
  }, {
    body: t.Object({
      userId: t.String(),
    }),
  });
};
