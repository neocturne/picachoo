import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { App, Config } from './app';

import './style.css';

const config: Config = {
	path: '/home/neoraider/Images/test',
	// path: '/home/neoraider/fangorn/Multimedia/Other/soup-backup',
	left: { label: 'Left', path: '/home/neoraider/Images/test-left' },
	up: { label: 'Up', path: '/home/neoraider/Images/test-up' },
	right: { label: 'Right', path: '/home/neoraider/Images/test-right' },
	down: { label: 'Down', path: '/home/neoraider/Images/test-down' },
};

ReactDOM.render(<App config={config} />, document.querySelector('#app'));

module.hot?.accept();
