import { env } from '../env.js';
import postgres from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';
import type { Contract } from './contract.js';
import contractJson from './contract.json' with { type: 'json' };
import { secureDatabaseUrl } from '../operations/database.js';

export const contract = contractFromJson<Contract>(contractJson);

export const db = postgres({
  contract,
  url: secureDatabaseUrl(env.DATABASE_URL),
  poolOptions: { connectionTimeoutMillis: 10000, idleTimeoutMillis: 10000 },
});
