import 'dotenv/config';
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';
import { secureDatabaseUrl } from './src/operations/database.js';

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    db: {
      connection: secureDatabaseUrl(process.env['DIRECT_URL']!),
    },
  }),
});
