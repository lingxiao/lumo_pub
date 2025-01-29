/**
 * 
 * @Module: web3 job cache
 * @Author: Xiao Ling
 * @Date  : 6/9/2022
 * 
 * 
*/


import {
	ETH_NETWORK,
	POST_ENDPOINTS,
	go_axios_post,
	make_post_params,
	Item_wholesale_price,
	default_fn_response,
	ETH_ADMIN_ADDRESS,
} from './core'

import {
	queryMetaMask,
	deployContract,
	mintToken,
	fundsOwed,
	releaseFunds,
	getBalanceOfEther,
	sendEthFromMetamaskAccount,
	readMintIsPaused,
} from './api_web3';

import {
	remove_story_board_item,
	maybe_premint_ticket
} from './api_storyboard';

import {
	deploy_safe
} from './gnosis_api';

import { 
	trivialNum, 
	trivialString, 
	illValued, 
	trivialProps, 
	cap 
} from './utils';

const uuid  = require('uuid');

/******************************************************
	@On Chain job queue
******************************************************/



/**
 * 
 * @Use: app API for on chain tx
 * @Functions:
 * 
 * 	- deploy_contract
 *  - can_deploy_contract
 *  - monitor_deploy_contract
 *  - can_mint_item
 *  - mint_item
 *  - batch_mint_item
 * 
 */ 
export default class Web3JobCache {

	constructor(user_cache, nft_cache){
		this.user_cache    = user_cache;
		this.nft_cache     = nft_cache;
		this.jobs          = {}
		this.delegate      = {};
	}

	/**
	 *
	 * @use: on load, sync all minting tokens 
	 * 
	 **/
	async sync(){
		await go_axios_post({
			post_params: make_post_params({}),
			endpoint   : POST_ENDPOINTS.monitor_all_minting_storyboard_item,
			then: (res) => cap
		});
	}

    /******************************************************
    	@bubble event
    ******************************************************/ 


    // @use: enqueue job into jobs queue, bubble event
    enqueue = (job_blob) => {
    	let id = job_blob['id'] || job_blob['ID'];
    	if ( trivialString(id) ){
    		return false;
    	}
    	job_blob['in_progress'] = true;
	    this.jobs[id] = job_blob;
		if ( !trivialProps(this.delegate,'willPushJob') ){
			this.delegate.willPushJob(job_blob);
		}	    

		return true;
    }


    // dequeue job from job queue, bubble event
    dequeue = (job_blob) => {

    	if (  trivialProps(job_blob,'ID') && trivialProps(job_blob,'id') ){
    		return;
    	}

    	let { id, ID, success, message, meta }  = job_blob;

    	let _id = id ?? ID;
    	var job = this.jobs[_id] ?? {};
    	job['in_progress'] = false;
    	job['success'] = success;
    	job['message'] = message;
    	job['meta']    = meta ?? {}
    	this.jobs[_id] = job;

    	if ( !trivialProps(this.delegate, 'didFinishJob') ){
    		this.delegate.didFinishJob(job);
    	}    	

    	return job;
    }


    /******************************************************
        @Mint read
    ******************************************************/ 

	/**
	 * 
	 * @use: lookup mint state of an item, determine
	 *       where the item is
	 * 
	 **/
	async lookup_mint_state ({ 
		item,
		then_dne,
		then_imported, 
		then_failed_to_lookup,
		then_contract_not_deployed, 
		then_minted,
		then_can_mint,
	}){

        if ( trivialProps(item,'ID') ){
        	return then_dne();
        }

        const { ID, migrated_token_id, migrated_contract_address } = item;

        // go to opensea migrated token
        if ( !trivialString(migrated_token_id) && !trivialString(migrated_contract_address) ){

        	then_imported({  migrated_contract_address, migrated_token_id })

        } else {

	        await this.can_mint_storyboard_item({ 
	        	itemID: ID,
				then   : ({ success, message, contract_deployed, minted, contract, tok }) => {	            	
					if ( !success ){
						then_failed_to_lookup(message)
	                } else if ( !contract_deployed ){
	                	then_contract_not_deployed();
	                } else if ( !trivialProps(tok,'tok_id') ){
	                    const { contract_address, tok_id } = tok;
	                    then_minted({ contract_address, tok_id });
	                } else {
	                	then_can_mint();
	                }
	            }
	        });

	    }    
	}

    /******************************************************
        @Mint write  on client side
    ******************************************************/ 


