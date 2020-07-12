declare interface NodeModule {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	hot: any;
}

declare namespace NodeJS {
	interface Global {
		sourcePath?: string;
	}
}
