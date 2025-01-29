/**
 *
 *
 * @Package: AppStoryboard
 * @Date   : March 3rd, 2022
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState, useEffect} from 'react'
import {Helmet} from "react-helmet";

import AppFooter   from './../components/AppFooter';
import AppSnackbar from './../components/AppSnackbar';

import { GiphBackgroundView,RemoteVideoBackgroundView, } from './../components/VideoBackground';

import useCheckMobileScreen from './../hoc/useCheckMobileScreen';

import {FullScreenMoreView} from './../components/FullScreenAboutView';
import FullScreenCommandView from './../components/FullScreenCommandView';

import { COLORS }    from './../components/constants';
import { useStyles } from './../components/AppBodyTemplate';

// home page panels
import SaleMenuView  from './../components/SaleMenuView';
import AboutSaleView from './AboutSaleView';
import TicketMachine from './TicketMachine';

// dashboard pages
import AppHeaderPage         from './AppHeader';
import AppStoryboardPanel    from './AppStoryboardPanel'
import AppStoryProfile       from './AppStoryboardProfile';
import AppStoryboardCrew     from './AppStoryboardCrew'
import AppStoryboardSlate    from './AppStoryboardSlate';
import AppStoryboardContract from './AppStoryboardContract';
import AppStoryboardGnosis   from './AppStoryboardGnosis';
import AppStoryboardFiat     from './AppStoryboardFiat';
import AppStoryboardAcquiredLicense   from './AppStoryboardAcquiredLicense';

import {
	trivialProps,
	trivialString,
} from './../model/utils'

import {
	CollectionKind,
	urlToFileExtension,
	TokenContentKind,
	home_page_url,
	GLOBAL_STAGING,
    AppBloggerItem,    
} from './../model/core'

import {
	PlayIcon,
	split_time,
	FullScreenTokenTable,
	useNftvieWstyles,
} from './AppStoryboardFragments';

/******************************************************
	@enums 
******************************************************/


const StoryboardKind = {
	about     : '_about',
	crew      : '_crew',
	patrons   : 'patrons',	
	license   : 'license',
	membership: 'membership',

	board_header: 'board_header',	
	space       : 'space',
	button      : 'button',
	coming_soon : 'coming_soon',

	// finance
	contract   : 'contract',
	gnosis_safe: 'gnossis_safe',
	stripe     : 'stripe',
}


const FullScreEnmodal = {
	none  : 'none', 
	about : 'about', 
	minted: 'minted', 
	tickets:'tickets',
}


const board_header  = (str, tip) => { return { name: str, ID: StoryboardKind.board_header, tip: tip ?? "" } };
const space_header  = {  name: '' , _ID: StoryboardKind.space }



/******************************************************
	@load datasource
******************************************************/


/**
 *
 * @Use: get full screen data soruce for `AboutSaleView`
 *
 */
async function getFullScreenAboutDatasource({ userID, storyboard, }){

	if ( trivialProps(storyboard,'eth_address') ){
		return [];	
	}

	// load board data
	let hero = storyboard.get_first_root();
	let crew     = await storyboard.read_crew();
	let editable = false;
	const { about } = hero;

	var datasource = [
	    {blocktype: AppBloggerItem.text_h1, left: 'About', right: 'this project', editable: editable, on_click: () => {return} },
	    {blocktype: AppBloggerItem.social, datasource: storyboard.social_links ?? [], left: "", right: "", editable: false, on_click: () => { return } },
	    {blocktype: AppBloggerItem.text_h4, text: about ?? ""},
	    {blocktype: AppBloggerItem.space},
	]

	if ( crew.length > 0 ){
		var crew_header = [
		    {   blocktype: AppBloggerItem.text_h1, 
		    	text: '', 
		    	left: '', 
		    	right: 'Core Team', 
		    	editable: !trivialString(userID),
		    	edit_add: true, 
		    	on_click: () => { return } 
		    },         
		];
		datasource = datasource.concat(crew_header)

		crew.forEach(data => {
			const { social_links } = data;
			let base = {
				blocktype: AppBloggerItem.crew,
				editable: editable,
		    	on_click: () => { return },
		    	icon_datasource: social_links ?? []
			}
			let block_item = { ...data, ...base }
			datasource.push(block_item)
		});
	}

	datasource.push({ blocktype: AppBloggerItem.space });

	return datasource;
}