	/**
	 * 
	 * @Use: check if can mint story board item 
	 * 
	 **/
	async can_mint_storyboard_item({ itemID, then }){

		var raw_response = {
			success: false, 
			minted: false,
			message: '',
			user: {},
			data: {},
			price: 0,
			contract: {},
			itemID: "",
			isPaused: false,
		}

		let deployment_network = ETH_NETWORK();
		let user = await this.user_cache.getAdminUser();

    	if ( trivialProps(user,'userID') ){
    		raw_response['message'] = 'please sign in first'
    		return then(raw_response);
    	}		

    	await queryMetaMask({ then: async ({ success, message, pk, chainId }) => {

    		if ( !success || trivialString(pk) ){

    			raw_response['message'] = message

				await go_axios_post({
					post_params: make_post_params({ itemID: itemID }),
					endpoint   : POST_ENDPOINTS.can_mint_storyboard_item,
					then: (res) => { 
						then({ ...res, message: message, success: false });
					}
				});

    		} else if ( deployment_network !== chainId ){

    			if ( deployment_network === '0x1' ){
    				raw_response['message'] = `Please switch your metamask account to ethereum mainnet`
    				return then(raw_response);
    			} else if (deployment_network === '0x4'){
    				raw_response['message'] = `Please switch your metamask account to ethereum rinkeby testnet`
    				return then(raw_response);
    			} else {
    				raw_response['message'] = `Wrong network, expected ${deployment_network}, but found ${chainId}`
    				return then(raw_response);
    			}

    		} else {

				await go_axios_post({
					post_params: make_post_params({ itemID: itemID }),
					endpoint   : POST_ENDPOINTS.can_mint_storyboard_item,
					then: async (res) => { 

						const { contract, contract_deployed, minted, success } = res;
			    		const {  contract_address, abi, bytecode } = contract;

			    		// if not deployed or fail to read, stop here
			    		if ( !success || !contract_deployed || minted ){
	
							return then({ ...res, user: user }) 

						} else {

							// check if mint is paused by contract owner
							await readMintIsPaused({ contract_address, abi, bytecode, then: async ({ success, message, isPaused }) => {
								if ( !success || isPaused ){
									then({ ...res, isPaused: isPaused, user: user }) 
								} else {
									then({ ...res, user: user }) 
								}
							}});
						}
					}
				});

			}

		}});
    }    

    /**
     * 
     * @use: premint ticket metadata, then 
     *       mint the ticket on chain
     * 
     **/
    async mint_ticket({
    	storyboard,
		storyboardID,
		then_did_premint,		    	
		then_will_mint,
		then_cannot_mint,
		then_contract_paused_mint,
		then_can_mint,
		then_minting,
		then_mint_failed,
		then_mint_progress,
		then_mint_progress_done,    	
    }){

		let user = await this.user_cache.getAdminUser();

    	if ( trivialProps(user,'userID') ){
    		let res = { success: false, message: 'please sign in first', data: {} }
    		return then_cannot_mint(res);
    	}

    	await maybe_premint_ticket({
    		userID       : user.userID,
    		storyboardID : storyboardID,
    		then         : async (res) => {

    			let { success,did_premint,data, message } = res;

    			if ( !success || !did_premint || trivialProps(data,'ID') ){
    				return then_cannot_mint(res);
    			}

    			then_did_premint(`Created ticket metadata`);

    			await this.mint_storyboard_item({
			    	storyboard: storyboard,
    				itemID: data.ID,
    				then_will_mint,
					then_can_mint,
					then_minting,
					// if mint failed, remove metadata 
					// from server 
					then_contract_paused_mint: async (str) => {
						await remove_story_board_item({
							userID: user.userID,
							itemID: data.itemID,
							then: async (_) => {
								then_contract_paused_mint(str);
							}
						})
					},
					then_cannot_mint: async (str) => {
						await remove_story_board_item({
							userID: user.userID,
							itemID: data.itemID,
							then: async (_) => {
								then_cannot_mint(str);
							}
						})
					},					
					then_mint_failed: async (fail_res) => {
						await remove_story_board_item({
							userID: user.userID,
							itemID: data.itemID,
							then: async (_res) => {
								then_mint_failed(fail_res);
							}
						})
					},
					then_mint_progress,
					then_mint_progress_done,    	    				
    			})
    		}
    	})
    }

