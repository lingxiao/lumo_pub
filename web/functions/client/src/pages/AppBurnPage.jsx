/**
 * @Package: AppBurnPage
 * @Date   : Aug 29th, 2022
 * @Author : Xiao Ling   
**/


import React, {useState, useEffect} from 'react'
import {Helmet} from "react-helmet";
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';

import { COLORS } from './../components/constants';
import AuthAndCard from './AuthAndCard';

import {
	cap,
	trivialProps,
	trivialString,
} from './../model/utils'

import {
    urlToFileExtension,
} from './../model/core'


import withRouter from './../hoc/withRouter';
import withAuth   from './../hoc/withAuth';
import withSnack from './../hoc/withSnack';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import { GiphBackgroundView } from './../components/VideoBackground';
import { ActionProgressWithProgress } from './../components/ButtonViews'
import AppImageView from './../components/AppImageView'

const burn  = require("./../assets/burn1.jpeg")
const burnsmall = require("./../assets/burn1-small.jpeg")
const acid      = require("./../assets/acid1.png");
const acid5     = require("./../assets/acid5.png")
const rbanner   = require("./../assets/Rbanner.png");

const {
	IconRow,
	// BurnTimer,
	BurnBanner,
	useBurnStyles,
	BurnTable,
	BurnTable2,
	ManifestoAlt,
	UserProfileHeader,
} = require('./AppBurnPageComponents')


/******************************************************
	@View exported
******************************************************/

const IS_SIMPLE_PAGE = true;
let succ_str   = "then claim all tabs on the red app";
let succ_str_b = "Support This movement";
let succ_str_e = "Step 2. Complete profile";
let succ_str_c = "Pledge $5 now";
let succ_str_d = "See tabs on the red app";
const call_to_action_str = "Sign and support this movement";

/**
 *
 * @use: principle burn page for one project
 *
 **/
