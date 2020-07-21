import * as React from 'react';
const { useEffect, useCallback, useState } = React;

import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Theme, makeStyles } from '@material-ui/core/styles';

import * as fs from 'fs';
import * as path from 'path';

import { remote } from 'electron';
const { dialog } = remote;

import { DirGrid, Direction } from './dir-grid';
import { ImageView } from './image-view';

import { useReaddir, useWindowEvent } from './util';
import { useAsyncReducer } from './async-reducer';

const useStyles = makeStyles((theme: Theme) => ({
	root: {
		color: theme.palette.text.primary,
		background: theme.palette.background.default,
		display: 'flex',
		flexDirection: 'column',
		height: '100%',
	},
	appView: {
		gridTemplateColumns: '10em auto 10em',
		gridTemplateRows: '8em auto 8em',
		height: 0,
		flex: 'auto',
	},
	destinationWrapper: {
		textAlign: 'center',
	},
	destinationLabel: {
		padding: theme.spacing(1),
		overflow: 'hidden',
		whiteSpace: 'nowrap',
		textOverflow: 'ellipsis',
		height: '1.5em',
	},
	statusBar: {
		background: theme.palette.background.paper,
		padding: theme.spacing(1),
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	},
}));

interface Destination {
	path: string;
}

interface Config {
	path: string;
	dests: {
		[key in Direction]?: Destination;
	};
}

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
	initialized?: symbol;
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
		try {
			const stats = await fs.promises.stat(cur);
			if (stats.isFile()) {
				return { ...state, index };
			}
		} catch (e) {}
	}

	return null;
}

async function reducer(state: State, action: Action): Promise<State> {
	switch (action.type) {
		case 'config-dest':
			const dests = { ...state.config.dests, [action.dir]: action.dest };
			const config = { ...state.config, dests };
			return { ...state, config };

		case 'undo':
			return undo(state);

		case 'move':
			const { files, index } = state;
			const file = files[index];
			const dest = state.config.dests[action.dir]?.path;
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
	const styles = useStyles();

	const destination = config.dests[dir];

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
		<div className={styles.destinationWrapper}>
			<Typography className={styles.destinationLabel}>{label}</Typography>
			<Button variant='outlined' onClick={onClick}>
				Browse...
			</Button>
		</div>
	);
}

const initialConfig: Config = {
	path: remote.getGlobal('sourcePath'),
	dests: {},
};

export function App(): JSX.Element | null {
	const styles = useStyles();

	const [epoch, setEpoch] = useState(Symbol());
	const [state, dispatch, , reset] = useAsyncReducer(reducer, {
		config: initialConfig,
		files: [],
		index: -1,
		status: 'Loading...',
	});
	const initialFiles = useReaddir(state.config.path, [epoch]);

	useEffect(() => {
		if (initialFiles && state.initialized !== epoch) {
			reset({
				...state,
				initialized: epoch,
				files: initialFiles,
				status: `Found ${initialFiles.length} files in directory ${state.config.path}`,
			});
			dispatch({ type: 'navigation', nav: 'begin' });
		}
	}, [epoch, state, dispatch, reset, initialFiles]);

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
				case 'KeyS':
				case 'Numpad5':
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
				case 'KeyQ':
				case 'Numpad7':
					dir = 'nw';
					break;
				case 'ArrowUp':
				case 'KeyW':
				case 'Numpad8':
					dir = 'n';
					break;
				case 'KeyE':
				case 'Numpad9':
					dir = 'ne';
					break;
				case 'ArrowLeft':
				case 'KeyA':
				case 'Numpad4':
					dir = 'w';
					break;
				case 'ArrowRight':
				case 'KeyD':
				case 'Numpad6':
					dir = 'e';
					break;
				case 'KeyZ':
				case 'Numpad1':
					dir = 'sw';
					break;
				case 'ArrowDown':
				case 'KeyX':
				case 'Numpad2':
					dir = 's';
					break;
				case 'KeyC':
				case 'Numpad3':
					dir = 'se';
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
				case 'F5':
					setEpoch(Symbol());
					reset({
						...state,
						files: [],
						index: -1,
						status: 'Loading...',
						undo: undefined,
					});
					break;
				default:
					return;
			}

			ev.preventDefault();
		},
		[state, dispatch, reset],
	);

	const keyHandler = useCallback(
		(ev: KeyboardEvent) => {
			if (ev.altKey || ev.shiftKey || ev.metaKey || ev.ctrlKey || ev.isComposing) {
				return;
			}

			handleNavigate(ev);
			handleMove(ev);
			handleControl(ev);
		},
		[handleNavigate, handleMove, handleControl],
	);
	useWindowEvent('keydown', keyHandler);

	let currentImage = null;
	if (file != null) currentImage = path.join(state.config.path, file);

	const dirChoosers: {
		[key in Direction]?: JSX.Element;
	} = {};

	const directions: Direction[] = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
	for (const dir of directions) {
		dirChoosers[dir] = <DestinationChooser dir={dir} config={state.config} dispatch={dispatch} />;
	}

	return (
		<div className={styles.root}>
			<DirGrid className={styles.appView} {...dirChoosers}>
				{currentImage && <ImageView key={currentImage} path={currentImage} />}
			</DirGrid>
			<Typography className={styles.statusBar}>{state.status}</Typography>
		</div>
	);
}
