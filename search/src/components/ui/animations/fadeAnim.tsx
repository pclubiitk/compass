import React, { useRef } from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";

interface FadeAnimProps {
	style?: Object;
	myname?: string;
	in?: boolean;
	children?: any[] | any;
}

function FadeAnimItem({ child }: { child: React.ReactElement }) {
	const nodeRef = useRef<HTMLDivElement>(null);
	return (
		<CSSTransition
			nodeRef={nodeRef}
			classNames="fade"
			timeout={300}
			mountOnEnter={true}
			unmountOnExit={true}
		>
			<div ref={nodeRef}>{child}</div>
		</CSSTransition>
	);
}

const FadeAnim = React.forwardRef((props: FadeAnimProps, _ref) => {
	return (
		<TransitionGroup
			style={props.style}
			className={props.myname}
			appear={props.in}
		>
			{React.Children.map(props.children, (child, i) => (
				<FadeAnimItem key={i} child={child} />
			))}
		</TransitionGroup>
	);
});

FadeAnim.displayName = "Fade Animation Wrapper";

export default FadeAnim;
