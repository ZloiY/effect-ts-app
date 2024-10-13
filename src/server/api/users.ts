import http from 'http';
import { match } from 'ts-pattern';
import knex from 'knex';
import { User, UserService } from '../services/users';
import { Effect, pipe } from 'effect';
import { ERRORS, MyServerError } from '../types';

export const userRoutesMiddleware = (db: knex.Knex<User>, req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }) => {
  return match(req)
    .with(
      {
        method: 'GET',
        url: '/users'
      },
      (req) => {
        return pipe(
          UserService.getUsers(db),
          Effect.map((users) => {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.write(JSON.stringify(users));
            return { req, res };
          })
        )
      })
    .otherwise(() => Effect.tryPromise({
      try: () => Promise.resolve({ req, res }),
      catch: () => ({ type: ERRORS.DB_ERROR, message: 'Shouldn\'t be here' } as MyServerError)
    }))
}
