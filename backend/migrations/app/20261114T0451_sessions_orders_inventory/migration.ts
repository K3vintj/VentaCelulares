#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/9d09f7888c87bd87e6e869a41513e3807a5a87ccb8f0ef41dd6de7a3aeaab342/contract';
import endContract from '../../snapshots/9d09f7888c87bd87e6e869a41513e3807a5a87ccb8f0ef41dd6de7a3aeaab342/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/d697a3033ba12c290d3fecbb778f677a69a73058d9cfd3c743251559c3b4aae3/contract';
import startContract from '../../snapshots/d697a3033ba12c290d3fecbb778f677a69a73058d9cfd3c743251559c3b4aae3/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropIndex({ schema: 'public', table: 'Sale', index: 'Sale_productId_idx_5858600a' }),
      this.createTable({
        schema: 'public',
        table: 'AdminSession',
        columns: [
          col('adminId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('expiresAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('tokenHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'Order',
        column: col('requestKey', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('isArchived', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.setDefault({
        schema: 'public',
        table: 'BusinessConfig',
        column: col('whatsapp', 'text', {
          default: lit('529211191936'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'AdminSession',
        constraint: 'AdminSession_tokenHash_key',
        columns: ['tokenHash'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Order',
        constraint: 'Order_requestKey_key',
        columns: ['requestKey'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Sale',
        constraint: 'Sale_productId_key',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AdminSession',
        index: 'AdminSession_adminId_idx_530179db',
        columns: ['adminId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AdminSession',
        index: 'AdminSession_expiresAt_idx_6b6b8c10',
        columns: ['expiresAt'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'AdminSession',
        foreignKey: {
          name: 'AdminSession_adminId_fkey',
          columns: ['adminId'],
          references: { schema: 'public', table: 'AdminUser', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
