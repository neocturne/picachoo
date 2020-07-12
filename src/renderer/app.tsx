import * as React from 'react';
const { useEffect, useCallback } = React;

import * as fs from 'fs';
import * as path from 'path';

import { remote } from 'electron';
const { dialog } = remote;

import { DirGrid } from './dir-grid';
import { ImageView } from './image-view';

import { useReaddir, useWindowEvent } from './util';
import { useAsyncReducer } from './async-reducer';

interface Destination {
	path: string;
}

interface Config {
	path: string;
	left?: Destination;
	up?: Destination;
	right?: Destination;
	down?: Destination;
}

type Direction = 'left' | 'up' | 'right' | 'down';

type MoveAction = {
	type: 'move';
	dir: Direction;
};

type UndoAction = {
	type: 'undo';
};

type Navigation = 'begin' | 'end' | 'next' | 'prev';

type NavigationAction = {
	type: 'navigation';
	nav: Navigation;
};

type ConfigDestAction = {
	type: 'config-dest';
	dir: Direction;
	dest: Destination;
};

type Action = MoveAction | UndoAction | NavigationAction | ConfigDestAction;

interface Undo {
	file: string;
	src: string;
	dest: string;
	index: number;
	prev?: Undo;
}

interface State {
	initialized: boolean;
	config: Config;
	files: (string | undefined)[];
	index: number;
	undo?: Undo;
	status: string;
}

async function moveFile(file: string, src: string, dest: string): Promise<void> {
	const srcpath = path.join(src, file);
	const destpath = path.join(dest, file);
	await fs.promises.rename(srcpath, destpath);
}

async function undo(state: State): Promise<State> {
	const { undo } = state;
	if (!undo) return state;

	const { file, src, dest, index, prev } = undo;

	const prevFiles = state.files.slice(0);
	prevFiles[index] = file;

	await moveFile(file, dest, src);

	return { ...state, files: prevFiles, undo: prev, index: index, status: `Undid move of ${file} to ${dest}` };
}

async function navigate(state: State, start: number, dir: -1 | 1): Promise<State | null> {
	for (let index = start; index >= 0 && index < state.files.length; index += dir) {
		const file = state.files[index];
		if (!file) continue;

		const cur = path.join(state.config.path, file);
		const stats = await fs.promises.stat(cur);
		if (stats.isFile()) {
			return { ...state, index };
		}
	}

	return null;
}

async function reducer(state: State, action: Action): Promise<State> {
	switch (action.type) {
		case 'config-dest':
			const config = { ...state.config, [action.dir]: action.dest };
			return { ...state, config };

		case 'undo':
			return undo(state);

		case 'move':
			const { files, index } = state;
			const file = files[index];
			const dest = state.config[action.dir]?.path;
			if (!file || !dest) {
				return state;
			}

			const src = state.config.path;
			await moveFile(file, src, dest);

			const newFiles = files.slice(0);
			delete newFiles[index];

			const newUndo: Undo = {
				file,
				src,
				dest,
				index,
				prev: state.undo,
			};

			state = {
				...state,
				files: newFiles,
				undo: newUndo,
				status: `Moved ${file} to directory ${dest}`,
			};

			return (await navigate(state, index, 1)) ?? (await navigate(state, index - 1, -1)) ?? state;

		case 'navigation':
			let start: number, dir: -1 | 1;
			switch (action.nav) {
				case 'begin':
					start = 0;
					dir = 1;
					break;
				case 'end':
					start = state.files.length - 1;
					dir = -1;
					break;
				case 'next':
					start = state.index + 1;
					dir = 1;
					break;
				case 'prev':
					start = state.index - 1;
					dir = -1;
					break;
			}

			return (await navigate(state, start, dir)) ?? state;
	}
}

interface DestinationChooserProps {
	dir: Direction;
	config: Config;
	dispatch: (action: Action) => void;
}

function DestinationChooser({ dir, config, dispatch }: DestinationChooserProps): JSX.Element {
	const destination = config[dir];

	const onClick = useCallback(() => {
		(async () => {
			const res = await dialog.showOpenDialog(remote.getCurrentWindow(), {
				defaultPath: destination?.path,
				properties: ['openDirectory'],
			});
			if (!res.canceled && res.filePaths[0]) {
				dispatch({ type: 'config-dest', dir, dest: { path: res.filePaths[0] } });
			}
		})();
	}, [destination, dir, dispatch]);

	let label;
	if (destination) {
		label = path.basename(destination.path);
	}

	return (
		<div style={{ textAlign: 'center' }}>
			<div style={{ padding: '0.5em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
			<button onClick={onClick}>Browse...</button>
		</div>
	);
}

const initialConfig: Config = {
	path: remote.getGlobal('sourcePath'),
};

export function App(): JSX.Element | null {
	const [state, dispatch, , reset] = useAsyncReducer(reducer, {
		initialized: false,
		config: initialConfig,
		files: [],
		index: -1,
		status: 'Loading...',
	});
	const initialFiles = useReaddir(state.config.path);

	useEffect(() => {
		if (initialFiles && !state.initialized) {
			reset({
				...state,
				initialized: true,
				files: initialFiles,
				status: `Found ${initialFiles.length} files in directory ${state.config.path}`,
			});
			dispatch({ type: 'navigation', nav: 'begin' });
		}
	}, [dispatch, reset, state, initialFiles]);

	const file = state.files[state.index];

	const handleNavigate = useCallback(
		(ev: KeyboardEvent) => {
			let nav: Navigation;
			switch (ev.code) {
				case 'Home':
					nav = 'begin';
					break;
				case 'End':
					nav = 'end';
					break;
				case 'PageUp':
					nav = 'prev';
					break;
				case 'PageDown':
				case 'Space':
					nav = 'next';
					break;
				default:
					return;
			}

			ev.preventDefault();
			dispatch({ type: 'navigation', nav });
		},
		[dispatch],
	);

	const handleMove = useCallback(
		(ev: KeyboardEvent) => {
			let dir: Direction;
			switch (ev.code) {
				case 'ArrowLeft':
					dir = 'left';
					break;
				case 'ArrowUp':
					dir = 'up';
					break;
				case 'ArrowRight':
					dir = 'right';
					break;
				case 'ArrowDown':
					dir = 'down';
					break;
				default:
					return;
			}

			ev.preventDefault();
			dispatch({ type: 'move', dir });
		},
		[dispatch],
	);

	const handleControl = useCallback(
		(ev: KeyboardEvent) => {
			switch (ev.code) {
				case 'Backspace':
					dispatch({ type: 'undo' });
					break;
				default:
					return;
			}

			ev.preventDefault();
		},
		[dispatch],
	);

	const keyHandler = useCallback(
		(ev: KeyboardEvent) => {
			handleNavigate(ev);
			handleMove(ev);
			handleControl(ev);
		},
		[handleNavigate, handleMove, handleControl],
	);
	useWindowEvent('keydown', keyHandler);

	let currentImage = null;
	if (file != null) currentImage = path.join(state.config.path, file);

	return (
		<>
			<DirGrid
				className='app-view'
				left={<DestinationChooser dir='left' config={state.config} dispatch={dispatch} />}
				top={<DestinationChooser dir='up' config={state.config} dispatch={dispatch} />}
				right={<DestinationChooser dir='right' config={state.config} dispatch={dispatch} />}
				bottom={<DestinationChooser dir='down' config={state.config} dispatch={dispatch} />}
			>
				{currentImage && <ImageView key={currentImage} path={currentImage} />}
			</DirGrid>
			<div className='status-bar'>{state.status}</div>
		</>
	);
}
