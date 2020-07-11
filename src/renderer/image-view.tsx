import * as React from 'react';

import * as fileUrl from 'file-url';
import * as path from 'path';

import { isVideo, isImage } from './util';

export interface ImageViewProps {
	path: string;
}

const ImageViewStyle: React.CSSProperties = {
	display: 'block',
	overflow: 'hidden',
	objectFit: 'contain',
};

export function ImageView({ path: filePath }: ImageViewProps): JSX.Element {
	const url = fileUrl(filePath);
	const basename = path.basename(filePath);
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				maxHeight: '100%',
			}}
		>
			{isImage(filePath) && <img style={ImageViewStyle} src={url} />}
			{isVideo(filePath) && (
				<video style={ImageViewStyle} controls>
					<source src={url} />
				</video>
			)}{' '}
			<div
				style={{
					textAlign: 'center',
					padding: '0.5em',
				}}
			>
				{basename}
			</div>
		</div>
	);
}
