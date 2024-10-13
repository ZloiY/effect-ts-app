import { Pokemon } from "@api/use-fetch-pokemon"
import { BaseCard } from "./BaseCard"

type DetailsCardProps = {
  pokemon: Pokemon;
  onSelect: (isSelected: boolean) => void;
  isSelected: boolean;
}

export const DetailsCard = (props: DetailsCardProps) => {
  return (
    <BaseCard onClick={() => props.onSelect(!props.isSelected)}>
      <div className="flex flex-col grow-1 whitespace-nowrap">
        <div className="flex justify-between">
          <div className="flex justify-center">
            <img className="w-[5rem] h-[5rem]" src={props.pokemon.sprites} alt={props.pokemon.name} />
          </div>
          <div className="flex flex-col max-w-[4rem] gap-3 justify-between">
            <span className="text-wrap text-start">Name: {props.pokemon.name}</span>
            <span className="text-wrap text-start">Height: {props.pokemon.height}</span>
            <span className="text-wrap text-start">Weight: {props.pokemon.weight}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          <span>Abilities:</span>
          {props.pokemon.abilities.map((ability) => (
            <span>{ability}</span>
          ))}
        </div>
        <div className="grid grid-cols-3 grid-rows-2 gap-2">
          {props.pokemon.stats.map((ability) => (
            <span className="text-wrap">{ability.stat}: {ability.base_stat}</span>
          ))}
        </div>
      </div>
    </BaseCard>
  )
}
