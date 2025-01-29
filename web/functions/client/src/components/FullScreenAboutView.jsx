/**
 *
 *
 * @Package: FullScreenAboutView
 * @Date   : Jan 28th, 2021
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useEffect, useState} from "react";

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tippy from "@tippyjs/react";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CloseIcon from '@mui/icons-material/Close';

import { createStyles, makeStyles } from "@material-ui/core/styles";

import PancakeView from './PancakeView'
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import WithChangeOpacity from './WithChangeOpacity';
import BlinkingDot from './BlinkingDot';
import AppImageView from './AppImageView'


import {  AppTextFieldNoUnderLine  } from './ChatTextInput'

import { COLORS } from './constants';
import { urlToFileExtension } from './../model/core';
import {
	trivialProps,
	trivialString,
} from './../model/utils'

import icon_play from './../assets/icon_play.svg'

import { useNftvieWstyles } from './../pages/AppStoryboard'


/******************************************************
    @enum
******************************************************/

const AboutRowKind = {
	hero  : 0,
	h1    : 1,
	h2    : 2,
	h3    : 3,
	h4    : 4,
	about : 5,
	trait : 6,
	button: 7,

	divide: 100,
	pad   : 200,

	full_h2 : 'full_h2',
	custom  : 'custom',
}

/******************************************************
    @style
******************************************************/

const useStyles = (mobile) => makeStyles((theme) => createStyles({

    container: {
        height    : mobile ? '80vh' : '90vh',
        overflow  : 'hidden',
        overflowY : "scroll",
    	marginTop  : mobile ? '2vh' : '0',
    },

    row_0 : {

    	height       : mobile ? '75vh' : '75vh',
    	// width        : '100vw',

    	position     : 'relative',
        display      : 'flex',        
        alignItems   : 'center',
        flexDirection: 'column',
        textAlign    : 'center',

        fontFamily   : 'NeueMachina-Black',
    	fontSize     : mobile ? '10vh' : `15vh`,
    	color        : 'white',
    	// filter       : COLORS.offwhite_filter,    
    },

    row_0_header : {
    	height  : '20px', 
    	position: 'relative',
    	width   : '100%',
    	padding : theme.spacing(4),
    },

    row_0_center : {
        top: '50%',
        position: 'absolute',
        transform: 'translateY(-60%)',
    },

    push_right : {
    	width       : mobile ? '90vw' : '50vw',
        marginLeft  : mobile ? '0vw' : '44vw',
    },

    row_1: {
        height    : '20px',
        fontSize  : '16px',
        color     : COLORS.white,
        fontFamily: 'NeueMachina-Bold',
        display   : 'flex',
        borderBottom: `1px solid ${COLORS.offwhite}`,        
    },    

    row_h2: {
        // fontSize  : '40px',
        color     : 'white',                
        fontFamily: 'NeueMachina-Black',
    	fontSize  : mobile ? '3vh' : `5vh`,        
        textAlign : 'right',        
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
    },


    row_h3 : {
        fontSize  : '40px',
        color     : 'white',                
        fontFamily: 'NeueMachina-Black',
        textAlign : 'right',        
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
    },

    row_h4 : {
        fontSize  : '36px',
        color     : 'white',                
        fontFamily: 'NeueMachina-Black',
        textAlign : 'right',        
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        // background: 'red',
    },

    row_3: {
    	fontSize : '15px',
    	color    : 'white',
        letterSpacing: '1px',
    	textAlign   : 'right',
    	fontFamily  : 'NeueMachina-Bold',
        paddingBottom: theme.spacing(4),
        lineHeight: 1.5,        
    },

    row_rarity: {
        height    : '23px',
        fontSize  : '16px',
        color     : COLORS.white,
        fontFamily: 'NeueMachina-Bold',
        display   : 'flex',
        marginTop : theme.spacing(4),
    },

    row_button : {
        fontSize    : mobile ? '2vw' : '2.5vw',
        color       : 'white',                
        fontFamily  : 'NeueMachina-Black',
        textAlign   : 'center',        
        cursor      : "pointer",        
        border      : `2px solid ${COLORS.green_1}`,
        borderRadius: '30px',
        textShadow  : `var(--green-glow)`,
    },

    row_button_small : {
        fontSize    : '18px',
        color       : 'white',                
        fontFamily  : 'NeueMachina-Black',
        textAlign   : 'center',        
        cursor      : "pointer",        
        border      : `2px solid ${COLORS.green_1}`,
        // border      : `1px solid ${COLORS.red}`,
        // textShadow  : `var(--red-glow)`,
        textShadow  : `var(--green-glow)`,        
        padding     : theme.spacing(2),
        borderRadius: '5px 20px 5px 20px',        
        // animation: 'text-flicker 3s linear',
        // animationDuration: '5.0s',
    },

    row_divide : {
    	height: '20px',
    	fontSize: '20px',
    	textAlign: 'center',
    	color    : 'white',
        paddingTop: theme.spacing(2),    	
    	paddingBottom: theme.spacing(3)
    },

    row_pad : {
    	height: '40px',
    	paddingTop: theme.spacing(3)
    },

    // more view
    more_view : {
		// position: 'absolute',
		// top     : '120px',
		// left    : '40px',
		textAlign: 'left',
		// right   : '40px',
		// textAlign  : 'right',
		width      : '20vw',
		// marginRight: '20px',
		cursor     : 'pointer',

        fontSize  : '15px',
        color     : 'white',                
        fontFamily: 'NeueMachina-Light',
    }

}));

