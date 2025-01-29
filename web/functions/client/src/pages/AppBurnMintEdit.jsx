/**
 *
 *
 * @Package: App mint page w/ edit 
 * @Date   : Oct 29th, 2022
 * @Author : Xiao Ling   
 *
 *
**/


import React, {useState, useEffect} from 'react'
import {Helmet} from "react-helmet";


import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import { GiphBackgroundView } from './../components/VideoBackground';

import { COLORS }    from './../components/constants';
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';
import withSnack from './../hoc/withSnack';

import {
	cap,
	trivialNum,
	trivialProps,
	trivialString,
	removeAllSpaces,
	swiftNow,
	force_to_num,
	parseSeverTimeStamp,
} from './../model/utils'

import {
	home_page_url,
	toTokenContentKind,
    urlToFileExtension,
    ItemMintState,
} from './../model/core'

import { DarkButton } from './../components/ButtonViews';
import useCountdown from './../hoc/useCountdown'

import { Text_H1 } from './../pages/AboutSaleView';
import { AboutAttributeSimple } from './../dialogs/DialogUtils';
import { AppTextField } from './../components/ChatTextInput'
import { CenterHorizontalView, CenterVerticalView, } from './../components/UtilViews';
import DragToSave from './../components/DragToSave';
import { ActionProgressWithProgress } from './../components/ButtonViews';
import AppImageView from './../components/AppImageView'


const {
	AcidBagImage,
	AcidFooter,
	useBurnStyles,	
	UserProfileHeader,
} = require('./AppBurnPageComponents')

const {
    FeatureBox,
} = require('./AppStoryboardFragments');


const burn2 = require("./../assets/burn2.jpeg")
const cubetable = require("./../assets/cubetable.png");

/******************************************************
	@constants + view components
******************************************************/


const featurebox_datasource1 = [
    {idx: 0, key: `1. Generate sale page`  , value: `A presale page will be created with a count down timer, share the page on socials to let people know you're coming.`},
    {idx: 1, key: `2. Conduct presale`     , value: `Buyers can reserve items with predefined item ids from the presale page, using just their credit card.`},
    {idx: 2, key: `3. Conduct general sale`, value: `Once the presale has ended and you have the proceeds on hand, you can deploy a contract and honor the presale supporters. And then commence general sale.`},
]


const featurebox_datasource2 = [
    {idx: 0, key: `1. About`      , value: `You can change the collection about at any time, but it may take a while for the updates to be reflected on OpenSea.`},
    {idx: 1, key: `2. Balance`    , value: `You can withdraw funds from the contract at any point, but you will need to approve the transaction with a signature.`},
    {idx: 2, key: `3. Mint State` , value: `You can pause mint or resume mint on this contract at any point. You will need to sign this transaction on chain.`},
]

const featurebox_datasource3 = [
    {idx: 0, key: `1. CONNECT`  , value: `You will be asked to connect Metamask wallet. If you do not have a wallet installed or it is not funded, then you will not be able to deploy a contract.`},
    {idx: 1, key: `2. DEPLOY` , value: `Next an ERC721 contract will be deployed from your Metamask wallet. You will be the sole owner of contract with pause/resume mint, and withdrawal funds rights.`},
    {idx: 2, key: `3. SALE`   , value: `Upon deployment, your contract will be in open-mint state, this means anyone can mint out of this contract. You can pause mint to until you're ready for general sale.`}
]


const inputPropsLink = {
    fontSize: '24px',
    fontFamily: 'NeueMachina-Medium',    
    color     : COLORS.text,
}

const inputPropsH2 = {
    fontSize: '24px',
    fontFamily: 'NeueMachina-Bold',    
    color     : COLORS.offBlack, // .black,
}

const bstyle2 = {
	borderRadius: 3,
	fontSize: '18px',		
	fontFamily: 'NeueMachina-Bold',
	marginLeft:'12px',
	color: COLORS.offBlack,
	background: 'transparent',
	maxWidth: '5f0vw',
}



/******************************************************
	@Acid tab page
******************************************************/


