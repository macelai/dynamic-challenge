import { beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import { db } from '../../db';

beforeAll(async () => {
  await db.$connect();
});

beforeEach(async () => {
  await db.$transaction([
    db.account.deleteMany(),
    db.wallet.deleteMany(),
    db.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await db.$disconnect();
});
