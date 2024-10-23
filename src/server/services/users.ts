import knex from "knex";
import crypto from 'crypto';
import { generateSalt } from "../utils/salt-generator";
import { ERRORS, MyServerError } from "../types";
import { Effect, flow, pipe } from "effect";
import { ExitMatchWrapper } from "../utils/exit-matcher";
import { yieldWrapGet } from "effect/Utils";
import { match } from "ts-pattern";

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
      UserService.getUser(db, name),
      Effect.match({
        onFailure: (error) => match(error)
          .with({ type: ERRORS.DB_ERROR }, (error) => Effect.fail(error))
          .with({ type: ERRORS.USER_SEARCH }, () => Effect.succeed(undefined))
          .exhaustive()
        ,
        onSuccess: () => Effect.fail({ type: ERRORS.USER_CREATION, message: "User already exist" } as MyServerError),
      }),
      Effect.flatMap(() => {
        const salt = generateSalt();
        const hash = crypto.createHash('sha256')
        hash.update(pswd + salt);
        return Effect.tryPromise({
          try: () => db.transaction((trx) =>
            trx('users').insert({ name, salt, hash: hash.digest('base64') })
              .then(trx.commit) as Promise<User[]>
          ),
          catch: (err: unknown) => ({ type: ERRORS.TRANSACTION_ERROR, message: `Transaction err ${err}` } as MyServerError)
        })
      }),
    )
  }

  static getUser(db: knex.Knex<User>, name: string) {
    return pipe(
      Effect.tryPromise({
        try: () => db('users').where('name', name),
        catch: (err: unknown) => ({ type: ERRORS.DB_ERROR, message: `DB error ${err}` })
      }),
      Effect.filterOrFail(
        (users) => users.length > 0,
        () => ({ type: ERRORS.USER_SEARCH, message: 'No such user' })
      ),
      Effect.map((users) => users[0])
    );
  }

  static getUsers(db: knex.Knex<User>) {
    return Effect.tryPromise({
      try: () => db('users'),
      catch: (err: unknown) => ({ type: ERRORS.DB_ERROR, message: `DB error ${err}` })
    })
  }

  static deleteUser(db: knex.Knex<User>, name: string) {
    return pipe(
      UserService.getUser(db, name),
      Effect.flatMap(() =>
        Effect.tryPromise({
          try: () => db('users').where('name', name).delete(),
          catch: (err: unknown) => ({ type: ERRORS.DB_ERROR, message: `DB error ${err}` })
        })
      )
    );
  }

  static updateUser(db: knex.Knex<User>, oldUser: { name: string, pswd: string }, newUser: { name: string, pswd: string }) {
    return pipe(
      UserService.verifyUser(db, oldUser),
      Effect.flatMap(() => {
        const salt = generateSalt();
        const hash = crypto.createHash('sha256')
        hash.update(newUser.pswd + salt);
        return Effect.tryPromise({
          try: () => db('users')
            .where('name', oldUser.pswd)
            .update<User>({
              name: newUser.name,
              salt,
              hash: hash.digest('base64')
            }),
          catch: (err: unknown) => ({ type: ERRORS.DB_ERROR, message: `DB error ${err}` })
        });
      })
    )
  }

  static verifyUser(db: knex.Knex<User>, user: { name: string; pswd: string }) {
    return pipe(
      UserService.getUser(db, user.name),
      Effect.filterOrFail(
        (dbUser) => {
          const hash = crypto.createHash('sha256');
          hash.update(user.pswd + dbUser.salt);
          return hash.digest('base64') === dbUser.hash;
        },
        () => ({ type: ERRORS.USER_VERIFICATION, message: 'Wrong user password' })
      ),
    )
  }

}
