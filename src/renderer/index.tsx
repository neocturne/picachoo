import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';

import { App } from './app';

import 'typeface-roboto';

const theme = createMuiTheme({
	palette: {
		type: 'dark',
	},
});

ReactDOM.render(
	<ThemeProvider theme={theme}>
		<App />
	</ThemeProvider>,
	document.querySelector('#app'),
);

module.hot?.accept();
