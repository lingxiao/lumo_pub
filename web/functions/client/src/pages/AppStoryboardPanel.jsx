/**
 *
 *
 * @Package: AppStoryboardPanel
 * @Date   : June 2nd, 2022
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState, useEffect} from 'react'

import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { createStyles, makeStyles } from "@material-ui/core/styles";

import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import WithChangeOpacity from './../components/WithChangeOpacity';

import { COLORS } from './../components/constants';
import { DarkButton } from './../components/ButtonViews';

import { trivialProps } from './../model/utils'

import { StoryboardKind } from './AppStoryboard';
import {FullScreenMoreView} from './../components/FullScreenAboutView';

/******************************************************
	@View exported
******************************************************/


/**
 *
 *
 * @Use: one app storyboard pannel
 *
**/
export default function AppStoryboardPanel(props){

	const isOnMobile = useCheckMobileScreen(1000);
	const pClasses   = usePanelStyles(isOnMobile)();

	const { 

		// base data
		update,
		storyboard,
		userid,
		is_syndicate,

		focus,
		datasource,
		onFocus,

		// snack
		tellUser,
		on_resume_full_screen,

	} = props;

	const [ _datasource, edatasource ] = useState([]);

	// load story board data
	useEffect(async () => {
		edatasource(datasource)
	}, [storyboard,update, focus, userid, datasource])

	function _is_on(data){
		return !trivialProps(data,'ID') && data.ID == focus
	}

	return (
		<Stack direction='column' 
			className={pClasses.scroll_container} 
			style={{height:`calc(100vh - 208px)`, borderRight: `2px solid ${COLORS.surface3}`}} 
		>

			<div style={{marginLeft:'0px'}}>
				<FullScreenMoreView 
					label={ is_syndicate ? ' /> Frontpage'  : ' /> Stage'} 
					showMore={on_resume_full_screen} 
				/>
				<br/>
			</div>

			{_datasource.map((data,index) => (
				data['ID'] === StoryboardKind.board_header
				? 
				<PanelItem is_header  tip={data.tip ?? ""} label={(data.name ?? "").toUpperCase()} key={index} />
				:
				data['ID'] === StoryboardKind.space
				?
				<br key={index} />
				:
				data['ID'] === StoryboardKind.button
				?
				<div style={{marginLeft:'-6px', marginTop:'8px'}} key={index}>
		            <DarkButton onClick={data.onClick} sx={{borderRadius:4}} > 
	                	{( data['name'] ?? "")}
		            </DarkButton>
				</div>
				:
				data['ID'] === StoryboardKind.coming_soon
				? 
				<PanelItem 
					is_titled
					tip={data.tip ?? ""}
					label={data.name ?? ""} 	
					key={index}
				/>
				:
				<PanelItem 
					tip={data.tip ?? ""}
					label={data.name ?? ""} 	
					clickable is_on={_is_on(data)} 
					on_click={() => {
						onFocus(data)
					}}
					key={index}
				/>

			))}
            <Box sx={{ flexGrow: 1 }} />
		</Stack>
	)


}


/******************************************************
	@style + fragments
******************************************************/


const on_style = {
    fontFamily: 'NeueMachina-Bold',
    textDecoration: 'underline',
    opacity: 1.0,
    cursor:'pointer',
}


function PanelItem({ label, clickable, is_titled, tip, is_on, is_header, on_click }){

	const isOnMobile = useCheckMobileScreen(1000);
	const pClasses   = usePanelStyles(isOnMobile)();

	const coming_soon_style = {
		background: COLORS.black,
		transform: 'rotate(5deg)',
		paddingTop: '6px',
		paddingBottom: '6px',
		textAlign:'center',
		fontSize: '10px',
		borderRadius: '6px',
		width: '100%',
		font: 'NeueMachina-Light',
        // textShadow  : `var(--green-glow)`,     
	}

	if ( is_titled ){
		return (
			<div className={ pClasses.category_header } style={coming_soon_style}>
				{(label ?? "").toUpperCase()}
			</div>		
		)		
	} else if ( (!is_header || clickable) && typeof on_click === 'function' ){
		return (
			<WithChangeOpacity onClick={on_click} style={{cursor:'pointer'}} >
				<div className={ is_header ? pClasses.category_header :  pClasses.category_item } style={is_on ? on_style : {cursor: 'pointer'}} >
					{(label ?? "")}
				</div>		
			</WithChangeOpacity>
		)
	} else {
		return (
			<div className={ pClasses.category_header }>
				{(label ?? "").toUpperCase()}
			</div>		
		)
	}

}



const usePanelStyles = (mobile) => makeStyles((theme) => createStyles({

	scroll_container : {
        width : '120px',
        overflowX: 'hidden',
        overflowY: 'scroll',        
        padding: theme.spacing(3),
        paddingTop: theme.spacing(4),
        marginBottom: '140px',
		background:COLORS.surface,
		position:'fixed',
		left: '0px',
	},

	category_header : {
		width: '100%',
		textAlign: 'left',
		color: COLORS.text3,
		fontSize: '15px',
		fontFamily: 'NeueMachina-Regular',
		paddingTop: theme.spacing(2),
		paddingBottom: theme.spacing(1),
	},

	category_item : {
		width: 'fit-content',
		textAlign: 'left',
		color: COLORS.text3,
		opacity: 0.80,
		fontSize: '14px',
		fontFamily: 'NeueMachina-Medium',
		paddingTop: theme.spacing(1),
		paddingBottom: theme.spacing(1),
    	// letterSpacing: '0.2px',

	},


}));




