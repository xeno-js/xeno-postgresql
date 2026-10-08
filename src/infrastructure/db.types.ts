import type { Dictionary } from '@xeno-js/core'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'

/**
 * @description Type definition for the database context used in the application.
 * Polymorphically handles both PostgreSQL and libSQL (SQLite/Turso) engines.
 *
 * @author Xeno
 * @version 1.0.0
 * @since 2025-09-30
 * @link https://github.com/xeno-js/xeno-js
 */
export type DbContext<TSchema extends Dictionary = Dictionary> = NodePgDatabase<TSchema>

/**
 * @description Type definition for the transaction object used in the database context.
 * Polymorphically handles both PostgreSQL and libSQL (SQLite/Turso) engines.
 *
 * @author Xeno
 * @version 1.0.0
 * @since 2025-09-30
 * @link https://github.com/xeno-js/xeno-js
 */
export type DbTransaction = Parameters<Parameters<DbContext['transaction']>[0]>[0]
