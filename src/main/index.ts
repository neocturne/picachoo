import { app, BrowserWindow } from 'electron';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

const isDevelopment = process.env.NODE_ENV !== 'production';

app.allowRendererProcessReuse = true;

async function installReactDevTools(): Promise<void> {
	const { default: installExtension, REACT_DEVELOPER_TOOLS } = await import('electron-devtools-installer');
	const name = await installExtension(REACT_DEVELOPER_TOOLS);
	console.log(`Added Extension: ${name}`);
}

function createWindow(): void {
	const window = new BrowserWindow({
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			allowRunningInsecureContent: false,
			webSecurity: !isDevelopment,
		},
	});

	window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

	if (isDevelopment) {
		window.webContents.openDevTools();
	}

	window.webContents.on('devtools-opened', () => {
		window.webContents.focus();
	});
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

async function initialize(): Promise<void> {
	if (isDevelopment) {
		await installReactDevTools();
	}

	createWindow();
}

// create main BrowserWindow when electron is ready
app.on('ready', initialize);
