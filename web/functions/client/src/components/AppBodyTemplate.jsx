/**
 *
 *
 * @Package: AppBodyTemplate
 * @Date   : Dec 28th, 2021
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState, useEffect} from 'react'
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";


// Lumo modules
import AppFooter from './AppFooter';
import AppSnackbar from './AppSnackbar';

import { urlToFileExtension, TokenContentKind } from './../model/core';

import StaticVideoBackgroundView, {
	GiphBackgroundView,
	RemoteVideoBackgroundView,
} from './VideoBackground';


import AppHeaderView from './../pages/AppHeader';

import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import BlinkingDot from './BlinkingDot';
import FullScreenAboutView, {FullScreenMoreView}  from './FullScreenAboutView';


import { COLORS } from './constants'


/******************************************************
	@styles
******************************************************/

// combined height of header and footer
// this value is used througout the 
// application 
const app_header_footer_ht = '200px'


// gradient style 
const bg_gradient = {
	background: COLORS.offBlack,
	// background: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0,0,0,0.9))`,	
}

const hd_gradient = {
	background: COLORS.offBlack,    
    // background: 'linear-gradient(rgba(0, 0, 0, 0.3), rgba(0,0,0,0.5))',  
}

const bg_gradient_lite = {
	background: `linear-gradient(rgba(7, 8, 7, 0.02), rgba(7,8,7,0.10))`,
}

const hd_gradient_lite = {
    background: 'linear-gradient(rgba(7, 9, 7, 0.01), rgba(7,8,7,0.02))',  
}


const useStyles = makeStyles((theme) => ({

	bodyContainer: {
		paddingLeft: theme.spacing(4),
		paddingRight: theme.spacing(4),
		background: COLORS.offBlack,
		height: '100vh',
	},

	// left container block

	leftContainer : {
		display: "flex",          
		justifyContent: 'center',
		height: '100vh',
	},

	leftContainerInner: {
		display   : "flex",
		alignItems: "center",		
	},  

	leftContainerBottomLeft : {
		position: 'fixed',
		left: theme.spacing(6),
		bottom: 120,
	},

	leftContainerTopLeft : {
		position: 'fixed',
		left: theme.spacing(6),
		top: 120,
	},

	// right container block
	rightContainer: {
		// textAlign:'center',
	},


	overLayContainer: {
		display: 'grid',
	},

	overLayContainerInner: {
		gridArea: '1 / 1',
	},	

	four_oh_four : {
		width: '100vw',
		height: `calc(100vh - 100px)`,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize  : '4vw',
        color     : COLORS.offwhite,
        fontFamily: 'NeueMachina-Black',        
        textShadow: `var(--green-glow)`,  

	},
}));



/******************************************************
	@Base views
******************************************************/


/**
 *
 * @Use: video background view where video appears after n seconds
 *
 **/
export function App404(props){

    const classes = useStyles();    

    return (
		<div className={classes.overLayContainer}>
			<div className={classes.overLayContainerInner}>
				<AppHeaderView {...props} simple/>
			</div>
			<StaticVideoBackgroundView delay={0}/>
			<div className={classes.four_oh_four} style={{fontSize:'6vw'}}>
				404
			</div>
		</div>		
    )
}

export function AppPreload(props){

    const classes = useStyles();    

    return (
		<div className={classes.overLayContainer}>
			<div className={classes.overLayContainerInner}>
				<AppHeaderView {...props} simple/>
			</div>
			<StaticVideoBackgroundView delay={0}/>
			<div 
				className={classes.four_oh_four} 
				style={{textShadow: `var(--red-glow)`}}
			>	
				{'loading'.toUpperCase()}
				<BlinkingDot blinking style={{width: '5px', marginLeft:'4px', marginBottom:'0.20vw'}}/> 
			</div>
		</div>		
    )
}


export { app_header_footer_ht, useStyles };
