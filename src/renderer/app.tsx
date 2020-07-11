import * as React from 'react';
const { useEffect, useCallback } = React;

import * as fs from 'fs';
import * as path from 'path';

import { DirGrid } from './dir-grid';
import { ImageView } from './image-view';

import { useReaddir, useWindowEvent } from './util';
import { useAsyncReducer } from './async-reducer';

export interface Destination {
	path: string;
	label: string;
}

export interface Config {
	path: string;
	left?: Destination;
	up?: Destination;
	right?: Destination;
	down?: Destination;
}

type Direction = 'left' | 'up' | 'right' | 'down';

type MoveAction = {
	action: 'move';
	dir: Direction;
};

type Navigation = 'begin' | 'end' | 'next' | 'prev';

type NavigationAction = {
	action: 'navigation';
	nav: Navigation;
};

type Action = MoveAction | NavigationAction;

interface State {
	config: Config;
	files: string[];
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
		const cur = path.join(state.config.path, state.files[index]);
		const stats = await fs.promises.stat(cur);
		if (stats.isFile()) {
			return { ...state, index };
		}
	}

	return null;
}

async function reducer(state: State, action: Action): Promise<State> {
	if (action.action === 'move') {
		const { files, index } = state;
		const file: string | undefined = files[index];
		const dest = state.config[action.dir]?.path;
		if (!file || !dest) {
			return state;
		}

		await moveFile(state.config, file, dest);
		state = { ...state, files: [...files.slice(0, index), ...files.slice(index + 1)] };
		return (await navigate(state, index, 1)) ?? (await navigate(state, index - 1, -1)) ?? state;
	}

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

interface FileOrganizerProps {
	config: Config;
	files: string[];
}

function FileOrganizer({ config, files: initialFiles }: FileOrganizerProps): JSX.Element {
	const [state, dispatch] = useAsyncReducer(reducer, { config, files: initialFiles, index: -1 });

	useEffect(() => {
		dispatch({ action: 'navigation', nav: 'begin' });
	}, [dispatch]);

	const file: string | undefined = state.files[state.index];

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
			dispatch({ action: 'navigation', nav });
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
			dispatch({ action: 'move', dir });
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
	if (file != null) currentImage = path.join(config.path, file);

	return (
		<DirGrid
			className='app-view'
			left={config.left?.label}
			top={config.up?.label}
			right={config.right?.label}
			bottom={config.down?.label}
		>
			{currentImage && <ImageView key={currentImage} path={currentImage} />}
		</DirGrid>
	);
}

export interface AppProps {
	config: Config;
}

export function App({ config }: AppProps): JSX.Element | null {
	const files = useReaddir(config.path);

	return files ? <FileOrganizer config={config} files={files} /> : null;
}
