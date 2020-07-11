import * as React from 'react';

export interface CenterProps {
	className?: string;
	style?: React.CSSProperties;
	children: React.ReactNode;
}

const CenterStyle: React.CSSProperties = {
	display: 'grid',
	gridTemplateRows: '1fr auto 1fr',
	gridTemplateColumns: '1fr auto 1fr',
	overflow: 'hidden',
};

const CenterChildStyle: React.CSSProperties = {
	gridRow: 2,
	gridColumn: 2,
	overflow: 'hidden',
};

export function Center({ className, style, children }: CenterProps): JSX.Element {
	const combinedStyle = { ...CenterStyle, ...style };
	return (
		<div style={combinedStyle} className={className}>
			<div style={CenterChildStyle}>{children}</div>
		</div>
	);
}
