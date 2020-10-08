import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { ipcRenderer } from 'electron';
import 'electron-disable-file-drop';

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

import { App } from './app';

import 'typeface-roboto';

const theme = createMuiTheme({
	palette: {
		mode: 'dark',
	},
});

ReactDOM.render(
	<ThemeProvider theme={theme}>
		<App />
	</ThemeProvider>,
	document.querySelector('#app'),
);

function checkReady() {
	if (document.readyState === 'complete') {
		ipcRenderer.send('ready-to-show');
	}
}

document.addEventListener('readystatechange', checkReady);
checkReady();

module.hot?.accept();
