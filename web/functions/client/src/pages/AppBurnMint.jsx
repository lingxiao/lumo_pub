/**
 *
 *
 * @Package: App mint page
 * @Date   : Oct 29th, 2022
 * @Author : Xiao Ling   
 * @TODO: https://github.com/ProjectOpenSea/operator-filter-registry
 *
**/


import React, {useState, useEffect} from 'react'
import {Helmet} from "react-helmet";


import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { GiphBackgroundView } from './../components/VideoBackground';

import { COLORS }    from './../components/constants';
import withSnack from './../hoc/withSnack';
import useCheckMobileScreen, {useHeight, useWidth} from './../hoc/useCheckMobileScreen';

import {
	cap,
	trivialNum,
	trivialProps,
	trivialString,
	swiftNow,
	roundTo,
	contractMetamaskAddress, 	
} from './../model/utils'

import {
	home_page_url,
	ETHERSCAN_ADDRESS_LINK,
    erc_721_tok_opensea_url,
} from './../model/core'

import AuthAndCard from './AuthAndCard';
import { DarkButton } from './../components/ButtonViews';
import useCountdown from './../hoc/useCountdown'

import { AppTextField } from './../components/ChatTextInput'
import { CenterHorizontalView , CenterVerticalView} from './../components/UtilViews';


const {
	IconRow,
	BurnUserRow,
	AcidBagImage,
	AcidFooter,
	MerchCheckout,
	MerchCheckoutRecepit,
	useBurnStyles,	
	BurnTimer,
	UserProfileHeader,
} = require('./AppBurnPageComponents')

const {
    FeatureBox,
} = require('./AppStoryboardFragments');


const burn2 = require("./../assets/burn2.jpeg")

/******************************************************
	@constants + view components
******************************************************/

const BuyIslandState = {
	checkout: 'checkout',
	receipt : 'receipt',
	signup  : 'signup',
}


const featurebox_datasource3a = [
    {idx: 0, key: `Supply` , value: `_`},
    {idx: 1, key: `Price`  , value: `_`},
    {idx: 2, key: `Address`, value: `_`},
]
const featurebox_datasource3b = [
    {idx: 0, key: `Presale supply`   , value: `_`},
    {idx: 1, key: `Exchange Rate`, value: `_`},
    {idx: 2, key: ``  , value: ``},
]


/******************************************************
	@Acid tab page
******************************************************/


