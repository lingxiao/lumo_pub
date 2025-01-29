/**
 *
 *
 * @Package: AppAcidPage
 * @Date   : Aug 29th, 2022
 * @Author : Xiao Ling   
 *
 *
**/


import React, {useState, useRef, useEffect} from 'react'
import {Helmet} from "react-helmet";


import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import AppSnackbar from './../components/AppSnackbar';
import { GiphBackgroundView } from './../components/VideoBackground';

import { COLORS }    from './../components/constants';
import useCheckMobileScreen, {useHeight, useWidth} from './../hoc/useCheckMobileScreen';
import withSnack from './../hoc/withSnack';

import {
	cap,
	trivialProps,
	trivialString,
} from './../model/utils'

import {
	app_page_urls,
	home_page_url,
	GLOBAL_STAGING,
} from './../model/core'

import AuthAndCard from './AuthAndCard';


const {
	BurnWall,
	AcidBagImage,
	AcidFooter,
	AcidBagCheckout,
	AcidBagCheckoutRecepit,
	useBurnStyles,	
} = require('./AppBurnPageComponents')

const {
    FeatureBox,
} = require('./AppStoryboardFragments');


const burn2 = require("./../assets/burn2.jpeg")


/******************************************************
	@constants + view components
******************************************************/

const BuyIslandState = {
	tabs: 'tabs',
	checkout: 'checkout',
	receipt: 'receipt',
	signup: 'signup',
}

// featurebox text
const featurebox_datasource1 = [
    {idx: 0, key: `Write Manifestos` , value: `Earn 5 tabs for every manifesto you write to kindle a movement.`},
    {idx: 1, key: `Sign Manifestos`  , value: `Earn 1 tab each time you sign a manifesto.`},
    {idx: 2, key: `Invite Burners`   , value: `Burn 1 tab each time you invite a new burner. The burner will earn the tab if they accept the invite.`}
]

// featurebox text
const featurebox_datasource2 = [
    {idx: 0, key: `Redeem for merch` , value: `The burn leader sets an exchange rate for tabs to merch, you can burn tabs and redeem merch for free.`},
    {idx: 1, key: `Cash out on chain`, value: `You can mint the tabs on chain at the merch store. There will be a small fee associated with this operation.`},
    {idx: 2, key: `Hodl and believe` , value: `There is no obligation to do anything with the tabs. You can hold them in the burn app, or mint and hold on chain.`},
]




/******************************************************
	@Acid tab page
******************************************************/


