/**
 *
 *
 * @Package: AppStoryboardMembership
 * @Date   : 8/7/2022
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState, useEffect} from 'react'
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';

import {
	trivialProps,
	trivialString,
	ppSwiftTime,
} from './../model/utils'

import { useStyles } from './../components/AppBodyTemplate';

import { TwitterCardHero } from './AppInvitePage'
import { useNftvieWstyles }  from './AppStoryboard'
	
import { AboutRareText, TicketHolderTitle } from './AppStoryboardRare';
import { UserRowBlock } from './AboutSaleView';

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
export default function AppStoryboardMembership(props){

	const classes    = useStyles();
	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	const { 
		storyboard,
		board_id,
		navigate,
		tellUser,
		onInviteCrew,
	} = props;


	// get data
	const [ update, eupdate ] = useState(0)

	// view states
	const [ name, ename   ] = useState("");
	const [ img, eimg     ] = useState("");
	const [ price, eprice ] = useState(0);
	const [ about, eabout ] = useState("");

	const [ items, eitems ] = useState([]);
	const [ num_editions, enum_editions ] = useState(1)
	const [ tix_users, etix_users ] = useState({ datasource: [], idx: 0, chunk_size: 20 });

    const [ btn_label, ebtn_label ] = useState('share buy link')
	const [ showProgress, eshowProgress ] = useState(false)

	/// load data
	useEffect(async () => {

		if ( trivialProps(storyboard,'get_board_items') || trivialString(board_id) ){
			return;
		}

		// get board root
		let board = await storyboard.get_board({ at: board_id });
		let items = await storyboard.get_board_items({ storyboardID: board_id });

		if ( trivialProps(board,'ID') || items.length === 0 ){
			return;
		}

		const item = items[0]
		eimg(item.image_url ?? "");
		ename(board.name ?? "");
		eabout(board.about ?? "");
		enum_editions( board.num_items ?? 1 );
		eprice(board.price_in_eth ?? 0);

		// get minted items, and sort LIFO
		var sold_items = items
			.sort((a,b) => a.timeStampCreated - b.timeStampCreated)
			.map(item => {
				let tt = ppSwiftTime({ timeStamp: item.timeStampCreated, dateOnly: false });
				let res = { ...item, ppTimeStamp: tt }
				return res;
			})
		sold_items = sold_items.slice(1,);
		sold_items = sold_items.sort((a,b) => b.timeStampCreated - a.timeStampCreated)
		eitems(sold_items)

		// chunk tickts in batchs for easier rendering
		let tix_users_datasource = sold_items.reduce((all,one,i) => {
			const ch = Math.floor(i/tix_users.chunk_size); 
			all[ch] = [].concat((all[ch]||[]),one); 
			return all
		}, []);

		etix_users({ ...tix_users, datasource: tix_users_datasource})

	},[]);

	// list ticke for sale
	async function onAccept(){
		onInviteCrew(board_id);
	}

	function CustomInviteView(){
		let top = Math.max(0,items.length)
		return (
			<AboutRareText 
				name={name} 
				about={about} 
				h1={`${top}/${num_editions} tokens sold`}
				h2={`* Price: ${price} ETH`}
			/>				
		)
	}

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
				btn_str  = {btn_label}
				progress_text  = {btn_label}
				onAccept ={onAccept}
				CustomInviteView = {CustomInviteView}
				showProgress={showProgress}
				storyboard={storyboard}
				style={{marginTop:'36px'}}
			/>			
			<TicketHolderTitle title="members" next_page_of_users={next_page_of_users} container_style={{width:'85%'}} data={tix_users} show_next_btn />
	        <div style={{width: '85%', marginLeft:'12px' }}>
			{
				get_current_datasource().map((item,index) => {
					return (
						<UserRowBlock 
							{...props} 
							key={index}
							userID={trivialProps(item,'userID') ? '' : item.userID}
							h2 = {`Joined on ${item.ppTimeStamp ?? ""}`}
							row_style={{}}
						/>
					)					
				})
			}
			</div>
		</div>
	)   

}





