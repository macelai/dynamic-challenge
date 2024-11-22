import { Queue, Worker } from 'bullmq';
import { createWalletWithMnemonic } from '../services/wallet';

export const mnemonicQueue = new Queue('mnemonic-generation', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || '6379'),
  }
});

export const setupMnemonicWorker = () => {
  const worker = new Worker(
    "mnemonic-generation",
    async (job) => {
      const { userId } = job.data;
      const mnemonic = await createWalletWithMnemonic(userId);

      return mnemonic;
    },
    {
      connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: Number(process.env.REDIS_PORT || "6379"),
      },
    }
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  return worker;
};