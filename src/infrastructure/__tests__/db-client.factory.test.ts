import type { PoolOptions } from 'pg'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { poolMock, createPoolInstance, drizzleMock } = vi.hoisted(() => ({
  poolMock: vi.fn(),
  createPoolInstance: vi.fn(),
  drizzleMock: vi.fn(),
}))

vi.mock('pg', () => ({
  Pool: class {
    public constructor(...args: [PoolOptions?]) {
      poolMock(...args)
      return createPoolInstance(args[0]) as object
    }
  },
}))

vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: drizzleMock,
}))

import { DbClientFactory } from '../db-client.factory'

describe('DbClientFactory', () => {
  beforeEach(() => {
    poolMock.mockReset()
    createPoolInstance.mockReset()
    drizzleMock.mockReset()
  })

  it('creates a pg Pool with the provided configuration and returns the drizzle client', () => {
    const opts = {
      connectionString: 'postgres://localhost:5432/test',
    } as unknown as PoolOptions
    const poolInstance = { query: vi.fn() }
    const dbClient = { query: vi.fn() }

    createPoolInstance.mockReturnValue(poolInstance)
    drizzleMock.mockReturnValue(dbClient)

    const factory = new DbClientFactory()
    const result = factory.create(opts)

    expect(poolMock).toHaveBeenCalledTimes(1)
    expect(poolMock).toHaveBeenCalledWith(opts)
    expect(createPoolInstance).toHaveBeenCalledWith(opts)
    expect(drizzleMock).toHaveBeenCalledTimes(1)
    expect(drizzleMock).toHaveBeenCalledWith({ client: poolInstance })
    expect(result).toBe(dbClient)
  })

  it('supports an undefined PoolOptions payload when no configuration is provided', () => {
    const poolInstance = { end: vi.fn() }
    const dbClient = { transaction: vi.fn() }

    createPoolInstance.mockReturnValue(poolInstance)
    drizzleMock.mockReturnValue(dbClient)

    const factory = new DbClientFactory()
    const result = factory.create(undefined)

    expect(poolMock).toHaveBeenCalledTimes(1)
    expect(poolMock).toHaveBeenCalledWith(undefined)
    expect(createPoolInstance).toHaveBeenCalledWith(undefined)
    expect(drizzleMock).toHaveBeenCalledTimes(1)
    expect(drizzleMock).toHaveBeenCalledWith({ client: poolInstance })
    expect(result).toBe(dbClient)
  })
})
