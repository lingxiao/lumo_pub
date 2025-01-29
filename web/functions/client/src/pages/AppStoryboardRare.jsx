/**
 *
 *
 * @Package: AppRareCard Card
 * @Date   : 7/19/2022
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState, useEffect} from 'react'

import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';

import {
	trivialProps,
	ppSwiftTime,
	trivialString,
} from './../model/utils'

import { COLORS } from './../components/constants'
import { useStyles } from './../components/AppBodyTemplate';

import { TwitterCardHero } from './AppInvitePage'
import { useNftvieWstyles }  from './AppStoryboard'

import WithChangeOpacity from './../components/WithChangeOpacity';

import { UserRowBlock } from './AboutSaleView';
import { AppTextFieldNoUnderLine } from './../components/ChatTextInput'



/******************************************************
	@View exported
******************************************************/


/**
 *
 *
 * @Use: app template view w/ progressive
 *       loading of different elemnents
 *
**/
export default function AppStoryboardRare(props){

	const classes    = useStyles();
	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	const { 
		storyboard,
		board_id,
		tellUser,
		onInviteCrew,
	} = props;


	// get data
	const [ update, eupdate ] = useState(0)

	const [ tix_users, etix_users ] = useState({ datasource: [], idx: 0, chunk_size: 5 });

	const [ name, ename ] = useState("")
	const [ img, eimg   ] = useState("");
	const [ about, eabout ] = useState("");
	const [ price, eprice ] = useState(0);

	// view states
	const [ showProgress, eshowProgress ] = useState(false)


	/// load data
	useEffect(async () => {

		if ( trivialProps(storyboard,'get_board_items') || trivialString(board_id) ){
			return;
		}

		// get board root
		let board = await storyboard.get_board({ at: board_id });
		let items = await storyboard.get_board_items({ storyboardID: board_id });

		if ( trivialProps(board,'ID') ){
			return;
		}

		const item = items[0]
		eimg(item.image_url ?? "");
		ename(board.name ?? "");
		eabout(board.about ?? "");
		eprice(board.price_in_eth ?? 0);

		// get all whitelisted users
		await storyboard.fetch_storyboard_whitelist({ storyboardID: board_id, then: ({ success, data }) => {
			var whitelist_items = data
				.sort((a,b) => b.timeStampCreated - a.timeStampCreated)
				.map(item => {
					let tt = ppSwiftTime({ timeStamp: item.timeStampCreated, dateOnly: false });
					let res = { ...item, ppTimeStamp: tt }
					return res;
				})
			// chunk tickts in batchs for easier rendering
			let tix_users_datasource = whitelist_items.reduce((all,one,i) => {
				const ch = Math.floor(i/tix_users.chunk_size); 
				all[ch] = [].concat((all[ch]||[]),one); 
				return all
			}, []);
			etix_users({ ...tix_users, datasource: tix_users_datasource})
		}})

	},[]);

	function get_current_datasource(){
		const { datasource, idx } = tix_users;
		if ( datasource.length === 0 ){
			return []
		} else {
			let _idx = Math.min(datasource.length-1,idx);
			return datasource[_idx];
		}
	}

	function next_page_of_users(){
		const { datasource,  idx } = tix_users;
		let _idx = (idx + 1) > datasource.length - 1 ? 0 : idx + 1;
		etix_users({ ...tix_users, idx: _idx })
	}

	// accept
	async function onAccept(){
		if ( trivialProps(storyboard,'eth_address') || trivialString(board_id) ){
			return tellUser("Oh no! An error occured!")
		} else {
			onInviteCrew(board_id, true)
		}
	}

	function CustomInviteView(){
		return (
			<AboutRareText 
				name={name} 
				about={about} 
				h1={`1/1`}
				h2={`* Price: ${price} ETH`}				
			/>				
		)
	}

	return (
		<div className={tclasses.scroll_container}>
			<TwitterCardHero 
				{...props}
				imageOnLeft
				show_full_image				
				update   = {update}
				img_url  = {img}
				name     = {name}
				address  = {""}
				host     = {{}}
				btn_str  = {'Share private invite'}
				onAccept ={onAccept}
				CustomInviteView = {CustomInviteView}
				showProgress={showProgress}
				storyboard={storyboard}
				style={{marginTop:'36px'}}
			/>							
			<TicketHolderTitle title={'Whitelist'} next_page_of_users={next_page_of_users} data={tix_users} show_next_btn />
			{
				get_current_datasource().map((item,index) => {
					return (
						<UserRowBlock 
							{...props} 
							key={index}
							userID={trivialProps(item,'userID') ? '' : item.userID}
							h2 = {`Whitelisted on ${item.ppTimeStamp ?? ""}`}
							row_style={{marginLeft:'36px', marginRight:'6vw', borderBottom: `0px solid ${COLORS.surface3}`}}
						/>
					)					
				})
			}			
		</div>
	)   

}

