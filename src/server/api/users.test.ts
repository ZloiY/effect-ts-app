import knex from 'knex';
import { beforeEach, describe, expect, it } from 'vitest';
import { createUserTable, User, UserService } from '../services/users';
import { userRoutesMiddleware } from './users';
import { IncomingMessage, ServerResponse } from 'http';
import { Effect } from 'effect';

let db: knex.Knex<User>;

describe('/users routes integration tests', () => {
  beforeEach(async () => {
    db = knex({
      client: 'better-sqlite3',
      connection: {
        filename: '',
      },
    });
    await db.schema.createTable('users', createUserTable);
  });

  it('should accept /users request', async () => {
    const req = {
      method: 'GET',
      url: '/users',
    } as IncomingMessage;
    const res = {
      write(payload: string) {
        expect(JSON.parse(payload)[0].name).toBe('test')
      }
    } as ServerResponse;
    await UserService.createUser(db, 'test', 'test');
    const result = await Effect.runPromise(userRoutesMiddleware(db, req, res));
    expect('req' in result && 'res' in result).toBe(true);
  });
});
