/**
 *
 *
 * @Package: ChatMessage.jsx
 * @Date   : Dec 22nd, 2021
 * @Author : Xiao Ling   
 * @Docs:
 *   - chat style: https://codesandbox.io/s/material-ui-chat-drh4l?file=/src/App.js
 *   - chat full: https://github.com/Wolox/react-chat-widget
 *   - the console used: https://github.com/linuswillner/react-console-emulator
 *   - other console: https://github.com/webscopeio/react-console
 *
*/



import React from "react";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import Avatar from "@material-ui/core/Avatar";
import IconButton from '@mui/material/IconButton';

import { COLORS } from './constants'
import AppImageView from './AppImageView'
// import PancakeView from './PancakeView'


import gif from './../assets/static2.gif'
import mp3_gif from './../assets/static2.gif'
import { MESSAGE_KIND } from './../model/core'

/******************************************************
	@styles
******************************************************/


const messageBorder = `0.4px solid ${COLORS.translucent}`

const useStyles = makeStyles((theme) => createStyles({

	// container
	messageRowLeft: {
		display: "flex",
		position: 'relative',
	},

	messageRowRight: {
		display: "flex",
		justifyContent: "flex-end",
		position: 'relative'
	},

	// inbound bubble
	messageInbound: {

		position    : "relative",
		marginLeft  : "20px",
		marginBottom: "10px",
		padding: theme.spacing(2),		
		backgroundColor: COLORS.transparent,


		maxWidth    : "60%",
		textAlign: "left",
		border   :  messageBorder, 
		borderRadius: "10px",

		color    : COLORS.text,
	    fontFamily: 'NeueMachina-Light',		
        fontSize: '16px',	  
        lineHeight: 1.5,

        left: -1*theme.spacing(4),

        overflowWrap: 'anywhere',

		// carrot next to the avatar
		// "&:after": {
		// 	content: "''",
		// 	position: "absolute",
		// 	width: "0",
		// 	height: "0",
		// 	borderTop: `15px solid ${COLORS.translucent}`,
		// 	borderLeft: "15px solid transparent",
		// 	borderRight: "15px solid transparent",
		// 	top: "0",
		// 	left: "-15px"
		// },
		// "&:before": {
		// 	content: "''",
		// 	position: "absolute",
		// 	width: "0",
		// 	height: "0",
		// 	borderTop: `17px solid ${COLORS.translucent}`,
		// 	borderLeft: `16px solid transparent`,
		// 	borderRight: `16px solid transparent`,
		// 	top: "-1px",
		// 	left: "-17px"
		// }
	},

	messageOutbound: {

		position: "relative",
		marginRight: "20px",
		marginBottom: "10px",
		padding: theme.spacing(2),
		maxWidth    : "60%",
		backgroundColor: COLORS.transparent,

		textAlign: "left",
		border: messageBorder,
		borderRadius: "10px",

        lineHeight: 1.5,
		color    : COLORS.text,
	    fontFamily: 'NeueMachina-Light',		
        fontSize: '16px',	  

        overflowWrap: 'anywhere',

		// "&:after": {
		// 	content: "''",
		// 	position: "absolute",
		// 	width: "0",
		// 	height: "0",
		// 	borderTop: "15px solid #f8e896",
		// 	borderLeft: "15px solid transparent",
		// 	borderRight: "15px solid transparent",
		// 	top: "0",
		// 	right: "-15px"
		// },
		// "&:before": {
		// 	content: "''",
		// 	position: "absolute",
		// 	width: "0",
		// 	height: "0",
		// 	borderTop: "17px solid #dfd087",
		// 	borderLeft: "16px solid transparent",
		// 	borderRight: "16px solid transparent",
		// 	top: "-1px",
		// 	right: "-17px"
		// }
	},

	messageContent: {
		padding: 0,
		margin: 0
	},

	messageImage : {
		width: '90%',
		margin: theme.spacing(2),
		marginTop: theme.spacing(2.5),
		cursor: 'pointer',		
	},

	messageTimeStampRight: {
		position: "absolute",
		fontSize: ".85em",
		fontWeight: "300",
		marginTop: "10px",
		bottom: "-3px",
		right: "5px",
		// padding: '5px',		
	},

	fromAvatar: {
		width: theme.spacing(3),
		height: theme.spacing(3),
		borderRadius: theme.spacing(1),
		marginLeft: theme.spacing(1/2),
		position: 'absolute',
		top: '5x',
		cursor: 'pointer',		
	},

	outboundAvatar: {
		width: theme.spacing(3),
		height: theme.spacing(3),
		borderRadius: theme.spacing(1),
		marginRight: theme.spacing(1/2),
		position: 'absolute',
		bottom: '0px',
		cursor: 'pointer',
	},



	displayName: {
		// marginLeft: "21px",
		marginBottom: '3px',
		color: 'white',
		textAlign:'left',
		fontFamily: 'NeueMachina-Light',
		fontSize: '13px',
		paddingLeft: theme.spacing(1),
	}


}));



