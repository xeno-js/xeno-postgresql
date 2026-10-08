<div align="center">
  <img src="logo/logo.png" alt="Xeno.JS Logo" width="140" />

  <h1>Xeno.JS</h1>
  <p><strong>A Typescript application framework architecture for Node.js, designed for lower technical debt, and faster infrastructure migrations.</strong></p>
  <p>Build long-lived applications with explicit dependency injection, DDD, CQRS, and transport-independent business logic.</p>

  <p>
    <a href="https://www.npmjs.com/package/@xeno-js/postgresql"><img src="https://img.shields.io/npm/v/@xeno-js/postgresql?style=flat-square" alt="NPM Version" /></a>
    <a href="https://github.com/xeno-js/xeno-postgresql"><img src="https://img.shields.io/badge/Powered%20by-Xeno-blueviolet?style=flat-square" alt="Powered by Xeno" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License: MIT" /></a>
    <a href="https://buymeacoffee.com/xenojs">
      <img src="https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-FFdd00?style=flat-square&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee" />
    </a>
  </p>
</div>

---

## @xeno-js/postgresql

PostgreSQL database integration for Xeno.JS using Drizzle ORM and node-postgres.

`@xeno-js/postgresql` integrates PostgreSQL into the Xeno.JS application
architecture through Drizzle ORM, `pg`, typed database contexts, transactions,
and Xeno's dependency injection container.

It keeps PostgreSQL infrastructure at the edge of your application while
allowing application and domain code to depend on explicit contracts.

---

## Why `@xeno-js/postgresql`?

Xeno.JS is an application architecture framework for TypeScript.

Your application architecture should not be defined by your database driver,
ORM, or transport layer.

`@xeno-js/postgresql` provides the PostgreSQL infrastructure layer while Xeno.JS
remains responsible for application composition, dependency injection, scopes,
transactions, repositories, and application execution.

```text
                 Xeno.JS Application
                        │
                ┌───────┴────────┐
                │                │
             Use Cases         Domain
                │
                ▼
           Repository /
            Data Source
                │
                ▼
        ┌───────────────────┐
        │ @xeno-js/postgresql│
        └─────────┬─────────┘
                  │
             Drizzle ORM
                  │
             node-postgres
                  │
                  ▼
              PostgreSQL
```

The package is intentionally focused on PostgreSQL infrastructure.

---

## Features

- PostgreSQL integration for Xeno.JS
- Drizzle ORM integration
- `node-postgres` (`pg`) connection pooling
- Type-safe `DbContext<TSchema>`
- Type-safe Xeno application registries
- Database transaction support through Xeno's `DbModule`
- Xeno `UnitOfWork` integration
- Base data source abstraction for PostgreSQL
- Explicit dependency injection
- TypeScript-first API
- No decorators or runtime scanning required

---

## Installation

Install the Xeno.JS PostgreSQL integration together with its required database
dependencies:

```bash
npm install @xeno-js/core @xeno-js/postgresql drizzle-orm pg
```

If you use TypeScript with `pg`, you may also install its type definitions:

```bash
npm install -D @types/pg
```

---

## Quick Start

Create your PostgreSQL application with `AppBuilder` and register the database
using `withPostgresql`.

```typescript
import { AppBuilder } from '@xeno-js/core'
import { withPostgresql } from '@xeno-js/postgresql'
import type { AppRegistry } from './registry'

const app = new AppBuilder<AppRegistry>()

app.addDb(
  withPostgresql((opts, config) => {
    opts.connectionString = config.getOrThrow('DATABASE_URL')
    opts.max = config.getNumber('DB_POOL_MAX', 20)
    opts.idleTimeoutMillis = 30000
  }),
)

const container = await app.build()
```

`withPostgresql()` accepts PostgreSQL `PoolOptions` from `pg`.

This means PostgreSQL connection configuration remains expressed using the
native `node-postgres` configuration model rather than introducing a second
configuration abstraction.

---

## Type-safe database schemas

The main benefit of the integration is that the Drizzle schema can become part
of the Xeno application registry.

Define your PostgreSQL tables with Drizzle:

```typescript
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const usersTable = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const dbSchema = {
  users: usersTable,
}

export type ProjectDbSchema = typeof dbSchema
```

Then specialize the Xeno database registry:

```typescript
import type { XenoDbRegistry } from '@xeno-js/postgresql'

export interface AppRegistry extends XenoDbRegistry<ProjectDbSchema> {
  USER_REPOSITORY: IUserRepository
}
```

Your database context is now associated with the application schema:

```typescript
DbContext<ProjectDbSchema>
```

This preserves the Drizzle table definitions through the Xeno dependency
injection boundary.

---

## Accessing `DB_CONTEXT`

The database context can be resolved from the Xeno container using the standard
database token.

```typescript
import { TOKENS } from '@xeno-js/core'

const db = container.resolve(TOKENS.DB_CONTEXT)
```

The resolved database context is backed by Drizzle ORM and `node-postgres`.

When a schema is supplied through `XenoDbRegistry`, the database context remains
strongly typed against that schema.

---

## Repositories

Keep database access behind application-facing repository contracts.

```typescript
export interface IUserRepository {
  findById(id: string): Promise<User | null>
}
```

The infrastructure implementation can resolve the Xeno database context:

```typescript
import type { DbContext } from '@xeno-js/postgresql'

export class SqlUserRepository implements IUserRepository {
  constructor(private readonly db: DbContext<ProjectDbSchema>) {}

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))

    return user ?? null
  }
}
```

Register the repository explicitly:

