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
// So if you voted 50 times and lost each one, you will still earn 1 tab!`}
const featurebox_datasource1 = [
    {idx: 0, key: `Write a manifesto` , value: `Earn 5 tabs when penning a manifesto to initiate a perpetual burn. Use tabs to elect new burn leaders.`},
    {idx: 1, key: `Sign a manifesto`  , value: `Earn 1 tab when signing a manifesto to pledge your support for the cause.`},
    {idx: 2, key: `Elect burn leaders`, value: `Earn 1/10th of a tab per tab used when the burn leader you voted for wins the weekly round, earn 2/100th of tab per tab used if your candidate lost.`}
]




/******************************************************
	@Acid tab page
******************************************************/


/**
 *
 * @Use: page for explaining burn page
 *
**/
function AppLumoSLP(props){

	/******************************************************/
	// mount

	const {
		chain_service,
		user_cache,
		tellUser,
		navigate,
	} = props;

	const isOnMobile = useCheckMobileScreen(1000);
	const bstyle = useBurnStyles(isOnMobile)();

	const [ has_stripe, ehas_stripe ] = useState(false);

	useEffect(async () => {
		await checkStripe();
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


	// @use; buy tabs
	async function onCheckout(){
		eshowProgress(true);
		echeckout_btn_str("Baking tabs");
		let amt_in_lumo = Math.max(1,selected_datasource.length);
		await chain_service.buy_lumo_token_on_polygon({
			amt_in_lumo: amt_in_lumo,
			then: async ({ success, message, data }) => {
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
		// const { mobile } = app_page_urls({ chain_id: "" });
        // let win = window.open(mobile, '_blank');        
        // win.focus()
        navigate('/thelittleredapp')
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
	            <title>{"Lumo SLP"}</title>
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
										{'the secret ☺ spark'.toUpperCase()}
							            <Box sx={{ flexGrow: 1 }} />
										{'to light ☺ the fire'.toUpperCase()}
									</Stack>
								)
							} else if ( data == 1) {
								return (
									<Stack key={idx} className={bstyle.title} style={{color: COLORS.surface1}} direction='row'>
										{'Lumo $slp'.toUpperCase()}
									</Stack>
								)
							} else if ( data == 2) {
								return (
									<Stack key={idx} className={bstyle.body} direction='row' style={{...text_style, marginTop:'24px'}}>
										{`The Lumo Burn Tab is the socially conscious currency of the decentralized internet. It’s your reputation in a brave new cashless economy. It’s your personal like button in real life and anywhere online. There are two ways to acquire tabs: earn tabs through social deeds, or just buy them here.`}
										<br/><br/>
										{`Use Burn Tabs to vote for new burn leaders. Tabs are locked in a safe when you vote, but you will receive it back in full plus interest once voting is done. You will never lose a tab from voting if you have earned it through deeds.`}
										{` 1 tab = 10 votes.`}
									</Stack>
								)
							} else if (data === 3){
								return (
									<Stack direction='column' key={idx}>
									<div className={bstyle.body} direction='row' style={{ fontSize:'16px', color:COLORS.text, marginTop:'48px'}}>
										{`This is how you earn tabs:`}
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
								return (
									<Stack className={bstyle.body} direction='row' style={{...text_style, marginTop:'12px'}} key={idx}>
										<p>
											{`Sell tabs to sponsors who wish to support your cause. Tabs are $5 each if you purchase them individually, and $4 each if you buy 100 or more. `}
											{`Unlike tabs acquired through socialy positive deeds, purchased tabs will be burnt if the sponsor votes for the losing burn leader. This prevents endowed special interests from buying votes to skew the values of the community.`}
											<br/><br/>
											{` Note! Sponors must buy tabs through a link generated by you, otherwise you will not be able to access the funds from tab sales.  `}
											<span style={{
												cursor:'pointer',
												textDecoration:'underline', 
												color: COLORS.surface1,
											}}>
												{`Generate link for sponors here`}
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
							st === BuyIslandState.checkout || true
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

export default withSnack(AppLumoSLP);
































