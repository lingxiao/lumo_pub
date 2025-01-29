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


import { AppTextField, AppTextFieldNoUnderLine } from './../components/ChatTextInput'
import useCheckMobileScreen from './../hoc/useCheckMobileScreen';

import { COLORS }    from './../components/constants';
import { useStyles } from './../components/AppBodyTemplate';
import { DarkButton } from './../components/ButtonViews';
import {CenterHorizontalView} from './../components/UtilViews';
import TypewriterText from "./../components/TypewriterText";

import { TicketHolderTitle } from './AppStoryboardRare';
import { UserRowBlock } from './AboutSaleView';

import {
	trivialNum,
	trivialProps,
	trivialString,
	ppSwiftTime,
	contractMetamaskAddress,
} from './../model/utils';

import {
	GLOBAL_STAGING,
	ETHERSCAN_TX_LINK,
	ETHERSCAN_ADDRESS_LINK,
} from './../model/core';

import {
	queryMetaMask
} from './../model/api_web3';


import {
	useNftvieWstyles,
} from './AppStoryboardFragments';

import {
	NonFunbileTokenCardText
} from './../components/NonFungibleTokenCard';

const {GnosisSAFE} = require('./../model/gnosis_api');


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
export default function AppStoryboardGnosis(props){

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

		// read/set cachedata
		read_cache_data,
		set_cache_data,

	} = props;

	/******************************************************
		@mount
	******************************************************/    


    // basics
    const [ can_sign, ecan_sign ] = useState(false);
    const [ reload, ereload ] = useState(1);
    const [ global_disable, eglobal_disable ] = useState(true);

    // contract info
    const [ contract_address, set_contract_address ] = useState("...")
    const [ tx_logs, etx_logs ] = useState({ datasource: [], idx: 0, chunk_size: 20 });
    const [ balance, ebalance ] = useState(0);

    // cosingers
    const [ cosigners, ecosigners ] = useState([]);
    const [ proposals, eproposals ] = useState([]);

    // buttons
    const [ lbtn_label, elbtn_label ] = useState('Propose Payout');
    const [ cbtn_label, ecbtn_label ] = useState('Deposit ETH');
    const [ rbtn_label, erbtn_label ] = useState('Add Signer');

	// check if metamask is installed
	useState(async () => {
		await queryMetaMask({ then: ({ success, pk }) => {
			if ( !success || trivialString(pk) ){
				eglobal_disable(true);
				tellUser("Metamask is required to access treasury")
			} else {
				eglobal_disable(false);				
			}
		}});
	},[])

    // load contract data
    useEffect(async () => {

    	if ( trivialProps(storyboard, 'safe') ){
    		return
    	}

    	await load_treasury();

    	setTimeout(async () => {
    		await load_treasury();
    	},2000);

    },[storyboard,update,userid]);


    function go_reload(){
    	ereload(0);
    	setTimeout(() => {
    		ereload(1);
    	},50)
    }

    // load data from treasury, 
    async function load_treasury(){

    	let treasury = storyboard.safe

    	if ( !trivialProps(treasury, 'safe_address') ){

    		// set addr
	    	const { safe_address } = treasury;
	    	set_contract_address(safe_address ?? "");

	    	// set balance
	    	let { eth, ppeth } = await treasury.read_balance();
	    	ebalance(ppeth);

	    	// set proposals
	    	eproposals(treasury.proposals);

	    	// set signers: problem: can't get users rn
	    	let prev_cosingers = read_cache_data({
	    		name: 'AppStoryboardGnosis',
	    		key : 'cosigners',
				mempty: []    		
	    	});    	
	    	ecosigners(prev_cosingers);

	    	let { owners } = await treasury.read_signers();
	    	await treasury.fetch_signer_users({ then: (users) => {
	    		ecosigners(users);
	        	set_cache_data({
					name : 'AppStoryboardGnosis',
					key  : 'cosigners',
					value: [],
	        	});		    		
	    	}});

	    	// check if i can sign
	    	let can_be_signed = await treasury.can_sign();
	    	ecan_sign(can_be_signed);
	    }    	
    }

	/******************************************************
		@responders proposal
	******************************************************/    

    // send fields
    const [ show_send , eshow_send ] = useState(false);
    const [ send_btn_label, esend_btn_label ] = useState(`Propose spending`)
    const [ send_tx, esend_tx ] = useState({ to: "", amt: "", about: "" });

	// @use: show send field
	async function onProposeSend(){
		tellUser("")
    	let treasury = storyboard.safe
    	if ( trivialProps(treasury, 'safe_address') || trivialString(treasury.safe_address) ){
    		return tellUser("no treasury found, please refresh");
    	} else if ( showlinearprogress ){
    		tellUser("Please wait for current transaction to complete")
    	} else {
    		eshow_send(true);
	    }
	}

	function cancel_send(){
		eshow_send(false);
		tellUser("");
		esend_btn_label("Send");
	}

	// @use: execute send proposal fn
	async function onExecuteProposal(){

		let treasury = storyboard.safe;

		const { to, amt, about } = send_tx;

		if ( trivialString(to) || !GnosisSAFE.validAddress(to) ){

			return tellUser("Please specify valid Ethereum address")

		} else if ( trivialNum(Number(amt)) ){

			return tellUser("Please specify send amount in ETH")

		} else if ( showlinearprogress ){

			tellUser("Please wait for current transaction to complete");

		} else {

			eshowlinearprogress(true);
			tellUser("You will be asked to sign twice")

	    	await treasury.propose_send({ 
				target: to, 
				amount: Number(amt), 
				about : about,
				then_sign: (str) => {
					esend_btn_label(str)
				},
				then_approve: (str) => {
					esend_btn_label(str)
				},
				then_approving: (str) => {
					esend_btn_label(str)
				},
				then: async ({ success, message , data }) => {
					eshowlinearprogress(false)
					tellUser(message);
					eshow_send(false);	
					setTimeout(async () => {
						cancel_send();
				    	await load_treasury();
				    	go_reload();
					},3000)
	    		}
		    });
		}
	}

	//. @use: ignore curent proposal
	async function onIgnoreProposal(data){
		let treasury = storyboard.safe;
		if ( trivialProps(data,'proposal_hash') ){
			return tellUser("please refresh page")
		}
		const { proposal_hash } = data
		await treasury.reject_tx({ proposal_hash, then: ({ success, message }) => {
		   	go_reload();
		   	if ( success ){
		   		tellUser("proposal removed")
		   	} else {
				tellUser(message)
			}
		}})
	}

	// @use: approve this proposal, maybe
	// execute the tx if enough votes secured
	async function onApproveProposal(data){
		let treasury = storyboard.safe;
		if ( trivialProps(data,'proposal_hash') || trivialProps(data,'proposal') ){
			return tellUser("please refresh page")
		}
		const { proposal, proposal_hash } = data;

		try {

			let _proposal = JSON.parse(proposal);

			eshowlinearprogress(true);

	    	await treasury.approve_transaction({ 
	    		proposal_hash,
	    		proposal: _proposal,
				then_approve: (str) => {
					tellUser(str)
				},
				then_approving: (str) => {
					tellUser(str)
				},
				then_execute: (str) => {
					tellUser(str)
				},
				then: async ({ success, message , data }) => {
					eshowlinearprogress(false)
					tellUser(message);
					eshow_send(false);	
					setTimeout(async () => {
				    	await load_treasury();
				    	go_reload();
					},3000)
	    		}
		    });


		} catch (e) {

			tellUser("We cannot decode this proposal")
		}
	}

	/******************************************************
		@responders deposit 
	******************************************************/    

    // deposit field
    const [ show_deposit , eshow_deposit ] = useState(false);
    const [ deposit_btn_label, edeposit_btn_label ] = useState(`Deposit`)
    const [ deposit_tx, edeposit_tx ] = useState(0);

	// show deposit fields
	async function onDeposit(){
		tellUser("")
    	let treasury = storyboard.safe
    	if ( trivialProps(treasury, 'safe_address') || trivialString(treasury.safe_address) ){
    		return tellUser("no treasury found, please refresh");
    	} else {
    		eshow_deposit(true);
    	}
	}

	// execute deposit fn
	async function onExecuteDeposit(){
		if ( trivialNum(Number(deposit_tx)) ){
			tellUser("Please enter valid amt of eth to deposit")
		} else {
			eshowlinearprogress(true)
			edeposit_btn_label('Awaiting approval')
			await storyboard.safe.deposit({ amt: deposit_tx, then: ({ success, message }) => {
				if ( !success ){
					tellUser(message)
				} else {
					tellUser("Awaiting block approval")
					edeposit_tx(0);
					eshowlinearprogress(false);
					edeposit_btn_label("Deposit");
					eshow_deposit(false);
					setTimeout(() => { tellUser("") },3000);
				}
			}})
		}
	}

	/******************************************************
		@responders add signer
	******************************************************/    

    // add signer
    const [ show_add_signer, eshow_add_signer ] = useState(false);
	const [ new_signer, enew_signer ] = useState({ pk: "", about: "" });
	const [ add_signer_btn, eadd_signer_btn ] = useState("Add signer");

	// add a signer
	async function onAddSigner(){
		tellUser("")
    	let treasury = storyboard.safe
    	if ( trivialProps(treasury, 'safe_address') || trivialString(treasury.safe_address) ){
    		return tellUser("no treasury found, please refresh");
    	} else {
	    	eshow_add_signer(true);
    	}		
	}

	// execute adding signer
	async function executeAddSigner(){
		const {  pk, about } = new_signer
		eshowlinearprogress(true);
		eadd_signer_btn("Proposing...")
    	await storyboard.safe.propose_add_signer({ 
    		pk: pk,
    		about: about,
    		then_create: (str) => { tellUser(str) },
    		then_approve: (str) => { tellUser(str) },
    		then_execute: (str) => { tellUser(str) },
    		then: ({  success, message }) => {
				eshowlinearprogress(false)
				tellUser(message);
				eshow_add_signer(false);	
				eadd_signer_btn("Add Signer")
				setTimeout(async () => {
			    	await load_treasury();
			    	go_reload();
				},3000)
    		}

    	});
	}


	/******************************************************
		@view responders
	******************************************************/  

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

	function contract_hash(str){
		return isOnMobile
			? contractMetamaskAddress({ pk: str, n: 3, m: 3 })
			: contractMetamaskAddress({ pk: str, n: 5, m: 7 });		
	}

	/******************************************************
		@view
	******************************************************/  

	function Vbreak(){
		return (
		    <div style={{ height: isOnMobile ? '18px' : '0px',  width: isOnMobile ? '0px' : '24px'}}/>
		)
	}  

	function HeaderView({ str, style }){
		return (
            <AppTextField
                standard
                disabled
                hiddenLabel
                value = {str.toUpperCase()}
                onChange={(e) => {return}}
                className={classes.row_2}                            
                inputProps={{style: {...(style ?? inputPropsTitleA), textDecoration:'none'}}}
                style={{...(textFieldStyle), marginBottom:'0px'}}
            />   			
		)
	}

	return (
		<div className={tclasses.scroll_container_alt} style={{...(style ?? {})}}>
		<Stack direction='column' style={{ marginLeft:'36px', width: '90%', paddingTop: '48px'}}>

            <HeaderView str='treasury'/>

            <div style={{...inputPropsAboutH1,width:'90%', marginTop:'25px' }} >
            	{`** balance: ${balance} eth`.toUpperCase()}
            </div>                                              

            { true 
            	? 
            	<div/> 
            	:
	            <div style={{...inputPropsAbout,width:'90%' }} >
	            	{log_intro}
	            </div>         
	        }

            <div style={{...inputPropsContract, height:'20px', marginTop:'12px'}} onClick={on_go_to_contract}>
				<TypewriterText	delay={50} onFinished={() => {}} className='green' >
                	{`Safe Address: ${contract_address}`}
                </TypewriterText>
            </div>
    
			{
				!can_sign
				?
				<div/>
				:	
				show_send
				?
				<Stack direction="column" style={{background:COLORS.surface1, borderRadius: '12px', width: '70%', marginTop: '24px', padding: '16px'}}>
					<Stack direction='row' style={{marginTop: '-18px'}}>
			            <AppTextFieldNoUnderLine
			                disabled
			                value = {"Send To:"}
			                onChange={(e) => {return}}
			                inputProps={{style: {...inputPropsLink, textDecoration:'none'}}}
			                style={{...(textFieldStyle), width: '20%', marginBottom: '0px', paddingTop: '0px'}}
			            />   	
			            <AppTextField
			                autoFocus
			                standard
			                hiddenLabel
			                value = { send_tx.to }
			                onChange={e => { esend_tx({ ...send_tx, to: e.target.value ?? "" }) }}
			                inputProps={{style: inputPropsLink}}
			                style={{width:'60%', marginLeft: '12px', marginTop: `36px`}}
			            />     			
			        </Stack>
					<Stack direction='row' style={{marginTop:'-12px'}}>
			            <AppTextFieldNoUnderLine
			                disabled
			                value = {"Amt in ETH:"}
			                onChange={(e) => {return}}
			                inputProps={{style: {...inputPropsLink, textDecoration:'none'}}}
			                style={{...(textFieldStyle), width: '20%', marginBottom: '0px', paddingTop: '0px'}}
			            />   	
			            <AppTextField
			                standard
			                hiddenLabel
			                value = { send_tx.amt }
			                onChange={e => { esend_tx({ ...send_tx, amt: e.target.value ?? "" }) }}
			                inputProps={{style: inputPropsLink}}
			                style={{width:'60%', marginLeft: '12px', marginTop: `36px`}}
			            />     			
			        </Stack>
					<Stack direction='row' style={{marginTop:'12px', marginBottom: '24px'}}>
			            <AppTextFieldNoUnderLine
			                disabled
			                value = {"About:"}
			                onChange={(e) => {return}}
			                inputProps={{style: {...inputPropsLink, textDecoration:'none'}}}
			                style={{...(textFieldStyle), width: '20%', marginBottom: '0px', paddingTop: '0px'}}
			            />   	
			            <AppTextField
			                standard
			                multiline
			                rows={3}
			                hiddenLabel
			                value = { send_tx.about }
			                onChange={e => { esend_tx({ ...send_tx, about: e.target.value ?? "" }) }}
			                inputProps={{style: inputPropsLink}}
			                style={{width:'60%', marginLeft: '12px', marginBottom: `0px`}}
			            />     			
			        </Stack>			        
		            <Stack direction='row' style={{marginTop:'12px'}}>
			            <DarkButton 
			            	onClick={cancel_send}
			            	sx={bstyle2}
			            	showProgress={showlinearprogress || global_disable}
			            > 
			            	{ showlinearprogress ? "_" : 'cancel'}
			            </DarkButton>			            
			            <DarkButton 
			            	showProgress={showlinearprogress || global_disable}
							onClick={onExecuteProposal}
							sx={{borderRadius:4, fontSize:'18px', width: '50%', fontFamily: 'NeueMachina-Bold'}} 
						> 
			            	{( send_btn_label ?? "")}
			            </DarkButton>
		            </Stack>			        
		        </Stack>
		        :
				show_deposit
				?
				<Stack direction="column" style={{background:COLORS.surface1, borderRadius: '12px', width: '70%', marginTop: '24px', padding: '16px'}}>
					<Stack direction='row' style={{marginTop:'-18px'}}>
			            <AppTextFieldNoUnderLine
			                disabled
			                value = {"Amt in ETH:"}
			                onChange={(e) => {return}}
			                inputProps={{style: {...inputPropsLink, textDecoration:'none'}}}
			                style={{...(textFieldStyle), width: '20%', marginBottom: '0px', paddingTop: '0px'}}
			            />   	
			            <AppTextField
			                standard
			                hiddenLabel
			                value = { deposit_tx }
			                onChange={e => { edeposit_tx(e.target.value ?? "" ) }}
			                inputProps={{style: inputPropsLink}}
			                style={{width:'60%', marginLeft: '12px', marginTop: `36px`}}
			            />     			
			        </Stack>
		            <Stack direction='row' style={{marginTop:'12px'}}>
			            <DarkButton 
			            	onClick={() => { eshow_deposit(false) }}
			            	sx={bstyle2}
			            	showProgress={showlinearprogress || global_disable}
			            > 
			            	{ showlinearprogress ? "_" : 'cancel'}
			            </DarkButton>			            
			            <DarkButton 
			            	showProgress={showlinearprogress || global_disable}
							onClick={onExecuteDeposit}
							sx={{borderRadius:4, fontSize:'18px', width: '50%', fontFamily: 'NeueMachina-Bold'}} 
						> 
			            	{( deposit_btn_label ?? "")}
			            </DarkButton>
		            </Stack>			        
		        </Stack>
		        :
		        show_add_signer
		        ? 
				<Stack direction="column" style={{background:COLORS.surface1, borderRadius: '12px', width: '70%', marginTop: '24px', padding: '16px'}}>
					<Stack direction='row' style={{marginTop:'-18px'}}>
			            <AppTextFieldNoUnderLine
			                disabled
			                value = {"New signer"}
			                onChange={(e) => {return}}
			                inputProps={{style: {...inputPropsLink, textDecoration:'none'}}}
			                style={{...(textFieldStyle), width: '20%', marginBottom: '0px', paddingTop: '0px'}}
			            />   	
			            <AppTextField
			                standard
			                hiddenLabel
			                value = { new_signer.pk }
			                onChange={e => { enew_signer({ ...new_signer, pk: e.target.value ?? "" }) }}
			                inputProps={{style: inputPropsLink}}
			                style={{width:'60%', marginLeft: '12px', marginTop: `36px`}}
			            />     			
			        </Stack>
		            <Stack direction='row' style={{marginTop:'12px'}}>
			            <DarkButton 
			            	onClick={() => { eshow_add_signer(false) }}
			            	sx={bstyle2}
			            	showProgress={showlinearprogress || global_disable}
			            > 
			            	{ showlinearprogress ? "_" : 'cancel'}
			            </DarkButton>			            
			            <DarkButton 
							showProgress={showlinearprogress || global_disable}
							onClick={executeAddSigner}
							sx={{borderRadius:4, fontSize:'18px', width: '50%', fontFamily: 'NeueMachina-Bold'}} 
						> 
			            	{( add_signer_btn ?? "")}
			            </DarkButton>
		            </Stack>			        
		        </Stack>		        
		        :				
	            <Stack direction={isOnMobile ? 'column' : 'row'} style={{marginTop:'32px'}}>
		            <DarkButton 
			            showProgress={showlinearprogress || global_disable}
		            	onClick={onProposeSend} 
		            	sx={{borderRadius:4, fontFamily: 'NeueMachina-Bold'}} > 
		            	{( lbtn_label ?? "")}
		            </DarkButton>
		            <Vbreak/>
		            <DarkButton 
			            showProgress={showlinearprogress || global_disable}
		            	onClick={onDeposit} 
		            	sx={{borderRadius:4, fontFamily: 'NeueMachina-Bold'}} > 
		            	{( cbtn_label ?? "")}
		            </DarkButton>
		            <Vbreak/>
		            {
		            	true ? <div/> :
			            <DarkButton  
				            showProgress={showlinearprogress || global_disable}
				            onClick={onAddSigner} 
			            	sx={{borderRadius:4, fontSize:'18px', fontFamily: 'NeueMachina-Bold'}} 
			            > 
			            	{( rbtn_label ?? "")}
			            </DarkButton>
			        }
	            </Stack>
	        }

            <TicketHolderTitle title='Cosigners' container_style={{marginLeft:'0px', marginTop:'24px'}} />
	        <div style={{width: '85%', marginLeft:'-12px' }}>
			{
				cosigners.map((item,index) => {
					return (
						<UserRowBlock 
							{...props} 
							key={index}
							data={item}
							onClick={() => { return }}
							userID={trivialProps(item,'userID') ? '' : item.userID}
							h1_style={{fontSize:'16px'}}
							h2 = {`Address: ${contract_hash(item.metamask_pk ?? "")}`}
							h3 = {isOnMobile ? "" : "Vote Weight: 1"}
							image_right_url = { isOnMobile ? "" : item.image_preview_url ?? ""}
							row_style={{width: isOnMobile ? "100%":'120%'}}
						/>
					)					
				})
			}     
			</div>

            <TicketHolderTitle title='Pending Proposals' container_style={{marginLeft:'0px', marginTop:'24px'}} />
				{	reload === 0 
					?
					<div/>
					:
					proposals.filter(m => m['pending']).map((item,index) => {
						return (
							<ProposalItem 
								{...props} 
								key={index} 
								data={item} 
								treasury={storyboard.safe} 
								onIgnore={() => {onIgnoreProposal(item)}}
								onApprove={() => {onApproveProposal(item)}}							
							/>
						)					
					})
				}     


            <TicketHolderTitle title='Approved Proposals' container_style={{marginLeft:'0px', marginTop:'24px'}} />
			{	reload === 0 
				?
				<div/>
				:
				proposals.filter(m => m['executed']).map((item,index) => {
					return (
						<ProposalItem 
							{...props} 
							hideButtons
							key={index} 
							data={item} 
							treasury={storyboard.safe} 
							onIgnore={() => {onIgnoreProposal(item)}}
							onApprove={() => {onApproveProposal(item)}}							
						/>
					)					
				})
			}     			          

            <TicketHolderTitle title='Rejected Proposals' container_style={{marginLeft:'0px', marginTop:'24px'}} />
			{	reload === 0 
				?
				<div/>
				:
				proposals.filter(m => m['rejected']).map((item,index) => {
					return (
						<ProposalItem 
							{...props} 
							hideButtons
							key={index} 
							data={item} 
							treasury={storyboard.safe} 
							onIgnore={() => {onIgnoreProposal(item)}}
							onApprove={() => {onApproveProposal(item)}}							
						/>
					)					
				})
			}               

            { true 
            	? <div/> 
            	:
				<TicketHolderTitle 
					show_next_btn 
					title='Transaction Log' 
					next_page_of_users={next_page_of_users} 
					data={tx_logs} 
					container_style = {{ marginTop:'24px', marginLeft:'0px', marginRight:'0px'}}
				/>
			}
	        <div style={{width: '85%', marginLeft:'12px' }}>
			{
				get_current_datasource().map((item,index) => {
					return (
						<UserRowBlock 
							{...props} 
							key={index}
							data={item}
							onClick={onClickItem}
							userID={trivialProps(item,'userID') ? '' : item.userID}
							h1_style={{fontSize:'16px'}}
							h2 = {isOnMobile ? item.ppSwiftTime : `Minted on ${item.ppTimeStamp ?? ""}`}
							h3 = {contract_hash(item)}
							image_right_url = { isOnMobile ? "" : item.image_preview_url ?? ""}
							row_style={{marginLeft:'0px', marginRight:'0px', borderBottom: `0px solid ${COLORS.surface3}`}}
						/>
					)					
				})
			}  
			</div>
			<br/><br/>          
        </Stack>
        </div>
	)
}


