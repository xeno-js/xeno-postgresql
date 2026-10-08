import type { ApplicationRegistry, Dictionary } from '@xeno-js/core'

import type { DbContext, DbTransaction } from './db.types'

/**
 * @description The XenoDbRegistry type is an alias for the ApplicationRegistry specialized with DbContext and DbTransaction. It represents the registry of application services and dependencies, specifically tailored for applications that utilize a database context and transactions. This type is used throughout the application to ensure consistent typing and to facilitate dependency injection and service resolution.
 * @author Xeno
 * @version 1.0.0
 * @since 2025-09-30
 * @link https://github.com/xeno-js/xeno-js
 */
export type XenoDbRegistry<
  TSchema extends Dictionary = Dictionary,
  TExtensions = object,
> = ApplicationRegistry<DbContext<TSchema>, DbTransaction> &
  Readonly<Omit<TExtensions, keyof ApplicationRegistry<DbContext<TSchema>, DbTransaction>>>
