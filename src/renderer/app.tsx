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

export function App({ config }: AppProps): JSX.Element {
	const [index, setIndex] = useState(-1);
	const files = useReaddir(config.path);
	const file = files?.[index];

	const [nav, setNav] = useState<[number, -1 | 1]>([0, 1]);

	const getNewIndex = useCallback(async () => {
		if (!files) return null;

		const [start, dir] = nav;
		if (start === index) return null;

		for (let newIndex = start; newIndex >= 0 && newIndex < files.length; newIndex += dir) {
			const cur = path.join(config.path, files[newIndex]);
			const stats = await fs.promises.stat(cur);
			if (stats.isFile()) return newIndex;
		}

		return null;
	}, [files, index, nav, config.path]);
	const newIndex = usePromise(getNewIndex);
	if (newIndex != null && newIndex !== index) setIndex(newIndex);

	const navigate = useCallback(
		(ev: KeyboardEvent) => {
			if (!files) return;

			switch (ev.code) {
				case 'Home':
					setNav([0, 1]);
					break;
				case 'End':
					setNav([files.length - 1, -1]);
					break;
				case 'PageUp':
					setNav([index - 1, -1]);
					break;
				case 'PageDown':
				case 'Space':
					setNav([index + 1, 1]);
					break;
				default:
					return;
			}

			ev.preventDefault();
		},
		[files, index],
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
