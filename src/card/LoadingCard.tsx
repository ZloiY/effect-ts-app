import { PokemonName } from "@api/use-fetch-pokemons";
import { BaseCard } from "./BaseCard";

export const LoadingCard = (props: { name?: PokemonName }) => <BaseCard>
  <div className="w-xs aspect-square b-rd-2xl b-8 b-solid b-black animate-spin"></div>
  <p>{props.name}</p>
</BaseCard>
