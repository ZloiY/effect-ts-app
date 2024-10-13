import React, { ReactNode } from "react";

type BaseCardProps = {
  onClick?: () => void;
  children: ReactNode
}

export const BaseCard: React.FC<BaseCardProps> = (props) =>
  <div onClick={props.onClick} className="flex flex-col grow-1 justify-between px-4 py-3 b-2 b-bluegray b-solid b-rd-md cursor-pointer">
    {props.children}
  </div>
