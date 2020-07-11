import { useCallback, useEffect, useState } from 'react';

import * as fs from 'fs';
import * as path from 'path';

export function usePromise<T>(f: () => Promise<T>): T | null {
	const [value, setValue] = useState<T | null>(null);

	useEffect(() => {
		setValue(null);

		let cancelled = false;

		(async (): Promise<void> => {
			const v = await f();
			if (!cancelled) {
				setValue(v);
			}
		})();

		return (): void => {
			cancelled = true;
		};
	}, [f]);

	return value;
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