/******************************************************
	@views: exprt
******************************************************/

/**
 *
 * @use: inbound message container
 * @Alt img:  <img className={classes.messageImage} src={gif} alt={""} />
 *
 *
 **/
const MessageLeft = (props) => {

	const message     = props.message ? props.message : "no message";
	const displayName = props.displayName ? props.displayName : ""
	const blurStyle = props.blur_style ?? {}

	const classes = useStyles();
	const preview_url = props.preview_url ?? false

	const handleTapIcon = () => {
		if (typeof props.handleTapIcon === 'function'){
			props.handleTapIcon(props.item)
		}
	}

	let avatarBlur = props.blur_style && props.blur_style.filter ? {filter: 'blur(3px)'} : {}

	let kind = props.kind;

	return (
		<div className={classes.messageRowLeft}>
			{ blurStyle === {} ? <></> :
				<IconButton onClick={handleTapIcon} className={classes.fromAvatar}>
					<Avatar 
						alt={""} 
						className={classes.fromAvatar} 
						style={avatarBlur} 
						src={props.photoURL}
					/>
				</IconButton>
			}
			<div>
				<div className={classes.displayName} style={blurStyle}>{displayName}</div>
				<div className={classes.messageInbound} style={blurStyle}>
				<div>
					<div className={classes.messageContent} style={blurStyle}>
						{message}
				        { !preview_url && (kind !== MESSAGE_KIND.TOKEN_COLLAB)
				        	? <div></div>
				        	: 
				        	<div className={classes.messageImage} src={gif} alt={""} onClick={props.handleClickImage}>
				        		<AppImageView
				        			showStatic
				        			width ={'90%'}
				        			height={'90%'}
				        			imgSrc={preview_url || mp3_gif}
				        			videoSrc={preview_url || mp3_gif}
				        			type    = {props.preview_type}
				        		/>
				        	</div>
				        }
					</div>
				</div>
					{/*<div className={classes.messageTimeStampRight} style={blurStyle}>{timestamp}</div>*/}
				</div>
			</div>
		</div>
	);
};




const MessageRight = (props) => {

	const classes = useStyles();
	const message = props.message ? props.message : "no message";
	const blurStyle = props.blur_style ?? {}

	const preview_url = props.preview_url ?? false

	const handleTapIcon = () => {
		if (props.handleTapIcon !== null){
			props.handleTapIcon(props.item)
		}
	}

	let kind = props.kind;


	return (
		<div className={classes.messageRowRight} style={blurStyle}>
			<div className={classes.messageOutbound} style={blurStyle}>
				<div className={classes.messageContent} style={blurStyle}>{message}</div>
		        { !preview_url && (kind !== MESSAGE_KIND.TOKEN_COLLAB)
		        	? <div></div>
		        	: 
		        	<div className={classes.messageImage} onClick={props.handleClickImage}>
		        		<AppImageView
		        			showStatic
		        			width ={'90%'}
		        			height={'90%'}
		        			imgSrc  = {preview_url || mp3_gif}
		        			videoSrc= {preview_url || mp3_gif}
		        			type    = {props.preview_type}
		        		/>
		        	</div>
		        }				
			</div>
			<Avatar 
				alt={""} 
				className={classes.outboundAvatar} 
				style={{blurStyle}} 
				src={props.photoURL}
				onClick={handleTapIcon}
			/>
		</div>
	);
};


/******************************************************
	@views
******************************************************/



export {
	MessageLeft,
	MessageRight,
}










