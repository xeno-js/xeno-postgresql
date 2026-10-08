import type { Dictionary, IFactory, Optional } from '@xeno-js/core'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool, type PoolOptions } from 'pg'

import type { DbContext } from './db.types'

/**
 * @description Factory class responsible for creating instances of IDbClient based on the provided configuration. It implements the IFactory interface, allowing for easy integration with dependency injection systems. The factory encapsulates the creation logic for the IDbClient, including the initialization of the underlying database client with the specified configuration options such as connection string and table mappings. This design promotes separation of concerns and allows for flexibility in managing IDbClient instances across the application.
 *
 * @author Xeno
 * @version 1.0.0
 * @since 2025-09-30
 * @link https://github.com/xeno-js/xeno-js
 */
export class DbClientFactory implements IFactory<PoolOptions, DbContext<Dictionary>> {
  public create(opts: Optional<PoolOptions>): DbContext<Dictionary> {
    const pool = new Pool(opts)

    return drizzle({ client: pool })
  }
}