    /** 
     * 
     *  @use: `mint` storyboard item
     * 
     **/
    async mint_storyboard_item({ 
    	itemID, 
    	storyboard,
		then_will_mint,
		then_cannot_mint,
		then_contract_paused_mint,
		then_can_mint,
		then_minting,
		then_mint_failed,
		then_mint_progress,
		then_mint_progress_done,    	
    }){

    	then_will_mint("checking mint status");


		let id = uuid.v4();
		var job_blob = {
	        ID           : id,
	        success      : false,
	        message      : 'minting', 
	        pretty_print : `minting item`,
	        data         : {},
	    }   	

	    this.enqueue(job_blob);
	
    	// check this item can be minted, if true then should
    	// return all contract data needed to build mint fn  clien side
    	await this.can_mint_storyboard_item({ itemID, then: async (_res_) => {

    		const { success, isPaused, minted, price, contract_deployed, contract, user } = _res_;

    		if ( !success || minted || !contract_deployed ){

    			this.dequeue(job_blob);
    			return then_cannot_mint(_res_);

    		} else if ( isPaused ){

    			this.dequeue(job_blob);
    			return then_contract_paused_mint("The contract owner has paused mint on this contract");

    		} else {

	    		const {  contract_kind, contract_address, abi, bytecode, contract_deployer_address } = contract;

	    		if ( [contract_deployer_address, contract_kind,contract_address,abi,bytecode].map(trivialString).includes(true)  ){
	    			this.dequeue(job_blob);	    			
	    			_res_['message'] = `${_res_.message}; contract is mal-formed`;
	    			return then_cannot_mint(_res_);
	    		}

	    		if ( illValued(price) ){
	    			this.dequeue(job_blob);	    			
	    			_res_['message'] = `${_res_.message}: price is not defined`
	    			return then_cannot_mint(_res_);
	    		}

	    		let price_and_mint_cost = price + 0.075;

	    		// check user has balance for price + mint fee
	    		await getBalanceOfEther({  then: async ({ success, balance }) => {

	    			if ( !success || balance < price_and_mint_cost ){

	    				let _bal = Math.round(balance*1000)/1000;
	    				let no_eth_res = {success: false, message: `Insufficient balance, you have ${_bal}ETH, this item costs ${price}ETH plus mint cost.`, data: {}};

		    			this.dequeue(job_blob);	    			
		    			return then_cannot_mint(no_eth_res)

	    			} else {

			    		// push mint-blob into mint queue
			    		await this.will_mint_storyboard_item({
			    			itemID : itemID,
			    			userID : user.userID ?? "",
			    			contract_address: contract_address,
			    			contract_kind: contract_kind,
			    			then: async ( { success, canMint, message } ) => {

			    				if ( !success || !canMint ){
					    			this.dequeue(job_blob);	    			
					    			return then_cannot_mint(_res_);    					
			    				}

						   		then_can_mint('please sign to approve payment, you will be asked to sign twice.');

						   		// send eth to contract-address
						   		// note erc721 contract is a PaymentSplitter.sol
						   		await sendEthFromMetamaskAccount({
									to_addr   : contract_address, // contract_deployer_address, 
									amt_in_eth: price ?? Item_wholesale_price(),
									userID    : user.userID ?? "", 
									then      : async (payment_res) => {

										const { success, message }  = payment_res
										let payment_tx_hash = payment_res['hash'] ?? "";

										if ( !success ){

							    			this.dequeue(job_blob);	    			
											await this.did_fail_to_mint({ itemID: itemID, then: cap });
											return then_mint_failed({ 
												success: false, 
												message: `we failed to charge for this token: ${message}`, 
												data: {}, 
												hash: "" 
											})

										} else {

											then_minting('please sign to approve the mint')

											// mint token fn on chain on client side
											// using user's metamask
									   		await mintToken({ 
									   			abi             : abi, 
									   			bytecode        : bytecode,
									   			itemID          : itemID, 
									   			contract_address: contract_address, 
									   			contract_kind   : contract_kind, 
									   			then: async (_mint_res_) => {

									   				let { success, message, tok_id, data, raw_data, hash } = _mint_res_;

									   				if ( !success || trivialString(hash) ){

									   					// erase mint-pending-token
														await this.did_fail_to_mint({ itemID: itemID, then: cap });

														// log payment but fail to mint
														await this.did_charge_and_fail_to_mint({
															itemID : itemID,
															price  : price, 
													    	storyboard: storyboard,
															transaction_hash: payment_tx_hash,											
															contract_address: contract_address, 
														});

										    			this.dequeue(job_blob);	    			
									   					return then_mint_failed(_mint_res_)

									   				} else {

									    				then_mint_progress(`Do not close window, waiting for block to be confirmed`)

										   				// update mint queue
										   				await this.did_mint_storyboard_item({	
										   					itemID: itemID,
										   					userID: user.userID ?? "",
										   					transaction_hash: hash, 
										   					payment_tx_hash: payment_tx_hash,
										   					then: async ({ success, message }) => {
										   						const _this = this;
													    		setTimeout(async () => {
														    		await _this._rec_monitor_mint_status({ 
														    			iter: 0, 
														    			itemID: itemID,
														    			tok_id: tok_id ?? "",
													   					transaction_hash: hash, 									    			
													   					job_blob: job_blob,
																		then_mint_progress: then_mint_progress, 
																		then_mint_progress_done: then_mint_progress_done 
																	});
													    		},3000);
										   					}
										   				})
										   			}										   			
									   			}
									   		})
									   	}
									}
						   		});
			    			}
			    		});

	    			}
	    		}});
	    	}
    	}});
    }



