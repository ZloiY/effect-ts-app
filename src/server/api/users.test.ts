import knex from 'knex';
import { Readable as ReadableStream } from 'stream';
import { ClientRequest, request } from 'http';
import { beforeEach, expect, it, vi } from 'vitest';
import { createUserTable, User, UserService } from '../services/users';
import { userRoutesMiddleware } from './users';
import { IncomingMessage, ServerResponse } from 'http';
import { Effect } from 'effect';
import { CreateUserPayload, UpdateUserPayload } from './users.schema';
import { FiberFailure } from 'effect/Runtime';
import { ERRORS } from '../types';
import { describe } from 'node:test';

let db: knex.Knex<User>;
describe('userApi', () => {
  beforeEach(async () => {
    db = knex({
      client: 'better-sqlite3',
      useNullAsDefault: true,
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

  it('should return error when doesn\'t find user', async () => {
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
    const spy = vi.spyOn(res, 'write');
    await Effect.runPromiseExit(UserService.createUser(db, 'test', 'test'));
    await Effect.runPromise(userRoutesMiddleware(db, req, res))
      .catch((err) => {
        expect((err as FiberFailure).stack).toContain(ERRORS.USER_SEARCH)
      });
    expect(spy).toHaveBeenCalledTimes(0);
  });

  it('should accept POST request /users', async () => {
    const payload = JSON.stringify({ name: 'test', password: '1234' } as CreateUserPayload);
    const req: ReadableStream & { method?: string, headers?: { host: string }, url?: URL } = ReadableStream.from(payload, { encoding: 'utf-8' });
    req.url = new URL('http://localhost/users');
    req.method = 'POST';
    req.headers = { host: 'http://localhost' };
    const res = {
      writeHead() { },
      write(payload: string) {
        expect(JSON.parse(payload).name).toBe('test')
      }
    } as unknown as ServerResponse;
    const spy = vi.spyOn(res, 'write');
    const result = await Effect.runPromise(userRoutesMiddleware(db, req as unknown as IncomingMessage, res))
    expect(spy).toHaveBeenCalledOnce();
    expect('req' in result && 'res' in result).toBe(true);
  });

  it('should return error on POST request /users', async () => {
    await Effect.runPromise(UserService.createUser(db, 'test', '1234'))
    const payload = JSON.stringify({ name: 'test', password: '1234' } as CreateUserPayload);
    const req: ReadableStream & { method?: string, headers?: { host: string }, url?: URL } = ReadableStream.from(payload, { encoding: 'utf-8' });
    req.method = 'POST';
    req.headers = { host: 'http://localhost' };
    req.url = new URL('http://localhost/users');
    const res = {
      writeHead() { },
      write() { }
    } as unknown as ServerResponse;
    await Effect.runPromise(userRoutesMiddleware(db, req as unknown as IncomingMessage, res))
      .catch((err) => {
        expect((err as FiberFailure).stack).toContain(ERRORS.USER_CREATION)
      });
  });

  it('should accept PUT request /users', async () => {
    await Effect.runPromise(UserService.createUser(db, 'test', 'test'))
    const payload = JSON.stringify({
      oldUser: {
        name: 'test',
        pswd: 'test',
      },
      newUser: {
        name: 'test2',
        pswd: 'test2',
      }
    });
    const req: ReadableStream & { method?: string, headers?: { host: string }, url?: URL } = ReadableStream.from(payload, { encoding: 'utf-8' });
    req.headers = { host: 'http://localhost' };
    req.url = new URL('http://localhost/users');
    req.method = 'PUT';
    const res = {
      writeHead() { },
      write(payload: string) {
        expect(JSON.parse(payload).name).toEqual('test2');
      }
    } as unknown as ServerResponse;
    const spy = vi.spyOn(res, 'write');
    const result = await Effect.runPromise(userRoutesMiddleware(db, req as unknown as IncomingMessage, res));
    expect(spy).toHaveBeenCalledOnce();
    expect('req' in result && 'res' in result).toBe(true);
  });

  it('should return error on PUT request /users', async () => {
    const payload = JSON.stringify({
      oldUser: {
        name: 'test',
        pswd: 'test',
      },
      newUser: {
        name: 'test2',
        pswd: 'test2',
      }
    });
    const req: ReadableStream & { method?: string, headers?: { host: string }, url?: URL } = ReadableStream.from(payload, { encoding: 'utf-8' });
    req.headers = { host: 'http://localhost' };
    req.url = new URL('http://localhost/users');
    req.method = 'PUT';
    const res = {
      writeHead() { },
      write(payload: string) {
        expect(JSON.parse(payload).name).toEqual('test2');
      }
    } as unknown as ServerResponse;
    const spy = vi.spyOn(res, 'write');
    const result = await Effect.runPromise(userRoutesMiddleware(db, req as unknown as IncomingMessage, res))
      .catch((err) => {
        expect((err as FiberFailure).stack).toContain(ERRORS.USER_SEARCH);
        return err;
      });
    expect(spy).toHaveBeenCalledTimes(0);
    expect('req' in result && 'res' in result).toBe(false);
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

  it('should return error on DELETE requests for /users?name=', async () => {
    const req = {
      method: 'DELETE',
      url: '/users?name=test',
      headers: {
        host: 'http://test'
      },
    } as IncomingMessage;
    const res = {
      writeHead(...args: any[]) {
        expect(args[0]).toEqual(400);
      },
    } as unknown as ServerResponse;
    const result = await Effect.runPromise(userRoutesMiddleware(db, req as unknown as IncomingMessage, res))
      .catch((err) => {
        expect((err as FiberFailure).stack).toContain(ERRORS.USER_SEARCH);
        return err;
      });
    expect('req' in result && 'res' in result).toBe(false);
  });
});
