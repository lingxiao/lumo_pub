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
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import PancakeView from './PancakeView'
import { COLORS } from './constants'
import AppSnackbar   from './AppSnackbar';

import icon_forward  from './../assets/icon_forward.svg'
import icon_play     from './../assets/icon_play.svg'
import icon_pause    from './../assets/icon_pause.svg'
import icon_shuffle  from './../assets/icon_shuffle.svg'
import icon_twitter  from './../assets/icon_twitter.svg'
import icon_exit_fullscreen  from './../assets/icon_exit_fullscreen.svg'
import icon_download  from './../assets/icon_download.svg'

import BlinkingDot from './BlinkingDot';
import BlinkingCursor from './BlinkingCursor';
import TypewriterText from "./TypewriterText";
import Tippy from "@tippyjs/react";

import { swiftNow, trivialString } from './../model/utils';

/******************************************************
	@styles
******************************************************/


const useStyles = makeStyles((theme) => ({

	commandView : {
		position: 'absolute',
		bottom: '30px',
		left: '40px',
		color: COLORS.offwhite, 
        opacity: 0.75,		
	},

	playButtonContainer : {
		marginBottom: theme.spacing(2),
	},

	promptContainer : {
		color: COLORS.offwhite, 
        fontFamily: 'NeueMachina-Medium',        
        fontSize: '15px',		
        cursor: 'pointer',
	},

	addressContainer: {
		fontFamily: 'NeueMachina-Bold',
		fontSize: '11px',
		color: COLORS.translucent3,
		paddingTop: theme.spacing(0.1),
		// color: 'rgb(235, 235, 235)',
		// textShadow: 'var(--green-glow)',
	},

    // header
    icon: {
    	width : 25,
    	height: 25,
        filter: COLORS.offwhite_filter,
        cursor: 'pointer',    
    },

    icon_green : {
        cursor      : "pointer",        
        textShadow  : `var(--green-glow)`,    	
    }

}));


/******************************************************
	@Uminifiy widget
******************************************************/

/**
 *
 * @use: command icons 
 *
 **/
function PlayBackIcon(props){

	const { style, view, src, ChildView, tip } = props
	const classes = useStyles();

	function handleClick(){
		if (typeof props.onClick === 'function'){
			props.onClick();
		}
	}	

	return (
	    <Tippy content={tip} disabled={false}>
			<Button variant="text" fullWidth = {false} onClick = {handleClick} style={style ?? {}}>
				{ trivialString(src)
					?
					<ChildView/>
					:
			        <img alt={""} src={src} className={classes.icon}/>
				}
			</Button>	
		</Tippy>
	)
}



/**
 *
 * @Use: button to resume nfty browser view
 *
 **/
export default function FullScreenCommandView(props){

	const classes = useStyles();
	const {
		hide_pause_btn,
		current_mix_name, 
		tok_address,
		is_playing,
		on_toggle_play,
		on_skip_next, 
		on_shuffle,
		on_twitter,
		on_download,
		on_exit_fullscreen,
		on_click_collab_user,
		on_click_tok_address,
	} = props;

	const [ showPause, setShowPause ]  = useState(true);
	const [ lastSkip, setLastSkip   ]  = useState(swiftNow()-2);
	const [ snack, setSnack         ]  = useState({ str: "", show: false });

	const [ showDot, setShowDot ] = useState(true);
	const [ showCursor, setShowCursor ] = useState(true);

	useEffect(() => {
		setShowPause(is_playing)
	},[is_playing])

	// hide cursor and show address
	useEffect(() => {
		setTimeout(() => {
			setShowDot(false);
		},10000);
	},[]);


	const _str = "You're going too fast! Breath"

	// throttle repeated skips
	function _onNext(){
		let now = swiftNow();
		if ( now - lastSkip < 2.0 ){
			snackOn(_str);
		} else {
			setLastSkip(now);
			on_skip_next();
		}
	}

	// throttle _repated shuffle
	function _onShuffle(){
		let now = swiftNow();
		if ( now - lastSkip < 3 ){
			snackOn(_str);
		} else {
			setLastSkip(now);
			on_shuffle();
		}		
	}

	function snackOn(str){
		setSnack({ str: _str, show: true });
		setTimeout(() => {
			setSnack({ str: "", show: false })
		},2000)
	}

	function didFinishTypeAddress(){
		setTimeout(() => {
			setShowCursor(false);
		},2000)
	}


	return (
		<div className={classes.commandView}>
            <PancakeView underlay_style={{filter:'blur(5px)'}} show_top >
            	<div className={classes.promptContainer} >

					<Stack direction='row' spacing={-2.5} className={classes.playButtonContainer} style={{marginLeft:'-20px'}}>

	                    {/*
						<PlayBackIcon onClick={_onShuffle} src={icon_shuffle} tip={'shuffle'}/>
	                    */}
						<PlayBackIcon onClick={on_twitter} src={icon_twitter} tip={'tweet this house'}/>

						{ true ? <div/> : 
							<PlayBackIcon onClick={_onNext} src={icon_forward} tip={'next project'}/>						
						}

						{ true  ? <div/> :
						<PlayBackIcon onClick={on_exit_fullscreen} src={icon_exit_fullscreen}/>
						}

						{ true ?  <div/> :
						<div style={{ transform: 'rotate(90deg)' }}>
							<PlayBackIcon onClick={on_download} src={icon_download}/>								
						</div>
						}

						{ hide_pause_btn
							?
							<div/>
							:
							<div style={{marginLeft: '36px'}}>
			                    { showPause 
			                    	?
			                    	<PlayBackIcon onClick={on_toggle_play} src={icon_pause} tip={'pause'}/> 
			                    	: 
			                    	<PlayBackIcon onClick={on_toggle_play} src={icon_play} tip={'play trailer'}/>
			                    }
		                    </div>
		                }						

	            	</Stack>	

	            	{
	            		trivialString(current_mix_name) 
	            		? 
	            		<div/> 
	            		:
		            	<div onClick={on_click_collab_user} style={{marginBottom:'8px'}}>
		            		{current_mix_name}
		            		{ showDot 
		            			?
			            		<BlinkingDot 
			            			{...props} 
			            			blinking 
			            			style={{marginLeft:'5px', width: '10px'}}
			            		/>
			            		: <div/>
			            	}
		            	</div>
		            }

	            	<div onClick={on_click_tok_address} className={classes.addressContainer}>
	        			<div style={{height:'11px'}}>
							<TypewriterText
								delay={1000}
								className="green"
								onFinished={didFinishTypeAddress}
							>
						        {tok_address}
						    </TypewriterText>
						    { showCursor 
						    	? 
								<BlinkingCursor 
									blinking 
									style={{
									 position: 'absolute',
									 display: "inline-block",
									 width: "10px", 
									 marginLeft: "4px" ,
									 marginTop: '-2.5px',
									}}
								/> 
								: 
								<div/>
							}
						</div>
	            	</div>       	

            	</div>
            </PancakeView>                    
            <AppSnackbar
                showSnack = {snack.show}
                snackMessage = {snack.str}
                vertical={"bottom"}
                horizontal={"right"}
            />    
		</div>
	)
}


export{ PlayBackIcon };


