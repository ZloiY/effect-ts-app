import { Cause, Exit } from "effect";
import { MyServerError } from "../types";

export type FailedPromise<T extends { type: string, message?: string }> = { type: 'failed', error: T | MyServerError };
export type PendingPromise = { type: 'pending' };
export type FullFiledPromise<V> = { type: 'fullfiled', value: V };

export const ServerErrorCauseMatch = <T extends { type: string, message?: string }>(cause: Cause.Cause<MyServerError | T>) =>
  Cause.match(cause, {
    onFail: (error) => error as MyServerError | T,
    onDie: () => ({ type: 'NO_ERROR' } as MyServerError | T),
    onInterrupt: () => ({ type: 'NO_ERROR' } as MyServerError | T),
    onParallel: (left) => left,
    onSequential: (left) => left,
    onEmpty: { type: 'NO_ERROR' } as MyServerError | T,
  })

export const ExitMatchWrapper = <T extends { type: string, message?: string }, V>(effect: Exit.Exit<null | V, T>) =>
  Exit.match({
    onFailure: (cause) => ({
      type: 'failed',
      error: ServerErrorCauseMatch(cause as Cause.Cause<MyServerError | T>)
    } as FailedPromise<T>),
    onSuccess: (value) => {
      if (value === null) {
        return { type: 'pending' } as PendingPromise;
      }
      return { type: 'fullfiled', value } as FullFiledPromise<V | null>;
    }
  })(effect)
