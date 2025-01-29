/**
 *
 *
 * @Package: AppStoryboardCrew
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
	ExplainCard,
	NonfungibleTokenCard,
 } from './../components/NonFungibleTokenCard';

import {
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
 *
 * @Use: one app storyboard pannel
 *
**/
export default function AppStoryboardCrew(props){

	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	const { 

		// base data
		update,
		storyboard,
		userid,
		style,

		// snack
		onInviteCrew,

	} = props;

	const [ datasource, edatasource ] = useState([]);
	const [ _is_owner, eis_owner ] = useState(false);

	useEffect( async () => {

		let crew = await storyboard.read_crew();
		let is_owner = await storyboard.is_owner();
		eis_owner(is_owner)

		if ( is_owner ){
			let data_source = [0].concat(crew);
			edatasource(data_source);
		} else {
			edatasource(crew);
		}

	},[update, storyboard, userid]);


	return (
		<div className={tclasses.scroll_container_alt} style={{...(style ?? {}),background: COLORS.surface }}>
			<Grid 
				container 
				spacing={0} 
				columns={{ xs: 1, sm: 2, md: 2, lg: 3 }}
			>
				{datasource.map((data,index) => (
					<Grid item xs={12} sm={12} md={6} lg={4} className={tclasses.storyboard_item_container} key={index}>
					{ index === 0 && _is_owner
						?
						<ExplainCard
							title='Core Team'
							h1 = {'* Do you know someone that would contribute to this team?'}
							h2 = {`Invite them to join!`}
							header={storyboard.get_name() ?? ""}
							buttonLabel='invite'
							onClickButton={onInviteCrew}
						/>
						:
						<CrewProfileCard {...props} data={data}/>
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
function CrewProfileCard(props){

	const {
		data,
		update,
		storyboard,
		user_cache,
		onEditProfile,
	} = props;


	// view state
	const [ time, etime ] = useState("");
	const [ name, ename ] = useState("");
	const [ image_url, eimage_url ] = useState("");
	const [ address, eaddress ] = useState('');
	const [ invitedby, einvitedby ] = useState({ h1: "Invited by", h2: '' })
	const [ links, elinks ] = useState([])

	const [ seed_str, eseed_str ] = useState("");

	useEffect(async () => {

		if ( trivialProps(data,'crewUserID') ){
			return;
		}

		let authed_user = await user_cache.getAdminUser();

		// set ownership data
		await user_cache.get({ userID: storyboard.get_owner_user_id(), then: (owner) => {
			if (trivialProps(owner,'userID')){
				return;
			}
			if ( owner.isMe(data.crewUserID)  ){
				einvitedby({ h1: 'House Owner', h2: "" })
			} else {
				einvitedby({ h1: 'Invited By', h2: owner.name ?? "" })
			}		
		}})

	await user_cache.get({ userID: data.crewUserID ?? "", then: (user) => {

			if ( trivialProps(user,'userID') || trivialString(user.userID) ){
				return 
			}

			let pk = trivialProps(user,'metamask_pk') 
				? (data['crew_eth_address'] ?? "")
				: (user['metamask_pk'] ?? "");

			let addr = contractMetamaskAddress({ pk: pk, n: 5, m:3 })
			let _name = (user['name'] ?? "") ?? (data['name'] ?? "");

			ename(_name);
			eaddress( addr );

			eimage_url( user.profile_image_preview_url );			
			eseed_str( user.sprite_str_default() );

			// const { social_links } = data;
			let model_links = to_social_links(user.view);
			elinks(model_links)

			let raw_time = (data['timeStampCreated'] ?? "")
			etime(ppSwiftTime({ timeStamp: raw_time,  dateOnly: true }));

		}});


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

	// min card
	const [ full_image, efull_image ] = useState(false)
	function minimizeCard(){
		efull_image(false)
	}
	function maximizeCard(){
		efull_image(true)		
	}

	return (
        <NonfungibleTokenCard
        	style={{
        		margin:'8px',
        		marginTop:'16px',
        		marginBottom: '16px',
        	}}
        	data         = {data}
        	full_image   = {full_image}
        	header_left  = {''}
        	header_right = {''}
			t1_left     = {'Team member'}
			t1_right    = {''}
			t2          = {name}
			t3_left     = {invitedby['h1'] ?? ""}
			t3_right    = {invitedby['h2'] ?? ""}
			t4_top      = {'Joined on'}
			t4_middle   = {split_time(time, 0)}
			t4_bottom   = {split_time(time,1)}
			t5_top      = {"Address"}
			t5_bottom   = {address}
			footer_left  = {name.toUpperCase()}
			footer_right = {'show more'}
			image_url   = {image_url}
			table_title = {"Links"}
			table_data_source = {links}
			hide_table_values = {true}

			seed_str = {seed_str}

			onClickt3right     = {onClickt3right}
			onClickTitle       = {onClickTitle}
			onClickt5_bottom   = {onClickTitle}
			onClickUser        = {onClickSocialLink}
			onClickFooterRight     = {minimizeCard}
			onClickCardRightHeader = {maximizeCard}
		/>
	)

}


