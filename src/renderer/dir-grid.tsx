import * as React from 'react';

import { Center } from './center';

export type Direction = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

export type DirGridProps = {
	[key in Direction]?: React.ReactNode;
} & {
	className?: string;
	children?: React.ReactNode;
};

const DirGridStyle: React.CSSProperties = {
	display: 'grid',
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
	const { className, children } = props;
	return (
		<div style={DirGridStyle} className={className}>
			{positions.map((row, i) =>
				row.map(
					(cell, j) =>
						cell && (
							<GridCell pos={[i + 1, j + 1]} name={cell}>
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
