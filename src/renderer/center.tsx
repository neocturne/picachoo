import * as React from 'react';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
	center: {
		display: 'grid',
		gridTemplateRows: '1fr auto 1fr',
		gridTemplateColumns: '1fr auto 1fr',
		overflow: 'hidden',
	},
	child: {
		gridRow: 2,
		gridColumn: 2,
		overflow: 'hidden',
	},
});

export interface CenterProps {
	className?: string;
	style?: React.CSSProperties;
	children: React.ReactNode;
}

export function Center({ className, style, children }: CenterProps): JSX.Element {
	const styles = useStyles();

	return (
		<div className={`${styles.center} ${className}`} style={style}>
			<div className={styles.child}>{children}</div>
		</div>
	);
}
