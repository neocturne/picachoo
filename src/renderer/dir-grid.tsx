import * as React from 'react';

import { Center } from './center';

export interface DirGridProps {
	className?: string;
	left?: React.ReactNode;
	top?: React.ReactNode;
	right?: React.ReactNode;
	bottom?: React.ReactNode;
	children?: React.ReactNode;
}

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

export function DirGrid({ className, left, top, right, bottom, children }: DirGridProps): JSX.Element {
	return (
		<div style={DirGridStyle} className={className}>
			<GridCell pos={[2, 1]} name='left'>
				{left}
			</GridCell>
			<GridCell pos={[1, 2]} name='top'>
				{top}
			</GridCell>
			<GridCell pos={[2, 3]} name='right'>
				{right}
			</GridCell>
			<GridCell pos={[3, 2]} name='bottom'>
				{bottom}
			</GridCell>
			<GridCell pos={[2, 2]} name='center'>
				{children}
			</GridCell>
		</div>
	);
}
