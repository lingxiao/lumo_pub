/**
 *
 *
 * @Package: AppStoryboardLicense
 * @Date   : 7/19/2022
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

import {
	home_page_url
} from './../model/core';

import { TwitterCardHero } from './AppInvitePage'
import { useNftvieWstyles }  from './AppStoryboard'
	
import { AboutRareText, TicketHolderTitle } from './AppStoryboardRare';
import { UserRowBlock } from './AboutSaleView';

import DialogEditLicense from './../dialogs/DialogEditLicense';

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
export default function AppStoryboardLicense(props){

	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	const { 
		storyboard,
		board_id,
		navigate,
		user_cache,
		onInviteCrew,
	} = props;


	// get data
	const [ update, eupdate ] = useState(0)

	// view states
	const [ name, ename ] = useState("")
	const [ img, eimg   ] = useState("");
	const [ about, eabout ] = useState("");
	const [ percent, epercent ] = useState(0);

	const [ items, eitems ] = useState([]);
	const [ num_editions, enum_editions ] = useState(1)
	const [ tix_users, etix_users ] = useState({ datasource: [], idx: 0, chunk_size: 10 });

	const [ can_license, ecan_license ] = useState(true);
    const [ btn_label, ebtn_label ] = useState('share license link')
    const [ show_edit_btn, eshow_edit_btn ] = useState(false);
	const [ showProgress, eshowProgress ] = useState(false)

	const [ open_edit, eopen_edit ] = useState(false)

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
		eimg   (item.image_url ?? "");
		ename  (board.name ?? "");
		eabout (board.about ?? "");
		enum_editions( board.num_items ?? 1 );
		epercent(board.percent_rake ?? 0);

		// check if item can be licnsed
		await storyboard.can_license_item({ itemID: item.ID, then: ({ can_license, message }) => {
			ecan_license(can_license);
		}});

		// check if license can be edited
		let admin = await user_cache.getAdminUser();
		if ( board.userID === admin.userID ){
			eshow_edit_btn(true);
		}


		// get all members who licensed from this:
		let licensors = await storyboard.get_all_licensors({ storyboardID: board_id, then: (licenses) => {

			// get licenses, sort LIFO
			var licensed_items = licenses
				.sort((a,b) => a.timeStampCreated - b.timeStampCreated)
				.map(item => {
					let tt = ppSwiftTime({ timeStamp: item.timeStampCreated, dateOnly: false });
					let res = { ...item, ppTimeStamp: tt }
					return res;
				})
			licensed_items = licensed_items.sort((a,b) => b.timeStampCreated - a.timeStampCreated)
			eitems(licensed_items);

			// chunk tickts in batchs for easier rendering
			let tix_users_datasource = licensed_items.reduce((all,one,i) => {
				const ch = Math.floor(i/tix_users.chunk_size); 
				all[ch] = [].concat((all[ch]||[]),one); 
				return all
			}, []);

			etix_users({ ...tix_users, datasource: tix_users_datasource});

		}});



	},[]);

	// ************************************************************************
	// responders

	async function onClickEditBoard(){
		eopen_edit(true);
	}

	function onClickLicensedTarget(data){
		if ( trivialProps(data,'licensing_projectID') ){
			return;
		}
		let id = data.licensing_projectID;
        let root = home_page_url();
        let url  = `${root}/house/${id}`;
        let win  = window.open(url, '_blank');
        win.focus();

	}

	// list ticke for sale
	async function onAccept(){

		await storyboard.generate_license_invite({ storyboardID: board_id, then: async (link, invite_id) => {
			onInviteCrew("", false, {url: link, title: "Invite to license"});
		}})
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

	// ************************************************************************
	// view responders

	function CustomInviteView(){
		let top = Math.max(0,items.length)
		return (
			<AboutRareText 
				name={name} 
				about={about} 
				h1={`${top}/${num_editions} licenses claimed`}
				h2={`** Royalty: ${percent}% of each sale`}
			/>				
		)
	}

	return (
		<div>
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
				hide_button={!can_license}
				aux_btn_label={'Edit License'}
				onClickAuxBtn={show_edit_btn ? onClickEditBoard : false}
			/>			
			<TicketHolderTitle title={'License holders'} container_style={{width:'85%'}} next_page_of_users={next_page_of_users} data={tix_users} show_next_btn />
	        <div style={{width: '85%', marginLeft:'12px' }}>
			{
				get_current_datasource().map((item,index) => {
					return (
						<UserRowBlock 
							{...props} 
							key={index}
							onClick={() => { onClickLicensedTarget(item) } }
							userID={trivialProps(item,'userID') ? '' : item.userID}
							h2 = {`Licensed on ${item.ppTimeStamp ?? ""}`}
							row_style={{marginLeft:'36px', width:'85%'}}
						/>
					)					
				})
			}
			</div>
		</div>
		<DialogEditLicense
            {...props}
            storyboard={storyboard}
			board_id={board_id}
			open={open_edit}
            handleClose= {() => { eopen_edit(false) }}
		/>
		</div>
	)   

}





