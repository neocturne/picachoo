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

type Action = MoveAction | NavigationAction | ConfigDestAction;

interface State {
	config: Config;
	files: (string | undefined)[];
	index: number;
}

async function moveFile(config: Config, file: string, dest: string): Promise<void> {
	const srcpath = path.join(config.path, file);
	const destpath = path.join(dest, file);
	console.log(`Moving ${srcpath} -> ${destpath}`);
	await fs.promises.rename(srcpath, destpath);
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

		case 'move':
			const { files, index } = state;
			const file = files[index];
			const dest = state.config[action.dir]?.path;
			if (!file || !dest) {
				return state;
			}

			await moveFile(state.config, file, dest);

			const newFiles = files.slice(0);
			delete newFiles[index];
			state = { ...state, files: newFiles };

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
		config: initialConfig,
		files: [],
		index: -1,
	});
	const initialFiles = useReaddir(state.config.path);

	useEffect(() => {
		if (initialFiles) {
			reset({ config: initialConfig, files: initialFiles, index: -1 });
			dispatch({ type: 'navigation', nav: 'begin' });
		}
	}, [dispatch, reset, initialFiles]);

	const file = state.files[state.index];

	const navigate = useCallback(
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

	const move = useCallback(
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

	const keyHandler = useCallback(
		(ev: KeyboardEvent) => {
			navigate(ev);
			move(ev);
		},
		[navigate, move],
	);
	useWindowEvent('keydown', keyHandler);

	let currentImage = null;
	if (file != null) currentImage = path.join(state.config.path, file);

	return (
		<DirGrid
			className='app-view'
			left={<DestinationChooser dir='left' config={state.config} dispatch={dispatch} />}
			top={<DestinationChooser dir='up' config={state.config} dispatch={dispatch} />}
			right={<DestinationChooser dir='right' config={state.config} dispatch={dispatch} />}
			bottom={<DestinationChooser dir='down' config={state.config} dispatch={dispatch} />}
		>
			{currentImage && <ImageView key={currentImage} path={currentImage} />}
		</DirGrid>
	);
}