/**
 *
 * @use: load storyboard panel datasource
 *
 **/
async function getBoardsPanelDatasource({
	storyboard, 
	onEditCollection,
	onInviteCrew,
	onImport,
	onPayme,
	is_syndicate,
}){

	let is_owner = await storyboard.is_owner();
	let is_member = await storyboard.is_member();

	var prefix = [ 
		board_header ('General', 'General information about your film' ), 
		{ name: 'About', ID: StoryboardKind.about },
		{ name: 'Core Team' , ID: StoryboardKind.crew  },
	]

	var infix = [
		space_header,
		board_header('collections', 'Create nft collections as community rewards'),
	]

	// if ( is_owner ){
		// prefix.push({ name: '+invite', ID: StoryboardKind.button, onClick: () => { onInviteCrew("") } })		
	// }

	prefix = prefix.concat(infix);
	let boards = await storyboard.get_board_roots();
	prefix = prefix.concat(boards);

	if ( is_owner || is_member){
		prefix.push({ name: '+collection', ID: StoryboardKind.button, onClick: onEditCollection });
	}

	// prefix.push({ name: '** import'  , ID: StoryboardKind.button, onClick: onImport })

	// licenses
	prefix = prefix.concat([
		space_header,
		board_header('licenses', 'Properties licensed to you'),
		{ name: 'Holding', ID: StoryboardKind.license },
	])

	// finances
	prefix = prefix.concat([
		// space_header,
		space_header,
		board_header('finance', 'Create contracts for your project'),
	])

	let contract = storyboard.get_contract({ at: "" });    	
	prefix.push({ name: 'Treasury'   , ID: StoryboardKind.gnosis_safe });
	prefix.push({ name: 'Multi-token', ID: StoryboardKind.contract    });
	prefix.push({ name: 'Fiat'       , ID: StoryboardKind.stripe      });

	prefix = prefix.concat([
		space_header,
		board_header('vault', 'place nonfungibles into a vault to create collateralized funding obligations')
	])
	prefix.push({ name: 'Coming soon!', ID: StoryboardKind.coming_soon });	

	return prefix;
}


/******************************************************
	@View exported
******************************************************/