function AppBurnPage(props){

	const {
		tellUser,
		user_cache,
		chain_service,		
		location,
		navigate,
	} = props;

	/******************************************************/
	// @mount

	const isOnMobile = useCheckMobileScreen(1000);
	const bstyle = useBurnStyles(isOnMobile)();

	// url data;
	const [ _subdomain, esubdomain ] = useState("");
	const [ is_my_burn, eis_my_burn ] = useState(false);

	// burn/chain data
	const [ chain, echain ] = useState({});
	const [ burn_data, eburn_data ] = useState({ 
		name: "", 
		about: "",
		timeStampLatestBlockExpire: 0 
	});

	const [ showpaper, eshowpaper ] = useState(false)
	const [ showauthview, eshowauthview ] = useState(false)
	const [ cols, ecols ] = useState([]);

	const [ btn_str , ebtn_str ] = useState("Sign Manifesto")
	const [ btn_strb, ebtn_strb ] = useState("And receive a tab ($5.00 value)");
	const [ showProgress, eshowProgress ] = useState(false)
	const [ reward_datasource, erewards ] = useState([]);

	// purchase tab view
	const [ showTab, eshowTab ] = useState(false);
	const [ show_banner, eshow_banner ] = useState(true);
	const [ showPayment, eshowPayment ] = useState(false);

	// invite data
	const [ code, ecode ] = useState("");
	const [ invitee, einvitee ] = useState("");
	const [ inviter_name, einviter_name ] = useState("");


	// load data
	useEffect(async () => {
		await mount({ then: cap });
		setTimeout(async () => {
			await mount({ then: cap });
		},1000)
	},[]);

	// @Use: mount by burn name
	//       or burn invite code
	async function mount({ then }){

        const { pathname } = location
        let url = pathname.replace('/','')
        const bits = url.split('/');

        if ( bits.length <= 1 ){
        	return then({});
        }
        let subdomain_0 = bits[0];
        let subdomain   = bits[1];

        esubdomain(subdomain);

        if (subdomain_0 === 'burn'){
			await chain_service.fetch_chain_by_subdomain({
				subdomain,
				then: async (chain) => {
					if ( !trivialProps(chain, 'root') ){
						eshowpaper  (true)
						eburn_data  (chain.root);
						echain      (chain);
						erewards(chain.read_unique_signers());
						if ( user_cache.isAuthed() ){
							let user = await user_cache.getAdminUser();
							if ( chain.root.userID === user.userID ){
								ebtn_str(succ_str_e)
								ebtn_strb("")
								eis_my_burn(true);
							} else {
								eis_my_burn(false);
							}
						} else {
							eis_my_burn(false);
						}
					}
					return then(chain);
				}
			});
		} else {

	        ecode(subdomain);
			await chain_service.fetch_by_invite({ code: subdomain, then: async ({ chain, invite, user }) => {
				if ( !trivialProps(chain, 'root') ){
					eshowpaper  (true);
					echain      (chain);
					eburn_data  (chain.root);
					erewards(chain.read_unique_signers());
					let alice = trivialProps(user,'name') ? "" : user.name
					einviter_name( alice );
					einvitee(`An invite from ${alice}`);
					ebtn_str("Accept nomination");
					if ( !trivialString(invite.tgtTwitterName) ){
						let bob   = invite.tgtTwitterName ?? ""					
						einvitee(`An invite for ${bob} from ${alice}:`)
					}
				}
				return then(chain);
			}});				
		}
	}

	
	/******************************************************/
	// @responders
	//

	// @use: go to edit my burn
	function onEditBurn(){
		if (is_my_burn){
			navigate(`/burn/${_subdomain}/edit`)
			window.location.reload(true);
		}
	}

	// @use: on sign manifesto, airdrop
	//       lumo to user, then res-sync 
	//       chain to db
	async function onSignManifesto(){
			
		if (trivialProps(chain,'sign_manifesto')){
			return tellUser("Slow down! You're going too fast!")
		}

		if ( btn_str === succ_str ){
	
	        navigate(`/thelittleredapp`);

		} else if ( btn_str === succ_str_b ){

			if (cols.length > 0 && !trivialProps(chain,'root') ){
		    	let contract = cols[0];
		    	navigate(`/gas/${chain.root.subdomain ?? ""}/${contract.ID}`)
		    } else {
		    	eshowTab(true);
		    	ebtn_str(succ_str_c);
		    }

		} else if ( btn_str == succ_str_c ){

			if ( !user_cache.isAuthed() ){
				eshowauthview(true);
				return;
			}

			let user =  await user_cache.getAdminUser();
			await user.does_user_have_stripe_customer_id({ then: async ({ customerId }) => {
				if ( trivialString(customerId) ){
					eshowPayment(true);
				} else {
					eshowProgress(true);
					ebtn_str("pledging")
					await chain_service.buy_lumo_token_on_polygon({
						amt_in_lumo: 1,
						chain_id: trivialProps(chain,'chain_id') ? "" : (chain.chain_id ?? ""),
						then: async (res) => {
							const { success, message, data } = res;
							eshowProgress(false);
							if ( success ){
								ebtn_str(succ_str_d);
								tellUser("Pledged $5!");
								eshow_banner(false);
							} else {
								ebtn_str("Try again")				
								tellUser(message);
							}
						}
					});
				}
			}});

		} else if ( btn_str == succ_str_d ){

			navigate("/thelittleredapp");

		} else if ( btn_str === succ_str_e ){

			navigate(`/burn/${_subdomain}/edit`)

		} else if ( !user_cache.isAuthed() ) {

			eshowauthview(true);

		} else {

			// sign manifesto
			if ( trivialString(code) ){

				let admin_user = await user_cache.getAdminUser();
				
				if ( admin_user.userID === chain.root.userID ){

					navigate(`/firehose/${chain.root.subdomain}`)

				} else {

					eshowProgress(true);
					ebtn_str("Signing manifesto");

					await chain.sign_manifesto({
						then: async ({ success, message }) => {
							await chain.get_all_collections({ then: async (cols) => {
								ecols(cols);
								eshowProgress(false);
								if ( cols.length > 0 ){
									ebtn_str(succ_str_b);
									ebtn_strb(succ_str)
								} else {
									if (success){
										ebtn_str(succ_str_b)
										ebtn_strb(succ_str)
										await addAuthedUserToRewards();
									} else {
										ebtn_str(succ_str_b);											
										ebtn_strb(succ_str)
									}
								}
							}})
						}
					});

				}	

			} else {

				eshowProgress(true);
				ebtn_str("accepting");
				await chain.accept_nomination({ code: code, then: async ({ success, message }) => {
					await chain.get_all_collections({ then: async (cols) => {
						ecols(cols);
						eshowProgress(false);
						if ( cols.length > 0 ){
							ebtn_str(succ_str_b);
							ebtn_strb(succ_str)
							if ( success ){
							}
						} else {
							if (success){
								ebtn_str(succ_str_b)
								ebtn_strb(succ_str)
								await addAuthedUserToRewards();
							} else {
								ebtn_str(succ_str_b);											
								ebtn_strb(succ_str)
								tellUser(message);
							}
						}
					}})						
				}});
			}
		}

	}

	async function onDidSaveCard(){
		eshowPayment(false);
	}

	// on did auth, change btn states
	async function onDidAuth(){
		eshowauthview(false);
		if ( user_cache.isAuthed() ){
			let user = await user_cache.getAdminUser();
			if ( chain.root.userID === user.userID ){
				ebtn_str(succ_str_e)
				ebtn_strb("then invite burners on the red app")
			} else {
				ebtn_str("Sign Manifesto");
				ebtn_strb("What is a tab?")				
			}
		} else {
			ebtn_str("Sign Manifesto");
			ebtn_strb("What is a tab?")
		}
	}

	//  go back home
	async function onClickSubtext(){
		navigate('/firehose')
	}

	function onClickReward(user){
		if ( trivialProps(user,'userID') ){
			return;
		} else {
			if ( !trivialString(user.get_twitterUserName()) ){
				let url = `https://twitter.com/${user.get_twitterUserName()}`
				window.open(url);
			}
		}
	}

	async function addAuthedUserToRewards(){
		let user = await user_cache.getAdminUser();
		let small = reward_datasource.filter(u => {
			return u.userID !== user.userID
		})
		let new_datasource = [user].concat(small);
		erewards(new_datasource);
	}


	/******************************************************/
	// @low-level view states

	// change bacgrkound color
	const [ bg_style, ebg_style ] = useState({ background: COLORS.red_2 });
	function on_fullscreen_image_did_load(){
		ebg_style({})
	}

	const link_style = {
		cursor:'pointer',
		color: COLORS.text2,
		textDecoration:'underline', 
		fontFamily: "NeueMachina-Black",
	}

	function faq(){
		let str1 = trivialString(inviter_name)
			? "You are seeing this link because you have been invited to this week's "
			: `You are seeing this link because ${inviter_name} has invited you to be this week's `
		let str2 = trivialString(inviter_name)
			? " One burn tab has been shared with you in the invitation package. "
			: ` ${inviter_name} has placed one burn tab in the initation package. `
		return (
			<p>
				{`A burn event is a communal initiation ritual for change and manifestation, empowering you and your community to will the world towards your collective purpose.`}
				<br/><br/>
				{str1}
				<span style={link_style} onClick={() => {
			        navigate(`/thelittleredapp`)
				}}>
					{`burn leader.`}
				</span>
				{str2}
				{"If accepted, you will observe this week's burn event and if willing, lead the initation ritual for other burners. "}
				<br/><br/>				
				{`The `}
				<span style={link_style} onClick={() => {
			        navigate(`/firehose`)
				}}>
					{`burn tab`}
				</span>
				{`  is the communal reward for all prosocial actions: attending burn events, signing manifestos, and voting for future burn leaders. It can be shared with other burners and is the social currency for all burn events on Lumo. `}
				{`You can keep the tab for memory sake, or pay it forward to the next burner of your choosing.`}
			</p>
		)
	}

	return (
		<div style={bg_style}>
	        <Helmet>
	            <title>{burn_data.name}</title>
	        </Helmet>

	        { isOnMobile 
	        	? 
	        	<div/> 
	        	:
				<GiphBackgroundView 
					no_delay
					no_video_bg
					darken = {false}       
					image_url={burn}
					preview_url={burnsmall}
					showVignette = {false}
					containerStyle={{background:COLORS.red_2}}
					on_image_did_load={on_fullscreen_image_did_load}
				/>				
			}

			{/* body */}
			<Stack direction='horizontal' style={{width:'100vw',height:'100vh'}}>	
				{/* body left full screen */}
				{
					isOnMobile
					?
					<div/>
					:
					<Stack direction='vertical' style={{ 
						width :'40vw', 
						height:'100vh',
						position:'relative',
					}}>
		                <div className={bstyle.manifesto_title} style={{
		                	whiteSpace: 'pre-wrap', 
							position:'absolute',
							left: '1vw',
							top: '5vh',
		                	height:'100vh',
		                	width:'80vw',
		                	lineHeight:1.2,
		                	zIndex:'-100',
		                	opacity:0.25,
		                }}>
		                	{(burn_data.name ?? "").toUpperCase()}
		                </div>			
		                <div>
						<div className={bstyle.h3} style={{marginTop:'48px',marginBottom:'12px', opacity:0.65}}>
							{ `//Signatures:` }
						</div>														                		
						<BurnTable2
							{...props}
							onClickUser={onClickReward}
							datasource = {reward_datasource}
							style={{opacity:'0.75'}}
						/>
						</div>
					</Stack>
				}
				{/* body right  */}
				{
					!showpaper
					? 
					<div/> 
					:
					<Paper 
						elevation={5}
						className={bstyle.scroll_container}  
						style={{
							width: isOnMobile? '100vw' : '65vw',
							height:'100vh',
							marginRight: isOnMobile ? '0px' : '36px',
							marginLeft:  isOnMobile ? '0px' : '24px',
							background: COLORS.red_2,
							objectFit: `cover`,
							background: `url(${burn})`
					}}>

						<UserProfileHeader {...props} style={{marginRight:'0px'}}/>


						<div className={bstyle.h2} style={{marginTop:'24px'}}>
							{`** ${burn_data.name ?? ""}`}
						</div>						

						<IconRow 
							{...props}
							style={{ paddingTop: '12px', paddingBottom:'12px', paddingLeft:'24px' }} 
							chain={chain}
						/>

						{
							is_my_burn 
							? 
							<div/> 
							:
							<BurnBanner 
								style={{marginTop:'12px'}}
								text={call_to_action_str}
							/>
						}

						<div className={bstyle.body} style={{marginTop:'12px', marginRight:'12px', whiteSpace: 'pre-wrap'}}>
							{burn_data.about ?? ""}
						</div>	


						{
							trivialString(code)
							?
							<div/>
							:
							<div>
								<BurnBanner 
									style={{marginTop:'84px'}}
									text={call_to_action_str}
								/>								
								<ManifestoAlt
									{...props}
									hide_btn
									image_left
									force_on_mobile
									title={"** what is a burn".toUpperCase()}
									faq={faq}
									state = {0}
									btn_str={"Initiate the burn".toUpperCase()}
									onClickInitiate={() => {}}
									style={{width: isOnMobile? '100vw' : '65vw'}}
								/>
							</div>
						}

						{
							!showTab
							?
							<div/>
							:
							<div>
								<BurnBanner 
									style={{marginTop:'24px'}}
									text={"Pledge $5 and receive one tab"}
								/>
								<div style={{ position:'relative', background:'black',height:'50vh', width: isOnMobile ? '100vw' : '65vw' }}>
									<div style={{position:'absolute', zIndex:0,left:'-36px'}}>
							            <AppImageView   
							                width = { isOnMobile ? '100vw' : '60vw'}
							                height= {'50vh'}
							                imageDidLoad = {cap}k
							                preview_url  = {acid5}
							                imgSrc       = {acid5}
							                type         = {urlToFileExtension(acid5)}
							                imgStyle ={{ background: 'black' }}
							            />    	
							        </div>
							        { show_banner
							        	?
										<div style={{position:'absolute', zIndex:1,left:'0px', top:'18vh', }}>
								            <AppImageView   
								                width = { isOnMobile ? '100vw' : '60vw'}
								                imageDidLoad = {cap}
								                preview_url  = {rbanner}
								                imgSrc       = {rbanner}
								                type         = {urlToFileExtension(rbanner)}
								                imgStyle ={{ background: 'black' }}
								            />    	
								        </div>
								        :
								        <div/>
								    }
						        </div>			        
								<BurnBanner 
									style={{marginTop:'0px'}}
									text={"Pledge $5 and receive one tab"}
								/>
							</div>						
						}

		                {
		                	showPayment
		                	?
							<AuthAndCard
								{...props}
								promptA={""}
								promptB={""}
								tellUser={tellUser}
								style={{}}
								onWillAuth={cap}
								onDidAuth={onDidAuth}
								onWillSaveCard={cap}
								onDidSaveCard ={onDidSaveCard}
								collect_payment_only
							/>
							:
							<div/>
						}

		                {
		                	showauthview 
		                	?
							<AuthAndCard
								{...props}
								promptA={""}
								promptB={""}
								tellUser={tellUser}
								style={{}}
								onWillAuth={cap}
								onDidAuth={onDidAuth}
								onWillSaveCard={cap}
								onDidSaveCard = {cap}
							/>
							:		     
							showPayment
							?
							<div/>
							:           	
			                <Stack direction='column' style={{padding:"24px", zIndex:100}}>
				                <ActionProgressWithProgress                    
				                    showProgress={showProgress}
				                    onClick = {onSignManifesto}
				                    label={btn_str}
				                    progress_text={btn_str}
				                    subtext={IS_SIMPLE_PAGE ? "" : btn_strb}
				                    onClickSubtext={IS_SIMPLE_PAGE ? () => {} : onClickSubtext}
				                    sx = {{width: '120%', border: `0.5px solid ${COLORS.red_1}`, color: COLORS.surface1}}
				                />   
				            </Stack>		            			            
				        }	

						{
							is_my_burn ? <div/> :
							<BurnBanner 
								style={{marginTop: showauthview ? '8px' : '-24px'}}
								text={call_to_action_str}
							/>
						}

						{ !isOnMobile ?  <div/> :
							<div>
							<div className={bstyle.h3} style={{marginTop:'48px',marginBottom:'12px'}}>
								{ `//Signatures:` }
							</div>												
							<BurnTable
								{...props}
								withImage = {false}
								onClickUser={onClickReward}
								datasource = {reward_datasource}
								style={{width: isOnMobile ? '100vw' : '60vw', paddingLeft:'12px'}}
							/>
							<BurnBanner 
								style={{marginTop:'12px'}}
								text={call_to_action_str}
							/>			
							</div>
						}

					</Paper>
				}
			</Stack>
        </div>
    )
}