    /******************************************************
        @Mint low level API and util fns
    ******************************************************/ 

	/**
	 * 
	 * @Use: alert will mint story board item 
	 * 
	 **/
	async will_mint_storyboard_item({ itemID, userID, contract_address, contract_kind, then }){
		await go_axios_post({
			post_params: make_post_params({ itemID: itemID, userID: userID, contract_kind: contract_kind, contract_address: contract_address }),
			endpoint   : POST_ENDPOINTS.will_mint_storyboard_item,
			then: then
		});		
	}

	/**
	 * 
	 * @Use: alert did mint item
	 * 
	 **/
	async did_mint_storyboard_item({ itemID, userID, transaction_hash, payment_tx_hash, then }){
		await go_axios_post({
			post_params: make_post_params({ 
				itemID: itemID, 
				userID: userID, 
				transaction_hash: transaction_hash, 
				payment_tx_hash: payment_tx_hash 
			}),
			endpoint: POST_ENDPOINTS.did_mint_storyboard_item,
			then: then
		});		
	}

	/**
	 * 
	 * @Use: alert did mint item
	 * 
	 **/
	async did_fail_to_mint({ itemID, then }){
		await go_axios_post({
			post_params: make_post_params({ itemID: itemID }),
			endpoint   : POST_ENDPOINTS.did_fail_to_mint,
			then: (res) => {
				then(res)
			}
		});		
	}	

	// @use: did charge and fail to mint
	async did_charge_and_fail_to_mint({ storyboard, itemID, transaction_hash, contract_address, price }){

		let user = await this.user_cache.getAdminUser();
		let uid = trivialProps(user,'userID') ? "" : user.userID;

		let project_address = trivialProps(storyboard,'eth_address') ? "" : storyboard.eth_address;

		let params = make_post_params({
			itemID: itemID,
			project_address: project_address,
			storyboardID: "",
			userID: uid, 
			price: price, 
			contract_address: contract_address, 
			charge_hash: transaction_hash,
		})
		await go_axios_post({
			post_params: params,
			endpoint: POST_ENDPOINTS.did_charge_and_fail_to_mint,
			then: (res) => {return}
		});
	}


    /**
     *
     * @Use: wait 30 min to monitor deployment status of the contract
     * 
     **/
    async _rec_monitor_mint_status({ iter, tok_id, itemID, transaction_hash, job_blob, then_mint_progress, then_mint_progress_done }){

    	if ( iter >= 500 ){ // cut off after 30 mins
    		this.dequeue(job_blob)
    		then_mint_progress_done({ success: true, message: 'status timed out, please check in a few minutes', data: {} })
    	} else {

    		await this.monitor_minted_storyboard_item({ tok_id: tok_id, itemID: itemID, transaction_hash: transaction_hash, then: async (res) => {
    			if ( res.success ){
		    		this.dequeue(job_blob)
    				then_mint_progress_done(res)
    			} else {
    				const _this = this;
    				then_mint_progress(`Still waiting for the block to be confirmed...`)
		    		setTimeout(async () => {
			    		await _this._rec_monitor_mint_status({ 
			    			iter: iter + 1, 
			    			tok_id: tok_id,
			    			itemID: itemID,
			    			job_blob:job_blob,
			    			transaction_hash: transaction_hash,
							then_mint_progress: then_mint_progress, 
							then_mint_progress_done: then_mint_progress_done 
						});
		    		},3000);
    			}
    		}});
    	}
    }


