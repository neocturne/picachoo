import * as React from 'react';
const { useState, useCallback } = React;

import * as fs from 'fs';
import * as path from 'path';

import { DirGrid } from './dir-grid';
import { ImageView } from './image-view';

import { usePromise, useReaddir, useWindowEvent } from './util';

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

export interface AppProps {
	config: Config;
}

enum Navigation {
	BEGIN,
	END,
	NEXT,
	PREV,
}

export function App({ config }: AppProps): JSX.Element {
	const [index, setIndex] = useState(-1);
	const files = useReaddir(config.path);
	const file = files?.[index];

	const [nav, setNav] = useState<Navigation | null>(Navigation.BEGIN);
	const [navPending, setNavPending] = useState<Navigation[]>([]);

	if (nav == null && navPending.length > 0) {
		setNav(navPending[0]);
		setNavPending(navPending.slice(1));
	}

	const pushNav = useCallback(
		(push: Navigation) => {
			setNavPending([...navPending, push]);
		},
		[navPending],
	);

	const getNewIndex = useCallback(async () => {
		if (!files) return null;

		let start: number, dir: -1 | 1;
		switch (nav) {
			case Navigation.BEGIN:
				start = 0;
				dir = 1;
				break;
			case Navigation.END:
				start = files.length - 1;
				dir = -1;
				break;
			case Navigation.NEXT:
				start = index + 1;
				dir = 1;
				break;
			case Navigation.PREV:
				start = index - 1;
				dir = -1;
				break;

			default:
				return;
		}

		for (let newIndex = start; newIndex >= 0 && newIndex < files.length; newIndex += dir) {
			const cur = path.join(config.path, files[newIndex]);
			const stats = await fs.promises.stat(cur);
			if (stats.isFile()) return newIndex;
		}

		return null;
	}, [files, index, nav, config.path]);
	const newIndex = usePromise(getNewIndex);
	if (newIndex != null && newIndex !== index) {
		setIndex(newIndex);
		setNav(null);
	}

	const navigate = useCallback(
		(ev: KeyboardEvent) => {
			switch (ev.code) {
				case 'Home':
					pushNav(Navigation.BEGIN);
					break;
				case 'End':
					pushNav(Navigation.END);
					break;
				case 'PageUp':
					pushNav(Navigation.PREV);
					break;
				case 'PageDown':
				case 'Space':
					pushNav(Navigation.NEXT);
					break;
				default:
					return;
			}

			ev.preventDefault();
		},
		[pushNav],
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
			{files ? currentImage && <ImageView key={currentImage} path={currentImage} /> : 'Loading...'}
		</DirGrid>
	);
}
