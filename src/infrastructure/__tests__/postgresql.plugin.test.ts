import type { AppBuilder, IConfigurationService } from '@xeno-js/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { XenoDbRegistry } from '../db-registry.types'

const { createMock, MockDbModuleClass } = vi.hoisted(() => ({
  createMock: vi.fn(),
  MockDbModuleClass: class MockDbModuleImplementation {
    public readonly name = 'MockDbModule'
  },
}))

class ConfigurationServiceMock implements IConfigurationService {
  public get = vi.fn().mockReturnValue({})
  public getNumber = vi.fn().mockReturnValue(0)
  public getBoolean = vi.fn().mockReturnValue(false)
  public getOrThrow = vi.fn().mockReturnValue('default')
}

vi.mock('../db-client.factory', () => ({
  DbClientFactory: class {
    public create = createMock
  },
}))

vi.mock('@xeno-js/core', () => ({
  DbModule: MockDbModuleClass,
  Guards: {
    isDefined: vi.fn((val: unknown) => val !== null && val !== undefined),
  },
}))

import { withPostgresql } from '../postgresql.plugin'

describe('withPostgresql', () => {
  beforeEach(() => {
    createMock.mockReset()
  })

  it('adds the PostgreSQL module using default options', async () => {
    const client = { kind: 'default-client' }
    createMock.mockReturnValue(client)

    const addModule = vi.fn().mockReturnThis()
    const builder = { addModule } as unknown as AppBuilder<XenoDbRegistry>

    const result = withPostgresql()(builder, new ConfigurationServiceMock())

    expect(result).toBe(builder)
    expect(createMock).toHaveBeenCalledWith({ connectionString: {} })
    expect(addModule).toHaveBeenCalledTimes(1)

    const [name, factory, moduleOptions] = addModule.mock.calls[0] as [
      string,
      () => Promise<unknown>,
      { client: typeof client },
    ]
    expect(name).toBe('PostgresDbModule')
    expect(moduleOptions).toEqual({ client })

    const dbModule = await factory()
    expect(dbModule).toBeInstanceOf(MockDbModuleClass)
  })

  it('passes the pool configuration to the DbClientFactory', () => {
    const client = { kind: 'configured-client' }
    const poolOptions = {
      connectionString: 'postgres://localhost:5432/test',
      max: 1,
      maxUses: 10,
      allowExitOnIdle: true,
      maxLifetimeSeconds: 30,
      idleTimeoutMillis: 30000,
    }
    createMock.mockReturnValue(client)

    const addModule = vi.fn().mockReturnThis()
    const builder = { addModule } as unknown as AppBuilder<XenoDbRegistry>

    withPostgresql((opts) => {
      opts.connectionString = 'postgres://localhost:5432/test'
      opts.max = 1
      opts.maxUses = 10
      opts.allowExitOnIdle = true
      opts.maxLifetimeSeconds = 30
      opts.idleTimeoutMillis = 30000
    })(builder, new ConfigurationServiceMock())

    expect(createMock).toHaveBeenCalledWith(poolOptions)
    expect(addModule).toHaveBeenCalledTimes(1)
    expect(addModule.mock.calls[0][2]).toEqual({ client })
  })
})
