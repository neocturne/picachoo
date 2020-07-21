import * as React from 'react';

import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { Theme, makeStyles } from '@material-ui/core/styles';

import * as fileUrl from 'file-url';
import * as path from 'path';

import { isVideo, isImage } from './util';

const useStyles = makeStyles((theme: Theme) => ({
	imageView: {
		display: 'flex',
		flexDirection: 'column',
		maxHeight: '100%',
	},
	image: {
		display: 'block',
		overflow: 'hidden',
		objectFit: 'contain',
	},
	imageCaption: {
		textAlign: 'center',
		padding: theme.spacing(1),
	},
}));

export interface ImageViewProps {
	path: string;
}

export function ImageView({ path: filePath }: ImageViewProps): JSX.Element {
	const styles = useStyles();

	const url = fileUrl(filePath);
	const basename = path.basename(filePath);
	return (
		<div className={styles.imageView}>
			{isImage(filePath) && <img className={styles.image} src={url} />}
			{isVideo(filePath) && (
				<video className={styles.image} controls>
					<source src={url} />
				</video>
			)}{' '}
			<Typography className={styles.imageCaption}>{basename}</Typography>
		</div>
	);
}
