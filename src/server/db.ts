import knex from 'knex';
import path from 'path';
import { createUserTable } from './services/users';
import { fileURLToPath } from 'url';

export const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: path.join(path.dirname(fileURLToPath(import.meta.url)), '../assets/db.sqlite')
  }
})

await db.schema.hasTable('users')
  .then((exists) => {
    if (!exists) {
      return db.schema.createTable('users', createUserTable);
    }
  });