/**
 *
 * @Use: page for explaining burn page
 *
**/
function AppBurnMintEdit(props){

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

	// auth
	const [ is_authed, eis_authed ]   = useState(false);
	const [ loaded, eloaded ]         = useState(false);
	const [ has_stripe, ehas_stripe ] = useState(false);

	// domain
	const [ _subdomain, esubdomain ] = useState("");
	const [ _collection_id, ecollection_id ] = useState("");
	const [ _invite_id, einvite_id ] = useState("");

	// chain
	const [ chain, echain ]           = useState({});
	const [ collection, ecollection ] = useState({});
	const [ users, eusers ]           = useState([]);

	// read countdown timer
	const [days, hours, minutes] = useCountdown(collection.timeStampDropDate ?? swiftNow());


	useEffect(async () => {
		if ( !user_cache.isAuthed() ){
			eis_authed(false)
		} else {
			eis_authed(true);
		}        
		await checkStripe();
		await mount({ then: cap });
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

        // let subdomain_0 = bits[0];
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
					eusers(chain.items ?? [])

					// populate collection if it exist
					await load_collection({ chain, collection_id });

					// load edit state
					if ( user_cache.isAuthed() ){
						let user = await user_cache.getAdminUser();
						if ( chain.root.userID === user.userID ){
							eloaded(true);
							eabout(chain.root.about);
							ebname(chain.root.name);
							await load_collection({ chain, collection_id });	
						} else {
							navigate('/')					
						}
					} else {
						navigate('/')					
					}
				} else {
					navigate('/')					
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

			ecollection(col);
			ebname(col.title);
			eabout(col.about);
			eticker(col.token_sym)
			eimage_url(col.image_url);
			enum_editions(col.num_editions);
			enum_editions_presale(col.num_editions_presale ?? 0)
			eprice_in_eth(col.price_in_eth)
			eprice_in_eth_original(col.price_in_eth);
			eprice_in_usd(col.price_in_cents/100);
			eexchange_rate(col.exchange_rate_tab ?? 0)
			enum_frees(col.num_frees ?? 0)
			elaunch_btn_str("Done")
			edrop_time({ days, hours, mins: minutes });

			await checkCanUseExistingContract({ chain });							
			await load_contract({ col, chain, collection_id });

		}});
	}


	/******************************************************/
	// contract responders

	const [ bname, ebname ] = useState("")
	const [ ticker, eticker ] = useState("");
	const [ about, eabout ] = useState("About this collection");
	const [ num_editions, enum_editions ] = useState(0);
	const [ num_editions_presale, enum_editions_presale ] = useState(0);
	const [ price_in_usd, eprice_in_usd ] = useState(0)
	const [ price_in_eth, eprice_in_eth ] = useState(0)
	const [ price_in_eth_original, eprice_in_eth_original] = useState(0);
	const [ exchange_rate, eexchange_rate ] = useState(0);
	const [ num_frees, enum_frees ]         = useState(0);

	const [ drop_timestamp, edrop_timestamp ] = useState(swiftNow())
	const [ drop_time, edrop_time ] = useState({
		days : 0,
		hours: 0, 
		mins : 0,
	});

	const [ image_url, eimage_url ] = useState("");
    const [ posterfile , setposterfile  ] = useState(false);
	const [ launch_btn_str, elaunch_btn_str ] = useState("Launch Presale");
	const [ deploy_btn_str, edeploy_btn_str ] = useState("deploy contract");
	const [ show_launch_progress, eshow_launch_progress ] = useState(false);
	const [ show_deploy_progress, eshow_deploy_progress ] = useState(false);

	// deployed contract state
	const [ payout_btn_str, epayout_btn_str ]  = useState("Payout funds");
	const [ pause_btn_str, epause_btn_str ]    = useState("Checking status");

	// use exisitng contract state
	const [ existing_collection, e_existing_collection ] = useState({});
	const [ hide_deploy_new_contract_btn, ehide_deploy_new_contract_btn ] = useState(false);
	const [ use_existing_contract_btn_str, euse_existing_contract_btn_str ] = useState("Connect to deployed contract");

	// @use: load contract data from onchain
	async function load_contract({ chain, col, collection_id }){
		await chain.fetch_contract_data({
			collection_id,
			then: ({ success, message, balance_in_eth, paused }) => {
				if ( !success ){
					return tellUser(message);
				} else {
					epause_btn_str(paused ? "Unpause Mint" : "Pause Mint")
					epayout_btn_str(`Payout ${balance_in_eth} eth`);
				}
			}
		})
	}

	// @use: search for any deployed contracts for this burn evnt.
	async function checkCanUseExistingContract({ chain }){
		await chain.can_connect_to_deployed_contract({ then: ({ success, collection }) => {
			if ( !trivialProps(collection, 'contract_address') && !trivialString(collection.contract_address) ){
				e_existing_collection(collection);
				edeploy_btn_str("Deploy new contract");
			}
		} })
	}

    async function handleSavePoster(inputs){
    	let { success, file } = parse_file(inputs);
    	if ( success ){
	        setposterfile(file);
	    }
    }

    function parse_file(inputs){
        let _fs =  Object.values(inputs).filter(f => {
            return !trivialString(f.type) && !trivialString(f.name)
        })
        let file = _fs[0];
        let url  = URL.createObjectURL(file);   
        let type = toTokenContentKind(file.type);
       	return { success: true, file: file }
    }

    function poster_url(){
    	if ( !trivialString(image_url) ){
    		return image_url;
    	} else {
	    	return trivialProps(posterfile, 'type') ? '' : URL.createObjectURL(posterfile)
	    }
    }

    // @use; create or edit collection edit collection meta
    async function onCreateEditCollection(){

    	if (  !trivialProps(collection, 'ID') ){
    		await chain.edit_collection({
    			collection_id: collection.ID,
    			about: about ?? "",
    			num_frees: num_frees ?? 0,
    			num_editions: num_editions ?? 1,
				price_in_eth: price_in_eth ?? 0.01,
				price_in_cents: (price_in_usd ?? 0.75)*100,
    			then: async (res) => {
		    		if ( price_in_eth_original !== price_in_eth ) {
			    		await chain.changeItemPrice({ collection_id: collection.ID, price_in_eth, then:(_res) => {
		    				tellUser(res.message);    				
		    				navigate(`/gas/${_subdomain}/${_collection_id}`)
							window.location.reload(true);
			    		}});
		    		} else {
	    				tellUser(res.message);    				
	    				navigate(`/gas/${_subdomain}/${_collection_id}`)
						window.location.reload(true);
		    		}
    			}
    		})
    	} else {

	    	let _ticker = removeAllSpaces(ticker ?? "");

	    	if ( trivialProps(chain,'deploy_collection_off_chain')){
	    		return tellUser("Please refresh the page and try again");
	    	}

	    	if ( trivialString(bname) ){
	    		return tellUser("Please specify collection name")
	    	}
	    	if ( trivialString(ticker) ){
	    		return tellUser("Please specify ticker")
	    	}
	    	if ( _ticker.length !==3 ){
	    		return tellUser("Please specify ticker with 3 letters")
	    	}
	    	if ( trivialString(about) || about === "About this collection" ){
	    		return tellUser("Please tell us about this collection");
	    	}
	    	if ( trivialNum(num_editions) || num_editions === 0 ){
	    		return tellUser("Please specify how many editions are in this collection");
	    	}
	    	if (  trivialNum(num_editions_presale) || num_editions_presale === 0 ){
	    		return tellUser("Please specify how many editions should be available for presale")
	    	}
	    	if ( trivialNum(price_in_usd) || price_in_usd === 0 ){
	    		return tellUser("Please share presale-price in USD")
	    	}
	    	if ( trivialNum(price_in_eth) || price_in_eth === 0 ){
	    		return tellUser("Please share price in eth")
	    	}
	    	if ( trivialString(poster_url()) ){
	    		return tellUser("Please upload an image")
	    	}

	    	eshow_launch_progress(true);
	    	elaunch_btn_str("launching");

	    	let drop_timestamp = swiftNow()
	    		+ force_to_num(drop_time.days*24*60*60,0)
	    		+ force_to_num(drop_time.hours*60*60,0)
	    		+ force_to_num(drop_time.mins*60,0);

	    	// deploy;
	    	await chain.deploy_collection_off_chain({

			    title  : bname,
			    sym    : _ticker,
			    about  : about,
			    num_editions  : num_editions,
			    num_editions_presale: num_editions_presale,
			    price_in_eth  : price_in_eth,
			    price_in_cents: price_in_usd * 100,

				num_frees: num_frees ?? 0,
				exchange_rate: exchange_rate ?? 0,

			    image_file    : posterfile,

			    drop_timestamp: force_to_num(drop_timestamp,swiftNow()) ?? 0,

			    then_saving_media: (str) => {
			    	elaunch_btn_str(str)
			    },

				then_cannot_deploy: ({ message }) => {
					tellUser(message)
					eshow_launch_progress(false);
					elaunch_btn_str("Try again");
				},

				then_will_deploy: (str) => {
					tellUser(str);
			    	elaunch_btn_str("launching");
				},

				then_deploy_progress_done: async ({success, message, collection_id }) => {
					if ( !success || trivialString(collection_id) ){
						tellUser(message)
						elaunch_btn_str("Try again");
						eshow_launch_progress(false);
					} else {
						tellUser("launched!")
						navigate(`/gas/${_subdomain ?? ""}/${collection_id}`)
						window.location.reload(true);
					}
				}
	    	})
	    }
    }


    /**
     * @use: deploy contract
     *
     **/
    async function on_deploy_contract_on_chain(){

    	if ( trivialProps(collection,'ID') ){
    		return tellUser("No collection found! Please refresh the page")
    	}

    	e_existing_collection({});
    	eshow_deploy_progress(true);
    	edeploy_btn_str("Deploying, you will be asked to sign twice.")

    	// deploy;
    	await chain.deploy_collection_on_chain({

    		collection: collection,

			then_cannot_deploy: ({ message }) => {
				tellUser(message)
				eshow_deploy_progress(false);
				edeploy_btn_str("Try again");
			},

			then_will_deploy: () => {
				tellUser("Deploying contract now");
		    	edeploy_btn_str("Deploying, you will be asked to sign twice.");
			},

			then_deploy_failed: (message) => {
				tellUser(message)
				eshow_deploy_progress(false);
				edeploy_btn_str("Try again");
			},

			then_deploy_progress: (message, iter, max) => {
				tellUser(message);
				edeploy_btn_str(`Waiting for approval: ${iter}/${max}, you will be asked to sign 1 more time.`);
			},

			then_deploy_progress_done: async ({success, message, collection_id }) => {
				if ( !success || trivialString(collection_id) ){
					tellUser(message)
					edeploy_btn_str("Try again");
					eshow_deploy_progress(false);
				} else {
					tellUser("Deployed! Refreshing window in a few seconds...");
					edeploy_btn_str("...")
					eshow_deploy_progress(false);
					// navigate(`/gas/${_subdomain ?? ""}/${collection_id}`);
					window.location.reload();
				}
			}
    	})
    }

    //@use:  connect col. to deployed contract;
    async function on_use_existing_contract(){
    	eshow_deploy_progress(true);
		euse_existing_contract_btn_str("Connecting...")
		ehide_deploy_new_contract_btn(true);
    	await chain.connect_collection_with_contract({
			collection_id: collection.ID,
			connect_collection_id: existing_collection.ID,
			then: ({ success, did_connect, message }) => {
				if (success && did_connect){
					tellUser("Connected! Give use a few more seconds")
					setTimeout(() => {
						navigate(`/gas/${_subdomain ?? ""}/${collection.ID}`)
						window.location.reload(true);					
					},1500);						
				} else {
					tellUser(message)
					euse_existing_contract_btn_str("Try again");
					eshow_deploy_progress(false);
				}
			}
    	})
    }


	// payout balance	
	async function onClickPayout(){		
		if ( trivialProps(chain,'release_balance') ){
			return tellUser("Please refresh")
		}
		epayout_btn_str("Please sign transaction")
		await chain.release_balance({ 
			collection_id: _collection_id, 
			then_balance_is_zero: () => {
				tellUser("Balance is zero");
				epayout_btn_str("Payout 0 eth");
			},
			then_monitor_progress: (num) => {
				epayout_btn_str(`Progress: ${num}/10`);
				tellUser(`Awaiting transaction approval`);
			},
			then: ({ success, message }) => {
				tellUser(message);
				if ( success ){
					epayout_btn_str("Done!");
				} else {
					epayout_btn_str("Try Again")				
				}			
		}});
	}

	// pause or unpause  mint
	async function onClickPause(){		
		if ( trivialProps(chain,'toggle_mint_state') ){
			return tellUser("Please refresh")
		}
		epause_btn_str("Please sign transaction")
		await chain.toggle_mint_state({ collection_id: _collection_id, then: ({success,message}) => {
			tellUser(message);
			if ( success ){
				epause_btn_str("executing transaction, you may close this window now.")
			} else {
				epause_btn_str("Try Again")				
			}
		}})
	}

	/******************************************************/
	// views

	// compute number of tabs
	const text_style = { color: COLORS.text, opacity: 0.90 }
	const [ bg_style, ebg_style ] = useState({ background: COLORS.red_2 });
	function on_fullscreen_image_did_load(){
		ebg_style({})
	}



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
						!loaded || !is_authed
						?
						<div/>
						:
						[-10,0,1,-1,2,3,4,5,6,7,8,9,10,11].map((data, idx) => {
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
									<Stack key={idx} className={bstyle.title} direction='row'>
							            <Text_H1 
							                left       = {'** Admin Page'}
							                right      = {""}
							                style_left = {{fontSize:'48px'}}
							                style_right= {{fontSize:'36px'}}
							            />  
									</Stack>
								)			
							} else if ( data === -1 ){
								if ( trivialString(_collection_id) ){
									return (
										<Stack key={idx} className={bstyle.title} direction='column'>
								            <AppTextField
								            	disabled
								                standard
								                label=""
								                value = {"Basic Information"}
								                onChange={cap}
								                inputProps={{style: inputPropsH2}}
								                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
								            />    							            
							            </Stack>
									)
								} else {
									<Stack key={idx} className={bstyle.title} direction='column'>
							            <AppTextField
							            	disabled
							                standard
							                label=""
							                value = {"Collection Information"}
							                onChange={cap}
							                inputProps={{style: inputPropsH2}}
							                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
							            />    			
									</Stack>
								}
							} else if ( data === 2 ){
								return (
									<Stack key={idx} className={bstyle.title} direction='column'>
							            <AppTextField
							            	disabled
							                standard
							                label=""
							                value = {"Details"}
							                onChange={cap}
							                inputProps={{style: inputPropsH2}}
							                style={{width:'80%',marginTop:'2vh', marginLeft:'12px', marginTop:'24px'}}
							            />    							            																		
							            <AppTextField
							                standard
							                autoFocus
							                label="Collection Name"
							                value = { bname}
							                onChange={(e) => { 
							                    ebname(e.target.value ?? "")
							                }}
							                inputProps={{style: inputPropsLink}}
							                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
								            disabled = {!trivialProps(collection,'ID')}
							            />    
						            </Stack>
								)																
							} else if ( data === 3 ){
								return (
									<Stack key={idx} className={bstyle.title} direction='row'>
							            <AppTextField
							                standard
							                label="Ticker Name (3 letters only)"
							                value = { ticker }
							                onChange={(e) => { 
							                    eticker(e.target.value ?? "")
							                }}
							                inputProps={{style: inputPropsLink}}
							                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
								            disabled = {!trivialProps(collection,'ID')}
							            />    
						            </Stack>
								)
							} else if ( data === 4 ){
								return (
									<Stack key={idx} className={bstyle.title} direction='column'>
							            <AppTextField
							                standard
							                label={ trivialProps(collection,'ID') 
							                	? "Supply (use 0 if you want the supply to be uncapped)"
							                	: "Supply"
							                }
							                value = { num_editions }
							                onChange={(e) => { 
							                    enum_editions(e.target.value ?? "")
							                }}
							                inputProps={{style: inputPropsLink}}
							                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
							            />    
							            <AppTextField
							                standard
							                label={ trivialProps(collection,'ID') 
							                	? "Price in ETH (a 10% sales commission will be deducted from this price)"
							                	: "Price in ETH"
							                }
							                value = { price_in_eth }
							                onChange={(e) => { 
							                    eprice_in_eth(e.target.value ?? "")
							                }}
							                inputProps={{style: inputPropsLink}}
							                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
							            />  

							            { !trivialProps(collection,'ID') ? <div/> :
							            <Stack direction={'column'} >
								            <AppTextField
								            	disabled
								                standard
								                label=""
								                value = {"Drops in:"}
								                onChange={cap}
								                inputProps={{style: inputPropsH2}}
								                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
								            />    	
								            <Stack direction={'row'} style={{marginTop:'2vh'}}>
								            <AppTextField
								                standard
								                label={"Days"}
								                value = { drop_time.days }
								                onChange={(e) => { 
								                    edrop_time({ ...drop_time, days: force_to_num(e.target.value ?? 0,0) })
								                }}
								                inputProps={{style: inputPropsLink}}
								                style={{width:'20%',marginTop:'0px', marginLeft:'12px'}}
									            disabled = {!trivialProps(collection,'ID')}							                
								            />    
								            <AppTextField
								                standard
								                label={"Hours"}
								                value = { drop_time.hours }
								                onChange={(e) => { 
								                    edrop_time({ ...drop_time, hours: force_to_num(e.target.value ?? 0,0) })
								                }}
								                inputProps={{style: inputPropsLink}}
								                style={{width:'20%',marginTop:'0px', marginLeft:'12px'}}
									            disabled = {!trivialProps(collection,'ID')}							                
								            />    
								            <AppTextField
								                standard
								                label={"Minutes"}
								                value = { drop_time.mins }
								                onChange={(e) => { 
								                    edrop_time({ ...drop_time, mins: force_to_num(e.target.value ?? 0, 0) })
								                }}
								                inputProps={{style: inputPropsLink}}
								                style={{width:'20%',marginTop:'0px', marginLeft:'12px'}}
									            disabled = {!trivialProps(collection,'ID')}							                
								            />    
								            </Stack>
							            </Stack>
									        }
						            </Stack>
								)		
							} else if ( data === 5 ){
								return (
									<Stack key={idx} className={bstyle.title} direction='column'>
							            <AppTextField
							            	disabled
							                standard
							                label=""
							                value = {"Perks"}
							                onChange={cap}
							                inputProps={{style: inputPropsH2}}
							                style={{width:'80%',marginTop:'2vh', marginLeft:'12px', marginTop:'24px'}}
							            />    							            
							            <AppTextField
							                standard
							                label={ trivialProps(collection,'ID') 
							                	? "Number of items in presale"
							                	: "Presale supply"
							                }
							                value = { num_editions_presale }
							                onChange={(e) => { 
							                    enum_editions_presale(e.target.value ?? "")
							                }}
							                inputProps={{style: inputPropsLink}}
							                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
								            disabled = {!trivialProps(collection,'ID')}							                
							            />    
							            <AppTextField
							                standard
							                label={ trivialProps(collection,'ID') 
							                	? "Presale Price in USD (please factor in the 10% sales commission)"
							                	: "Presale price in USD"
							                }							                
							                value = { price_in_usd }
							                onChange={(e) => { 
							                    eprice_in_usd(e.target.value ?? "")
							                }}
							                inputProps={{style: inputPropsLink}}
							                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
							            />   
							            <AppTextField
							                standard
							                label={"Exchange rate between _ and one merch item"}
							                value = { exchange_rate }
							                onChange={(e) => { 
							                    eexchange_rate(e.target.value ?? "")
							                }}
							                inputProps={{style: inputPropsLink}}
							                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
								            disabled = {!trivialProps(collection,'ID')}							                
							            />   
						            </Stack>
								)				
							} else if ( data === 6 ){
								return (
									<Stack key={idx} className={bstyle.title} direction='column'>
							            <AboutAttributeSimple
							                numLines = {20}
							                value    = {about}
							                onChange = {e => { eabout(e.target.value ?? "") }}
							                style    = {{
							                    marginTop:'0px', 
							                    height:'fit-content', 
							                    borderRadius:'12px',
							                    background:'transparent',
							                    border: `1px solid ${COLORS.red_3}`,
							                    width:'80%',
							                }}
							            />     
						            </Stack>
								)				
							} else if (data === 7){
								if ( !trivialString(poster_url()) && !trivialProps(collection,'ID') ){
									return <div/>
								} else {
									return (
										<div key={idx} style={{fontSize:'18px', width:'90%', marginLeft:'24px', marginTop:'38px'}}>
									        <DragToSave handleDrop={handleSavePoster}>
									        	<div style={{width:'90%',height:'300px', borderRadius:'12px', background:COLORS.offBlack}}>
									        		{
									        			trivialString(poster_url())
									        			?
														<CenterVerticalView style={{height:'100%'}}>
											        		<CenterHorizontalView>
											        		<div className={bstyle.feature_box_child_h1} style={{color: COLORS.surface3}}>
												        		{'Drag and drop nft image here (We accept .mp4, .jpg, .png)'}
											        		</div>
										        		</CenterHorizontalView>
														</CenterVerticalView>
														:
										                <AppImageView 
										                    imgSrc      = {poster_url()}
										                    preview_url = {poster_url()}
										                    videoSrc    = {poster_url()}
										                    width       = {'100%'}
										                    height      = {'300px'}
										                    type        = { 
										                    	!trivialProps(posterfile, 'type') && posterfile.type === 'video/mp4'
										                    		? 'mp4'
												                     : urlToFileExtension(poster_url() ?? "") 
											                 }
										                />														
													}
									        	</div>
									        </DragToSave>
								        </div>
								    )
								}
							} else if (data === 9){
								return (
									<Stack direction='column' key={idx}>
										<div style ={{marginLeft: trivialProps(collection,'ID') ? '0px' : '12px'}}>
										{
				                        	trivialString(collection.deployed_metamask_address) && !trivialProps(collection,'ID')
				                        	?
											<Stack direction='column' style={{marginTop:'36px', background: COLORS.red_2, width: isOnMobile ? '100vw' : '50vw'}}>
												<div className={bstyle.body} style={{color:COLORS.text, marginLeft:'12px', marginTop:'12px'}}>
													{`Deploy a contract on chain to commence general sale. Here's how:`}
												</div>																						            
						                        <FeatureBox 
							                        always_on
						                            datasource = {featurebox_datasource3}
						                            content_style = {{ fontSize:'16px', fontFamily: 'NeueMachina-Medium', marginTop:"-12px" }}
						                            style={{
						                            	height:'fit-content',
						                            	margin: '24px',
						                            	width: `calc(50vw-24px)`,
						                            	border: `0.25px solid ${COLORS.text3}`
						                            }}
						                        />
						                        {
						                        	hide_deploy_new_contract_btn ? <div/> : 
									                <ActionProgressWithProgress                    
										                showProgress={show_deploy_progress}
									                    onClick = {on_deploy_contract_on_chain}
									                    label={deploy_btn_str}
									                    progress_text={deploy_btn_str}
									                    sx = {{width: '120%', border: `0.5px solid ${COLORS.red_1}`, color: COLORS.surface1}}
									                />   	
									            }
								                {
								                	!trivialProps(existing_collection, 'contract_address')
								                	?
								                	<div>								                	
													<CenterHorizontalView style={{}}>
														<div className={bstyle.body} style={{color:COLORS.text,marginTop:'-24px', marginBottom:'12px'}}>
															{hide_deploy_new_contract_btn ? "" : `or`}
														</div>							
													</CenterHorizontalView>															            								                
									                <ActionProgressWithProgress                    
										                showProgress={show_deploy_progress}
									                    onClick = {on_use_existing_contract}
									                    label={use_existing_contract_btn_str}
									                    progress_text={use_existing_contract_btn_str}
									                    sx = {{width: '120%', border: `0.5px solid ${COLORS.red_1}`, color: COLORS.surface1}}
									                />   			
									                </div>
									                :
													<div/>									                
												}
											</Stack>
											:
											<div/>
										}
										{ trivialProps(collection,'ID')
											?
											<div>
									            <AppTextField
									            	disabled
									                standard
									                label=""
									                value = { trivialProps(collection,'ID') 
									                	? "Read this before launching presale"
									                	: "Read this before saving the updates"
									                }
									                onChange={cap}
									                inputProps={{style: inputPropsH2}}
									                style={{width:'80%',marginTop:'2vh', marginLeft:'20px', marginTop:'48px', marginBottom:'12px'}}
									            />    							            
												<div className={bstyle.body} direction='row' style={{ 
													fontSize:'16px', 
													color:COLORS.text, 
													marginTop:'6px'}
												}>
													{ trivialProps(collection,'ID') 
														? `What will happen when you press "Launch Presale":`
														: `What can be updated:`
													}
												</div>
						                        <FeatureBox 
							                        always_on
						                            datasource = { trivialProps(collection,'id') ? featurebox_datasource1 : featurebox_datasource2}
						                            content_style = {{ fontSize:'16px', fontFamily: 'NeueMachina-Medium', marginTop:"-12px" }}
						                            style={{
						                            	height:'fit-content',
						                            	margin: '24px',
						                            	width: `calc(50vw-24px)`,
						                            	border: `0.25px solid ${COLORS.text3}`
						                            }}
						                        />
					                        </div>
					                        :
					                        <div/>
					                    }
				                        </div>

				                        {
				                        	trivialProps(collection,'ID') || trivialString(collection.deployed_metamask_address)
				                        	? 
				                        	<div key={idx}/> 
											:
											<Stack key={idx} className={bstyle.title} direction='column' style={{top:'48px'}}>
									            <AppTextField
									            	disabled
									                standard
									                label=""
									                value = {"Contract State"}
									                onChange={cap}
									                inputProps={{style: inputPropsH2}}
									                style={{width:'80%',marginTop:'2vh', marginLeft:'12px'}}
									            />    

									            <div style={{marginTop:'24px', marginBottom:'12px', marginLeft:'-8px'}}>
													<div className={bstyle.body} style={{color:COLORS.surface1}}>
														{`How with receive earning from sales: when buyers buy items with ETH, it's sent to the contract address. You can withdrawal here by pressing the button below. A 10% sales commission will be applied at point of withdrawal.`}
													</div>													
										            <DarkButton 
										            	onClick={onClickPayout}
										            	sx={{...bstyle2, maxWidth:'40vw', marginTop: isOnMobile ? '12px' : '-6px', marginLeft:'20px'}}
										            > 
										            	{payout_btn_str}
										            </DarkButton>		
										        </div>						       


									            <div style={{marginBottom:'24px', marginLeft:'-8px'}}>
													<div className={bstyle.body} style={{color:COLORS.surface1}}>
														{`How to pause or resume mint: when a contract is deployed, it is in mint state: this means anyone can mint out of this contract. You may pause mint here to prevent further mints.`}
													</div>													

										            <DarkButton 
										            	onClick={onClickPause}
										            	sx={{...bstyle2, marginTop: isOnMobile ? '12px' : '-6px', marginLeft:'20px'}}
										            > 
										            	{pause_btn_str}
										            </DarkButton>		
										        </div>					
										        {/*

									            <div style={{marginBottom:'24px'}}>
													<div className={bstyle.body} style={{color:COLORS.surface1}}>
														{`How to whitelist people or list an open sale: When the contract is deployed, it is set in whitelist mode. This means only those who are whitelisted may purchase items out of your collection. Circulate the manifesto to collate the whitelist, people are added to the whitelist queue when they sign the manifesto. You *must* add them to the whitelist here by tapping the "Whitelist All" button below.`}
														{` You can see a list of people who are waiting on the whitelist on the right side. If you cannot see it, then make sure you're on a desktop computer, and make the screen very big.`}
													</div>			
										            <DarkButton 
										            	onClick={onClickWhiteList}
										            	sx={{...bstyle2, marginLeft:'12px'}}
										            > 
										            	{whitelist_btn_str}
										            </DarkButton>		
										        </div>		


									            <div style={{marginBottom:'12px'}}>
													<div className={bstyle.body} style={{color:COLORS.surface1}}>
														{`If or when you're ready, you can open the collection for a general sale, just press the "Commence general sale" button below.`}
														{` In a general sale, anyone can purchase items out of your collection, even if they're not on the whitelist.`}
													</div>			
										            <DarkButton 
										            	onClick={onClickToggleWhiteList}
										            	sx={{...bstyle2,  marginLeft:'12px'}}
										            > 
										            	{toggle_whitelist_btn_str}
										            </DarkButton>		
										        </div>	

										        */}
										        							        													        
									        </Stack>
				                        }

			                        </Stack>
			                    )								
							} else if ( data === 10 ){
								if (show_deploy_progress){
									return <div style={{marginBottom:'72px'}}/>
								} else {
									return (									
										<AcidFooter 
											key={idx} 
											style={{marginTop:'0px', marginBottom:'72px'}}
											btn_str={launch_btn_str}
											onClick={onCreateEditCollection}
											showProgress={show_launch_progress}
										/>
									)																																
								}
							} else {
								return (
									<div/>
								)
							}
						})
					}
				</div>	
				
				{ isOnMobile || !is_authed
					? 
					<div/> 
					:
					<Stack direction='column' style={{width:'50vw', background: COLORS.offBlack }}>
						{
							trivialProps(collection,'ID')
							?
							<CenterVerticalView style={{height:'100vh'}}>
							<AcidBagImage
								img_name={cubetable}
								width={'40ww'}
								height={'40vw'}
								style={{
									background:COLORS.offBlack,
								}}
							/>
							</CenterVerticalView>
							:
							<WhiteListTable
								{...props}
								chain={chain}				
								tellUser={tellUser}
								collection_id={_collection_id}
							/>
						}
					</Stack>
				}	
			</Stack>
			</div>		
		</div>
    )
}


