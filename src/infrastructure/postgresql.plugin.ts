import type { AppBuilder, IConfigurationService, Optional, SetupAction } from '@xeno-js/core'
import { Guards } from '@xeno-js/core'
import type { PoolOptions } from 'pg'

import type { DbContext, DbTransaction } from './db.types'
import { DbClientFactory } from './db-client.factory'
import type { XenoDbRegistry } from './db-registry.types'

/**
 * @description This function is a plugin for the Xeno.JS application builder that sets up the PostgreSQL database module.
 * It takes an optional PoolOptions object as a parameter and returns a function that configures the application builder.
 * The returned function adds a new module to the application builder, which is an instance of the DbModule class.
 * The DbModule class is responsible for managing the database connection and providing access to the database client.
 */
export function withPostgresql<TRegistry extends XenoDbRegistry = XenoDbRegistry>(
  setupAction?: Optional<SetupAction<PoolOptions, IConfigurationService>>,
) {
  return (builder: AppBuilder<TRegistry>, config: IConfigurationService): AppBuilder<TRegistry> => {
    const opts = {
      connectionString: config.get('DATABASE_URL', ''),
    } as PoolOptions

    if (Guards.isDefined(setupAction)) setupAction(opts, config)

    const client = new DbClientFactory().create(opts)

    builder.addModule(
      'PostgresDbModule',
      async () => {
        const { DbModule } = await import('@xeno-js/core')
        return new DbModule<TRegistry, DbContext, DbTransaction>()
      },
      { client },
    )

    return builder
  }
}
