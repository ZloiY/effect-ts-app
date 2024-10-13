import knex from "knex";
import crypto from 'crypto';
import { generateSalt } from "../utils/salt-generator";
import { ERRORS, MyServerError } from "../types";
import { Effect, Either, flow, pipe } from "effect";
import { ExitMatchWrapper } from "../utils/exit-matcher";

export type User = {
  name: string;
  salt: string;
  hash: string;
}

export const createUserTable = (table: knex.Knex.CreateTableBuilder) => {
  table.string('name', 60)
    .unique()
    .primary()
    .notNullable();
  table.string('salt', 10).notNullable();
  table.string('hash').notNullable();
}

export class UserService {
  static createUser(db: knex.Knex<User>, name: string, pswd: string) {
    return pipe(
      UserService.isUserExist(db, name),
      Effect.flatMap((isExist) => {
        if (!isExist) {
          const salt = generateSalt();
          const hash = crypto.createHash('sha256')
          hash.update(pswd)
          return Effect.tryPromise({
            try: () => db.transaction((trx) =>
              trx('users').insert({ name, salt, hash: hash.digest('base64') })
                .then(trx.commit)
            ),
            catch: (err: unknown) => ({ type: ERRORS.TRANSACTION_ERROR, message: `Transaction err ${err}` } as MyServerError)
          })
        }

        return Effect.fail({ type: ERRORS.USER_CREATION, message: "User already exist" } as MyServerError);
      }),
      Effect.runPromiseExit,
    ).then(ExitMatchWrapper)
  }

  static getUser(db: knex.Knex<User>, name: string) {
    return Effect.tryPromise({
      try: () => db('users').where('name', name),
      catch: (err: unknown) => ({ type: ERRORS.DB_ERROR, message: `DB error ${err}` } as MyServerError)
    })
  }

  static getUsers(db: knex.Knex<User>) {
    return Effect.tryPromise({
      try: () => db('users'),
      catch: (err: unknown) => ({ type: ERRORS.DB_ERROR, message: `DB error ${err}` } as MyServerError)
    })
  }

  static deleteUser(db: knex.Knex<User>, name: string) {
    return Effect.tryPromise({
      try: () => db('users').where('name', name).delete(),
      catch: (err: unknown) => ({ type: ERRORS.DB_ERROR, message: `DB error ${err}` } as MyServerError)
    })
  }

  static updateUser(db: knex.Knex<User>, oldName: string, newUser: { name: string, pswd: string }) {
    return pipe(
      UserService.isUserExist(db, oldName),
      Effect.flatMap((isExist) => {
        if (isExist) {
          const salt = generateSalt();
          const hash = crypto.createHash('sha256')
          hash.update(newUser.pswd);
          return Effect.tryPromise({
            try: () => db('users')
              .where('name', oldName)
              .update<User>({
                name: newUser.name,
                salt,
                hash: hash.digest('base64')
              }),
            catch: (err: unknown) => ({ type: ERRORS.DB_ERROR, message: `DB error ${err}` } as MyServerError)
          });
        }

        return Effect.fail({ type: ERRORS.USER_CREATION, message: "User already exist" } as MyServerError);
      })
    )
  }

  static isUserExist(db: knex.Knex<User>, name: string) {
    return pipe(
      UserService.getUser(db, name),
      Effect.map((users) => users.length > 0)
    )
  }
}
