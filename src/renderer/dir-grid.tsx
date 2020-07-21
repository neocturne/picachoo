import * as React from 'react';

import { makeStyles } from '@material-ui/core/styles';

import { Center } from './center';

const useStyles = makeStyles({
	dirGrid: {
		display: 'grid',
	},
});

export type Direction = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

export type DirGridProps = {
	[key in Direction]?: React.ReactNode;
} & {
	className?: string;
	children?: React.ReactNode;
};

interface GridCellProps {
	name: string;
	pos: [number, number];
	children: React.ReactNode;
}

function GridCell({ name, pos: [row, column], children }: GridCellProps): JSX.Element {
	return (
		<Center style={{ gridRow: row, gridColumn: column }} className={`dir-grid-cell-${name}`}>
			{children}
		</Center>
	);
}

const positions: (Direction | undefined)[][] = [
	['nw', 'n', 'ne'],
	['w', , 'e'],
	['sw', 's', 'se'],
];

export function DirGrid(props: DirGridProps): JSX.Element {
	const styles = useStyles();

	const { className, children } = props;

	return (
		<div className={`${styles.dirGrid} ${className}`}>
			{positions.map((row, i) =>
				row.map(
					(cell, j) =>
						cell && (
							<GridCell key={cell} pos={[i + 1, j + 1]} name={cell}>
								{props[cell]}
							</GridCell>
						),
				),
			)}
			<GridCell pos={[2, 2]} name='center'>
				{children}
			</GridCell>
		</div>
	);
}
