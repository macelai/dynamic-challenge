import { beforeEach } from "vitest";
import { db } from "../../db";


const resetDb = async () => {
  await db.$transaction([
    db.account.deleteMany(),
    db.wallet.deleteMany(),
    db.user.deleteMany(),
  ]);
};

beforeEach(async () => {
  await resetDb();
});
