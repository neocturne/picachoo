import * as React from 'react';

export interface ImageViewProps {
	url: string;
}

export function ImageView({ url }: ImageViewProps): JSX.Element {
	const basename = url.match(/[^\/]*$/)?.[0];
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				maxHeight: '100%',
			}}
		>
			<img
				style={{
					display: 'block',
					overflow: 'hidden',
					objectFit: 'contain',
				}}
				src={url}
			/>
			<div
				style={{
					overflow: 'hidden',
					textAlign: 'center',
					padding: '0.5em',
				}}
			>
				{basename}
			</div>
		</div>
	);
}
