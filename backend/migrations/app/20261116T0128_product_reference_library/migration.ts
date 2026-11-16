#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/2b76b6bb6b1fb87c1cd24e3ff1f869cbe2741ccb51dd4be8e11fe02f3b78d130/contract';
import startContract from '../../snapshots/2b76b6bb6b1fb87c1cd24e3ff1f869cbe2741ccb51dd4be8e11fe02f3b78d130/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/a130737d00cdeab35c804c0a33751c77239b231bfea30fe789877f8e71722fd7/contract';
import endContract from '../../snapshots/a130737d00cdeab35c804c0a33751c77239b231bfea30fe789877f8e71722fd7/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('referenceVariantId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
