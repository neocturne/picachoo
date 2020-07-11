import { useCallback, useEffect, useState } from 'react';

import { promises as fs } from 'fs';

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
	const readdir = useCallback(() => fs.readdir(path), [path]);
	return usePromise(readdir);
}

export function useReadFile(path: string): Buffer | null {
	const readFile = useCallback(() => fs.readFile(path), [path]);
	return usePromise(readFile);
}

export function useWindowEvent<K extends keyof WindowEventMap>(type: K, f: (ev: WindowEventMap[K]) => void): void {
	useEffect(() => {
		window.addEventListener(type, f);

		return () => {
			window.removeEventListener(type, f);
		};
	}, [type, f]);
}
