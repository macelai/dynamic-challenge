import { Elysia } from "elysia";
import { connect } from "elysia-connect-middleware";
import cors from "@elysiajs/cors";
import { configurePassport } from "./config/passport";
import { walletRoutes } from "./routes/wallet";
import { userRoutes } from "./routes/user";

const passport = configurePassport();

const app = new Elysia().use(cors({})).use(
  connect(
    passport.authenticate("dynamicStrategy", {
      session: false,
      failWithError: true,
    })
  )
);

// Register routes
walletRoutes(app);
userRoutes(app);

app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
