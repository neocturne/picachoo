import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { App, Config } from './app';

import './style.css';

const config: Config = {
	path: '/home/neoraider/Images/test',
	left: 'Left',
	top: 'Top',
	right: 'Right',
	bottom: 'Bottom',
};

ReactDOM.render(<App config={config} />, document.querySelector('#app'));

module.hot?.accept();
