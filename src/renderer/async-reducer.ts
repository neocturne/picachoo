import * as React from 'react';
const { useReducer, useCallback } = React;

interface AsyncState<S, A> {
	asyncState: S;
	pending: boolean;
	epoch: symbol;
	actionQueue: AsyncActionDispatch<S, A>[];
}

interface AsyncActionDispatch<S, A> {
	action: 'dispatch';
	asyncReducer: (state: S, action: A) => Promise<S>;
	asyncAction: A;
	dispatch: (action: AsyncAction<S, A>) => void;
}

interface AsyncActionUpdate<S> {
	action: 'update';
	epoch: symbol;
	newState: S;
}

interface AsyncActionCancel {
	action: 'cancel';
	epoch: symbol;
}

interface AsyncActionReset<S> {
	action: 'reset';
	newState: S;
}

type AsyncAction<S, A> = AsyncActionDispatch<S, A> | AsyncActionUpdate<S> | AsyncActionCancel | AsyncActionReset<S>;

function initialAsyncState<S, A>(state: S): AsyncState<S, A> {
	return { asyncState: state, pending: false, epoch: Symbol(), actionQueue: [] };
}

function reducer<S, A>(state: AsyncState<S, A>, action: AsyncAction<S, A>): AsyncState<S, A> {
	if (action.action === 'update' || action.action === 'cancel') {
		if (action.epoch !== state.epoch) {
			return state;
		}
	}

	switch (action.action) {
		case 'reset':
			return initialAsyncState(action.newState);

		case 'update':
			state = { ...state, asyncState: action.newState };

		/* Fallthrough */
		case 'cancel':
			state = { ...state, pending: false };

			if (state.actionQueue.length === 0) return state;

			action = state.actionQueue[0];
			state = { ...state, actionQueue: state.actionQueue.slice(1) };

		/* Fallthrough */
		case 'dispatch':
			if (state.pending) {
				return {
					...state,
					actionQueue: [...state.actionQueue, action],
				};
			}

			(async () => {
				try {
					const newState = await action.asyncReducer(
						state.asyncState,
						action.asyncAction,
					);
					action.dispatch({ action: 'update', epoch: state.epoch, newState });
				} catch (e) {
					action.dispatch({ action: 'cancel', epoch: state.epoch });
					throw e;
				}
			})();
			return { ...state, pending: true };
	}
}

export function useAsyncReducer<S, A>(
	asyncReducer: (state: S, action: A) => Promise<S>,
	initialState: S,
): [S, boolean, (action: A) => void, (state: S) => void] {
	const [state, dispatch] = useReducer<(state: AsyncState<S, A>, action: AsyncAction<S, A>) => AsyncState<S, A>>(
		reducer,
		initialAsyncState(initialState),
	);

	const asyncDispatch = useCallback(
		(action: A) => {
			dispatch({
				action: 'dispatch',
				asyncReducer,
				asyncAction: action,
				dispatch,
			});
		},
		[asyncReducer],
	);

	const reset = useCallback((state: S) => {
		dispatch({
			action: 'reset',
			newState: state,
		});
	}, []);

	return [state.asyncState, state.pending, asyncDispatch, reset];
}
