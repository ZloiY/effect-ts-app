import knex from "knex";
import { expect, test } from "vitest";
import { createUserTable, UserService } from "./users";
import { Effect } from "effect";
import { ERRORS } from "../types";
import { FiberFailure } from "effect/Runtime";


test('Should create user', async () => {
  const db = knex({
    client: 'better-sqlite3',
    connection: {
      filename: ''
    }
  });

  await db.schema.createTable('users', createUserTable);

  await Effect.runPromise(UserService.createUser(db, 'test', 'test'));
  const userName = await Effect.runPromise(UserService.getUser(db, 'test'));
  expect(userName.name).toBe('test');
});

test('Should find correct user', async () => {
  const db = knex({
    client: 'better-sqlite3',
    connection: {
      filename: ''
    }
  });

  await db.schema.createTable('users', createUserTable);

  await Effect.runPromise(UserService.createUser(db, 'test', 'test'));
  await Effect.runPromise(UserService.createUser(db, 'test2', 'test2'));
  const userName = await Effect.runPromise(UserService.getUser(db, 'test2'));
  expect(userName.name).toStrictEqual('test2');
})

test('Should delete user', async () => {
  const db = knex({
    client: 'better-sqlite3',
    connection: {
      filename: ''
    }
  });

  await db.schema.createTable('users', createUserTable);

  await Effect.runPromise(UserService.createUser(db, 'test', 'test'));
  await Effect.runPromise(UserService.createUser(db, 'test2', 'test2'));
  await Effect.runPromiseExit(UserService.deleteUser(db, 'test2'));
  const userName = await Effect.runPromise(UserService.getUser(db, 'test'))
  expect(userName.name).toStrictEqual('test');
})

test('Should update user', async () => {
  const db = knex({
    client: 'better-sqlite3',
    connection: {
      filename: ''
    }
  });

  await db.schema.createTable('users', createUserTable);

  await Effect.runPromise(UserService.createUser(db, 'test', 'test'));
  await Effect.runPromise(UserService.updateUser(db, { name: 'test', pswd: 'test' }, { name: 'test2', pswd: 'test2' }));
  await Effect.runPromise(
    UserService.getUser(db, 'test'),
  ).catch((err) => {
    expect((err as FiberFailure).stack).toContain(ERRORS.USER_SEARCH)
  })
  const userName2 = await Effect.runPromise(UserService.getUser(db, 'test2'))
  expect(userName2.name).toBe('test2')
})

test('Should return all users', async () => {
  const db = knex({
    client: 'better-sqlite3',
    connection: {
      filename: ''
    }
  });

  await db.schema.createTable('users', createUserTable);

  await Effect.runPromise(UserService.createUser(db, 'test', 'test'));
  await Effect.runPromise(UserService.createUser(db, 'test2', 'test2'));
  const users = await Effect.runPromise(UserService.getUsers(db));
  expect(users.length).toBe(2);
  expect(users[0].name).toStrictEqual('test');
  expect(users[1].name).toStrictEqual('test2');
})
