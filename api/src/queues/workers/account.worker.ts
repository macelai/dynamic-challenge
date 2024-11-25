import type { Job } from "bullmq";
import { Worker } from "bullmq";
import { createNewAccount } from "../../services/wallet";
import { QUEUE_NAMES, queueConnection } from "../config";
import type { AccountGenerationJobData } from "../producers/account.queue";

/**
 * Worker to handle account generation jobs
 * Fetches the wallet's mnemonic and current index, then generates a new account
 */
export function createAccountGenerationWorker() {
  return new Worker<AccountGenerationJobData>(
    QUEUE_NAMES.ACCOUNT_GENERATION,
    async (job: Job<AccountGenerationJobData>) => {
      const { userId, walletId, name } = job.data;

      try {
        const newAccountAddress = await createNewAccount(userId, walletId, name);

        return { success: true, accountAddress: newAccountAddress };
      } catch (error) {
        console.error("Failed to generate account:", error);
        throw error;
      }
    },
    {
      connection: queueConnection,
      concurrency: 5,
    }
  );
}
