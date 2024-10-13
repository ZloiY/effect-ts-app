import { FailedResponse } from "@hooks/use-fetch"
import { ZodError } from "@types/error"
import { BaseCard } from "./BaseCard"
import ErrorSvg from "@assets/error.svg?react"
import { match } from "ts-pattern"

type ErrorCardProps = {
  cause: FailedResponse<ZodError>
}

export const ErrorCard = (props: ErrorCardProps) => (
  <BaseCard>
    <ErrorSvg className="w-[10rem] h-[10rem]" />
    {match(props.cause.error)
      .with(({ type: 'NO_ERROR' }), () => 'Oops shouldn\'t be here')
      .otherwise(() => 'Something went wrong')
    }
  </BaseCard>
)