/**
 *
 *
 * @Use: app storyboard home page
 *
**/
export default function AppStoryboard(props){

	const classes    = useStyles();
	const isOnMobile = useCheckMobileScreen(1000);

	const { 

		// base data
		update,
		storyboard,
		full_screen,
		userid,
		panel_focus,
		is_syndicate,

		chain_id,
		did_change_chain,
		metamask_acct_changed,

		// full screen fn
		on_exit_fullscreen,
		on_full_screen,

		// other fn
		onNavToTwitter,
		onNavToStoryEtherscan,
		onEditCollection,
		onInviteCrew,
		onImport,
		onPayme,

		// snack
		show_snack,
		snack_message,
	} = props;

	let default_focus = StoryboardKind.contract; // StoryboardKind.crew

	/******************************************************
		@load data from db
	******************************************************/

	// full-screen-hero
	const [ is_member, eis_member ] = useState(false);
	const [ film_name, efilm_name ] = useState("");
	const [ film_logo, efilm_logo ] = useState("");
	const [ film_address, efilm_address ] = useState("");
	const [ crew_subtitle, ecrew_subtitle ] = useState("");

	// full-screen-header
	const [ fullscreenmodal, efullscreenmodal ] = useState(FullScreEnmodal.none)
	const [ fullScreen_board_root, efullScreen_board_root ] = useState({});
	const [ fullscreen_header_datasource, efullscreen_header_datasource  ] = useState([])

	// full screen about datasource
	const [ about_sale_datasource, eabout_sale_datasource ] = useState([]);

	// backstage-dashboard-side-bar
	const [ focusPanel, efocusPanel  ] = useState(default_focus)
	const [ panel_datasource, epanel_datasource ] = useState([]);

	// change focus panel
	function onFocusPanel(item){
		tellUser("");
		if (  !trivialProps(item,'ID') ){
			efocusPanel("");
			setTimeout(() => {
				efocusPanel(item.ID);
			},10)
		}
	}

	/***
	 *
	 * @use: on arrival, load light data,	  
	 *       sync with server for full story,
	 *       then load heavy data
	 *
	**/
	useEffect(async () => {

		efullscreenmodal(FullScreEnmodal.none);

		await load_light_data();

		// sync full, the reload data again
		await storyboard.syncFull({ then: async () => {
			await load_heavy_data();
			if ( fullscreen_header_datasource.length <= 1 ){
				await load_heavy_data();
			}
		}});
	}, [storyboard,update,userid]);
	// }, [userid, update, storyboard]);


	// load data on chain id changed
	// on chain update, change btn state
	useEffect(async () => {
		if ( !trivialString(chain_id) ){
			tellUser(`You are now on chain ${chain_id}`);
			setTimeout(() => {
				tellUser("")
			},3000)		
		}
	},[chain_id, did_change_chain]);		

	// on acct changed, go back to full screen
	useEffect(() => {
		on_full_screen();
		tellUser("You changed your metamask account");
		setTimeout(() => { tellUser("") },3000);
	},[metamask_acct_changed])

	/***
	 *
	 * @use: on arrival, load 
	 *	   - fullscreen-header
	 *     - fullscreen-data
	 *     - dashboard-panel
	 *     - dashboard-data
	 * 
	 **/
	async function load_light_data(){

		// get hero image + permissions
		let hero_img = storyboard.get_hero_image();
		let can_edit = await storyboard.is_member();
		let is_owner = await storyboard.is_owner();
		let hero     = storyboard.get_first_root();

		eis_member(can_edit)
		efull_img_screen_url(hero_img)
		efull_preview_img_url(storyboard.get_preview_hero_img())

		if ( !trivialProps(storyboard,'get_name') ){
			efilm_name(storyboard.get_name());
		}

		if ( !trivialProps(storyboard,'root') ){
			efilm_logo(storyboard.root.logo_url ?? "")
		}

		// set header data
		await _load_full_screen_header_data();

		// set footer contract address
		let contract_address = storyboard.get_any_contract_address();
		let imported_contract_addr = storyboard.get_imported_contract_address();

		if (  !trivialString(contract_address) ){
			efilm_address(contract_address)			
		} else if ( !trivialString(imported_contract_addr) ){
			efilm_address(imported_contract_addr)
		} else {
			efilm_address(storyboard.eth_address)
		}

	}

	async function _load_full_screen_header_data(){

		let can_edit = await storyboard.is_member();
		let is_owner = await storyboard.is_owner();		

		// get full screen header data
		var header = [{ str: 'About', tip: 'About this project',  onClick: () => { 
			efullscreenmodal(FullScreEnmodal.about) 
		} }]

		// push all storyboards
		let board_roots = storyboard.get_board_roots();
		let board_names = board_roots
			.filter(r => r.kind !== CollectionKind.rare && r.kind !== CollectionKind.license)
			.map(r => {

				let _tip = (r['about'] ?? "").slice(0,100)
				let kind = r['kind']
				let show_ticket_machine = kind === CollectionKind.tickets 
					|| kind === CollectionKind.membership

				let blob = {
					str: r['name'] ?? "",
					tip: _tip,
					data: r,
					kind: r['kind'] ?? "",
					isTicket: kind === CollectionKind.tickets,
					isMemberTok: kind === CollectionKind.membership,
					onClick: async () => {
						efullScreen_board_root(r);
						efullscreenmodal(false)
						setTimeout(() => {
							if ( show_ticket_machine ){
								efullscreenmodal(FullScreEnmodal.tickets)						
							} else {
								efullscreenmodal(FullScreEnmodal.minted)						
							}
						},50)
					}
				}
				return blob;
		});
		header = header.concat(board_names);

		if ( is_owner || can_edit ){
			let tip = `Manage your project`;
			header.push({ 
				str: 'backstage',
				tip: tip,  
				rotate: true, 
				onClick: async () => { 
					efullscreenmodal(FullScreEnmodal.none);
					on_exit_fullscreen();
			}})
		}
		efullscreen_header_datasource(header);

	}

	// @use: load heavier data set that may take 
	//       a while to sync from the server
	async function load_heavy_data(){

		// get full-screen-datasource
		let sale_datasource = await getFullScreenAboutDatasource({
			userID: userid,
			storyboard: storyboard,
		});
		eabout_sale_datasource(sale_datasource)

		// set play btn if trailer exists
		await storyboard.get_trailer({ then: (data) => {
			if ( data.length > 0 ){
				eshow_play_btn(true);
			}
		}});

		// get crew name
		await storyboard.pretty_print_crew_names({ then: async (str) => {
			ecrew_subtitle(str);
		}});

		// reload header after collections
		// have been loaded
		await _load_full_screen_header_data();

		// set backstage side panel
		let valid_panel = typeof panel_focus === 'string'
			   || Object.values(StoryboardKind).includes(panel_focus);
			   
		efocusPanel( valid_panel ? panel_focus : default_focus)
		let panel_datasource = await getBoardsPanelDatasource({ 
			storyboard, 
			onEditCollection, 
			onInviteCrew, 
			onImport,
			onPayme,
			is_syndicate
		});
		epanel_datasource(panel_datasource);
	}

	/******************************************************
	   @play video
	******************************************************/

	// play back mode
	const [ show_play_btn, eshow_play_btn ] = useState(false);
	const [ is_playing, eis_playing ] = useState(false);
	const [ full_img_screen_url, efull_img_screen_url ] = useState("");
	const [ full_preview_img_url, efull_preview_img_url] = useState("");

	// play trailer mp4
	async function go_play_trailer_video(){

		let sorted_trailers =  storyboard.read_trailer();

		if ( sorted_trailers.length > 0 ){
			eshow_play_btn(true);
		} else {
			tellUser("Oh no! We can't find the trailer for this film");
		}

		if ( is_playing ){

			efullscreenmodal(FullScreEnmodal.none);
			eis_playing(false)

			let hero_img = storyboard.get_hero_image();
			let preview_img = storyboard.get_preview_hero_img();

			efull_img_screen_url( hero_img );
			efull_preview_img_url(preview_img);

			efilm_name(storyboard.get_name());

		} else {

			storyboard.play_trailer({ then: async ({ success, data }) => {
				if ( trivialProps(data,'image_url') || trivialString(data.image_url) ){
					return tellUser("Oh no! We can't find the trailer for this film");
				} else {
					efull_img_screen_url(data.image_url)
					eis_playing(true)
					efilm_name('')
				}
			}});		

		}
	}


	/******************************************************
		@low-level view states
	******************************************************/

	// progerss
	const [showlinearprogress, eshowlinearprogress] = useState(false);

	// snack
    const [ snack_content, setSnackContent] = useState({ show: false, str: "" });
	useEffect(() => {
		setSnackContent({
			show: show_snack,
			str: snack_message ?? "",
		})
	},[show_snack, snack_message]);

	//show snack
    function tellUser(str){
    	if ( trivialString(str) ){
    		setSnackContent({ show: false, str: "" })
    	} else {
	        setSnackContent({ show: true, str: str })
	        setTimeout(() => {
	        	if ( str === snack_content.str ){
	                setSnackContent({ show: false, str: "" })
	            }
	        },4000)
	    }
	}

	// full screen
	const DELAY_BG = 300;
    const [style, setStyle] = useState({});

    // set full screen/non-fullscreen datag
    // if enter page w/ showStoryboard set to this storyboard
    // then foucs on storyboard
	useEffect(() => {
		if ( full_screen === 0 ){
			setStyle({ background: COLORS.offBlack })
		} else {
			setStyle({})
		}
	},[full_screen]);

	// listener
	useEffect(() => {
	    window.addEventListener("keydown", handleEsc);
		return () => {
	      window.removeEventListener("keydown", handleEsc);
	    };
	}, []);

	// exit full screen on press `ESC` key
	// disable for now since you're minting on home screen
	async function handleEsc(event) {
		tellUser("");
		// if ( _is_minting || fullscreenmodal === FullScreEnmodal.tickets  ){
		// 	console.log('if case')
		// 	return;
		// } else {
		// 	console.log('else case')
		// 	let in_dev = home_page_url().includes('localhost') 
		// 		&& GLOBAL_STAGING
		// 	if (event.keyCode === 27 ){ // `esc``
		// 		tellUser("");
		// 		efullscreenmodal(FullScreEnmodal.none);
		// 	} else if ( event.code === 'ControlRight' && in_dev ){
		// 		on_exit_fullscreen();	
		// 	} else if ( event.keyCode === 70 && in_dev ){ // `f``
		// 		on_full_screen();
		// 	} else if (event.keyCode === 39){ // next button
		// 		return
		// 	}
		// }	
	}

    const inner_body_style = {
        // borderLeft: `2.0px solid ${COLORS.surface3}`,
        marginLeft: '135px',
        width: 'calc(100vw-135px)',
        paddingLeft: '24px'
    }

	return (
		<div>
	        <Helmet>
	            <title>{film_name}</title>
	        </Helmet>


			{	full_screen === 0
				? 
				<div/>
				:
				urlToFileExtension(full_img_screen_url) === TokenContentKind.MP4 
				?
				<RemoteVideoBackgroundView 
					showVignette  = {!is_playing}
					darken        = {!is_playing}
					video_url = {full_img_screen_url}
				/>
				:					
				<GiphBackgroundView 
					no_delay
					showVignette = {!is_playing}
					darken       = {!is_playing}
					image_url={full_img_screen_url}
					preview_url={full_preview_img_url}
				/>				
			}

			<AppHeaderPage
				{...props} 
				showLeft = {full_screen === 0}
				name    = { `Backstage`}
				delay_bg={DELAY_BG}
				header_gradient={style}
				in_full_screen_mode = {full_screen > 0}
				tellUser={tellUser}
			/>

            <AppSnackbar	
                showSnack    = {snack_content.show}
                snackMessage = {snack_content.str}
                vertical={"bottom"}
                horizontal={"right"}
            />   			

			{ 	true
				?
				<div/>
				:
				<FullScreenMoreView {...props} showMore={() => { return }} /> 
			}			

			{ 	full_screen > 0 && fullscreenmodal === FullScreEnmodal.none
				?
				<FullScreenCommandView 
					{...props} 
                    is_playing           = {is_playing}
                    hide_pause_btn       = { ! (isOnMobile && show_play_btn) }
                    num_mixes            = {storyboard.get_all_board_items().length}
                    tok_address          = {`House address:  ${film_address}`}
                    current_mix_name     = {crew_subtitle}
                    on_skip_next         = {() => { return }}
                    on_twitter           = {onNavToTwitter}
                    on_click_tok_address = {() => {onNavToStoryEtherscan(film_address)}}
                    on_click_collab_user = {() => { return }}
                    on_toggle_play       = {go_play_trailer_video}
                    on_skip_previous     = {() => { return }}
                    on_shuffle           = {() => { return }}
                    on_download          = {() => { return }}
                    on_exit_fullscreen   = {() => { return }}
					onClickResume        = {() => { return }}					
				/> 
				:
				<div/>
			}

			{	full_screen === 0 || fullscreenmodal === FullScreEnmodal.minted
				?
				<div/>
				:
				<SaleMenuView 
					{...props}
					name = { film_name }
					logo = { film_logo}
					datasource = {fullscreen_header_datasource} 
					showlinearprogress={showlinearprogress}
					tellUser = {tellUser}
				/>
			}

			{
				full_screen === 0  
				|| fullscreenmodal === FullScreEnmodal.none 
				? 
				<div/>
				:
				fullscreenmodal === FullScreEnmodal.about
				? 
				<AboutSaleView 
					{...props} 
					storyboard={storyboard}
					tellUser={tellUser}
					on_close={() => {efullscreenmodal(FullScreEnmodal.none)} }
					datasource={about_sale_datasource}
				/>
				:
				fullscreenmodal === FullScreEnmodal.tickets
				?
				false
				? 
				<div/>
				:
				<TicketMachine 
					{...props} 
					storyboard={storyboard}
					tellUser={tellUser}
                    board_root= {fullScreen_board_root}
					on_close={() => {efullscreenmodal(FullScreEnmodal.none)} }
					datasource={about_sale_datasource}
					showlinearprogress={showlinearprogress}
					eshowlinearprogress={eshowlinearprogress}
				/>
				: 
				fullscreenmodal === FullScreEnmodal.minted
				? 
				<div style={{
					paddingLeft:'32px',
				 	paddingRight:'32px', 
				}}>
					<FullScreenTokenTable
						{...props}
						goHandleClose = {() => { efullscreenmodal(FullScreEnmodal.none) }}
	                    board_root    = {fullScreen_board_root}
	                    style         = {{marginBottom: '5vh'}}
					/>
				</div>				
				:
				<div/>
			}
			{ full_screen > 0
				?
				<div/>
				:
				<div className={ classes.bodyContainer }>

					<AppStoryboardPanel 
						{...props} 
						focus={focusPanel}
						onFocus={onFocusPanel}
						datasource={panel_datasource}
						tellUser={tellUser}
						on_resume_full_screen={on_full_screen}
					/>
					{
						focusPanel == StoryboardKind.crew
						? 
						<AppStoryboardCrew
							{...props}
							focusBoard={focusPanel}
							eshowlinearprogress={eshowlinearprogress}
							style={inner_body_style}
							tellUser={tellUser}

						/>
						: 
						focusPanel == StoryboardKind.about
						?
						<AppStoryProfile
							{...props}
							tellUser={tellUser} 
							showlinearprogress={showlinearprogress}
							eshowlinearprogress={eshowlinearprogress}
							style={inner_body_style}
						/>
						: focusPanel === StoryboardKind.contract
						?
						<AppStoryboardContract
							{...props} 
							tellUser={tellUser} 
							style={inner_body_style}
							showlinearprogress={showlinearprogress}
							eshowlinearprogress={eshowlinearprogress}
						/>
						: focusPanel === StoryboardKind.gnosis_safe
						?
						<AppStoryboardGnosis
							{...props} 
							tellUser={tellUser} 
							showlinearprogress={showlinearprogress}
							eshowlinearprogress={eshowlinearprogress}
							style={inner_body_style}						
						/>
						: focusPanel === StoryboardKind.stripe
						?
						<AppStoryboardFiat
							{...props}
							focusBoard={focusPanel}
							eshowlinearprogress={eshowlinearprogress}
							style={inner_body_style}
							tellUser={tellUser}
						/>					
						: focusPanel === StoryboardKind.license
						?
						<AppStoryboardAcquiredLicense
							{...props}
							focusBoard={focusPanel}
							eshowlinearprogress={eshowlinearprogress}
							style={inner_body_style}
							tellUser={tellUser}
						/>																	
						: typeof focusPanel === 'string'						 
						  && !trivialString(focusPanel)
						?
						<AppStoryboardSlate 
							{...props} 
							board_id = {focusPanel}
							tellUser={tellUser} 
							showlinearprogress={showlinearprogress}
							eshowlinearprogress={eshowlinearprogress}
							style={inner_body_style}
						/>
						:
						<div style={{}}/>
					}

					<AppFooter {...props}  show_progress={showlinearprogress} />					
				</div>
			}


			{
				full_screen > 0 && show_play_btn && fullscreenmodal === FullScreEnmodal.none
				?
				<PlayIcon {...props} onClick={go_play_trailer_video} showPause={is_playing} />
				:
				<div/>

			}			

	

		</div>

	)   
}

export {
	split_time,
	useNftvieWstyles,
	StoryboardKind,
}

