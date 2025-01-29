/**
 *
 *
 * @Package: AppStoryboardFiat.jsx
 * @Date   : July 31st 2022
 * @Author : Xiao Ling   
 *
 *
*/


import React, {useState, useEffect} from 'react'

import Stack from '@mui/material/Stack';


import { AppTextField } from './../components/ChatTextInput'
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';

import { COLORS }    from './../components/constants';
import { useStyles } from './../components/AppBodyTemplate';
import { DarkButton} from './../components/ButtonViews';
// import TypewriterText from "./../components/TypewriterText";

import { TicketHolderTitle } from './AppStoryboardRare';
import { UserRowBlock } from './AboutSaleView';

import {
	trivialProps,
	trivialString,
	ppSwiftTime,
	contractMetamaskAddress,
} from './../model/utils';


import {
	useNftvieWstyles,
} from './AppStoryboardFragments';


/******************************************************
	@View exported
******************************************************/

const default_btn = 'Complete KYC to accept payout'

/**
 *
 * @use: after contract has been deployed
 *       this becomes the transaction logs
 *
 *
*/
export default function AppStoryboardFiat(props){

	const classes    = useStyles();
	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	const { 
		// base data
		update,
		storyboard,
		userid,
		style,

		// snack
		tellUser,
		web3_job_cache,
		eshowlinearprogress,

		// data cache;
		set_cache_data,
		read_cache_data,
	
	} = props;

	/******************************************************
		@mount
	******************************************************/    

    // basics
    const [ is_owner, eis_owner ] = useState(false);

    // contract info
    const [ tx_logs, etx_logs ] = useState({ datasource: [], idx: 0, chunk_size: 20 });

    // withdraw button
    const [ amt_owed, eamt_owed ] = useState(0)
    const [ btn_label, ebtn_label ] = useState( default_btn )

    // payout accounts
    const [ payout_accts, epayout_accts ] = useState([]);

    // load contract data
    useEffect(async () => {

    	if ( trivialProps(storyboard, 'root') || trivialString(storyboard.root.ID) ){
    		return
    	}

    	let _is_owner = await storyboard.is_owner();
    	eis_owner(_is_owner);

    	// read strip and get 
    	// defined splits from on chain
    	await read_stripe();
    	await read_splits();

    	// read buy log from cache
    	let prev_buy_log = read_cache_data({
    		name: 'AppStoryboardFiat',
    		key : 'buy_log',
			mempty: []    		
    	});    	
    	etx_logs({ ...tx_logs,datasource: prev_buy_log });

    	// load fiat purchases buys
    	await storyboard.fetch_fiat_buyers({ then: (items) => {

			var sold_items = items
				.sort((a,b) => b.timeStampCreated - a.timeStampCreated)
				.map(item => {
					let tt = ppSwiftTime({ timeStamp: item.timeStampLatest, dateOnly: false });
					let res = { ...item, ppTimeStamp: tt }
					return res;
				});

			// chunk tickts in batchs for easier rendering
			let _datasource = sold_items.reduce((all,one,i) => {
				const ch = Math.floor(i/tx_logs.chunk_size); 
				all[ch] = [].concat((all[ch]||[]),one); 
				return all
			}, []);

        	set_cache_data({
				name: 'AppStoryboardFiat',
				key: 'buy_log',
				value: _datasource,
        	});			
			etx_logs({ ...tx_logs, datasource: _datasource})	    	

    	}})

    },[storyboard,update,userid])


    // load how much funds is outstanding
    // in erc1155 contract
    async function read_stripe(){

    	const stripe_connected = storyboard.stripe_connected;
    	if ( trivialProps(stripe_connected, 'stripe_account_id') ){
    		return;
    	}
    	const { stripe_account_id, payouts_enabled } = stripe_connected;

    	// strip not enabled
    	if ( trivialString(stripe_account_id) ){

    		ebtn_label(default_btn);

    	// stripe is enabled
    	} if ( !trivialString(stripe_account_id) && payouts_enabled ){

    		ebtn_label("You have successfully KYCed")
    		// read  how much is owed to user, and enumerate payout

    	// need to monitor stripe for pending successful KYC
    	} else if ( !trivialString(stripe_account_id) && !payouts_enabled  ){

    		eshowlinearprogress(true);
    		ebtn_label("Pending KYC...")
    		tellUser("We are waiting for your account to be confirmed. Please do not navigate away, this could take up to five minutes");
            await storyboard.confirm_connected_account({
                iter: 30,
                then: ({ success, message, approved }) => {
                	eshowlinearprogress(false);
                    if ( success ){
                    	ebtn_label("You have successfully KYCed, refresh this page to see updates.")
                    	tellUser("Your account is verified!")
                    } else {
                    	tellUser(message);
                    }
                }
            })
    	}

    }

    // note we read the splits from the 
    // AppStoryboardContract view, because
    // the splits is the same there
    async function read_splits(){
    	let prev_data = read_cache_data({
    		name: 'AppStoryboardContract',
    		key : 'payout_accts',
			mempty: []    		
    	});
    	epayout_accts(prev_data ?? []);
    	await storyboard.fetch_current_split_at_erc1155({    		
            then_read_fail: (str) => {return},
            then_read_success: ({ accounts }) => {
            	epayout_accts(accounts ?? [])
            	set_cache_data({
					name: 'AppStoryboardContract',
					key: 'payout_accts',
					value: accounts
            	});
            }
    	})
    }


	/******************************************************
		@responders
	******************************************************/    

	// @use: payout user
	async function onPressActionButton(){

		if ( trivialString(storyboard.eth_address ?? "") ){
			return tellUser("Please refresh this page")
		}

    	const stripe_connected = storyboard.stripe_connected;

    	if ( trivialProps(stripe_connected, 'stripe_account_id') || trivialString(stripe_connected.stripe_account_id) ){

	        eshowlinearprogress(true);
	        ebtn_label("Connecting...");

	        tellUser("You will be redirected to our payment partner for KYC")
			await storyboard.make_connected_account({
				then: ({ message, data, link }) => {
					ebtn_label(default_btn)
					eshowlinearprogress(false)
					if ( trivialString(link) ){
						tellUser(message)
					} else {
		                let win = window.open(link, '_blank');
		                win.focus();
		            }
				}
			})

		} else {

	    	// const { stripe_account_id, payouts_enabled } = stripe_connected;		
	    	tellUser("No pending payouts right now.")

		}

    }

	/*********************************************************/
    // navigation

    /**
     *
     * @Use: go to item
     *
    */
    async function onClickItem(data){
    	return;
    }


	function get_current_datasource(){
		const { datasource, idx } = tx_logs;
		if ( datasource.length === 0 ){
			return []
		} else {
			let _idx = Math.min(datasource.length-1,idx);
			return datasource[_idx];
		}
	}

	function next_page_of_users(){
		const { datasource,  idx } = tx_logs;
		let _idx = (idx + 1) > datasource.length - 1 ? 0 : idx + 1;
		etx_logs({ ...tx_logs, idx: _idx })
	}

	function payment_id_str(item){
		if ( trivialProps(item,'ID') ){
			return `Price: n/a`;
		} else {
			let board = storyboard.get_board({ at: item.storyboardID ?? "" })
			return `Amount: $${(board.price_in_cents ?? 0)/100}`;
			// let sid = item.fiat_payment_id ?? item.paymentId;
			// let id = contractMetamaskAddress({ pk: sid, m: 3, n:5 })
			// return `Receipt: ${id}`;
		}
	}

	/******************************************************
		@view
	******************************************************/    

	return (
		<div className={tclasses.scroll_container_alt} style={{...(style ?? {})}}>
			<Stack direction='column' style={{ marginLeft:'36px', width: '90%', paddingTop: '48px'}}>
	            <AppTextField
	                standard
	                disabled
	                hiddenLabel
	                value = {(isOnMobile ? 'Fiat' : `Fiat Purchase History`).toUpperCase()}
	                onChange={(e) => {return}}
	                className={classes.row_2}                            
	                inputProps={{style: {...inputPropsTitleA, fontSize: '3vw', textDecoration:'none'}}}
	                style={{...textFieldStyle, marginBottom:'0px'}}
	            />   

	            <div style={{...inputPropsAbout,width:'90%' }} >
	            	{log_intro}
	            </div>                        
				{
					!is_owner
					?
					<div/>
					:
		            <Stack direction='row' style={{marginTop:'32px'}}>
			            <DarkButton onClick={onPressActionButton} sx={{borderRadius:4,fontFamily: 'NeueMachina-Bold'}} > 
			            	{( btn_label ?? "")}
			            </DarkButton>
		            </Stack>
		        }
	            <TicketHolderTitle title='Splits' container_style={{marginLeft:'0px', width:'85%', marginRight:'-24px', marginTop:'36px'}} />
		        <div style={{width: '100%', marginLeft:'-12px' }}>
					{
						payout_accts.map((item,index) => {
							return (
								<UserRowBlock 
									{...props} 
									key={index}
									data={item}
									onClick={() => { return }}
									userID={trivialProps(item,'userID') ? '' : item.userID}
									h1={item.name ?? ""}
									h1_style={{fontSize:'16px'}}
									h2 ={ contractMetamaskAddress({ pk: item.pk, m: 7, n: 5 }) }
									h3 = {`Split: ${item.share_in_percent * 100}%`}
									row_style={{width:'90%'}}
								/>
							)					
						})
					}     
				</div>
				<TicketHolderTitle 
					show_next_btn 
					title='Purchase History' 
					data={tx_logs} 
					next_page_of_users={next_page_of_users} 
					container_style = {{ marginTop:'24px', marginLeft:'0px', marginRight:'0px', width:'85%'}}
				/>
		        <div style={{width: '100%', marginLeft:'-12px' }}>
					{
						get_current_datasource().map((item,index) => {
							return (
								<UserRowBlock 
									{...props} 
									key={index}
									data={item}
									onClick={onClickItem}
									userID={trivialProps(item,'userID') ? '' : item.userID}
									h1 = { contractMetamaskAddress({ pk: item.pk, m: 7, n: 4 }) }
									h2 = {isOnMobile ? item.ppSwiftTime : `Date: ${item.ppTimeStamp ?? ""}`}
									h3 = {payment_id_str(item)}
									image_right_url = { isOnMobile ? "" : item.image_url ?? ""}
									row_style={{width:'90%'}}
								/>
							)					
						})
					}            
				</div>
	        </Stack>
        </div>
	)
}



/******************************************************
	@View inputs + styles
******************************************************/

const log_intro = `
We partner with Stripe to bring you and your community the safest purchasing experience.
`


const textFieldStyle = {
	width: '90%',
	marginTop: '36px',
	marginBottom: '54px'
}

const inputPropsTitleA = {
    fontSize: `7vw`,
    fontFamily: 'NeueMachina-Bold',    
    color     : COLORS.text,
    marginTop: '-32px',
    textDecoration: 'underline'
}

const inputPropsAbout = {
	fontSize: '16px',
	fontFamily: 'NeueMachina-Regular',
	color: COLORS.text,
	lineHeight: 1.5,
	// textSpacing: '1px',
	whiteSpace: "break-spaces",
}


const inputPropsContract = {
	cursor: 'pointer',
	color: COLORS.text,
    textShadow  : `var(--green-glow)`,
    fontSize: '18px',
    font: 'NeueMachina-Bold',
}
