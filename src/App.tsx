import { useMemo, useReducer } from 'react'
import { PokemonsList } from './pokemons-list/PokemonsList'
import * as O from 'effect/Option';
import { pipe } from "effect";
import { match } from "ts-pattern";
import { useFetchPokemons } from './api/use-fetch-pokemons';

type RequestParams = {
  limit: number;
  offset: number;
};

const requestParamsReducer = (state: RequestParams, payload: Partial<RequestParams>) => ({ ...state, ...payload });
function App() {
  const [requestParams, setRequestParams] = useReducer(requestParamsReducer, { limit: 16, offset: 0 });
  const fetchedPokemonsList = useFetchPokemons(requestParams.limit, requestParams.offset);

  const currentPage = useMemo(() => {
    if (requestParams.offset === 0) {
      return 0;
    }
    return Math.ceil(requestParams.offset / requestParams.limit);
  }, [requestParams.offset, requestParams.limit]);

  const maxPokemons = useMemo(() =>
    pipe(
      fetchedPokemonsList,
      O.map(
        (value) => match(value)
          .with({ type: 'fullfiled' }, ({ value }) => value?.count ?? 0)
          .otherwise(() => 0)
      ),
      O.getOrElse(() => 0)
    ), [fetchedPokemonsList]);

  const lastPage = useMemo(() => maxPokemons === 0 ?
    0 :
    Math.ceil(maxPokemons / requestParams.limit)
    , [maxPokemons, requestParams.limit]);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-rows-1 grid-cols-2">
        <div>
          <label htmlFor='limit'>Pokemons limit</label>
          <input value={requestParams.limit} onChange={(event) => {
            setRequestParams({ limit: +event.target.value });
          }} name='limit' min={0} max={maxPokemons} type='number' />
        </div>
        <div>
          <label htmlFor='page'>Pokemons page</label>
          <input value={currentPage} onChange={(event) => {
            const offset = +event.target.value * requestParams.limit;
            setRequestParams({ offset });
          }} name='page' type='number' min={0} max={lastPage} />
        </div>
      </div>
      {pipe(
        fetchedPokemonsList,
        O.map((pokemons) =>
          match(pokemons)
            .with({ type: 'fullfiled' }, ({ value }) => value === null ? 'No pokemons' : <PokemonsList pokemons={value} />)
            .with({ type: 'pending' }, () => 'Loading...')
            .with({ type: 'failed', error: { type: 'ZOD_PARSE_ERROR' } }, () => "Couldn't parse response")
            .with({ type: 'failed', error: { type: 'NETWORK_ERROR' } }, () => "Network error")
            .with({ type: 'failed', error: { type: 'JSON_PARSE_ERROR' } }, () => "Couldn't parse json")
            .with({ type: 'failed', error: { type: 'REQUEST_ERROR' } }, () => "Can't create\\send request")
            .with({ type: 'failed', error: { type: 'NO_ERROR' } }, () => "Shouldn't be here")
            .exhaustive()
        ),
        O.getOrElse(() => 'Couldn\'t fetch pokemons')
      )}
    </div>
  )
}

export default App
