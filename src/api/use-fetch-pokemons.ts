import { useEffect, useMemo, useReducer, useState } from "react";
import * as O from 'effect/Option';
import * as Exit from 'effect/Exit';
import { Effect, Fiber, Brand, pipe, flow } from 'effect';
import { POKEMONS_URL, ERRORS } from "../constants";
import { convertObjectToQuery, ExitMatchWrapper, FailedResponse, FetchErrors, FullFiledResponse, PendingResponse, useFetch } from "../hooks/use-fetch";
import { z } from "zod";
import { ZodError } from "@types/error";

export type PokemonUrl = string & Brand.Brand<"PokemonUrl">;
export type PokemonName = string & Brand.Brand<"PokemonName">;

const PokemonUrl = Brand.refined<PokemonUrl>(
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

const PokemonName = Brand.nominal<PokemonName>();

const pokemonItemSchema = z.object({
  name: z.string().transform(PokemonName),
  url: z.string().transform(PokemonUrl),
});

const pokemonsListSchema = z.object({
  count: z.number(),
  results: pokemonItemSchema.array(),
}).strip();

export type PokemonsList = z.infer<typeof pokemonsListSchema>;
export type PokemonItem = z.infer<typeof pokemonItemSchema>;

type ValidatedResponse = FailedResponse<ZodError> | PendingResponse | FullFiledResponse<PokemonsList | null>;

export const useFetchPokemons = (limit: number, offset: number) => {
  const fetch = useFetch();

  const [validatedResponse, setValidatedResponse] = useState<O.Option<ValidatedResponse>>(O.none);

  const response = useMemo(() => fetch(`${POKEMONS_URL}/pokemon?${convertObjectToQuery({ limit, offset })}`), [limit, offset]);

  useEffect(() => {
    pipe(
      response,
      flow(
        Effect.flatMap((response) => {
          const parseResult = pokemonsListSchema.safeParse(response);
          if (parseResult.success) {
            return Effect.succeed(parseResult.data)
          } else {
            return Effect.fail({ type: ERRORS.ZOD_PARSE_ERROR, message: parseResult.error.toString() });
          }
        }),
        Effect.runPromiseExit,
      ),
    ).then(flow(
      ExitMatchWrapper,
      O.some,
      setValidatedResponse
    ))
  },
    [response]);

  return validatedResponse;
};