/******************************************************
	@View proposal component
******************************************************/


/**
 *
 * @use: proposal item
 *
**/
function ProposalItem(props){

	const classes    = useStyles();
	const isOnMobile = useCheckMobileScreen(1000);
	const tclasses   = useNftvieWstyles(isOnMobile, "")();

	const {
		style, 
		data,
		treasury,
		user_cache,
		hideButtons,
		onIgnore,
		onApprove,
		global_disable,
		showlinearprogress,
	} = props;

	// load data 

	const [ t1_right, et1_right ] = useState("");
	const [ t2, et2, ] = useState("");
	const [ t3_right, et3_right ] = useState("");
	const [ t4_middle, et4_middle ] = useState("");
	const [ t5_bottom, et5_bottom ] = useState("");
	const [ table_data_source, etable ] = useState([]);

	useEffect(async () => {

		if ( trivialProps(data, 'proposal_hash') ){
			return;
		}

		const { 
			name, 
			message,
			proposal_hash,
			proposal,
			timeStampCreated 
		} = data;

		let hash = contractMetamaskAddress({ pk: proposal_hash, n: 7, m: 3 });
		let pptime = ppSwiftTime({ timeStamp: timeStampCreated, dateOnly: false });

		await treasury.get_approvals_by({  proposal_hash, then: (approvals) => {

			let data = approvals
				.map(m => {
					const { user, userID, approval_hash, timeStampCreated } = m;
					let _pk = contractMetamaskAddress({ pk: userID, m: 5, n: 3 });
					let name = trivialProps(user, 'name') ? _pk : user.name;
					let _pptime = ppSwiftTime({ timeStamp: timeStampCreated, dateOnly: isOnMobile });
					let _hash   = contractMetamaskAddress({ pk: approval_hash, m: 5, n: 3 });
					let blob = { 
						key   : user.name,
					    valuec: isOnMobile ? _pptime : `signed: ${_pptime}`,
					    value : `${_hash}`,
					}				
					return blob;
				});
			etable(data);

		}})

		et1_right(pptime)
		et3_right(message)
		et5_bottom(hash)

		try {
			let _proposal = JSON.parse(proposal);
			if ( !trivialProps(_proposal,'value') ){
				const num_decimals = 3;
				const { value, to } = _proposal;
		        const bal_wei   = parseInt(value);
		        const bal_eth   = bal_wei/1000000000000000000;
		        et4_middle(bal_eth);
			}
			if ( !trivialProps(_proposal, 'to') ){
				let tgt = contractMetamaskAddress({ pk: _proposal.to, m: 5, n: 3 });
				await user_cache.get({ userID: _proposal.to, then: (user) => {
					if ( !trivialProps(user,'name') && !trivialString(user.name) ){
						et2(`To: ${user.name}`)
					} else {
						et2(`To: ${tgt}`)
					}
				}})
			}
		} catch (e) {
			return;
		}

	},[]);


	const sstyle = {
		border: `0.25px solid ${COLORS.surface2}`,
		width: '85%',
		padding: '18px',
		marginTop: '24px',
	}

	
	const t3_style = {
		marginLeft: '5vw',
		fontSize: '16px',
		fontFamily: 'NeueMachina-Medium',
		color: COLORS.text3,
		lineHeight: 1.2,
	};

	const bstyle = {
		borderRadius: 3,
		fontSize: '18px',
		fontFamily: 'NeueMachina-Bold',
		width: '40%'
	}


	return (
		<Stack direction='column' style={sstyle}>
			<NonFunbileTokenCardText
				style={ hideButtons ? {opacity:0.25} : {}}
				t1_left = {'Proposed on'}
				t1_right = {t1_right}
				t2 = {t2}
				t3_left = {'About'}
				t3_right = {t3_right}
				t3_style = {t3_style}
				t4_top = {'Proposed Spending'}
				t4_middle = {t4_middle}
				t4_bottom = {'ETH'}
				t5_top = {'Proposal Hash'}
				t5_bottom={t5_bottom}
				table_title={'Signed by'}
				table_data_source={table_data_source}			
				table_style_l={{width:'20%'}}
				table_style_r={{width:'75%'}}
			/>
			<br/>
			{ hideButtons ? <div/> :
			<CenterHorizontalView>
		        <DarkButton showProgress={global_disable || showlinearprogress} onClick={onIgnore} sx={bstyle2}>
		        	{"Ignore"}
		        </DarkButton>
		        <DarkButton showProgress={global_disable || showlinearprogress} onClick={onApprove} sx={bstyle}>
		        	{"Approve"}
		        </DarkButton>	        
	        </CenterHorizontalView>
		    }
		</Stack>
	)


}

