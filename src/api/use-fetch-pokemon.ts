import { useEffect, useMemo, useState } from "react";
import { FailedResponse, FetchErrorCauseMatch, FetchErrors, FullFiledResponse, PendingResponse, useFetch } from "../hooks/use-fetch";
import * as O from 'effect/Option';
import { PokemonItem } from "./use-fetch-pokemons";
import { z } from "zod";
import { Url } from "./utils";
import { Effect, flow, pipe, Boolean, Cause, Exit, Option } from "effect";
import { ERRORS } from "../constants";
import { ZodError } from "@my-types/error";

const pokemonSchema = z.object({
  abilities: z.object({
    ability: z.object({
      name: z.string(),
    }),
  }).transform(({ ability }) => ability.name).array(),
  height: z.number().positive(),
  id: z.number().positive(),
  name: z.string(),
  stats: z.object({
    base_stat: z.number(),
    stat: z.object({
      name: z.string(),
    }).transform(({ name }) => name),
  }).array(),
  sprites: z.object({
    front_default: z.string().transform(Url),
    other: z.object({
      dream_world: z.object({
        front_default: z.string().transform(Url),
      }),
    }).nullish(),
  }).transform((value) => value.other?.dream_world.front_default ?? value.front_default),
  weight: z.number().positive(),
})

export type Pokemon = z.infer<typeof pokemonSchema>;

type ValidatedResponse = FailedResponse<ZodError> | PendingResponse | FullFiledResponse<Pokemon | null>;
export const useFetchPokemon = (url?: PokemonItem['url']) => {
  const fetch = useFetch();
  const [validatedResponse, setValidatedResponse] = useState<Option.Option<ValidatedResponse>>(O.none);

  const response = useMemo(() => pipe(
    url,
    O.fromNullable,
    O.map(flow(
      fetch,
      Effect.flatMap((response) => {
        const parsedResponse = pokemonSchema.safeParse(response);
        return pipe(
          parsedResponse.success,
          Boolean.match({
            onTrue: () => Effect.succeed(parsedResponse.data!),
            onFalse: () => Effect.fail({ type: ERRORS.ZOD_PARSE_ERROR, message: parsedResponse.error!.toString() })
          }),
        )
      }),
      Effect.mapErrorCause((cause) => Cause.fail(FetchErrorCauseMatch(cause as Cause.Cause<FetchErrors | ZodError>))),
      Effect.runPromiseExit,
    ),
    ),
  ), [url]);

  useEffect(() => {
    O.getOrElse(response, () => Promise.resolve(Exit.succeed(null)) as Promise<Exit.Exit<Pokemon | null, FetchErrors | ZodError>>)
      .then(Exit.match({
        onSuccess(value) {
          if (value === null) {
            setValidatedResponse(O.some({ type: 'pending' }))
          } else {
            setValidatedResponse(O.some({ type: 'fullfiled', value }))
          }
        },
        onFailure(cause) {
          const error = FetchErrorCauseMatch(cause);
          setValidatedResponse(O.some({ type: 'failed', error }))
        }
      }));
  }, [response]);

  return validatedResponse;
}
