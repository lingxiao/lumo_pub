/**
 *
 *
 * @Package: AppStoryBoardContract
 * @Date   : June 8th, 2022
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
import TypewriterText from "./../components/TypewriterText";

import { TicketHolderTitle } from './AppStoryboardRare';
import { UserRowBlock } from './AboutSaleView';

import {
	trivialProps,
	trivialString,
	ppSwiftTime,
	contractMetamaskAddress,
} from './../model/utils';

import {
	ETHERSCAN_TX_LINK,
	ETHERSCAN_ADDRESS_LINK,
} from './../model/core';

import {
	useNftvieWstyles,
} from './AppStoryboardFragments';

import DialogAdjustSplits from './../dialogs/DialogAdjustSplits';
import DialogPauseMint from './../dialogs/DialogPauseMint';

/******************************************************
	@View exported
******************************************************/


/**
 *
 * @use: after contract has been deployed
 *       this becomes the transaction logs
 *
 *
*/
export default function AppStoryboardContract(props){

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
		showlinearprogress,
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
    const [ contract_address, set_contract_address ] = useState("...")
    const [ tx_logs, etx_logs ] = useState({ datasource: [], idx: 0, chunk_size: 20 });

    // withdraw button
    const [ amt_owed, eamt_owed ] = useState(0)
    const [ btn_label, ebtn_label ] = useState( "Syncing" )
    const [ payout_accts, epayout_accts ] = useState([]);

    // pause mint btn and dialog
    const [ paused_mint, epaused_mint ] = useState({});
    const [ showDialogPauseMint, eshowDialogPauseMint ] = useState(false);

    // split btn + dialog
    const [ split_btn_label, esplit_btn_label ] = useState("Splits locked")
    const [ disable_adjust_splits, edisable_adjust_splits ] = useState(true);
    const [ showDialogAdjustSplits, eshowDialogAdjustSplits ] = useState(false);

    // load contract data
    useEffect(async () => {

    	if ( trivialProps(storyboard, 'root') || trivialString(storyboard.root.ID) ){
    		return
    	}

    	let _is_owner = await storyboard.is_owner();
    	eis_owner(_is_owner);

    	let contract = storyboard.get_contract({ at: "" });
    	if ( !trivialProps(contract, 'contract_address') ){
	    	const { contract_address, contract_deploy_tx_hash } = contract;
	    	set_contract_address(contract_address ?? "");
	    }

    	// hard reload contract data from
    	// 0xPARC server
    	await load_contract_data();

    	// read contract data from onchain
    	await read_splits_and_is_paused();

    	// read mint from cache
    	let prev_mint_log = read_cache_data({
    		name: 'AppStoryboardContract',
    		key : 'mint_log',
			mempty: []    		
    	});    	
    	etx_logs({ ...tx_logs,datasource: prev_mint_log });

	    // load minted tokens
	    await storyboard.fetch_all_minted_items({ then: ({ data }) => {

			// get minted items, and sort LIFO
			var sold_items = data
				.sort((a,b) => a.timeStampCreated - b.timeStampCreated)
				.map(item => {
					let tt = ppSwiftTime({ timeStamp: item.timeStampCreated, dateOnly: false });
					let res = { ...item, ppTimeStamp: tt }
					return res;
				});
			sold_items = sold_items.slice(1,);
			sold_items = sold_items.sort((a,b) => b.timeStampCreated - a.timeStampCreated);

			// chunk tickts in batchs for easier rendering
			let _datasource = sold_items.reduce((all,one,i) => {
				const ch = Math.floor(i/tx_logs.chunk_size); 
				all[ch] = [].concat((all[ch]||[]),one); 
				return all
			}, []);

        	set_cache_data({
				name: 'AppStoryboardContract',
				key: 'mint_log',
				value: _datasource,
        	});			

			etx_logs({ ...tx_logs, datasource: _datasource})	    	
		}});

    },[storyboard,update,userid])


    //@use: load contract address or recepit hash
    async function load_contract_data(){
    	if ( trivialProps(storyboard, 'sync') ){
    		return
    	}
    	await storyboard.sync({ reload: true, fast: true, then: () => {
	    	let contract = storyboard.get_contract({ at: "" });    		
	    	if ( !trivialProps(contract,'contract_address') ){
		    	const { contract_address, contract_deploy_tx_hash } = contract;
		    	set_contract_address(contract_address ?? "");
		    }
    	}})
    }    

    // set list of ppl who should be paid out 
    async function read_splits_and_is_paused(){

    	let prev_data = read_cache_data({
    		name: 'AppStoryboardContract',
    		key : 'payout_accts',
			mempty: []    		
    	});

    	epayout_accts(prev_data ?? []);	
    	ebtn_label('Syncing...');

    	await storyboard.fetch_current_split_at_erc1155({

            then_read_fail: (str) => {return},

            then_read_success: ({ accounts, balance }) => {

            	var str = ""
            	if ( balance > 0 ){
                   	str = isOnMobile ? "Deposit" : `Payout ${balance} ETH`
	            } else {
                	str = "No outstanding payables";
	            }
               	ebtn_label(str);
            	epayout_accts(accounts ?? []);

            	let total_owed = accounts.map(m => {
            		return m['owed_in_eth'] ?? 0
            	})
            	.reduce((a,b) => a+b,0);

            	if ( total_owed === 0 ){
	            	esplit_btn_label('Adjust splits')
					edisable_adjust_splits(false)    
				} else {					
	            	esplit_btn_label('Splits locked')
					edisable_adjust_splits(true)    
				}

            	set_cache_data({
					name: 'AppStoryboardContract',
					key: 'payout_accts',
					value: accounts
            	});
            }    		
    	})

    	await storyboard.read_mint_is_paused({ then: ({ success, message, isPaused }) => {
    		if ( success ){
    			epaused_mint(isPaused);
    		} else {
    			tellUser(`Error reading ERC-1155 pause status: ${message}`)
    		}
    	}})
    }


	/******************************************************
		@responders
	******************************************************/    

	// @use: payout user
	async function onPressActionButton(){

		if ( trivialString(storyboard.eth_address ?? "") ){
			return tellUser("Please refresh this page")
		}

        eshowlinearprogress(true);
        ebtn_label('Awaiting signature');

	    await storyboard.release_current_window_at_erc1155({
	        then_releasing_funds: (str) => {
	            tellUser(str)
	            ebtn_label("releasing funds")
	        },
	        then_released_funds_fail: (str) => {
	            tellUser(str);
	            eshowlinearprogress(false);
	            ebtn_label("Try again")
	        },
	        then_released_funds_success: async ({ success, message }) => {
	            eshowlinearprogress(false);
            	set_cache_data({ name: 'AppStoryboardContract', key: 'payable_btn_str', value: '' });
	            if ( success ){
	            	ebtn_label("Released")
	            	tellUser("The funds have been released, you will see the update once the block has been confirmed.")
	            } else {
		            tellUser(message)
	            	ebtn_label("Try again")
	            }
	        }
	    });	
    }

    // navigation
    function on_go_to_contract(){
        let win = window.open(`${ETHERSCAN_ADDRESS_LINK()}/${contract_address}`, '_blank');
        win.focus();

    }
	
    /**
     *
     * @Use: go to item
     *
    */
    async function onClickItem(data){
    	if ( !trivialProps(data,'txHash') ){
	        let win = window.open(`${ETHERSCAN_TX_LINK()}/${data.txHash}`, '_blank');
	        win.focus();
    	}
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

	function contract_hash(item){
		let str = trivialProps(item,'txHash') ? "" : item.txHash;
		return isOnMobile
			? contractMetamaskAddress({ pk: str, n: 3, m: 3 })
			: contractMetamaskAddress({ pk: str, n: 5, m: 7 });		
	}

	/******************************************************
		@view
	******************************************************/    

	const dark_btn_style = {
		borderRadius:4, 
		fontFamily: 'NeueMachina-Bold', 
		marginLeft: isOnMobile ? '0px' : '24px',
		marginTop: isOnMobile ? '12px' : '0px',
	}

	return (
		<div>
			<div className={tclasses.scroll_container_alt} style={{...(style ?? {})}}>
				<Stack direction='column' style={{ marginLeft:'36px', width: '90%', paddingTop: '48px'}}>
		            <AppTextField
		                standard
		                disabled
		                hiddenLabel
		                value = {(isOnMobile ? 'ERC-1155' : `erc-1155 multi*token standard`).toUpperCase()}
		                onChange={(e) => {return}}
		                className={classes.row_2}                            
		                inputProps={{style: {...inputPropsTitleA, fontSize: '3vw', textDecoration:'none'}}}
		                style={{...textFieldStyle, marginBottom:'0px'}}
		            />   

		            <div style={{...inputPropsAbout,width:'90%' }} >
		            	{log_intro}
		            </div>                        
		            <div style={{...inputPropsContract, height:'20px'}} onClick={on_go_to_contract}>
						<TypewriterText	delay={50} onFinished={() => {}} className='red' >
		                	{`Contract Address: ${contract_address}`}
		                </TypewriterText>
		            </div>
					{
						!is_owner
						?
						<div/>
						:
			            <Stack direction= {isOnMobile ? 'column' : 'row'} style={{marginTop:'32px'}}>
				            <DarkButton 
				            	onClick={() => {eshowDialogPauseMint(true)}}
				            	sx={{borderRadius:2, fontFamily: 'NeueMachina-Bold', ...( paused_mint ? {background:'transparent'} : {} )}}
				            > 
				            	{ typeof paused_mint !== 'boolean' ? "Syncing..." : (paused_mint ? 'Mint disabled' : 'Mint enabled')}
				            </DarkButton>

				            <DarkButton 
					            disabled={disable_adjust_splits}
				            	onClick={() => {eshowDialogAdjustSplits(true)}}
				            	sx={dark_btn_style}
				            > 
				            	{split_btn_label}
				            </DarkButton>

				            <DarkButton onClick={onPressActionButton} 
				            	sx={dark_btn_style}
				            >
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
										h4 = {`Payable: ${item.owed_in_eth ?? 0} ETH`}
										row_style={{width:'90%'}}
									/>
								)					
							})
						}     
					</div>
					<TicketHolderTitle 
						show_next_btn 
						title='Transaction Log' 
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
										h2 = {isOnMobile ? item.ppSwiftTime : `Minted: ${item.ppTimeStamp ?? ""}`}
										h3 = {contract_hash(item)}
										image_right_url = { isOnMobile ? "" : item.image_preview_url ?? ""}
										row_style={{width:'90%'}}
									/>
								)					
							})
						}            
					</div>
		        </Stack>
	        </div>
            {
                showDialogAdjustSplits
                ?
                <DialogAdjustSplits
                    {...props}
                    storyboard={storyboard}
                    open={showDialogAdjustSplits}
                    handleClose   = {() => {
                    	eshowDialogAdjustSplits(false);
                    }}
                />      
                :
                <div/>  
            }	        
            {
            	showDialogPauseMint
            	?
            	<DialogPauseMint
                    {...props}
                    showlinearprogress = {showlinearprogress}
                    eshowlinearprogress = {eshowlinearprogress}
                    storyboard={storyboard}
                    open={showDialogPauseMint}
                    handleClose   = {() => {
                    	eshowDialogPauseMint(false);
                    }}
            	/>
            	:
            	<div/>
            }
        </div>
	)
}




/******************************************************
	@View inputs + styles
******************************************************/

const log_intro = `
You can view all mint transactions here. You will be able to adjust your splits once you have released all pending payouts from this contract.
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
    fontSize: '13px',
    font: 'NeueMachina-UltraLight',
}
