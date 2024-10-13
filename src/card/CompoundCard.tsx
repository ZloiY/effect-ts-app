import { useFetchPokemon } from "@api/use-fetch-pokemon"
import { PokemonName, PokemonUrl } from "@api/use-fetch-pokemons"
import { PreviewCard } from "./PreviewCard";
import { Option, pipe } from "effect";
import { match } from "ts-pattern";
import { LoadingCard } from "./LoadingCard";
import { ErrorCard } from "./ErrorCard";
import { DetailsCard } from "./DetailsCard";

type CompoundCardProps = {
  name: PokemonName,
  url: PokemonUrl,
  isSelected: boolean,
  toggleSelected: (isSelected: boolean) => void,
}

export const CompoundCard = (props: CompoundCardProps) => {
  const pokemon = useFetchPokemon(props.url);

  return pipe(
    pokemon,
    Option.map((data) => match(data)
      .with(({ type: 'fullfiled' }), (response) => props.isSelected ?
        <DetailsCard isSelected={props.isSelected} onSelect={props.toggleSelected} pokemon={response.value!} /> :
        <PreviewCard
          onSelect={props.toggleSelected}
          isSelected={props.isSelected}
          name={props.name}
          imageUrl={response.value?.sprites}
        />)
      .with(({ type: 'pending' }), () => <LoadingCard />)
      .with(({ type: 'failed' }), (cause) => <ErrorCard cause={cause} />)
      .exhaustive()),
    Option.getOrNull
  );
}
