import type { ConnectionOptions } from 'bullmq';

export const queueConnection: ConnectionOptions = {
  url: process.env.REDIS_URL,
};

// Queue names as constants to avoid string literals
export const QUEUE_NAMES = {
  MNEMONIC_GENERATION: 'mnemonic-generation',
  ACCOUNT_GENERATION: 'account-generation',
} as const;