/**
 *
 * @Use: page for explaining burn page
 *
**/
function AppAcidPage(props){

	/******************************************************/
	// mount

	const {
		chain_service,
		user_cache,
		tellUser,
		navigate,
		location,
	} = props;

	const isOnMobile = useCheckMobileScreen(1000);
	const bstyle = useBurnStyles(isOnMobile)();

	const [ chain, echain ] = useState({});
	const [ _subdomain, esubdomain ] = useState("");
	const [ has_stripe, ehas_stripe ] = useState(false);

	useEffect(async () => {
		await checkStripe();
		await mount();
		setTimeout(async () => {
			await checkStripe()
		},1000)
	},[])

	async function checkStripe(){
		if ( trivialProps(user_cache, 'isAuthed') ){
			return;
		}
		if ( user_cache.isAuthed() ){
			let user =  await user_cache.getAdminUser();
			await user.does_user_have_stripe_customer_id({ then: ({ customerId }) => {
				ehas_stripe(!trivialString(customerId));
			}});
		}		
	}

	// @Use: mount by burn name
	//       or burn invite code
	async function mount(){
        const { pathname } = location
        let url = pathname.replace('/','')
        const bits = url.split('/');
        if ( bits.length <= 1 ){
        	return;
        } else {
	        let subdomain   = bits[1];
	        esubdomain(subdomain);
			await chain_service.fetch_chain_by_subdomain({ subdomain,
				then: async (chain) => { 
					echain(chain); 
					if ( !trivialProps(chain,'chain_id') ){
						ebtn_str("Fund movement")
					}
				}
			})
		}

	}	


	/******************************************************/
	// responders

	const [ st, est ] = useState(BuyIslandState.tabs) 
	const [ btn_str, ebtn_str ] = useState("Buy Tab");
	const [ selected_datasource, eselected ] = useState([]);

	const [ showpayment, eshowpayment ] = useState(false);

	const [ showProgress, eshowProgress ] = useState(false);
	const [ checkout_btn_str, echeckout_btn_str ] = useState("Buy 1 tab")
	const [ receipt, ereceipt ] = useState({});

	// @use: on click item, add item
	// to queue, scoll page so btn is in view
	function onClickItem(idx){
		go_scroll();
		if ( selected_datasource.includes(idx) ){
			let sm = selected_datasource.filter(x => x != idx);
			eselected(sm);
			let str = `${sm.length} tab${sm.length > 1 ? 's' : ''}`
			ebtn_str(`Checkout ${str}`)
			echeckout_btn_str(`Buy ${str}`)
		} else {
			let big = selected_datasource.concat([idx]);
			eselected(big);
			let str = `${big.length} tab${big.length > 1 ? 's' : ''}`
			ebtn_str(`Checkout ${str}`)
			echeckout_btn_str(`Buy ${str}`)
		}
	}

	// @use: on buy tab, either show auth, credit card,
	//       or checkout view
	async function onBuyTab(){
		if ( user_cache.isAuthed() ){
			if ( has_stripe ){
				if (isOnMobile){
					est(BuyIslandState.checkout)
					await onCheckout();
				} else {
					est(BuyIslandState.checkout)
				}
			} else {
				eshowpayment(true)
				est(BuyIslandState.signup)
			}
		} else {
			est(BuyIslandState.signup)
		}
	}


	async function onDidSaveCard(){
		est(BuyIslandState.checkout);
	}


	// @use; buy tabs, sign manifesto if chain exist
	async function onCheckout(){
		eshowProgress(true);
		echeckout_btn_str("Baking tabs");
		let amt_in_lumo = Math.max(1,selected_datasource.length);
		await chain_service.buy_lumo_token_on_polygon({
			amt_in_lumo: amt_in_lumo,
			chain_id: trivialProps(chain,'chain_id') ? "" : (chain.chain_id ?? ""),
			then: async ({ success, message, data }) => {
				if (!trivialProps(chain,'sign_manifesto')){
					await chain.sign_manifesto({ then: cap });
				}
				if ( success ){
					ebtn_str("Next")				
					ereceipt(data);
					est(BuyIslandState.receipt);
				} else {
					ebtn_str("Try again")				
					tellUser(message);
				}
			}

		});
	}

	// @use: go to mobile app store
	//       or page for mobile phone
	function onInstallApp(){
        navigate('/thelittleredapp')
	}

	function onNavToBurn(){
		if ( trivialProps(chain,'chain_id') ){
			return;
		} else {
			navigate(`/burn/${_subdomain}`);
		}
	}


	/******************************************************/
	// views

	// compute number of tabs
	const winheight = useHeight();
	const winWidth  = useWidth();
	const [showIcons, eshowIcons] = useState(true);
	function numTabs(){
		let n1 = Math.floor(winheight*winWidth/(50*50))*2
		let n2 = Math.round(n1/100);
		let n3 = n2*100;
		return Math.min(900, n3)
	}	
	useEffect(() => {
		setTimeout(() => {
			eshowIcons(true)
		},800);
	},[])

	// scroll to bottom of page
	const messagesEndRef = useRef();
	const [ _scroll, escroll ] = useState(0)
	function go_scroll(){
		if ( _scroll > 0 ){
			return
		} else {
			// messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
			escroll(Math.random());
		}
	}

	const text_style = { color: COLORS.text, opacity: 0.90 }

	const [ bg_style, ebg_style ] = useState({ background: COLORS.red_2 });
	function on_fullscreen_image_did_load(){
		ebg_style({})
	}


	return (
		<div style={bg_style}>
			<div>
	        <Helmet>
	            <title>{"The Burn Tab"}</title>
	        </Helmet>

			<GiphBackgroundView 
				no_delay
				darken       
				no_video_bg
				image_url={burn2}
				preview_url={burn2}
				containerStyle={{background:COLORS.red_2}}
				on_image_did_load={on_fullscreen_image_did_load}
			/>							

			<Stack direction='row' style={{width:'100vw'}}>
				<div 
					className={bstyle.scroll_container} 
					style={{
						height:'100vh', 
				        overflowX:'hidden',
						width: isOnMobile ? '100vw' : '50vw',
				}}>
					{ [0,1,2,3,4,5,6,7].map((data, idx) => {
							if ( data === 0 ){
								return (
									<Stack 
										key={idx}
										direction='row' 
										className={bstyle.footer} 
										style={{margin:'24px', color:COLORS.text3, fontSize:'12px'}}
									>
										{'the communal ☺ fuel'.toUpperCase()}
							            <Box sx={{ flexGrow: 1 }} />
										{'to feed ☺ the burn'.toUpperCase()}
									</Stack>
								)
							} else if ( data == 1) {
								if ( trivialProps(chain, 'chain_id') ){
									return (
										<Stack key={idx} className={bstyle.title} style={{color: COLORS.surface1}} direction='row'>
											{'the burn tab'.toUpperCase()}
										</Stack>
									)
								} else {
									return (
										<Stack key={idx} className={bstyle.title} style={{color: COLORS.surface1}} direction='column'>
											{`Fund ${(chain.root.name ?? "").toUpperCase()} with the tab`.toUpperCase()}
										</Stack>
									)
								}
							} else if ( data == 2) {
								return (
									<Stack key={idx} className={bstyle.body} direction='column' style={{...text_style, marginTop:'24px'}}>
										{	
											trivialProps(chain,'chain_id')
											?
											<div/>
											:
											<Stack direction='column' style={{marginBottom:'24px'}}>
												<Stack 
													onClick={onNavToBurn}
													className={bstyle.h3} 
													style={{color: COLORS.surface1, cursor:'pointer', 'text-decoration': 'underline', marginLeft:'0px'}
												}>
													{`About ${chain.root.name ?? ""}`}
												</Stack>
												<div className={bstyle.body} style={{marginTop:'12px', marginLeft:'0px', whiteSpace: 'pre-wrap'}}>
													{chain.root.about}
												</div>
												<Stack className={bstyle.h3} style={{color: COLORS.text, 'text-decoration': 'underline', marginLeft:'0px', marginTop:'24px', marginBottom:'-12px'}}>
													{"About The Tab"}
												</Stack>
											</Stack>
										}
										{`The tab is the socially conscious currency of the decentralized internet. It’s your reputation in a brave new cashless economy. There are two ways to acquire tabs: earn them through social deeds, or buy here. `}
										{
											trivialProps(chain,'chain_id') 
											? 
											"" 
											:
											<div>
												<br/>
												{`Proceeds from sales of the tab will go to fund the merchandise campaign for ${chain.root.name}. Once you have acquired the tab,
												you can either gift them to other burners in an act of prosocial generosity, or you can redeem tabs on chain after the burn leader have launched a decentralized merch line.`}
												<br/>
												<div className={bstyle.body} direction='row' style={{ fontSize:'16px', color:COLORS.text, marginTop:'24px'}}>
													{`Here's how you redeem tabs at the movement merch store:`}
												</div>
						                        <FeatureBox 
							                        always_on
						                            datasource = {featurebox_datasource2}
						                            content_style = {{ fontSize:'16px', fontFamily: 'NeueMachina-Medium' }}
						                            style={{
						                            	height:'fit-content',
						                            	margin: '24px',
						                            	width: `calc(50vw-24px)`,
						                            	border: `0.25px solid ${COLORS.text3}`
						                            }}
						                        />												
											</div>
										}
									</Stack>
								)
							} else if (data === 3){
								return (
									<Stack direction='column' key={idx} style={{marginLeft:'12px'}}>
									<div className={bstyle.body} direction='row' style={{ fontSize:'16px', color:COLORS.text, marginTop:'24px'}}>
										{	trivialProps(chain,'chain_id')
											? `This is how you earn or burn tabs on the burn app:`
											: `In addition to merch store redemptions, you can also use the tab as a native social currency in the burn app. Here's how you can earn or burn:`
										}
									</div>
			                        <FeatureBox 
				                        always_on
			                            datasource = {featurebox_datasource1}
			                            content_style = {{ fontSize:'16px', fontFamily: 'NeueMachina-Medium' }}
			                            style={{
			                            	height:'fit-content',
			                            	margin: '24px',
			                            	width: `calc(50vw-24px)`,
			                            	border: `0.25px solid ${COLORS.text3}`
			                            }}
			                        />
			                        </Stack>
			                    )
							} else if ( data == 4) {
								{/*{` Note! In order to receive sponsorship money, sponsors must buy tabs on the mobile app from a movement page with a manifesto written by you.`}*/}
								return (
									<Stack className={bstyle.body} direction='row' style={{...text_style, marginTop:'12px'}} key={idx}>
										<p>
											{ trivialProps(chain,'chain_id') ? `Sell tabs to sponsors who wish to support your cause: tabs are $5 each. Consume tabs on the little red app.` : ""}
											{ trivialProps(chain,'chain_id') ?  <br/> : <div/> }
											<span style={{
												cursor:'pointer',
												textDecoration:'underline', 
												color: COLORS.surface1,
												}}
												onClick={onInstallApp}
											>
												{`Download the app here`}
											</span>
										</p>
									</Stack>
								)						
							} else if ( data === 5 ){
								if ( isOnMobile ){
									if ( st === BuyIslandState.signup ){
										return (
											<AuthAndCard
												{...props}
												should_collect_payment
												collect_payment_only={showpayment}
												promptA={""}
												promptB={""}
												tellUser={tellUser}
												style={{}}
												onWillAuth={() => {}}
												onDidAuth={() => {}}
												onWillSaveCard={() => {}}
												onDidSaveCard = {onDidSaveCard}
											/>
										)
									} else if ( st === BuyIslandState.checkout ){
										return (
											<AcidBagCheckout
												{...props}
												onClick={onCheckout}
												btn_str={checkout_btn_str}
												bag_width ={'100vw'}
												bag_height={"65vw"}
												showProgress={showProgress}
												btn_style={{ color: COLORS.surface1 }}
											/>
										)
									} else if ( st  === BuyIslandState.receipt ){
										return (
											<AcidBagCheckoutRecepit
												{...props}
												title="** Order Summary"
												receipt={receipt}
												onInstallApp={onInstallApp}
											/>
										)
									} else {
										return (
											<AcidBagImage key={idx} style={{marginTop:'24px'}}/>
										)
									}
								} else {
									return (<div/>)
								}
							} else if ( data === 6 ){
								if ( st === BuyIslandState.tabs ){
									return (
										<AcidFooter 
											key={idx} 
											style={{marginTop:'0px', marginBottom:'72px'}}
											btn_str={btn_str}
											onClick={onBuyTab}
										/>
									)
								} else {
									return (<div style={{height:'48px'}} />)
								}
							} else {
								return (<div/>)
							}
						})
					}
					<div ref={messagesEndRef}/>
				</div>	
				
				{ isOnMobile 
					? 
					<div/>
					:
					<Stack direction='column' style={{width:'50vw', background:COLORS.black}}>
						{	st === BuyIslandState.signup
							?
							<AuthAndCard 
								{...props}
								should_collect_payment
								collect_payment_only={showpayment}
								promptA={""}
								promptB={""}
								tellUser={tellUser}
								style={{paddingTop:'20vh'}}
								onWillAuth={() => {}}
								onDidiAuth={() => {}}
								onWillSaveCard={() => {}}
								onDidSaveCard = {onDidSaveCard}
							/>
							: 
							st === BuyIslandState.checkout
							?
							<AcidBagCheckout
								{...props}
								style={{width:'50vw', height: 'fit-content', marginTop:'15vh'}}
								onClick={onCheckout}
								btn_str={checkout_btn_str}
								showProgress={showProgress}
							/>
							:
							st === BuyIslandState.receipt
							?
							<AcidBagCheckoutRecepit
								{...props}
								title="** Order Summary"
								receipt={receipt}
								onInstallApp={onInstallApp}
								style={{width:'45vw', height: 'fit-content', marginTop:'10vh'}}
							/>
							:
							<BurnWall
								{...props}
								showIcons   = {showIcons}
								delay_show  = {3000}
								onClickItem = {onClickItem}
								grid_width  = {winWidth/2}
								grid_height = {winheight}
								datasource  = {Array(numTabs()).fill().map(_ => 1)}
								selected_datasource = {selected_datasource}
								style={{height:'fit-content', overflowY:'hidden'}}
							/>
						}
					</Stack>
				}	
			</Stack>
			</div>		
		</div>
    )
}

export default withSnack(AppAcidPage);
