/**
 *
 * @Use: page for explaining burn page
 *
**/
function AppBurnMint(props){

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

	const [ chain, echain ]           = useState({});
	const [ collection, ecollection ] = useState({});
	const [ can_edit, ecan_edit ]     = useState(false);
	const [ tok_ids, etok_ids ]       = useState([]);

	const [ _subdomain, esubdomain ] = useState("");
	const [ _collection_id, ecollection_id ] = useState("");
	const [ _invite_id, einvite_id ] = useState("");
	const [ tydr, etydr ] = useState(featurebox_datasource3a);
	const [ tydr2, etydr2 ] = useState(featurebox_datasource3b);

	const [ is_authed, eis_authed ]   = useState(false);
	const [ loaded, eloaded ]         = useState(false);
	const [ has_stripe, ehas_stripe ] = useState(false);

	// read countdown timer
	const [days, hours, minutes] = useCountdown(collection.timeStampDropDate ?? swiftNow());

	useEffect(async () => {
		if ( !user_cache.isAuthed() ){
			eis_authed(false)
		} else {
			eis_authed(true);
		}        
		await checkStripe();
		await mount({ then: () => {
			setTimeout(() => {
				eloaded(true);
			},400)
		}});
	},[]);



	// check if uers has stripe
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
	async function mount({ then }){

        const { pathname } = location
        let url = pathname.replace('/','')
        const bits = url.split('/');

        if ( bits.length <= 1 ){
        	return then({});
        }

        let subdomain_0 = bits[0];
        let subdomain   = bits[1];
        let collection_id = bits[2] ?? "";
        let invite_id     = bits[3] ?? "";
        esubdomain(subdomain);
        ecollection_id(collection_id);
        einvite_id(invite_id);

        // get chain
		await chain_service.fetch_chain_by_subdomain({
			subdomain,
			then: async (chain) => {
				if ( !trivialProps(chain, 'root') ){

					echain(chain);

					// populate collection if it exist
					await load_collection({ chain, collection_id });

					// load edit state
					if ( user_cache.isAuthed() ){
						let user = await user_cache.getAdminUser();
						if ( chain.root.userID === user.userID ){
							eabout_1(chain.root.about);
							ebname(chain.root.name);
							ecan_edit(true);							
							await load_collection({ chain, collection_id });	
							// eloaded(true);
						} else {
							ecan_edit(false);
							// eloaded(true);
						}
					} else {
						ecan_edit(false);
						// eloaded(true);						
					}
				} else {
					ecan_edit(false);
					// eloaded(true);
				}
				return then(chain);
			}
		})
	}


	// if collection-id specified, then load col. name;
	async function load_collection({ chain, collection_id }){

		if ( trivialString(collection_id) ){
			return;
		}
		await chain.get_collection_for_burn({ collection_id, then: async (col) => {

			if ( trivialProps(col,'ID') ){
				return;
			}

			if ( trivialProps(window,'ethereum') || trivialString(col.deployed_metamask_address) ){
				let price = roundTo(col.price_in_cents/100,2);
				echeckout_btn_str(`Reserve for $${price} USD`);				
			} else {
				echeckout_btn_str(`Buy`)
			}			

			ecollection(col);
			ebname(col.title);
			eabout_1(col.about);
			eticker(col.token_sym)
			eimage_url(col.image_url);
			enum_editions(col.num_editions);
			eprice_in_eth(col.price_in_eth)
			eprice_in_usd(col.price_in_cents/100);
			eexchange_rate(col.exchange_rate_tab ?? 0)
			enum_frees(col.num_frees ?? 0)
			edeploy_btn_str("Done");

			let tids = Array
				.from(Array(col.num_editions_presale ?? 0), (_, index) => index + 1)
				.map(idx => {
					return {
						tok_id: idx,
						purchased: false,
						selected: false,
					}
				})
			etok_ids(tids)

			edrop_time({
				days: days,
				hours: hours,
				mins: minutes,
			})

			let num_edition = Number(col.num_editions);
			etydr([
				{idx: 0, key: `Supply` , value: num_edition > 0 ? `${num_edition} editions` : 'open'},
			    {idx: 1, key: `Price`  , value: `${col.price_in_eth}TH/edition`},
			    {idx: 2, key: `Address`, value:  trivialString(col.contract_address) ? "** Presale" : contractMetamaskAddress({ pk: col.contract_address, m: 4, n: 5 }) },
			])
			etydr2([
				{idx: 0, key: `Presale supply`   , value: trivialNum(col.num_editions_presale) || col.num_editions_presale == 0 
					? `None`
					: `${col.num_editions_presale ?? 0} items are available for presale` 
				},
			    {idx: 1, key: `Exchange Rate`, value: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc mattis, eros et lacinia hendrerit, nibh purus dignissim mauris`}, //`Burn ${col.exchange_rate_tab ?? 0} tabs and receive one item from this collection for free`},

			    {idx: 2, key: ``, value: ""},
			])									
			await load_contract({ chain, collection_id, col });

		}})

	}

	/******************************************************/
	// load contract

	const [ bname, ebname ] = useState("")
	const [ ticker, eticker ] = useState("");
	const [ about_1, eabout_1 ] = useState("About this collection");
	const [ num_editions, enum_editions ] = useState(0);
	const [ price_in_usd, eprice_in_usd ] = useState(0)
	const [ price_in_eth, eprice_in_eth ] = useState(0)
	const [ exchange_rate, eexchange_rate ] = useState(0);
	const [ num_frees, enum_frees ]         = useState(0);
	const [ whitelist_only, ewhitelist_only ] = useState(true)

	const [ drop_timestamp, edrop_timestamp ] = useState(swiftNow())
	const [ drop_time, edrop_time ] = useState({
		days : 0,
		hours: 0, 
		mins : 0,
	})

	const [ image_url, eimage_url ]           = useState("");
    const [ posterfile , setposterfile  ]     = useState(false);
	const [ deploy_btn_str, edeploy_btn_str ] = useState("Launch Merch Line");
	const [ show_deploy_progress, eshow_deploy_progress ] = useState(false);

	// deployed contract state
	const [ showPayoutProgress, eshowPayoutProgress ] = useState(false);
	const [ payout_btn_str, epayout_btn_str ] = useState("Payout funds")
	const [ pause_btn_str, epause_btn_str ] = useState("")

	// @use: load ocntract data
	async function load_contract({ chain, col, collection_id }){
		await chain.fetch_contract_data({
			collection_id,
			then: ({ success, message, balance_in_eth, paused, whitelist_only_mode }) => {
				if ( success ){
					epause_btn_str(paused ? "Unpause Mint" : "Pause Mint")
					epayout_btn_str(`Payout ${balance_in_eth} eth`);
					ewhitelist_only(whitelist_only_mode);
					etydr2([
						{idx: 0, key: `Presale supply`   , value: trivialNum(col.num_editions_presale) || col.num_editions_presale == 0 
							? `None.`
							: `${col.num_editions_presale ?? 0} items are available for presale.` 
						},
					    // {idx: 1, key: `Exchange Rate`, value: `Burn ${col.exchange_rate_tab ?? 0} tabs and receive one item from this collection for free.`},
					    {idx: 1, key: `Exchange Rate`, value: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc mattis, eros et lacinia hendrerit, nibh purus dignissim mauris`},
					    {idx: 2, key: whitelist_only_mode ? `Private Sale` : 'Public sale', 
					    		value: whitelist_only_mode 
							    	? `This collection is only available on the private market right now.`
							    	: `This collection is open for general sale.`
					    },
					])				
				}
			}
		})
	}

    function onEditCollection(){
    	navigate(`/gas/${_subdomain}/${_collection_id}/edit`)
    }


	/******************************************************/
	// buy-side responders

	const [ st, eviewstate ] = useState(BuyIslandState.checkout) 
	const [ selected_datasource, eselected ] = useState([]);

	const [ showpayment, eshowpayment ] = useState(false);
	const [ showProgress, eshowProgress ] = useState(false);
	const [ checkout_btn_str, echeckout_btn_str ] = useState("Buy")
	const [ receipt, ereceipt ] = useState({});

	// @use: buy either w/ credit card or eth
	async function onBuyMerch(){

		let _is_authed = await user_cache.isAuthed();

		if ( !_is_authed ){
			return eviewstate(BuyIslandState.signup);
		}

		if ( trivialProps(chain,'mint_collection_item') ){
			return tellUser("please refresh the page")
		}

		if ( trivialProps(window,'ethereum') || trivialString(collection.deployed_metamask_address) ){

			eshowProgress(true);
			echeckout_btn_str("Checking supply");

			await chain.mint_collection_item_offchain({ 

				collection_id: _collection_id, 

				is_presale: trivialString(collection.deployed_metamask_address),

				then_cannot_mint: (str) => {
					tellUser(str)
					eshowProgress(false);
					echeckout_btn_str("Try again")
				},				

				then_will_mint: (str) => {
					echeckout_btn_str(str)
				}, 

				then_did_mint_succ: ({ success, message, no_payment, tok_id, paymentId }) => {
					if ( !success ){
						tellUser(message);
						eshowProgress(false);
						echeckout_btn_str("Try again")
						if ( no_payment ){
							eviewstate(BuyIslandState.signup);
							eshowpayment(true);
						}
					} else {
						eshowProgress(false);
						eviewstate(BuyIslandState.receipt);
						echeckout_btn_str("Buy Another");
						ereceipt({  tok_id, paymentId, is_offchain: true });
						if ( trivialString(collection.deployed_metamask_address) ){
							tellUser("Presale item reserved! You can claim your item on chain once general sale commences.")
						} else {							
							tellUser("Purchased! Please see item on the burn app");
						}
					}
				},				

			})

		} else {

			eshowProgress(true);
			echeckout_btn_str("Checking supply");

			await chain.mint_collection_item({ 

				collection_id: _collection_id, 

				then_can_mint: (str) => {
					tellUser(str);
					echeckout_btn_str("You will be asked to sign once")
				},

				then_cannot_mint: (str) => {
					tellUser(str)
					eshowProgress(false);
					echeckout_btn_str("Try again")
				},				

				then_payment_failed: (str) => {
					tellUser(str)
					eshowProgress(false);
					echeckout_btn_str("Try again");
				},

				then_will_mint: (str) => {
					echeckout_btn_str(str);				
				}, 

				then_minting: () => {
					tellUser("minting")
				},

				then_did_mint_fail: (str) => {
					tellUser(str);
					eshowProgress(false);
					echeckout_btn_str("Try again")
				},

				then_monitor_progress: (iter) => {
					eshowProgress(true);
					tellUser("Awaiting approval, do not close this window");
					let base = iter < 10 ? 10 : 20;
					echeckout_btn_str(`Progress: ${iter}/${base}`);
				},

				then_did_mint_succ: ({ success, message, data }) => {
					if ( !success ){
						tellUser(message);
						eshowProgress(false);
						echeckout_btn_str("Try again")
					} else {
						eshowProgress(false);
						eviewstate(BuyIslandState.receipt);
						echeckout_btn_str("Buy Another");
						ereceipt(data);
						tellUser("Purchased! Please wait a few minutes for the update to reflect on OpenSea.")
					}
				},
			})

		}
	}

	async function onDidSaveCard(){
		eviewstate(BuyIslandState.checkout);
	}

	async function onGoToManifesto(){
		// navigate(`/burn/${_subdomain}`)
		let user = await user_cache.getAdminUser();
		navigate(`/profile/${user.userID}`)
	}

	// @use: go to mobile app store
	//       or page for mobile phone
	function onGoToOpenSea(){
		const { contract_address } = collection;
		const { tok_id } = receipt;
		if ( trivialString(contract_address) || trivialString(tok_id) ){
			return tellUser("Please check back later");
		}
		let { url, url_api } = erc_721_tok_opensea_url(contract_address,tok_id);
        let win1 = window.open(url);
        win1.focus();
        let win2 = window.open(url_api);
        win2.focus();
	}

	function onClickBoxItem(data){
		let address = collection.contract_address ?? "";
		let url = `${ETHERSCAN_ADDRESS_LINK()}${address}`;
		window.open(url)
	}

	/******************************************************/
	// views

	// compute number of tabs
	const text_style = { color: COLORS.text, opacity: 0.90 }
	const [ bg_style, ebg_style ] = useState({ background: COLORS.red_2 });
	function on_fullscreen_image_did_load(){
		ebg_style({})
	}

	const winheight = useHeight();
	const winWidth  = useWidth();

	return (
		<div style={bg_style}>
			<div>
	        <Helmet>
	            <title>{"Merch"}</title>
	        </Helmet>

			<GiphBackgroundView 
				no_delay
				darken       
				no_video_bg
				image_url  = { burn2 }
				preview_url= { burn2 }
				containerStyle={{background:COLORS.red_1}}
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
					{  /// left side of the screen
						!loaded
						?
						<div/>
						:
						[-10,0,1,-1,2,3,4,5,6].map((data, idx) => {
							if ( data === -10 ){
								return (
									<UserProfileHeader {...props} flush_left={!isOnMobile} style={{marginLeft:'24px'}}/>
								)							
							} else if ( data === 0 ){
								return (
									<Stack 
										key={idx}
										direction='row' 
										className={bstyle.footer} 
										style={{margin:'24px', color:COLORS.text3, fontSize:'12px'}}
									>
										{'the ☺ fuel'.toUpperCase()}
							            <Box sx={{ flexGrow: 1 }} />
										{'to feed ☺ the fire'.toUpperCase()}
									</Stack>
								)
							} else if ( data == 1) {
								return (
									<Stack key={idx} className={bstyle.h3} style={{color: COLORS.surface1}} direction='column'>
										<div className={bstyle.title}>
											{(bname ?? "").toUpperCase()}
										</div>
										<IconRow 
											{...props}
											chain={chain}
											style={{ height: 'fit-content', marginTop:'6px', marginBottom:'0px', marginLeft:'20px'}}
										/>																				
									</Stack>
								)
							} else if ( data === -1 ){
								return (
									<Stack key={idx} className={bstyle.title} direction='column'>									
										{ trivialProps(collection,'ID') || collection.timeStampDropDate < swiftNow()
											? 
											<div/> 
											: 
											<div>
												<div className={bstyle.h3} style={{marginTop:'48px'}}>
													{"// Drops in:"}
												</div>
												<div style={{marginLeft:'-48px', marginBottom: '24px'}}>
													<BurnTimer
														force_on_mobile
														style={{marginTop: '24px',}}
														timeStampExpire={collection.timeStampDropDate}
													/>						
												</div>
											</div>
										}											
						            </Stack>
								)								
							} else if ( data == 2) {
								return (
									<Stack key={idx} className={bstyle.body} direction='column' 
										style={{...text_style, whiteSpace: 'pre-wrap', marginTop:'24px', marginLeft:'12px'}
									}>
										<div className={bstyle.h3} style={{color:COLORS.surface1, marginTop:'24px',marginLeft: '12px'}}>
											{"// About This Collection:"}
										</div>
										<div style={{marginLeft:'12px'}}>
											{about_1 ?? ""}
										</div>
										<br/>
										<div style={{marginLeft:'12px'}}>
											{"At a glance:"}
					                        <FeatureBox 
						                        always_on
					                            datasource = {tydr}
					                            onClick={onClickBoxItem}
					                            content_style = {{ fontSize:'16px', fontFamily: 'NeueMachina-Medium' }}
					                            style={{
					                            	height:'fit-content',
					                            	marginTop: '24px',
					                            	marginRight: '24px',
					                            	width: `calc(50vw-24px)`,
					                            	border: `0.25px solid ${COLORS.text3}`,
					                            	borderBottom: `0px solid white`,
					                            }}
					                        />
					                        <FeatureBox 
						                        always_on
					                            datasource = {tydr2}
					                            content_style = {{ fontSize:'16px', fontFamily: 'NeueMachina-Medium' }}
					                            style={{
					                            	height:'fit-content',
					                            	marginBottom: '24px',
					                            	marginRight: '24px',
					                            	width: `calc(50vw-24px)`,
					                            	border: `0.25px solid ${COLORS.text3}`,
					                            	borderTop: `0px solid white`,

					                            }}
					                        />
					                    </div>
									</Stack>
								)				
							} else if ( data === 3 ){
								if ( isOnMobile ){
									if ( st === BuyIslandState.signup ){
										return (
											<AuthAndCard
												{...props}
												should_collect_payment={false}
												collect_payment_only={showpayment}
												promptA={""}
												promptB={""}
												tellUser={tellUser}
												style={{}}
												onWillAuth={cap}
												onDidAuth={cap}
												onWillSaveCard={cap}
												onDidSaveCard = {onDidSaveCard}
											/>
										)
									} else if ( st === BuyIslandState.checkout ){
										return (
											<CenterHorizontalView style={{
												width:'100%',background:COLORS.black, 
												paddingTop:'64px', 
												marginTop:'48px', 
												paddingBottom:'10vh'
											}}>	
											{
												trivialString(collection.deployed_metamask_address) 
												?
												<MerchCheckout
													{...props}
													onClick={onBuyMerch}
													btn_str={checkout_btn_str}
													showProgress={showProgress}
													image_url={image_url}
													btn_style={{}}
												/>	
												:
												<MerchCheckout
													{...props}
													onClick={onBuyMerch}
													btn_str={checkout_btn_str}
													showProgress={showProgress}
													image_url={image_url}
													btn_style={{}}
												/>
											}
											</CenterHorizontalView>
										)
									} else if ( st  === BuyIslandState.receipt ){
										return (
											<MerchCheckoutRecepit
												{...props}
												title="** Order Summary"
												receipt={receipt}
												image_url={image_url}
												collection = {collection}
												onGoToOpenSea={onGoToOpenSea}
												onGoToManifesto={onGoToManifesto}
												style={{width:'100vw', height: 'fit-content', marginTop:'36px', paddingBottom:'10vh'}}
											/>
										)
									} else {
										return (
											<div/>
										)
									}
								} else {
									return (<div/>)
								}
							} else if ( data === 4 ){
								if ( !trivialString(_invite_id) ){
									return (
										<AcidFooter 
											key={idx} 
											style={{marginTop:'0px', marginBottom:'72px'}}
											btn_str={'accept_invite_btn'}
											onClick={() => { return `onAcceptInvite`}}
											showProgress={'accept_invite_btn_progress'.length == 0}
										/>
									)							
								} else if ( can_edit && is_authed && !isOnMobile ){
									return (
										<AcidFooter 
											key={idx} 
											style={{marginTop:'0px', marginBottom:'72px'}}
											btn_str={"See Admin Page"}
											onClick={onEditCollection}
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
				</div>	
				
				{ isOnMobile  // right side of the screen
					? 
					<div/> 
					:
					<Stack direction='column' style={{width:'50vw', background: COLORS.black }}>
						{	
							st === BuyIslandState.signup  
							?
							<AuthAndCard 
								{...props}
								should_collect_payment
								collect_payment_only={showpayment}
								promptA={"Please authenticate"}
								promptB={"to continue purchase"}
								tellUser={tellUser}
								style={{paddingTop:'20vh'}}
								onWillAuth={cap}
								onDidiAuth={cap}
								onWillSaveCard={cap}
								onDidSaveCard = {onDidSaveCard}
								promptStyle={{color:COLORS.text, opacity:0.25}}
							/>
							:							
							st === BuyIslandState.checkout 
							?
							<Stack direction='column' style={{height:'100vh'}}>
					            <Box sx={{ flexGrow: 1 }} />
								<MerchCheckout
									{...props}
									style={{width:'50vw', height: 'fit-content'}}
									onClick={ onBuyMerch}
									btn_str={checkout_btn_str}
									showProgress={showProgress}
									image_url={image_url}
								/>
					            <Box sx={{ flexGrow: 1 }} />
							</Stack>
							:
							st === BuyIslandState.receipt 
							?
							<CenterVerticalView style={{height:'80vh'}}>
							<MerchCheckoutRecepit
								{...props}
								hide_image
								title="** Order Summary"
								receipt={receipt}
								image_url={image_url}
								collection = {collection}
								onGoToOpenSea={onGoToOpenSea}
								onGoToManifesto={onGoToManifesto}
								style={{width:'45vw', height: 'fit-content', marginTop:'10vh'}}
							/>
							</CenterVerticalView>
							:
							<div/>
						}
					</Stack>
				}	
			</Stack>
			</div>		
		</div>
    )
}




export default withSnack(AppBurnMint);
































