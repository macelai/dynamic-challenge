import { Queue } from "bullmq";
import { queueConnection, QUEUE_NAMES } from "../config";

export interface AccountGenerationJobData {
  userId: string;
  walletId: string;
  name: string;
}

const accountQueue = new Queue<AccountGenerationJobData>(
  QUEUE_NAMES.ACCOUNT_GENERATION,
  {
    connection: queueConnection,
  }
);

/**
 * Queues an account generation job for the specified wallet
 * @param userId The ID of the user who owns the wallet
 * @param walletId The ID of the wallet to generate a new account from
 * @param name The name of the account to generate
 * @returns The ID of the queued job
 * @throws {Error} If the job cannot be queued
 */
export async function queueAccountGeneration(
  userId: string,
  walletId: string,
  name: string
) {
  try {
    const job = await accountQueue.add(
      "generate-account",
      { userId, walletId, name },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      }
    );

    return job.id;
  } catch (error) {
    console.error("Failed to queue account generation:", error);
    throw new Error("Failed to queue account generation");
  }
}

export { accountQueue };
