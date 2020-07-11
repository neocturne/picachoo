import * as React from 'react';
const { useCallback } = React;

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

type NavigationAction = {
	action: 'begin' | 'end' | 'next' | 'prev';
	files: string[];
};

interface NavigationState {
	config: Config;
	index: number;
}

async function navigationReducer(state: NavigationState, action: NavigationAction): Promise<NavigationState> {
	let start: number, dir: -1 | 1;
	switch (action.action) {
		case 'begin':
			start = 0;
			dir = 1;
			break;
		case 'end':
			start = action.files.length - 1;
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

	for (let index = start; index >= 0 && index < action.files.length; index += dir) {
		const cur = path.join(state.config.path, action.files[index]);
		const stats = await fs.promises.stat(cur);
		if (stats.isFile()) {
			return { ...state, index };
		}
	}

	return state;
}

interface FileOrganizerProps {
	config: Config;
	files: string[];
}

function FileOrganizer({ config, files }: FileOrganizerProps): JSX.Element {
	const [state, pending, dispatch] = useAsyncReducer(navigationReducer, { config, index: -1 });
	if (state.index === -1 && !pending) {
		dispatch({ action: 'begin', files });
	}

	const file: string | undefined = files[state.index];

	const navigate = useCallback(
		(ev: KeyboardEvent) => {
			switch (ev.code) {
				case 'Home':
					dispatch({ action: 'begin', files });
					break;
				case 'End':
					dispatch({ action: 'end', files });
					break;
				case 'PageUp':
					dispatch({ action: 'prev', files });
					break;
				case 'PageDown':
				case 'Space':
					dispatch({ action: 'next', files });
					break;
				default:
					return;
			}

			ev.preventDefault();
		},
		[dispatch, files],
	);

	const move = useCallback(
		(ev: KeyboardEvent) => {
			if (!file) return;

			let dest: 'left' | 'up' | 'right' | 'down';
			switch (ev.code) {
				case 'ArrowLeft':
					dest = 'left';
					break;
				case 'ArrowUp':
					dest = 'up';
					break;
				case 'ArrowRight':
					dest = 'right';
					break;
				case 'ArrowDown':
					dest = 'down';
					break;
				default:
					return;
			}
			const destPath = config[dest]?.path;
			console.log(destPath);

			ev.preventDefault();
		},
		[file, config],
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