export default withAuth(withRouter(withSnack(AppBurnPage)));

/*

						{
							IS_SIMPLE_PAGE ? <div/> : 
							<div>
								<div className={bstyle.h3} style={{marginTop:'24px'}}>
									{'Burn ends in:'.toUpperCase()}
								</div>
								<div style={{marginLeft:'-48px'}}>
									<BurnTimer
										force_on_mobile
										style={{marginTop: '24px'}}
										timeStampExpire={burn_data.timeStampLatestBlockExpire}
									/>						
								</div>
							</div>
						}

						{
							IS_SIMPLE_PAGE ? <div/> :
							<div>
								<BurnBanner 
									style={{marginTop:'24px'}}
									text={call_to_action_str}
								/>
								<div style={{ position:'relative', background:'black',height:'50vh', width: isOnMobile ? '100vw' : '60vw' }}>
									<div style={{position:'absolute', zIndex:0,left:'-36px'}}>
							            <AppImageView   
							                width = { isOnMobile ? '100vw' : '60vw'}
							                height= {'50vh'}
							                imageDidLoad = {cap}k
							                preview_url  = {acid5}
							                imgSrc       = {acid5}
							                type         = {urlToFileExtension(acid5)}
							                imgStyle ={{ background: 'black' }}
							            />    	
							        </div>
							        { show_banner
							        	?
										<div style={{position:'absolute', zIndex:1,left:'0px', top:'18vh', }}>
								            <AppImageView   
								                width = { isOnMobile ? '100vw' : '60vw'}
								                imageDidLoad = {cap}
								                preview_url  = {rbanner}
								                imgSrc       = {rbanner}
								                type         = {urlToFileExtension(rbanner)}
								                imgStyle ={{ background: 'black' }}
								            />    	
								        </div>
								        :
								        <div/>
								    }
						        </div>
								<BurnBanner 
									style={{marginTop:'0px'}}
									text={call_to_action_str}
								/>
							</div>
						}
*/