	/**
	 * 
	 * @Use: monitor mint progress
	 **/

	async monitor_minted_storyboard_item({ tok_id, itemID, transaction_hash, then }){	
		await go_axios_post({
			post_params: make_post_params({ itemID: itemID, tok_id: tok_id ?? "", transaction_hash: transaction_hash }),
			endpoint   : POST_ENDPOINTS.monitor_minted_storyboard_item,
			then: then
		});		
	}


    /******************************************************
        @Deploy
    ******************************************************/ 

    /**
     * 
     * @Use: now deploy contract and gnosis safe multisig wallet
     * 
     **/
    async deploy_contract({ 
    	cname,
    	csymbol,
    	storyboard,
		address, 		
		then_will_deploy,
		then_cannot_deploy,
		then_can_deploy,
		then_deployed, 
		then_deploy_failed,
		then_deploy_progress,
		then_deploy_safe,
		then_deployed_safe,
		then_deploy_safe_fail,		
		then_deploy_progress_done,
	}){

    	var res  = default_fn_response({ data: {} });
		let user = await this.user_cache.getAdminUser();
    	if ( trivialProps(user,'userID') ){
    		res['message'] = 'please sign in first';
    		return then_cannot_deploy(res);
    	}

    	if ( trivialString(user.metamask_pk) ){
    		res['message'] = 'no metamask account found'
    		return then_cannot_deploy(res);
    	}

		let id = uuid.v4();
		var job_blob = {
	        ID           : id,
	        meta         : {},
	        success      : false,
	        message      : '', 
	        hash         : '',
	        no_eth       : false,
	        in_progress  : true,
	        deployed_erc1155: false,
	        deployed_gnosis : false,
	        pretty_print : `deploying contract`,
	    }   	

	    this.enqueue(job_blob);
	    then_will_deploy();;

	    // get the correct contract instance from server to deploy
	    await this.can_deploy_contract({ 
	    	address: address, 
	    	then: async ({ success, 
	    			message, 
	    			can_deploy, 
	    			user, 
	    			no_eth, 
	    			contract, 
	    			contract_kind, 
	    			witness_pk,
	    		}) => {

	    	if ( !success || !can_deploy || trivialProps(user,'userID') || trivialProps(contract, 'contract_kind') ){

				var response = this.dequeue({ id: id, success: false, can_deploy: false, message: message, meta: {} });	
				response['no_eth'] = no_eth;
				return then_cannot_deploy(response);

	    	} else {

		    	then_can_deploy(); 

		    	// deploy contract w/ metamask client API
		    	await deployContract({ 
		    		name    : cname ?? "",
		    		symbol  : csymbol ?? "",
					contract: contract,  
					witness_pk: witness_pk,
					network : ETH_NETWORK(), 
					then    : async (response) => {

		    		const { success, message, hash } = response;
		    		var res = this.dequeue({ id: id, success: success, can_deploy: true, message: message, meta: response });
		    		const _this = this;

		    		// if fail, exit
		    		if ( !success ){

		    			await this.dequeue({});
		    			then_deploy_failed({  ...response, deployed_erc1155: false, deployed_gnosis: false, can_deploy: true })

		    		} else {
		    			// else save deployment data to server, 
		    			// continue success fn, then monitor
						let post_params = make_post_params({
							address : address,
							hash    : hash,
							userID  : trivialProps(user,'userID') ? "" : user.userID,
							contract_kind: contract_kind,
						});

						await go_axios_post({
							post_params: post_params,
							endpoint   : POST_ENDPOINTS.did_deploy_contract_to_project,
							then: async ({ success, message, data  }) => {

					    		then_deployed({ ...response, can_deploy: true });

					    		setTimeout(async () => {

					    			// wait until last contract is deployed before
					    			// deploying the safe
						    		await _this._rec_monitor_deployment_status({ 
						    			iter          : 0, 
										address       : address,
										contract_kind : contract_kind,
										then_deploy_progress: then_deploy_progress, 
										then_deploy_progress_done: async (deploy_res)  => {

											// deploy gnosis safe
											then_deploy_safe("setting up your treasury");

											await deploy_safe({
												storyboard   : storyboard,
												userID       : user.userID,
												user_pk      : user.metamask_pk,
												then_deployed: then_deployed_safe,
												then: async ({  success, message, safe_address }) => {

													if ( !success ){
														if ( typeof then_deploy_safe_fail === 'function' ){
															then_deploy_safe_fail(`Deployed ERC1155 but failed to setup treasury: ${message}`)
														}
													} 
													let done_response = { 
														...deploy_res, 
														safe_address: safe_address ?? "",
														deployed_erc1155: deploy_res.success, 
														deployed_gnosis: success 
													}
									    			await this.dequeue({});
													return then_deploy_progress_done(done_response)													
												}
											});
										}
									});
					    		},3000);
							}
						});
			    	}
		    	}});

		    }
	    }});
    }

