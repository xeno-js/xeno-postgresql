import { describe, expect, it, vi } from 'vitest'

import { BasePostgresSqlDataSource } from '../base-postgressql.datasource'
import type { DbContext } from '../db.types'

describe('BasePostgresSqlDataSource', () => {
  it('exposes the database client through the protected db getter', () => {
    const db = {
      query: vi.fn(),
      transaction: vi.fn(),
    } as unknown as DbContext

    class TestDataSource extends BasePostgresSqlDataSource {
      public getDb() {
        return this.db
      }
    }

    const source = new TestDataSource(db)

    expect(source.getDb()).toBe(db)
  })
})