const inputPropsAbout = {
	fontSize : '15px',
	color    : COLORS.text,
    letterSpacing: '1px',
	textAlign   : 'right',
	fontFamily  : 'NeueMachina-Bold',
    lineHeight: 1.5,  
    // textAlign: 'left'
}


/******************************************************
    @views componet
******************************************************/


// @use: row kind rarity
function TraitRow(props){

	const { left, right, glow, onClickRight } = props.data;
	const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile)();

    function onClickName(){
    	if ( typeof onClickRight === 'function' ){
    		onClickRight(props.data);
    	}
    }

    function onClickRole(){    	
    }

	return (
		<div className={classes.push_right}>
            <div className={classes.row_rarity}>
                <div onClick={() => {}} style={{cursor:"pointer"}} className={ glow ? "red" : ""}>
					<WithChangeOpacity onClick={onClickRole}>
	                    {left}
	                </WithChangeOpacity>
                </div>
                <Box sx={{ flexGrow: 1 }} />
                <div 
                	onClick={() => {}} 
	                style={{cursor:"pointer", marginRight:isOnMobile ? '10px' : '0px'}}
	                className={ glow ? "red" : ""}
                >                
					<WithChangeOpacity onClick={onClickName}>
	                	{right}
	                </WithChangeOpacity>
                </div>
            </div>        		
        </div>        		    		
	)
}


/**
 *
 * @Use; rserve btn with custom effect
 *
 **/
        
function ReserveButton(props){

	const { on_apply } = props;
	const { center, } = props.data;
	const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile)();

    function onClick(){
    	if ( typeof on_apply === 'function' ){
    		on_apply(); 
    	}
    }

	return (
		<div className={classes.push_right}>
			<WithChangeOpacity onClick={onClick}>
            	<div className = {classes.row_button}>
					<h2 style={{fontFamily: 'NeueMachina-Black'}}>
						{center}
					</h2>
                </div>     
            </WithChangeOpacity>
        </div>     	  
	)
}


/**
 *
 * @Use: render different row
 *
 *
 **/

 {/*	            return (
	        		<div 
	        			className={classes.push_right}
	        			style={{cursor:'pointer'}}
	        			onClick={on_click_about}
	        		>            	
	                	<div 
	                		style = {{ marginRight: isOnMobile ? '10px' : '0px' }}
	                		className = {classes.row_3}
	                		onMouseEnter={onEnterAbout}
              		        onMouseLeave={onExitAbout}
	                	>
	                		{left ?? (center ?? "")}
	                		<br/><br/>
	                		{right ?? ""}
		                </div>     
	                </div>     
	**/}    
