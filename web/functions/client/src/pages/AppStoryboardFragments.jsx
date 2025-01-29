/**
 *
 *
 * @Package: AppStoryboardFragment
 * @Date   : March 30th, 2022
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState, useEffect} from 'react'

import Stack from '@mui/material/Stack';
import Grid from "@material-ui/core/Grid";
import Box from '@mui/material/Box';
import { createStyles, makeStyles } from "@material-ui/core/styles";

import useCheckMobileScreen from './../hoc/useCheckMobileScreen';

import CloseIcon from '@mui/icons-material/Close';

import { COLORS }    from './../components/constants';

import icon_play from './../assets/icon_play.svg'
import icon_pause    from './../assets/icon_pause.svg'
import WithChangeOpacity from './../components/WithChangeOpacity';

import {
	trivialProps,
	trivialString,
} from './../model/utils'

import { StoryBoardCardBasic } from './AppStoryboardSlate';


/******************************************************
	@styles
******************************************************/


// trello board styles
const useNftvieWstyles = (mobile, project_name) => makeStyles((theme) => createStyles({

	scroll_container : {
        height: `calc(100vh - 170px)`,
        overflowY: 'scroll',        
		paddingTop: '16px',
	},

	scroll_container_alt : {
        height: `calc(100vh - 152px)`, 
        overflowY: 'scroll',     
        // background:'blue'
	},

	no_scroll_container : {
        height: `calc(100vh - 152px)`, 
        // background:'blue'
	},

	// bounty block
	bounty_block : {
		padding: theme.spacing(4),
	},

	storyboard_item_container : {
        display    : "flex",          
        alignItems : 'center',
        // border: `0.8px solid ${COLORS.translucent}`,
	},

    bounty_header: {
        height    : '20px',
        display   : 'flex',
        marginLeft : theme.spacing(2),
        marginRight: theme.spacing(2),
        borderBottom: `1px solid ${COLORS.offwhite}`,        
    }, 

    // hero
    hero_container : {
    	padding: theme.spacing(2),
    	paddingBottom: theme.spacing(6),    
    },
  	
  	hero_right: {
    	marginTop  : theme.spacing(2),
    	height:'90%',
    },

    mintButton :{
        height: '50px',
        width: '100%',
    },        

    play_icon : {
	    position: 'absolute',
	    top: '50%',
	    left: '50%',
	    marginTop: '-50px',
	    marginLeft: '-50px',
	    width: '100px',
	    height: '100px',
	    opacity: 0.0,
	    '&:hover': {
	    	opacity: 0.75
	    },
	},

	feature_box : {
		border: `1px solid ${COLORS.surface3}`,
		height: '100%',
		padding: theme.spacing(2),
	},

	feature_box_child : {
		width: '30%'
	},

	feature_box_child_h1: {
		fontSize: '20px',
		fontFamily: 'NeueMachina-Black',
		color: COLORS.text,		
		paddingBottom: mobile ? '0px' : theme.spacing(2),
		paddingTop: !mobile ? '0px' : theme.spacing(2),
	},

	feature_box_child_h1b: {
		fontSize: '18px',
		fontFamily: 'NeueMachina-Light',
		color: COLORS.text,		
		paddingBottom: mobile ? '0px' : theme.spacing(2),
		paddingTop: !mobile ? '0px' : theme.spacing(2),
	},

	feature_box_child_h2 : {
		fontSize: '14px',
		fontFamily: 'NeueMachina-Medium',
		color: COLORS.text3,		
		lineHeight: 1.5,
		paddingRight: theme.spacing(2.5),
		marginTop:'6px',
	},

}));




// parse time
function split_time(time,idx){
	let ts = time.split(' ');
	if ( ts.length === 3 ){
		let [ m, d, y ] = ts;
		if ( idx === 0 ){
			return `${m} ${d}`
		} else { 
			return y 
		}
	} else {
		return time
	}
}



/******************************************************
	@Feature box
******************************************************/

/**
 *
 * @use: feature box
 *
 */
