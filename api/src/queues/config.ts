import type { ConnectionOptions } from 'bullmq';

export const queueConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT || '6379'),
};

// Queue names as constants to avoid string literals
export const QUEUE_NAMES = {
  MNEMONIC_GENERATION: 'mnemonic-generation',
  ACCOUNT_GENERATION: 'account-generation',
} as const;