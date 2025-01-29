/**
 *
 *
 * @Package: AppStoryboardAcquiredLicense
 * @Date   : June 2nd, 2022
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState, useEffect} from 'react'

import Grid from "@material-ui/core/Grid";

import useCheckMobileScreen from './../hoc/useCheckMobileScreen';

import { COLORS } from './../components/constants';

import {
	split_time,
	useNftvieWstyles,
} from './AppStoryboardFragments';

import { 
	CommandCard,
	ExplainCard,
	NonfungibleTokenCard,
 } from './../components/NonFungibleTokenCard';

import {
	cap,
	trivialProps,
	ppSwiftTime,
	trivialString,
	contractMetamaskAddress,
} from './../model/utils'

import {
	to_social_links
} from './../model/core';


/******************************************************
	@View exported
******************************************************/

/**
 *
 * @Use: one app storyboard pannel
 *
 *
**/
export default function AppStoryboardAcquiredLicense(props){

	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	const { 

		// base data
		update,
		storyboard,
		userid,
		style,

		navigate,
		onEditCollection,

		set_cache_data,
		read_cache_data,		

	} = props;

	const [ datasource, edatasource ] = useState([]);

	useEffect( async () => {

    	let prev_licenses = read_cache_data({
    		name: 'AppStoryboardAcquiredLicense',
    		key : 'licenses',
			mempty: []
		});
    	edatasource(prev_licenses);

		await storyboard.get_acquired_licenses({ then: (licenses) => {
			let data = [0].concat(licenses ?? []);
			edatasource(data);
        	set_cache_data({
				name: 'AppStoryboardAcquiredLicense',
				key: 'licenses',
				value: data,
        	});			
		}});
	},[update, storyboard, userid])

	function onShowCollection(){
		onEditCollection({ hide_top_row: true, hide_bottom_row: false, license_item: {} })
	}

	function onUseLicense(data){
		onEditCollection({ hide_top_row: false, hide_bottom_row: true, license_item: data ?? {} })
	}

	function onGoToProject(data){
		if ( trivialProps(data,'address') ){
			return;
		} else {
			navigate(`/house/${data.address}`)
		}
	}


	return (
		<div className={tclasses.scroll_container_alt} style={{...(style ?? {}),background: COLORS.surface }}>
			<Grid 
				container 
				spacing={0} 
				columns={{ xs: 1, sm: 2, md: 2, lg: 3 }}
			>
				{datasource.map((data,index) => (
					<Grid item xs={12} sm={12} md={6} lg={4} className={tclasses.storyboard_item_container} key={index}>
					{ index === 0 
						?
						<ExplainCard
							key = {index}	
							title='Licenses'
							h1 = {'* This page contains all the licenses you have acquired from other houses'}
							h2 = {`Would you like to license out some of your work and secure passive income from royalties? Click on "Issue License"`}
							header={storyboard.get_name() ?? ""}
							buttonLabel='Issue License'
							onClickButton={onShowCollection}
						/>
						:
						<LicenseProfileCard 
							{...props} 
							key={index} 
							data={data}
							onGoToProject={() => { onGoToProject(data) }}
							onUseLicense ={() => { onUseLicense(data)  }}
						/>
					}
					</Grid>
				))}
			</Grid>      
		</div>
	)


}


/******************************************************
	@View component
******************************************************/


/**
 *
 * @Use: one storybaord card
 *
 **/
function LicenseProfileCard(props){

	const {
		data,
		update,
		storyboard,
		nft_cache,
		user_cache,
		onGoToProject,
		onUseLicense,
	} = props;


	// view state
	const [ time, etime ] = useState("");
	const [ name, ename ] = useState("_");
	const [ image_url, eimage_url ] = useState("");
	const [ address, eaddress ] = useState('');
	const [ invitedby, einvitedby ] = useState({ h1: "From", h2: '' })

	const [ thisisme, ethisisme ] = useState(false);
	const [ incomplete, eincomplete ] = useState(false);

	useEffect(async () => {

		if ( trivialProps(data,'ID') ){
			return;
		}

		// destructure item
		const { projectID, image_url, userID, timeStampLicensed, itemID } = data;

		await nft_cache.getStoryBoard({ address: projectID, fast: true, then: (licensed_board) => {

			if ( trivialProps(licensed_board,'eth_address') ){
				return;
			}

			let addr = contractMetamaskAddress({ pk: projectID, n: 5, m:3 });
			let licensed_time = ppSwiftTime({  timeStamp: timeStampLicensed, dateOnly: true });

			eaddress(addr);
			ename(licensed_board.get_name());
			eimage_url(image_url);
			etime(licensed_time);

		}});

		await user_cache.get({ userID: userID, then: (user) => {
			einvitedby({ h1: "Created by", h2: user.name ?? "" })
		}})

	}, [data, update, storyboard])


	async function onClickt3right(){
		alert('onClickt3right')
	}

	function onClickTitle(){
		return;
	}

	async function onClickSocialLink(link){
		if ( trivialProps(link,'value') || trivialString(link.value) ){
			return;
		} else {
            let win = window.open(link.value, '_blank');
            win.focus();			
		}
	}

	return (
        <NonfungibleTokenCard
        	style={{
        		margin:'8px',
        		marginTop:'16px',
        		marginBottom: '16px',
        	}}
        	data         = {data}
        	header_left  = {''}
        	header_right = {''}
			t1_left     = {'Licensed Item'}
			t1_right    = {''}
			t2          = {name}
			t3_left     = {invitedby['h1'] ?? ""}
			t3_right    = {invitedby['h2'] ?? ""}
			t4_top      = {'Licensed on'}
			t4_middle   = {split_time(time, 0)}
			t4_bottom   = {split_time(time,1)}
			t5_top      = {"Address"}
			t5_bottom   = {address}
			footer_left  = {name.toUpperCase()}
			footer_right = {'show more'}
			image_url   = {image_url}
			table_title = {""}

			table_data_source = {[]}
			hide_table_values = {true}

			action_btn_text = {'Use License'}
			onClickActionBtn = {onUseLicense}

			onClickt3right     = {cap}
			onClickt5_bottom   = {cap}
			onClickTitle       = {onGoToProject}
			onClickUser        = {onGoToProject}
			onClickFooterRight     = {cap}
			onClickCardRightHeader = {cap}
		/>
	)

}


