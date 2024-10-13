import { useEffect, useMemo, useReducer } from "react";
import { PokemonName, PokemonsList as PokemonsListT, PokemonUrl } from "../api/use-fetch-pokemons"
import { CompoundCard } from "../card/CompoundCard";
import { match } from "ts-pattern";
import { isSet } from "effect/Predicate";

type FetchPokemonsParams = {
  limit: number;
  offset: number;
}

type PokemonsListParams = {
  pokemons: PokemonsListT;
}

type PokemonsReducerActions =
  | {
    type: 'SELECT_POKEMON';
    payload: { index: number; isSelected: boolean };
  }
  | {
    type: 'SET_LIST';
    payload: PokemonsListT['results'];
  };

type PokemonWithSelect = {
  isSelected: boolean;
  name: PokemonName;
  url: PokemonUrl;
}

const pokemonsReducer = (state: PokemonWithSelect[], action: PokemonsReducerActions) => match(action)
  .with(({ type: 'SELECT_POKEMON' }), ({ payload }) => state.map((pokemon, index) => {
    if (index === payload.index) {
      return { ...pokemon, isSelected: payload.isSelected }
    }
    return pokemon
  }))
  .with(({ type: 'SET_LIST' }), ({ payload }) => payload.map((pokemon) => ({ isSelected: false, ...pokemon })))
  .exhaustive();
export const PokemonsList = (props: PokemonsListParams) => {
  const [pokemonsWithSelect, dispatch] = useReducer(pokemonsReducer, [] as PokemonWithSelect[]);

  useEffect(() => {
    dispatch({ type: 'SET_LIST', payload: props.pokemons.results });
  }, [props.pokemons.results]);

  const selectePokemon = (index: number) => (isSelected: boolean) => {
    dispatch({ type: 'SELECT_POKEMON', payload: { index, isSelected } })
  }

  return (
    <div className="grid grid-cols-5 gap-4">{
      pokemonsWithSelect.map((pokemon, index) => <CompoundCard toggleSelected={selectePokemon(index)} {...pokemon} />)
    }</div>
  )
}
