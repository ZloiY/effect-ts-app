import { Effect, pipe, flow, Cause } from 'effect';
import * as A from 'effect/Array';
import * as R from 'effect/Record';
import * as Exit from 'effect/Exit';
import { useCallback } from "react";
import { ERRORS } from '../constants';

export type FetchErrors = {
	type: typeof ERRORS.NETWORK_ERROR | typeof ERRORS.REQUEST_ERROR | typeof ERRORS.JSON_PARSE_ERROR,
	message: string,
}
	| { type: 'NO_ERROR' };

export const convertObjectToQuery = (queryParams: Record<string, string | number>) =>
	pipe(
		queryParams,
		R.toEntries,
		A.map(([key, value]) => `${key}=${value}`),
	).join('&');

const safeFetch = (...args: Parameters<typeof fetch>) =>
	Effect.tryPromise({
		try: () => fetch(...args),
		catch: (err: unknown) => ({ type: ERRORS.NETWORK_ERROR, message: `Network error. ${err}` })
	});

const isResponseOk = (effect: Effect.Effect<Response, { type: typeof ERRORS.NETWORK_ERROR, message: string }, never>) =>
	pipe(
		effect,
		Effect.flatMap((response) => {
			if (response.ok) {
				return Effect.succeed(response);
			}
			return Effect.fail({ type: ERRORS.REQUEST_ERROR, message: `Error during request. Status code ${response.status}` })
		})
	);

const parseToJson = (effect: Effect.Effect<Response, { type: typeof ERRORS.NETWORK_ERROR | typeof ERRORS.REQUEST_ERROR, message: string }, never>): Effect.Effect<unknown, FetchErrors, never> =>
	pipe(
		effect,
		Effect.flatMap((response) =>
			Effect.tryPromise({
				try: () => response.json() as Promise<unknown>,
				catch: (err: unknown) => ({ type: ERRORS.JSON_PARSE_ERROR, message: `Error during json parsing. ${err}` })
			})
		)
	);

export const useFetch = () => {
	return useCallback(
		flow(
			safeFetch,
			isResponseOk,
			parseToJson,
		), []);
};

export type FailedResponse<T extends { type: string, message?: string }> = { type: 'failed', error: T | FetchErrors };
export type PendingResponse = { type: 'pending' };
export type FullFiledResponse<V> = { type: 'fullfiled', value: V };

export const FetchErrorCauseMatch = <T extends { type: string, message?: string }>(cause: Cause.Cause<FetchErrors | T>) =>
	Cause.match(cause, {
		onFail: (error) => error as FetchErrors | T,
		onDie: () => ({ type: 'NO_ERROR' } as FetchErrors | T),
		onInterrupt: () => ({ type: 'NO_ERROR' } as FetchErrors | T),
		onParallel: (left) => left,
		onSequential: (left) => left,
		onEmpty: { type: 'NO_ERROR' } as FetchErrors | T,
	})

export const ExitMatchWrapper = <T extends { type: string, message?: string }, V>(effect: Exit.Exit<null | V, T>) =>
	Exit.match({
		onFailure: (cause) => ({
			type: 'failed',
			error: FetchErrorCauseMatch(cause as Cause.Cause<FetchErrors | T>)
		} as FailedResponse<T>),
		onSuccess: (value) => {
			if (value === null) {
				return { type: 'pending' } as PendingResponse;
			}
			return { type: 'fullfiled', value } as FullFiledResponse<V | null>;
		}
	})(effect)

