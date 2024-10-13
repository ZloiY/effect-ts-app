import { Brand, Effect, pipe } from "effect";

export type Url = string & Brand.Brand<"Url">;

export const Url = Brand.refined<Url>(
  (url) => pipe(
    Effect.try({
      try: () => new URL(url),
      catch: () => false
    }),
    Effect.map(() => true),
    Effect.runSync
  ),
  (url) => Brand.error(`${url} not an url`)
);
