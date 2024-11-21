import type { Elysia } from "elysia";
import { generateWallet } from "../services/wallet";

export const walletRoutes = (app: Elysia) => {
  return app.post("/wallet/generate", async () => {
    try {
      const wallet = await generateWallet();
      return wallet;
    } catch (error) {
      console.error("Error generating wallet:", error);
      return new Response("Error generating wallet", { status: 500 });
    }
  });
};