    /**
     * 
     * @use: assert can deploy contract for story @`address`
     *  
     **/
    async can_deploy_contract({ contract_kind, address, then }){

    	// check user exists
		let user = await this.user_cache.getAdminUser();
    	if ( trivialProps(user,'userID') ){
    		return then({ success: false, message: 'please sign in first', user: {}, data: {}, no_eth: false })
    	}

    	let deployment_network = ETH_NETWORK();

    	// check user is on right chain
    	await queryMetaMask({ then: async ({ success, message, pk, chainId }) => {

    		if ( !success || trivialString(pk) ){

    			return then({ success: false, message: message, user:user, data: {}, no_eth: false });

    		} else if ( deployment_network !== chainId ){

    			if ( deployment_network === '0x1' ){
    				return then({ success: false, message: `Please switch your metamask account to ethereum mainnet`, user: user, data: {}, no_eth: false })
    			} else if (deployment_network === '0x4'){
    				return then({ success: false, message: `Please switch your metamask account to ethereum rinkeby testnet`, user: user, data: {}, no_eth: false })
    			} else {
    				return then({ success: false, message: `Wrong network, expected ${deployment_network}, but found ${chainId}`, user: user, data: {}, no_eth: false })
    			}

    		} else {

    			// get balance
	    		await getBalanceOfEther({  then: async ({ success, message, balance }) => {

	    			if ( !success || balance < 0.01 ){

	    				return then({ 
	    					success: false, 
	    					user: user,
	    					data: {},
	    					no_eth: true,
	    					no_ether: true,
	    					message: `Ether balance is too low, you have ${balance} ETH`,
	    				});

	    			} else {

	    				// get contract ABI from server
						let post_params = make_post_params({
							address: address,
							contract_kind: contract_kind,
							userID: user.userID ?? "",
						});

						await go_axios_post({
							post_params: post_params,
							endpoint   : POST_ENDPOINTS.can_deploy_contract_to_project,
							then: async (res) => {
								then({ ...res, no_eth: false, user: user });
							}
						});
	    			}
    			}});

			}

    	}});
	}   

    /**
     *
     * @Use: wait 30*3 seconds to monitor deployment status of the contract
     * 
     **/
    async _rec_monitor_deployment_status({ iter, address, contract_kind, then_deploy_progress_done, then_deploy_progress }){

    	if ( iter >= 500 ){ // cut off after 30 minutes
    		then_deploy_progress_done({ success: true, message: 'status timed out, please check in a few minutes', data: {} })
    	} else {

    		await this.monitor_deploy_contract({ address: address, contract_kind: contract_kind, then: async (res) => {
    			if ( res.success ){
    				then_deploy_progress_done(res)
    			} else {
    				const _this = this;
    				then_deploy_progress(`Still waiting for the block to be confirmed...`)
		    		setTimeout(async () => {
			    		await _this._rec_monitor_deployment_status({ 
			    			iter: iter + 1, 
							address: address,
							contract_kind: contract_kind,
							then_deploy_progress: then_deploy_progress, 
							then_deploy_progress_done: then_deploy_progress_done 
						});
		    		},3000);
    			}
    		}});
    	}
    }

    /**
     * 
     * @Use: monitor the deployed contract
     *       and update its status
     * 
     **/
    async monitor_deploy_contract({ address, contract_kind, then }){

		let user = await this.user_cache.getAdminUser();
    	if ( trivialProps(user,'userID') ){
    		return then({ success: false, message: 'please sign in first', user: {}, data: {} })
    	}

		let post_params = make_post_params({
			address: address,
			userID: user.userID ?? "",
			contract_kind: contract_kind,
		});    	

		await go_axios_post({
			post_params: post_params,
			endpoint   : POST_ENDPOINTS.monitor_project_contract_deployed,
			then: async (res) => {
				then({ ...res, user: user });
			}
		});
    }


}