function FeatureBox({ onClick, style, always_on, datasource, no_bottom, no_top, content_style }){

	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	function BoxItem({ data }){

		const [ hovered, ehovered ] = useState(false)

	    function onMouseEnter(){
	    	if ( isClickable() ){
		    	ehovered(true)
		    }
	    }
	    function onMouseLeave(){
	    	if ( isClickable() ){
		    	ehovered(false)
		    }
	    }	

	    function _onClick(data){
	    	if ( isClickable() ){
		    	onClick(data);
		    } else {
		    	return;
		    }
	    }

	    function isClickable(){
	    	return typeof onClick === 'function';
	    }

		return (
			<div 
				style={typeof onClick === 'function' ? {cursor:'pointer'}: {}}
				onMouseEnter={onMouseEnter} 
				onMouseLeave={onMouseLeave}
				onClick={() => { _onClick(data) }}
			>
				<div 
					className={tclasses.feature_box_child_h1}
					style={ hovered ? {textDecoration:'underline'} : {}}
				>
					{`${data.key.toUpperCase()}`}
				</div>
				<div 
					className={tclasses.feature_box_child_h2}
					style={{  ...(content_style ?? {}),  ...(hovered || always_on ? {color:'white'} : {}) }}
				>
					{data.value}
				</div>
			</div>
		)
	}

	var container_style = {
		...(style ?? {}),
			
	}

	if ( no_bottom ){
		container_style = { ...container_style, borderBottom: '0px solid black'}
	}

	if ( no_top ){
		container_style = { ...container_style, borderTop: '0px solid black'}		
	}


	return (
		<div className={tclasses.feature_box} style={container_style}>
			<Grid 
				container 
				spacing={0} 
				columns={{ xs: 1, sm: 1, md: 3, lg: 3 }}
			>
				{datasource.map((data,index) => (
					<Grid item xs={12} sm={12} md={4} lg={4} className={tclasses.feature_box_child} key={index}>
						<Stack direction={'column'}>
							<BoxItem data={data} />
						</Stack>
					</Grid>
				))}
			</Grid>    		
		</div>
	)	
}


	

/******************************************************
	@Play icon
******************************************************/


/***
 *
 * @use: play icon that displays when hovering
 *
 **/
function PlayIcon({ onClick, showPause }){

	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	return (
		<WithChangeOpacity onClick={onClick} style={{cursor:'pointer'}} >
			{ showPause
				?
				<img alt={""} src={icon_pause} className={tclasses.play_icon}/>
				:
				<img alt={""} src={icon_play} className={tclasses.play_icon}/>
			}
		</WithChangeOpacity>
	)
}




/******************************************************
	@View full screennft table
******************************************************/


/**
 *
 * @use: table of nfts
 *
 */
function FullScreenTokenTable(props){

	const { 
		storyboard, 
		board_root, 
		update,
		style, 
		goHandleClose,
	} = props;

	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	const [ datasource, edatasource ] = useState([]);
	const [ name, ename ] = useState("")

	useEffect(async () => {

		let all_roots = storyboard.get_board_roots();

		var current_root = board_root;
		var current_id = trivialProps(board_root,'storyboardID') ? '' : board_root.storyboardID;

		if ( trivialString(current_id) ){
			let roots = storyboard.get_board_roots()			
			if ( roots.length > 0 && !trivialProps(roots[0], 'storyboardID') ){
				current_root = roots[0];
				current_id = roots[0].storyboardID
			}
		}

		edatasource([]);
		setTimeout(() => {
			ename(current_root.name ?? "")
			let items = storyboard.get_board_items({ storyboardID: current_id })
			edatasource(items)
		},400)


	}, [storyboard, board_root, update]);

	const container = {
		height    : '100vh',
		overflow  : 'hidden',
		overflowY : "scroll",
		marginTop : '4vh',
	}

	return (
		<div style={{...container, ...(style ?? {})}}>
			<_TableHeader label={name ?? ""} on_close={goHandleClose}/>
			<Grid container spacing={0} columns={{ xs: 1, sm: 2, md: 2, lg: 3 }} style={{marginTop:'16px'}}>
				{datasource.map((data,index) => (
					<Grid 
						key={index}
						item xs={12} sm={12} md={6} lg={4} 
						className={tclasses.storyboard_item_container} 
					>
						<StoryBoardCardBasic {...props} data={data} key={index}/>
					</Grid>
				))}
			</Grid>      
			<br/><br/><br/><br/><br/><br/><br/><br/>
		</div>
	)

}


/**
 *
 * @use: board header
 *
 **/
function _TableHeader({ label, on_close }){

	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	const txt_style = {
		color: COLORS.text,
	    fontFamily: 'NeueMachina-Black',		
		fontSize:`48px`,
	}

	const _container = {
        display   : 'flex',
        marginLeft : '24px',
        marginRight: '24px',
        borderBottom: `1px solid ${COLORS.offwhite}`,
	}

	return (
	    <Stack direction='row' style={_container}>
           	<div style={txt_style}>{(label ?? 'collection').toUpperCase()}</div>
	        <Box sx={{ flexGrow: 1 }} />
            <WithChangeOpacity onClick={on_close}>
                <CloseIcon style={{cursor: 'pointer', color: COLORS.text}}/>
            </WithChangeOpacity>	        
	    </Stack>    

	)
}

/******************************************************
	@export
******************************************************/


export {

	useNftvieWstyles,
	split_time,
	PlayIcon,

	// full screen table
	FullScreenTokenTable,
	FeatureBox,
}


/******************************************************
	@depricated
******************************************************/