function RowItem(props){

	const isOnMobile = useCheckMobileScreen(1000);
    const classes = useStyles(isOnMobile)();
    const { 
    	data, 
		goHandleClose,
		is_member,
	} = props;

    const [ span_name, set_span_name ] = useState('offset')    

    useEffect(() => {
        setTimeout(() => {
            set_span_name('animate-done')
        },2000)
    },[]);
    

    if ( trivialProps(data,'kind')  ){

    	return ( <div/> )

    } else {

	    const { 
	    	kind,
			left,
			right, 
			center,
			img_url, 
			storyboard,
			CustomView, 
		} = data;

	    let mtop = isOnMobile ? '-40px' : '-60px';

	    switch (kind){

	        case AboutRowKind.hero:

		    	let tip = 'Edit film information'

	            return (
	                <div className = {classes.row_0}>

	                	<Stack direction='row' className={classes.row_0_header}>

		                	<div style={{marginLeft: '20px', marginTop: mtop, cursor: 'pointer'}}>
								<CloseRoundedIcon onClick={goHandleClose} src={icon_play}/>								
			                </div>

		                    <Box sx={{ flexGrow: 1 }} />

		                    { is_member
		                    	?
			                	<div style={{marginRight:'24px', marginTop:'-15px', cursor: 'pointer'}}>
									<WithChangeOpacity onClick={props.onClickEdit}>
									    <Tippy content={tip} disabled={false}>
							            	<div className = {classes.row_button_small}>
												{ 'ED'.toUpperCase() }
												<span id={span_name}>{ 'I' }</span>
												{ 'T' }
							                </div>     
										</Tippy>
									</WithChangeOpacity>	
				                </div>
				                :
				                <div/>
		                    }

	                	</Stack>

		                	
	                	<div className={classes.row_0_center}>
	                		{ false
	                			?
	                			<div style={{transform:'translateY(15%)'}}>
			                        <AppImageView 
			                            imgSrc      = {img_url}
			                            preview_url = {img_url}
			                            type        = {urlToFileExtension(img_url)}
			                        />		      
		                        </div>  	
		                        :
					            <PancakeView underlay_style={{filter:'blur(5px)'}} show_top >
				                	{center}
				                </PancakeView>
				            }
	                	</div>

	                </div>
	            )

	        case AboutRowKind.h1:
	        	return (
	        		<div className={classes.push_right}>
			            <div className={classes.row_1}>
			                <div>
			                    {left}
			                </div>
			                <Box sx={{ flexGrow: 1 }} />
			                <div style={{marginRight:isOnMobile ? '10px' : '0px'}} >                
								{right}
			                </div>
			            </div>        		
		            </div>        		
	        	)

	        case AboutRowKind.h2:
	            return (
	        		<div className={classes.push_right}>
		                <div className = {classes.row_h2} style={{marginRight: isOnMobile ? '10px' : '0px'}}>
		                	<Stack direction='row'>
		                		<Box sx={{flexGrow:1}}/>
			                	<Stack direction='column'>
				                	<div style={{fontSize:'64px', marginBottom:'12px'}}>{left.toUpperCase()}</div>
				                	<div style={{fontSize:'32px'}}>{right.toUpperCase()}</div>	    	            	
			                	</Stack>
			                </Stack>
		                </div>     
		            </div>
	            )


	        case AboutRowKind.h3:
	            return (
	        		<div className={classes.push_right}>
		                <div className = {classes.row_h3}>
	    	            	{center}
		                </div>                       
		            </div>
	            )

	        case AboutRowKind.h4: 
	            return (
	        		<div className={classes.push_right}>
		                <div className = {classes.row_h4}>
	    	            	{center}
		                </div>                       
		            </div>
	            )

	        case AboutRowKind.about:
	        	var num_rows = 1;
	        	if ( center.length < 200 ){
	        		num_rows = 3;
	        	} else if (center.length < 500){
	        		num_rows = 7;
	        	} else if ( center.length > 700 ){
	        		num_rows = 15
	        	}
	            return (
	        		<div className={classes.push_right}>
	                	<AppTextFieldNoUnderLine 
	                		disabled
	                		multiline
	                		rows = { trivialString(center) ? 1 : num_rows}
	                		value = {center}
	                		style = {{ 
	                			marginRight: isOnMobile ? '10px' : '0px',
	                		    width: isOnMobile ? '100vw' : '50vw', 
		                	}}
		                    inputProps={{style: inputPropsAbout}}
	                	/>
	                </div>     
	            )

	        case AboutRowKind.trait:
	        	return (
					<TraitRow {...props} />        		
	        	)

	        case AboutRowKind.button: {
	        	return (
					<ReserveButton {...props}/>
	        	)
	        }


	        case AboutRowKind.divide:
	        	return (
	        		<div className={classes.push_right}>
	                	<div className = {classes.row_divide}>
	                		{'* * * *'}
	        			</div>
	        		</div>
	        	)

	        case AboutRowKind.pad:
	        	return (
	        		<div className={classes.push_right}>
	                	<div className = {classes.row_pad}/>
	        		</div>
	        	)

	        case AboutRowKind.full_h2:
	        	return (
	        		<TableHeader 
	        			{...props}
	        			{...data}
	        			on_fullscreen
	        			storyboard={storyboard}
	        		/>
	        	)
	        case AboutRowKind.custom:
	        	return (	
	        		<CustomView {...props}/>
	        	)

	        default:
	            return (
					<div/>                              
	            )
	    }

	}
}


