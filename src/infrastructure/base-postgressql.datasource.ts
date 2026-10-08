import type { Dictionary } from '@xeno-js/core'

import type { DbContext } from './db.types'

/**
 * @description BasePostgresSqlDataSource is an abstract class that serves as a foundation for creating data sources that interact with a PostgreSQL database. It provides a common interface for accessing the database connection and ensures that the database connection is properly initialized and managed. By extending this class, developers can easily create data sources that are tailored to their specific use cases.
 *
 * @author Xeno
 * @version 1.0.0
 * @since 2025-09-30
 * @link https://github.com/xeno-js/xeno-js
 */
export abstract class BasePostgresSqlDataSource<TSchema extends Dictionary = Dictionary> {
  constructor(private readonly _db: DbContext<TSchema>) {}

  /**
   * @description Returns the database connection.
   * @returns {NodePgDatabase<TSchema>} The database connection.
   */
  protected get db(): DbContext<TSchema> {
    return this._db
  }
}
