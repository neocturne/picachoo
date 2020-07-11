import * as React from 'react';
const { useReducer, useCallback } = React;

interface AsyncState<S, A> {
	asyncState: S;
	pending: boolean;
	actionQueue: AsyncActionDispatch<S, A>[];
}

interface AsyncActionDispatch<S, A> {
	action: 'dispatch';
	asyncReducer: (state: S, action: A) => Promise<S>;
	asyncAction: A;
	dispatch: (action: AsyncAction<S, A>) => void;
}

interface AsyncActionCancel {
	action: 'cancel';
}

interface AsyncActionUpdate<S> {
	action: 'update';
	newState: S;
}

type AsyncAction<S, A> = AsyncActionDispatch<S, A> | AsyncActionUpdate<S> | AsyncActionCancel;

function reducer<S, A>(state: AsyncState<S, A>, action: AsyncAction<S, A>): AsyncState<S, A> {
	switch (action.action) {
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
					action.dispatch({ action: 'update', newState });
				} catch (e) {
					action.dispatch({ action: 'cancel' });
					throw e;
				}
			})();
			return { ...state, pending: true };
	}
}

export function useAsyncReducer<S, A>(
	asyncReducer: (state: S, action: A) => Promise<S>,
	initialState: S,
): [S, boolean, (action: A) => void] {
	const initialAsyncState: AsyncState<S, A> = { asyncState: initialState, pending: false, actionQueue: [] };
	const [state, dispatch] = useReducer<(state: AsyncState<S, A>, action: AsyncAction<S, A>) => AsyncState<S, A>>(
		reducer,
		initialAsyncState,
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

	return [state.asyncState, state.pending, asyncDispatch];
}