/******************************************************
	@preview page
******************************************************/
/**
 *
 * @Use: pre-load page
 *
*/
export function AppBurnPagePreview(props){

	const isOnMobile = useCheckMobileScreen(800);
	const bstyle = useBurnStyles(isOnMobile)();

	const rot_style = {
		//transform: isOnMobile ? 'rotate(90deg)' : "",
	}

	return (
		<div>
	        <Helmet>
	            <title>{"burn"}</title>
	        </Helmet>

			<GiphBackgroundView 
				no_delay
				darken       
				image_url={burn}
				preview_url={burnsmall}
				containerStyle={{background:COLORS.red_2}}
				showVignette = {false}
			/>							

			{/* header */}
			<Stack direction='row' style={{paddingLeft:'25px', paddingTop:'70px', height:'50px'}}/>      

			{/* body */}
			<Stack 
				direction='column'
				style={{
					width:'100vw',
					opacity:0.50,
					marginTop:'48px',				
				}}
			>
				<div className={bstyle.manifesto} style={rot_style}>
					{'destruction'.toUpperCase()}
				</div>
				<Stack direction='row' style={{marginRight:'2vw'}}>
					<div className={bstyle.manifesto} style={rot_style}>
						{'breeds'.toUpperCase()}
					</div>
		            <Box sx={{ flexGrow: 1 }} />
					<div className={bstyle.manifesto} style={rot_style}>
						{'*'.toUpperCase()}
					</div>
				</Stack>
				<div className={bstyle.manifesto} style={rot_style}>
					{'creation'.toUpperCase()}
				</div>
			</Stack>

        </div>
    )
}




