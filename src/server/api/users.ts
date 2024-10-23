import http from 'http';
import { match, P } from 'ts-pattern';
import knex from 'knex';
import { User, UserService } from '../services/users';
import { Effect, pipe } from 'effect';
import { ERRORS } from '../types';
import { CreateUserPayload, createUserPayloadSchema, upadateUserPayloadSchema, UpdateUserPayload } from './users.schema';

export const userRoutesMiddleware = (db: knex.Knex<User>, req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage }) => {
  return match({ req, method: req.method, url: new URL(req.url!, req.headers.host) })
    .with(
      {
        method: 'GET',
        url: {
          pathname: '/users',
          searchParams: P.when((searchParams) => searchParams.has('name'))
        }
      },
      ({ req, url }) => {
        const name = url.searchParams.get('name')!;
        return pipe(
          UserService.getUser(db, name),
          Effect.map((user) => {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.write(JSON.stringify(user));
            return { req, res };
          })
        );
      })
    .with(
      {
        method: 'GET',
        url: {
          pathname: '/users'
        }
      },
      ({ req }) => {
        return pipe(
          UserService.getUsers(db),
          Effect.map((users) => {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.write(JSON.stringify(users));
            return { req, res };
          })
        )
      })
    .with(
      {
        method: 'POST',
        url: {
          pathname: '/users'
        }
      },
      ({ req }) => {
        let data = '';
        req.on('data', (chunk) => {
          data += chunk;
        });
        return pipe(
          Effect.tryPromise({
            try: () => new Promise<CreateUserPayload>((resolve, reject) => {
              req.on('end', () => {
                const userData = createUserPayloadSchema.safeParse(JSON.parse(data));
                if (userData.success) {
                  resolve(userData.data);
                } else {
                  reject({ type: ERRORS.PAYLOAD_PARSING, message: userData.error.format()._errors.join('\n') })
                }
              })
            }),
            catch: (err) => err,
          }),
          Effect.flatMap((userData) => UserService.createUser(db, userData.name, userData.password)),
          Effect.map((user) => {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.write(JSON.stringify(user))
            return { req, res }
          })
        )
      })
    .with({
      method: 'PUT',
      url: {
        pathname: '/users',
      }
    }, ({ req }) => {
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      return pipe(
        Effect.tryPromise({
          try: () => new Promise<UpdateUserPayload>((resolve, reject) => {
            req.on('end', () => {
              const userData = upadateUserPayloadSchema.safeParse(JSON.parse(data));
              if (userData.success) {
                resolve(userData.data);
              } else {
                reject({ type: ERRORS.PAYLOAD_PARSING, message: userData.error.format()._errors.join('\n') })
              }
            })
          }),
          catch: (err) => err,
        }),
        Effect.flatMap((update) => UserService.updateUser(db, update.oldUser, update.newUser)),
        Effect.map((user) => {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.write(JSON.stringify(user))
          return { req, res }
        })
      );
    })
    .with({
      method: 'DELETE',
      url: {
        pathname: '/users',
        searchParams: P.when((searchParams) => searchParams.has('name'))
      }
    }, ({ req, url }) => {
        const name = url.searchParams.get('name')!;
        return pipe(
          UserService.deleteUser(db, name),
          Effect.map(() => {
            res.writeHead(200)
            return { req, res };
          })
        );
      })
    .otherwise(() => Effect.tryPromise({
      try: () => Promise.resolve({ req, res }),
      catch: () => ({ type: ERRORS.DB_ERROR, message: 'Shouldn\'t be here' })
    }))
}
