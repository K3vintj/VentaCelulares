#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/d697a3033ba12c290d3fecbb778f677a69a73058d9cfd3c743251559c3b4aae3/contract';
import endContract from '../../snapshots/d697a3033ba12c290d3fecbb778f677a69a73058d9cfd3c743251559c3b4aae3/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'AdminUser',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'AuditLog',
        columns: [
          col('action', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('adminId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('details', 'json', { codecRef: { codecId: 'pg/json@1' } }),
          col('entityId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('entityType', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'BusinessConfig',
        columns: [
          col('businessName', 'text', {
            notNull: true,
            default: lit('Alexxziño Store'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('id', 'text', {
            notNull: true,
            default: lit('default'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('noticesJson', 'json', { notNull: true, codecRef: { codecId: 'pg/json@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('warrantyDays', 'int4', {
            notNull: true,
            default: lit(30),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('whatsapp', 'text', {
            notNull: true,
            default: lit('5292111936'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Delivery',
        columns: [
          col('carrier', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('destination', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('mode', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('notes', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('orderId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('pendiente'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('trackingNumber', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('Delivery_mode_check_0f7384e4', sql`"mode" IN ('local', 'envio')`),
          checkExpression(
            'Delivery_status_check_868db64d',
            sql`"status" IN ('pendiente', 'en_ruta', 'entregado', 'incidencia')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Order',
        columns: [
          col('consentAccepted', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('customerName', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('customerPhone', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('deliveryMode', 'text', {
            notNull: true,
            default: lit('local'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('folio', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('priceSnapshot', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('productId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productNameSnapshot', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('shippingDestination', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('pendiente'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Order_deliveryMode_check_ff653be1',
            sql`"deliveryMode" IN ('local', 'envio')`,
          ),
          checkExpression(
            'Order_status_check_cde57f46',
            sql`"status" IN ('pendiente', 'confirmada', 'completada', 'cancelada')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Product',
        columns: [
          col('accessories', 'text', {
            notNull: true,
            default: lit(''),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('battery', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('biometric', 'text', {
            notNull: true,
            default: lit('FACE_ID'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('cameraStatus', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('color', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('condition', 'text', {
            notNull: true,
            default: lit('seminuevo'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('conditionNote', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('description', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isPublished', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('observations', 'text', {
            notNull: true,
            default: lit(''),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('physicalCondition', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('price', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('repairHistory', 'text', {
            notNull: true,
            default: lit('Sin reparaciones conocidas'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('screenCondition', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sku', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('Disponible'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('storage', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('techInfoVerified', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('unlockStatus', 'text', {
            notNull: true,
            default: lit('Liberado'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('verifiedNoReplacedParts', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('verifiedNotRefurbished', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('warrantyDays', 'int4', {
            notNull: true,
            default: lit(30),
            codecRef: { codecId: 'pg/int4@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Product_biometric_check_1270ac0d',
            sql`"biometric" IN ('FACE_ID', 'TOUCH_ID', 'NO_APLICA')`,
          ),
          checkExpression(
            'Product_condition_check_18480edb',
            sql`"condition" IN ('nuevo', 'seminuevo', 'usado')`,
          ),
          checkExpression(
            'Product_status_check_f26e2551',
            sql`"status" IN ('Disponible', 'Reservado', 'Vendido')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'ProductPhoto',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sortOrder', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('storageKey', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('url', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Sale',
        columns: [
          col('finalPrice', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('orderId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('paymentMethod', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('productId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('soldAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'AdminUser',
        constraint: 'AdminUser_email_key',
        columns: ['email'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Delivery',
        constraint: 'Delivery_orderId_key',
        columns: ['orderId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Order',
        constraint: 'Order_folio_key',
        columns: ['folio'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Product',
        constraint: 'Product_sku_key',
        columns: ['sku'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Sale',
        constraint: 'Sale_orderId_key',
        columns: ['orderId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AuditLog',
        index: 'AuditLog_adminId_idx_530179db',
        columns: ['adminId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'AuditLog',
        index: 'AuditLog_entityType_entityId_idx_ea0fa809',
        columns: ['entityType', 'entityId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Order',
        index: 'Order_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Order',
        index: 'Order_status_createdAt_idx_58610442',
        columns: ['status', 'createdAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Product',
        index: 'Product_isPublished_status_idx_e47cb281',
        columns: ['isPublished', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ProductPhoto',
        index: 'ProductPhoto_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'ProductPhoto',
        index: 'ProductPhoto_productId_sortOrder_idx_fe80956b',
        columns: ['productId', 'sortOrder'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Sale',
        index: 'Sale_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'AuditLog',
        foreignKey: {
          name: 'AuditLog_adminId_fkey',
          columns: ['adminId'],
          references: { schema: 'public', table: 'AdminUser', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Delivery',
        foreignKey: {
          name: 'Delivery_orderId_fkey',
          columns: ['orderId'],
          references: { schema: 'public', table: 'Order', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Order',
        foreignKey: {
          name: 'Order_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'Product', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'ProductPhoto',
        foreignKey: {
          name: 'ProductPhoto_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'Product', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Sale',
        foreignKey: {
          name: 'Sale_orderId_fkey',
          columns: ['orderId'],
          references: { schema: 'public', table: 'Order', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Sale',
        foreignKey: {
          name: 'Sale_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'Product', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
