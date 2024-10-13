import http from 'http';
import { PORT, HOST } from './constants';
import { db } from './db';
import { userRoutesMiddleware } from './api/users';
import { Effect, pipe } from 'effect';

const server = http.createServer((req, res) => {
  console.log(req.url);
  console.log(req.headers);
  console.log(req.method);
  pipe(
    userRoutesMiddleware(db, req, res),
    Effect.match({
      onSuccess: ({ req, res }) => {
        res.end();
      },
      onFailure: (err) => {
        console.log(err);
      }
    }),
    Effect.runPromiseExit,
  );
});

server.on('error', (error) => {
  console.log(error);
})

server.on('listening', () => {
  console.log(`Server started on ${HOST}:${PORT}`);
})

server.listen(PORT, HOST);