```typescript
builder.addServices((services) => {
  services.addScoped(
    'USER_REPOSITORY',
    (container) => new SqlUserRepository(container.resolve(TOKENS.DB_CONTEXT)),
  )
})
```

The dependency graph remains explicit:

```text
Application
    │
    ▼
IUserRepository
    │
    ▼
SqlUserRepository
    │
    ▼
DB_CONTEXT
    │
    ▼
Drizzle
    │
    ▼
node-postgres
    │
    ▼
PostgreSQL
```

---

## Transactions and Unit of Work

`@xeno-js/postgresql` integrates with the generic database infrastructure
provided by Xeno.JS.

The PostgreSQL `DbContext` is registered through Xeno's `DbModule`, which also
provides transaction state and `UnitOfWork` integration.

This allows database operations to participate in the same application
transaction boundary.

The application can therefore keep transaction coordination outside individual
repositories and handlers.

```text
Application operation
        │
        ▼
     Handler
        │
        ▼
    UnitOfWork
        │
        ▼
   DbContext
        │
        ▼
     Drizzle
        │
        ▼
   PostgreSQL
```

The exact transaction behavior depends on how the Xeno application scope and
`UnitOfWork` are composed.

---

## Base PostgreSQL Data Source

The package also provides a base class for infrastructure data sources:

```typescript
import { BasePostgresSqlDataSource } from '@xeno-js/postgresql'

export class UserDataSource extends BasePostgresSqlDataSource<ProjectDbSchema> {
  constructor(db: DbContext<ProjectDbSchema>) {
    super(db)
  }

  async findById(id: string) {
    return this.db.select().from(usersTable).where(eq(usersTable.id, id))
  }
}
```

The base data source gives infrastructure implementations access to the typed
PostgreSQL `DbContext`.

This is useful when you want to separate:

```text
Repository
    │
    ▼
Data Source
    │
    ▼
Drizzle
```

instead of placing Drizzle queries directly inside repositories.

---

## Recommended application structure

A typical Xeno.JS application can keep PostgreSQL infrastructure isolated from
the domain:

```text
src/
├── domain/
│   ├── entities/
│   ├── repositories/
│   └── policies/
│
├── application/
│   ├── commands/
│   ├── queries/
│   └── handlers/
│
├── infrastructure/
│   ├── db/
│   │   ├── schema.ts
│   │   ├── data-sources/
│   │   └── repositories/
│   └── xeno-registry/
│
└── main.ts
```

The domain should not need to import `pg` or Drizzle.

The infrastructure layer owns the concrete PostgreSQL implementation.

---

## Configuration

`withPostgresql()` accepts `PoolOptions` from `pg`.

For example:

```typescript
builder.addDb(
  withPostgresql({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
  }),
)
```

Because the options are based on `pg`'s pool configuration, PostgreSQL
connection settings remain familiar to users already working with
`node-postgres`.

---

## PostgreSQL driver

This package currently builds its Drizzle database context using:

```typescript
drizzle - orm / node - postgres
```

and:

```typescript
pg.Pool
```

Therefore the integration is specifically based on the `node-postgres` driver.

```text
@xeno-js/postgresql
        │
        ├── Drizzle ORM
        │      └── drizzle-orm/node-postgres
        │
        └── pg
               └── Pool
```

---

## What this package does

`@xeno-js/postgresql` provides the PostgreSQL infrastructure integration
required by a Xeno.JS application.

It is responsible for:

- creating the PostgreSQL connection pool;
- creating the Drizzle database context;
- integrating the context with Xeno's `DbModule`;
- exposing a typed database registry;
- providing PostgreSQL data source primitives.

---

## What this package does not do

`@xeno-js/postgresql` does not replace Xeno.JS Core.

It does not provide:

- application-level dependency injection;
- CQRS;
- commands and queries;
- application pipelines;
- HTTP routing;
- HTTP server lifecycle;
- domain entities;
- business logic;
- repository interfaces;
- a PostgreSQL database server.

Those responsibilities belong to the application and the corresponding Xeno.JS
packages.

---

## Architecture

The intended responsibility boundary is:

```text
                 Transport
          Fastify / Express / Hono
                      │
                      ▼
               Xeno.JS Core
                      │
        ┌─────────────┼─────────────┐
        │             │             │
      CQRS           DI          Context
        │             │             │
        └─────────────┼─────────────┘
                      │
                 Application
                      │
                      ▼
               Infrastructure
                      │
                      ▼
          @xeno-js/postgresql
                      │
             ┌────────┴────────┐
             ▼                 ▼
        Drizzle ORM       node-postgres
             │                 │
             └────────┬────────┘
                      ▼
                  PostgreSQL
```

PostgreSQL is an infrastructure dependency.

It should not define the application architecture.

---

## Xeno.JS ecosystem

`@xeno-js/postgresql` is part of the Xeno.JS ecosystem.

| Package               | Responsibility                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| `@xeno-js/core`       | Application architecture, dependency injection, CQRS, pipelines, scopes and infrastructure composition |
| `@xeno-js/shared`     | Shared contracts and domain primitives                                                                 |
| `@xeno-js/postgresql` | PostgreSQL + Drizzle + node-postgres integration                                                       |
| `@xeno-js/cli`        | Project scaffolding and developer tooling                                                              |
| `@xeno-js/vue`        | Vue application integration                                                                            |

The goal is to keep each package focused on a clear architectural
responsibility.

---

## Requirements

- Node.js 20+
- TypeScript
- Xeno.JS Core
- PostgreSQL
- Drizzle ORM
- node-postgres (`pg`)

---

## License

MIT