/**
 *
 * @use: whitelist tabl
 *
 **/
function WhiteListTable({ chain, user_cache, collection_id, tellUser }){

	const isOnMobile = useCheckMobileScreen(800);
	const bstyle = useBurnStyles(isOnMobile)();

	const [ queue, equeue ]           = useState([]);
	const [ listed, elisted ]         = useState([]);
	const [ preminted, epreminted ]   = useState([]);
	const [ minted, eminted ]         = useState([]);

	const [ whitelist_hd, ewhitelist_hd ]   = useState("Whitelisted:")
	const [ qwhitelist_hd, eqwhitelist_hd ] = useState("Whitelist Queue:")
	const [ minted_hd, eminted_hd ] = useState("")
	const [ preminted_hd, epreminted_hd ] = useState("");

	useEffect(async() => {

		// load minted
		setTimeout(async () => {
			await chain.fetch_all_tokens({ collection_id, then: async ({ data }) => {
				await rec_fill_minted({ tokens: data });
			}});
		},2000);

		// load whitelist
		setTimeout(async () => {
			let all_signers = await chain.read_unique_signers();
			// await rec_fill_signer({ signers: all_signers });
		},2000)
	},[]);


	// fill minted
	async function rec_fill_minted({ tokens }){
		if ( tokens.length == 0 ){
			return;
		} else {
			let tok = tokens[0];
			let tail = tokens.slice(1,);
			let { userID, mint_state } = tok;
			await user_cache.get({ userID: userID, then: async (user) => {
				let blob = { user, tok };
				if (mint_state == ItemMintState.fiat_purchased_await_mint){
					preminted.push(blob);
					epreminted_hd( `${preminted.length} editions in premint:` )
				} else {					
					minted.push(blob);
					eminted_hd( `${minted.length} editions minted:` )
				}
				return await rec_fill_minted({ tokens: tail });
			}});
		}
	}

	// navigate to user
	function onClickUser(user){
		if ( trivialProps(user,'userID') ){
			return tellUser("No profile found")
		} else {
		    window.open(`https://twitter.com/${user.twitterUserName}`)
		}
	}

	const row_font_style = {
		color:COLORS.text3, 
		marginTop:'12px', 
		marginLeft:'0px',
		cursor:'pointer',
		fontSize: '14px',
		fontFamily: 'NeueMachina-Regular'
	}

	return (
		<div className={bstyle.scroll_container} style={{height:'calc(100vh)',marginTop:'24px',marginLeft:'24px', color:COLORS.text2}}>
			<div className={bstyle.h3} style={{marginLeft:'0px', paddingBottom:'24px', textDecoration: 'underline'}} >
				{'Sales History'.toUpperCase()}
			</div>
			{/*
			<div className={bstyle.h4} style={{marginLeft:'0px'}} >
				{(whitelist_hd ?? "").toUpperCase()}
			</div>
			<Stack direction='column'>
		        {
		            ( listed ?? [] ).map((blob,idx) => (
		                <div 
		                	key={idx} 
		                	style={row_font_style}
		                	className={bstyle.body} 
		                	onClick={() => onClickUser(blob.user) }
		               	>
		               		{  `${contractMetamaskAddress({ pk: blob._signer_metamask_pk, m: 3, n: 5 })}: ${blob.user.get_name()}` }
		                </div>
		            ))
		        }									
			</Stack>
			<div style={{height:'48px'}}/>
			<div className={bstyle.h4} style={{marginLeft:'0px'}} >
				{(qwhitelist_hd ?? "").toUpperCase()}
			</div>
			<Stack direction='column'>
		        {
		            ( queue ?? [] ).map((blob,idx) => (
		                <div 
		                	key={idx} 
		                	style={row_font_style}
		                	className={bstyle.body} 
		                	onClick={() => onClickUser(blob.user) }
		               	>
		               		{  `${contractMetamaskAddress({ pk: blob._signer_metamask_pk, m: 3, n: 5 })}: ${blob.user.get_name()}` }
		                </div>
		            ))
		        }									
			</Stack>
			<div style={{height:'48px'}}/>
			*/}			
			{
				preminted.length > 0 
				?
				<div>
					<div className={bstyle.h4} style={{marginLeft:'0px'}} >
						{preminted_hd.toUpperCase()}
					</div>
					<Stack direction='column'>
				        {
				            ( preminted ?? [] ).map((tok,idx) => (
				                <div 
				                	key={idx} 
				                	style={row_font_style}
				                	className={bstyle.body}
				                	onClick={() => onClickUser(tok.user) }
				               	>
									{`${tok.user.get_name()} reserved item id: ${tok.tok.tok_id} on ${parseSeverTimeStamp({ timeStamp: tok.tok.timeStampCreatedPP })}`}
				                </div>
				            ))
				        }									
					</Stack>
				</div>
				:
				<div/>
			}
			<br/>
			<div className={bstyle.h4} style={{marginLeft:'0px'}} >
				{minted_hd.toUpperCase()}
			</div>
			<Stack direction='column' style={{paddingBottom:'10vh'}}>
		        {
		            ( minted ?? [] ).map((tok,idx) => (
		                <div 
		                	key={idx} 
		                	style={row_font_style}
		                	className={bstyle.body} 
		                	onClick={() => onClickUser(tok.user) }
		               	>
							{`${tok.user.get_name()} purchased item ${tok.tok.tok_id} on ${parseSeverTimeStamp({ timeStamp: tok.tok.timeStampCreatedPP })}`}
		                </div>
		            ))
		        }									
			</Stack>		
		</div>
	)
}



export default withSnack(AppBurnMintEdit);












