import knex from 'knex';
import { ClientRequest, request } from 'http';
import { beforeEach, describe, expect, it } from 'vitest';
import { createUserTable, User, UserService } from '../services/users';
import { userRoutesMiddleware } from './users';
import { IncomingMessage, ServerResponse } from 'http';
import { Effect } from 'effect';
import { CreateUserPayload } from './users.schema';

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
      headers: {
        host: 'http://test'
      },
    } as IncomingMessage;
    const res = {
      writeHead() { },
      write(payload: string) {
        expect(JSON.parse(payload)[0].name).toBe('test')
      }
    } as unknown as ServerResponse;
    await Effect.runPromiseExit(UserService.createUser(db, 'test', 'test'));
    const result = await Effect.runPromise(userRoutesMiddleware(db, req, res));
    expect('req' in result && 'res' in result).toBe(true);
  });

  it('should accept /users?name= request', async () => {
    const req = {
      method: 'GET',
      url: '/users?name=test1',
      headers: {
        host: 'http://test'
      },
    } as IncomingMessage;
    const res = {
      writeHead() { },
      write(payload: string) {
        expect(JSON.parse(payload)[0].name).toBe('test1')
      }
    } as unknown as ServerResponse;
    await Effect.runPromiseExit(UserService.createUser(db, 'test', 'test'));
    await Effect.runPromiseExit(UserService.createUser(db, 'test1', 'test1'));
    const result = await Effect.runPromise(userRoutesMiddleware(db, req, res));
    expect('req' in result && 'res' in result).toBe(true);
  });

  it('should accept POST request /users', async () => {
    const req: ClientRequest & { headers?: { host: string } } = request({
      method: 'POST',
    });
    req.write(JSON.stringify({ name: 'test', password: '1234' } as CreateUserPayload))
    req.headers = { host: 'http://test' };
    const res = {
      writeHead() { },
      write(payload: string) {
        expect(JSON.parse(payload)[0].name).toBe('test')
      }
    } as unknown as ServerResponse;
    const result = await Effect.runPromise(userRoutesMiddleware(db, req as unknown as IncomingMessage, res));
    expect('req' in result && 'res' in result).toBe(true);
  });
});
