#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/2b76b6bb6b1fb87c1cd24e3ff1f869cbe2741ccb51dd4be8e11fe02f3b78d130/contract';
import endContract from '../../snapshots/2b76b6bb6b1fb87c1cd24e3ff1f869cbe2741ccb51dd4be8e11fe02f3b78d130/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/9d09f7888c87bd87e6e869a41513e3807a5a87ccb8f0ef41dd6de7a3aeaab342/contract';
import startContract from '../../snapshots/9d09f7888c87bd87e6e869a41513e3807a5a87ccb8f0ef41dd6de7a3aeaab342/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.enableRowLevelSecurity({ schema: 'public', table: 'AdminSession' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'AdminUser' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'AuditLog' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'BusinessConfig' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'Delivery' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'Order' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'Product' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'ProductPhoto' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'Sale' }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'AdminSession',
        policy: {
          naming: { kind: 'exact', name: 'vc_runtime_access' },
          tableName: 'AdminSession',
          namespaceId: 'public',
          operation: 'all',
          roles: ['vc_runtime'],
          using: sql`true`,
          withCheck: sql`true`,
          permissive: true,
        },
      }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'AdminUser',
        policy: {
          naming: { kind: 'exact', name: 'vc_runtime_access' },
          tableName: 'AdminUser',
          namespaceId: 'public',
          operation: 'all',
          roles: ['vc_runtime'],
          using: sql`true`,
          withCheck: sql`true`,
          permissive: true,
        },
      }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'AuditLog',
        policy: {
          naming: { kind: 'exact', name: 'vc_runtime_access' },
          tableName: 'AuditLog',
          namespaceId: 'public',
          operation: 'all',
          roles: ['vc_runtime'],
          using: sql`true`,
          withCheck: sql`true`,
          permissive: true,
        },
      }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'BusinessConfig',
        policy: {
          naming: { kind: 'exact', name: 'vc_runtime_access' },
          tableName: 'BusinessConfig',
          namespaceId: 'public',
          operation: 'all',
          roles: ['vc_runtime'],
          using: sql`true`,
          withCheck: sql`true`,
          permissive: true,
        },
      }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'Delivery',
        policy: {
          naming: { kind: 'exact', name: 'vc_runtime_access' },
          tableName: 'Delivery',
          namespaceId: 'public',
          operation: 'all',
          roles: ['vc_runtime'],
          using: sql`true`,
          withCheck: sql`true`,
          permissive: true,
        },
      }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'Order',
        policy: {
          naming: { kind: 'exact', name: 'vc_runtime_access' },
          tableName: 'Order',
          namespaceId: 'public',
          operation: 'all',
          roles: ['vc_runtime'],
          using: sql`true`,
          withCheck: sql`true`,
          permissive: true,
        },
      }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'Product',
        policy: {
          naming: { kind: 'exact', name: 'vc_runtime_access' },
          tableName: 'Product',
          namespaceId: 'public',
          operation: 'all',
          roles: ['vc_runtime'],
          using: sql`true`,
          withCheck: sql`true`,
          permissive: true,
        },
      }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'ProductPhoto',
        policy: {
          naming: { kind: 'exact', name: 'vc_runtime_access' },
          tableName: 'ProductPhoto',
          namespaceId: 'public',
          operation: 'all',
          roles: ['vc_runtime'],
          using: sql`true`,
          withCheck: sql`true`,
          permissive: true,
        },
      }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'Sale',
        policy: {
          naming: { kind: 'exact', name: 'vc_runtime_access' },
          tableName: 'Sale',
          namespaceId: 'public',
          operation: 'all',
          roles: ['vc_runtime'],
          using: sql`true`,
          withCheck: sql`true`,
          permissive: true,
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