/******************************************************
	@View inputs + styles
******************************************************/



const log_intro = `
This is your project treasury, it is running on a multisig wallet by Gnosis SAFE. 
`

const bstyle2 = {
	borderRadius: 3,
	fontSize: '18px',		
	fontFamily: 'NeueMachina-Bold',
	width: '20%',
	color: COLORS.text3,
	background: 'transparent',
	marginRight:'2vw',
}

const inputPropsLink = {
    fontSize: `18px`,
    fontFamily: 'NeueMachina-Regular',    
    color     : COLORS.text,
}


const textFieldStyle = {
	width: '90%',
	marginTop: '36px',
	marginBottom: '54px'
}

const inputPropsTitleA = {
    fontSize: `3vw`,
    fontFamily: 'NeueMachina-Black',    
    color     : COLORS.text,
    marginTop: '-32px',
    textDecoration: 'underline'
}


const inputPropsTitleB = {
	fontSize:'18px',
    fontFamily: 'NeueMachina-Regular',
    color     : COLORS.text3,
    textDecoration: 'underline'
}


const inputPropsAbout = {
	fontSize: '16px',
	fontFamily: 'NeueMachina-Light',
	color: COLORS.text3,
	lineHeight: 1.5,
	whiteSpace: "break-spaces",
	marginBottom:'4px',
}

const inputPropsAboutH1 = {
	fontSize: '32px',
	fontFamily: 'NeueMachina-Regular',
	color: COLORS.text,
	// lineHeight: 1.0,
	// border: `0.5px soild ${COLORS.text3}`,
}

const inputPropsContract = {
	cursor: 'pointer',
	color: COLORS.text,
    textShadow  : `var(--green-glow)`,
    fontSize: '13px',
    font: 'NeueMachina-UltraLight',

}
