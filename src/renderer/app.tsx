import * as React from 'react';
const { useState, useCallback } = React;

import * as fileUrl from 'file-url';

import * as path from 'path';

import { DirGrid } from './dir-grid';
import { ImageView } from './image-view';

import { useReaddir, useWindowEvent } from './util';

export interface Config {
	path: string;
	left?: string;
	top?: string;
	right?: string;
	bottom?: string;
}

export interface AppProps {
	config: Config;
}

export function App({ config }: AppProps): JSX.Element {
	const [index, setIndex] = useState(0);
	const files = useReaddir(config.path);

	const keyHandler = useCallback(
		(ev: KeyboardEvent) => {
			if (!files) return;

			let newIndex;
			switch (ev.code) {
				case 'Home':
					newIndex = 0;
					break;
				case 'End':
					newIndex = files.length - 1;
					break;
				case 'PageUp':
					newIndex = index - 1;
					break;
				case 'PageDown':
					newIndex = index + 1;
					break;
				default:
					return;
			}

			ev.preventDefault();

			if (files[newIndex] != null) setIndex(newIndex);
		},
		[index, files],
	);
	useWindowEvent('keydown', keyHandler);

	const file = files?.[index];
	let currentImage = null;
	if (file != null) {
		const file1path = path.join(config.path, file);
		currentImage = fileUrl(file1path);
	}
	return (
		<DirGrid
			className='app-view'
			left={config.left}
			top={config.top}
			right={config.right}
			bottom={config.bottom}
		>
			{currentImage && <ImageView key={currentImage} url={currentImage} />}
		</DirGrid>
	);
}
