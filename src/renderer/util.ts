import { useCallback, useEffect, useState } from 'react';

import * as fs from 'fs';
import * as path from 'path';

export function usePromise<T>(f: () => Promise<T>): T | null {
	const [value, setValue] = useState<[T, () => Promise<T>] | null>(null);

	useEffect(() => {
		let cancelled = false;

		(async (): Promise<void> => {
			const v = await f();
			if (!cancelled) {
				setValue([v, f]);
			}
		})();

		return (): void => {
			cancelled = true;
		};
	}, [f]);

	if (!value || value[1] !== f) {
		return null;
	}

	return value[0];
}

export function useReaddir(path: string): string[] | null {
	const readdir = useCallback(() => fs.promises.readdir(path), [path]);
	return usePromise(readdir);
}

export function useWindowEvent<K extends keyof WindowEventMap>(type: K, f: (ev: WindowEventMap[K]) => void): void {
	useEffect(() => {
		window.addEventListener(type, f);

		return () => {
			window.removeEventListener(type, f);
		};
	}, [type, f]);
}

export function isImage(file: string): boolean {
	const acceptedExtensions = ['.apng', '.bmp', '.gif', '.ico', '.jpg', '.jpeg', '.png', '.svg', '.webp'];
	return acceptedExtensions.includes(path.extname(file).toLowerCase());
}

export function isVideo(file: string): boolean {
	const acceptedExtensions = ['.mp4', '.mpg', '.mpeg', '.webm'];
	return acceptedExtensions.includes(path.extname(file).toLowerCase());
}