/******************************************************
	@View components
******************************************************/


function AboutRareText({  name, about, h1, h2 }){
	return (
		<div style={{marginLeft:'24px'}}>
            <AppTextFieldNoUnderLine
                standard
                hiddenLabel
                disabled
                value = {h1}
                inputProps={{style: inputPropsTitleA}}
                style={{width:'87%'}}
            />                    
            {
            	trivialString(h2)
            	?
            	<div/> 
            	:
	            <AppTextFieldNoUnderLine
	                standard
	                hiddenLabel
	                disabled
	                value = {h2}
	                inputProps={{style: inputPropsTitleA}}
	                style={{width:'87%'}}
	            />                                	

            }
            <AppTextFieldNoUnderLine
                standard
                hiddenLabel
                disabled
                value = {name}
                inputProps={{style: inputPropsTitleB}}
                style={{width:'87%'}}
            />                    
            <AppTextFieldNoUnderLine
                standard
                hiddenLabel
                disabled
                multiline
                numLines={10}
                value = {about}
                inputProps={{style: inputPropsAbout}}
                style={{width:'87%', height:'fit-content'}}
            />                    
		</div>
	)
}


// Ticket hodler title with //> next button
function TicketHolderTitle({ 
	title, 
	next_page_label,
	next_page_of_users, 
	data,
	container_style, 
	title_style, 
	btn_style, 
	show_next_btn
}){

	const classes    = useStyles();
	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	const _btn_style = {
	    fontSize: `16px`,
	    fontFamily: 'NeueMachina-Bold',    
	    color     : COLORS.text3,		
	    cursor: 'pointer', 
	    height: 'fit-content', 
	    marginTop:'6px',
		...(btn_style ?? {}),	    
	}

	const _title_style = {
	    fontSize  : `18px`,
	    color     : COLORS.text3,
	    marginTop : '0px',
	    fontFamily: 'NeueMachina-Bold',    			    
	    ...(title_style ?? {})
	}

	const _container_style = {
		paddingBottom: '4px',
		marginBottom:'16px', 
		marginTop:'12px', 
		marginLeft: '24px',		
		marginRight: '24px',
		width: '90%',
		borderBottom: `0.5px solid ${COLORS.surface2}`, 
		...(container_style ?? {}),
	}

	return (
		<Stack direction='horizontal' style={_container_style}>
        	<div style={_title_style}>
        		{title ?? 'Ticket Holders'}
			</div>		
            <Box sx={{ flexGrow: 1 }} />
            { show_next_btn && !isOnMobile && typeof(next_page_of_users) === 'function'
            	? 
	            <WithChangeOpacity onClick={next_page_of_users}>
	            	<div style={_btn_style}>
						{ !trivialString(next_page_label)
							? 
							next_page_label
							:
							data.datasource.length === 0 
							? "" 
							: `//> page ${data.idx+1}/${data.datasource.length}`
						}
	            	</div>
				</WithChangeOpacity>
				:
				<div/>
			}
		</Stack>
	)	
}


const inputPropsTitleA = {
    fontSize: `calc(12px+1.2vw)`,
    fontFamily: 'NeueMachina-Light',    
    color     : COLORS.text3,
    marginTop: '0px',
}

const inputPropsTitleB = {
    fontSize  : '2vw',
    fontFamily: 'NeueMachina-Black',    
    color     : COLORS.text,
}

const inputPropsAbout = {
    fontSize : '1.5vh',
    color    : COLORS.text2,
    // letterSpacing: '0.5px',
    lineHeight: '1.5em',
    textAlign   : 'left',
    fontFamily  : 'NeueMachina-Medium',
    // filter: `brightness(0.9)`,	
    // fontSize: '18px',
    // fontFamily: 'NeueMachina-Medium',
    // color: COLORS.text2,
    // lineHeight: 1.5,
    // textSpacing: '1px',
    whiteSpace: "break-spaces",
}


export { AboutRareText, TicketHolderTitle }


