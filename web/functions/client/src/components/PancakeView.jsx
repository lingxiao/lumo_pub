/**
 * @Package: PancakeView.jsx
 * @Date   : 1/8/2022
 * @Author : Xiao Ling   
 *
 *
*/



import React from "react";
import { createStyles, makeStyles } from "@material-ui/core/styles";

/******************************************************
	@styles
******************************************************/


const useStyles = makeStyles((theme) => createStyles({

	overLayContainer: {
		display: 'grid',
	},

	overLayContainerInner: {
		gridArea: '1 / 1',
	},	


}));

/**
 *
 * @Use: parent that blurs its children
 *
 *
 **/
export default function PancakeView(props){

	const { underlay_style, show_top } = props
	const classes = useStyles();

	return (
		<div className={classes.overLayContainer}>
			<div className={classes.overLayContainerInner} style={underlay_style || {}}>
				{props.children}
			</div>
			<div className={classes.overLayContainerInner}>
				{show_top ? props.children : <div/>}
			</div>
		</div>
	);
}

export { useStyles };




