import { Queue } from 'bullmq';
import { queueConnection, QUEUE_NAMES } from '../config';

interface MnemonicJobData {
  userId: string;
}

const mnemonicQueue = new Queue<MnemonicJobData>(QUEUE_NAMES.MNEMONIC_GENERATION, {
  connection: queueConnection,
});

/**
 * Queues a mnemonic generation job for the specified user
 * @param userId The ID of the user to generate a mnemonic for
 * @returns The ID of the queued job
 * @throws {Error} If the job cannot be queued
 */
export async function queueMnemonicGeneration(userId: string) {
  try {
    const job = await mnemonicQueue.add(
      'generate-mnemonic',
      { userId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      }
    );

    return job.id;
  } catch (error) {
    console.error('Failed to queue mnemonic generation:', error);
    throw new Error('Failed to queue mnemonic generation');
  }
}

export { mnemonicQueue };