/**
 *
 * @use: header to switch amongst boards
 *
 **/
function TableHeader({ storyboard, label, on_close }){

	const classes    = useStyles();
	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	const fontsize = 48;
	const txt_style = {
		color: COLORS.text,
	    fontFamily: 'NeueMachina-Black',		
		fontSize:`${fontsize}px`,
		marginTop: `${-0.65*fontsize}px`,
        // textShadow  : `var(--red-glow)`,		
	}

	return (
	    <Stack direction='row' className={tclasses.bounty_header}>
           	<div style={txt_style}>{(label ?? 'collection').toUpperCase()}</div>
	        <Box sx={{ flexGrow: 1 }} />
            <WithChangeOpacity onClick={on_close}>
                <CloseIcon style={{cursor: 'pointer', color: COLORS.text}}/>
            </WithChangeOpacity>	        
	    </Stack>    

	)
}



/******************************************************
    @views exported
******************************************************/


/**
 *
 * @Use: render about rows
 * 
 */
export default function FullScreenAboutView(props) {

	const isOnMobile = useCheckMobileScreen(1200);
    const classes = useStyles(isOnMobile)();

    const { 
    	on_apply ,
    	goHandleClose,
		on_click_about,
		data_source_a,
		data_source_b,
		data_source_c,
		data_source_d,
		is_member,
		data_source_index,
		fullScreen_board_root,
    } = props;

    const [ data, setdata ] = useState([])

    useEffect(() => {

    	let res = data_source_a.concat(data_source_b ?? [], data_source_c ?? [], data_source_d ?? [])
    	setdata(res);

    },[is_member, fullScreen_board_root, data_source_index, data_source_a.length, data_source_b.length, data_source_c.length, data_source_d.length])

    return (
        <div className={classes.container}>
            {data.map((data) => {
                return (
                    <RowItem 
                    	{...props} 
                    	data={data}  
                    	on_apply = {on_apply}
                    	goHandleClose = {goHandleClose}
                    	on_click_about = {on_click_about}
                    />
                )
            })}
        </div>
    );
}


/**
 *
 * @Use: show full screen view	
 *
 **/
export function FullScreenMoreView(props){

	const isOnMobile = useCheckMobileScreen(1200);
    const classes = useStyles(isOnMobile)();

    const {  showMore, label, style, should_show_dot } = props;

    const [ showdot, setdot ] = useState( typeof should_show_dot === 'boolean' ? should_show_dot :  true)

    useEffect(() => {
    	setTimeout(() => {
    		setdot(false)
    	},20000)
    },[])

	return (
		<div className={classes.more_view} style={style ?? {}} onClick={showMore} >
		    <span className="red">
				{ label ??  'tell me more' }				
				{ showdot
					?
					<BlinkingDot
						style={{ display: "inline-block", width: "10px", marginLeft: "4px" }}
						blinking
						className="red"
					/>
					:
					<div/>
				}
		    </span>
    	</div>
	)
}


export { AboutRowKind };



