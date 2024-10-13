import { FC } from "react";
import { PokemonName } from "@api/use-fetch-pokemons";
import { BaseCard } from "./BaseCard";
import { Url } from "@api/utils";

interface PreviewCardProps {
  name: PokemonName,
  imageUrl?: Url,
  onSelect: (isSelected: boolean) => void,
  isSelected: boolean,
}

export const PreviewCard: FC<PreviewCardProps> = (props) => {
  return (
    <BaseCard onClick={() => props.onSelect(!props.isSelected)}>
      <img className="w-[10rem] h-[10rem]" src={props.imageUrl} alt={props.name} />
      <p>{props.name}</p>
    </BaseCard>
  );
};
