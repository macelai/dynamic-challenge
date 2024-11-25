import type { Job } from 'bullmq';
import { Worker } from 'bullmq';
import { createWalletWithMnemonic } from '../../services/wallet';
import { queueConnection, QUEUE_NAMES } from '../config';

interface MnemonicJobData {
  userId: string;
}

export const createMnemonicWorker = () => {
  const worker = new Worker<MnemonicJobData>(
    QUEUE_NAMES.MNEMONIC_GENERATION,
    async (job: Job<MnemonicJobData>) => {
      try {
        const { userId } = job.data;
        const mnemonic = await createWalletWithMnemonic(userId);

        return mnemonic;
      } catch (error) {
        console.error(`Error processing mnemonic generation for user ${job.data.userId}:`, error);
        throw error; // Re-throw to trigger the failed event
      }
    },
    { connection: queueConnection }
  );

  worker.on('completed', (job) => {
    console.log(`Mnemonic generation completed for job ${job.id}`);
  });

  worker.on('failed', (job, error) => {
    console.error(`Mnemonic generation failed for job ${job?.id}:`, error);
  });

  return worker;
};