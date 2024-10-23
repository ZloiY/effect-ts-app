import knex from 'knex';
import { ClientRequest, request } from 'http';
import { beforeEach, beforeAll, describe, expect, it } from 'vitest';
import { createUserTable, User, UserService } from '../services/users';
import { userRoutesMiddleware } from './users';
import { IncomingMessage, ServerResponse } from 'http';
import { Effect } from 'effect';
import { CreateUserPayload, UpdateUserPayload } from './users.schema';
import HttpRequestMock from 'http-request-mock';
import { await } from 'effect/Fiber';

let db: knex.Knex<User>;

const mocker = HttpRequestMock.setup();

describe('/users routes integration tests', () => {
  beforeAll(() => {
    mocker.mock({
      url: '127.0.0.1',
      method: 'POST',
    });
  });
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
        expect(JSON.parse(payload).name).toBe('test1')
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

  it('should accept PUT request /users', async () => {
    await Effect.runPromise(UserService.createUser(db, 'test', 'test'))
    const req: ClientRequest & { headers?: { host: string } } = request({
      method: 'PUT',
    });
    req.headers = { host: 'http://test' };
    req.write(JSON.stringify({
      oldUser: {
        name: 'test',
        pswd: 'test',
      },
      newUser: {
        name: 'test2',
        pswd: 'test2',
      }
    } as UpdateUserPayload))
    const res = {
      writeHead() { },
      write(payload: string) {
        expect(JSON.parse(payload).name).toEqual('test2');
      }
    } as unknown as ServerResponse;
    const result = await Effect.runPromise(userRoutesMiddleware(db, req as unknown as IncomingMessage, res));
    expect('req' in result && 'res' in result).toBe(true);
  });

  it('should accept DELETE requests for /users?name=', async () => {
    await Effect.runPromise(UserService.createUser(db, 'test', 'test'))
    const req = {
      method: 'DELETE',
      url: '/users?name=test',
      headers: {
        host: 'http://test'
      },
    } as IncomingMessage;
    const res = {
      writeHead(...args: any[]) {
        expect(args[0]).toEqual(200);
      },
    } as unknown as ServerResponse;
    const result = await Effect.runPromise(userRoutesMiddleware(db, req as unknown as IncomingMessage, res));
    expect('req' in result && 'res' in result).toBe(true);
  });
});
