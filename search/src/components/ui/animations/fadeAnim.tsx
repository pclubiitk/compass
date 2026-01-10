import React from "react";
import {CSSTransition, TransitionGroup} from "react-transition-group";

interface FadeAnimProps {
	style?: Object;
	myname?: string;
	in?: boolean;
	children?: any[] | any;
}

const  FadeAnim = React.forwardRef((props: FadeAnimProps, ref) => {
	return (
		<TransitionGroup 
			style={props.style} 
			className={props.myname}
			appear={props.in}
		>
		{React.Children.map(props.children, (child) => {
			return (
				<CSSTransition
					classNames="fade"
					timeout={300}
					mountOnEnter={true}
					unmountOnExit={true}
				>
				{child}
				</CSSTransition>
			);
		})}
		</TransitionGroup>
	);
});

FadeAnim.displayName = "Fade Animation Wrapper";

export default FadeAnim;