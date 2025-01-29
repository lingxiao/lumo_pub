
/**
 * 
 * @Module: Chain service
 * @Author: Xiao Ling
 * @Date  : 9/11/2022
 * 
 * 
*/


import {
	deployContract,
	mintToken,
	getBalanceOfEther,
	readMintIsPaused,
	readSplits,
	monitorDeployedContract,
	toggleContractMintStatus,
	releaseCurrentWindow,
	changeItemPrice,
	monitorTxOnChain,
	updatePayoutWindow,
} from './api_web3';

const { 
	trivialProps,
	trivialString, 	
	cap,
	illValued,
	force_to_num,
	removeAllSpaces,
} = require('./utils')

const { 
	go_axios_post_preset,
	default_fn_response,
	ETH_NETWORK,
	uploadPhotoFromURL,
	toTokenContentKind,
	MemberPermission,
} = require('./core');

/******************************************************
	@exported model
******************************************************/	

 
/**
 * 
 * @use: load chain
 * 
 **/
export default class ChainModel {

	constructor(chain_id, user_cache, root){
		if ( trivialString(chain_id) ){
			return;
		}
		this.chain_id     = chain_id;
		this.root         = root ?? {};
		this.items        = [];
		this.rewards      = [];
		this.user_cache   = user_cache;
		this.collections  = {};
	}

	async sync({ then }){
		if ( !trivialProps(this.root,'ID')  ){
			then(this)
		}
		return await go_axios_post_preset({
			fn_name: "fetch_chain",
			params: { chain_id: this.chain_id ?? "", partial: true, full: false },
			then: ({ root,  items, rewards }) => {
				this.root    = root;
				this.items   = items;
				this.rewards = rewards;
				return then(this)
			}
		})
	}


	/**
	 * 
	 * @use: sign manfesto, whitelist user if metamask installed
	 * 
	 **/
	sign_manifesto = async ({ then }) => {
		let user = await this.user_cache.getAdminUser();		
		await getBalanceOfEther({ then: async ({ pk }) => {
			return await go_axios_post_preset({
				fn_name: "sign_manifesto",
				params: { 
					userID: user.userID, 
					chain_id: this.chain_id, 
					block_id: "",
					signer_metamask_pk: pk ?? "",
				},
				then: then
			})
		}})
	}

	// @use: linearize reward in
	//       number of lumo toks per batch
	read_reward_in_lumo = () => {
		var res = [];
		this.rewards.map(rwd => {
			const { reward } = rwd;
			if (reward === 1){
				res.push(reward)
			} else {
				let rs = Array(reward ?? 1).fill().map(_ => rwd);
				res = res.concat(rs)
			}
		})
		return res;
	}

	// @use: get unique signers
	read_unique_signers = () => {
		var res = {};
		this.items.forEach(item => {
			res[item.userID] = item;
		})		
		return Object.values(res)
	}

	/**
	 * 
	 * @use: create invite code
	 * 
	 **/
	create_invite_code_for_team = async({ collection_id, then }) => {
		let user = await this.user_cache.getAdminUser();		
		return await go_axios_post_preset({
			fn_name: "nominate_leader",
			params: { 
				chain_id: this.chain_id,
			    collection_id: collection_id ?? "",
			    userID: user.userID ?? "", 
			    block_id: "",
			    clientInviteCode: "",
			    tgtUserID: "", 
			    tgtTwitterName: "", 
			    tgtTwitterUserID: "",
			    isGeneral: true, 
			    perm: MemberPermission.t1,
			},
			then: then
		})		
	}


	/**
	 * 
	 * @use: accept nomination at code
	 * 
	 **/
	accept_nomination = async ({ code, then }) => {
		let user = await this.user_cache.getAdminUser();		
		return await go_axios_post_preset({
			fn_name: "accept_nomination",
			params: { inviteCode: code ?? "", userID: user.userID ?? "" },
			then: then
		})		
	}	

	/**
	 * 
	 * @use: update chain root
	 * 
	 **/
	update_chain_root = async ({ 
		about,
		twitter,
		instagram,
		youtube,
		website,
		discord,
		imdb,
		then,
	}) => {		
		let user = await this.user_cache.getAdminUser();		
		return await go_axios_post_preset({
			fn_name: "update_chain_root",
			params: { 
				about     : about       ?? "",
				twitter   : twitter     ?? "",
				instagram : instagram   ?? "",
				youtube   : youtube     ?? "",
				website   : website     ?? "",
				discord   : discord     ?? "",
				imdb      : imdb        ?? "",
				chain_id  : this.chain_id ?? "",
				userID    : user.userID ?? "",
			},
			then: then
		})		
	}


	/*******************************************************/
	//  web3 deploy

	// @use: get colleciton at collection-id
	get_collection_for_burn = async ({ collection_id, then }) => {
		if ( trivialString(collection_id) ){
			return then({})
		} else if ( !trivialProps(this.collections, collection_id) && !trivialProps(this.collections[collection_id],'ID') ){
			return then(this.collections[collection_id])
		} else {
			return await go_axios_post_preset({
				fn_name: "get_collection_for_burn",
				params: { 
					chain_id: this.chain_id,
					collection_id: collection_id ?? ""
				},
				then: ({ success, data }) => {
					if ( !trivialProps(data,'length') && data.length > 0 ){
						this.collections[collection_id] = data[0];
						return then(data[0]);
					} else  {
						return then({})
					}
				}
			})	
		}
	}

	// @use: get all collectiosn for this burn
	get_all_collections = async ({ then }) => {		
		return await go_axios_post_preset({
			fn_name: "get_all_contracts_for_burn",
			params: { 
				chain_id: this.chain_id,
			},
			then: ({ success, data }) => {
				if ( !trivialProps(data,'length') && data.length > 0 ){
					data.map( item => {
						this.collections[item.ID] = item;
					})
					return then(data);
				} else  {
					return then([]);
				}
			}
		})			
	}

	/**
	 * 
	 * @Use: deploy collection w/o deploying contract
	 * 
	 **/
	deploy_collection_off_chain = async (params) => {

    	var res  = default_fn_response({ data: {}, collection_id: "" });

		const {
			title,
			sym,
			image_file,
			then_saving_media,
			then_cannot_deploy,
			then_will_deploy,
			then_deploy_progress_done, 
		} = params;

		let user = await this.user_cache.getAdminUser();		
    	let deployment_network = ETH_NETWORK();

		if ( trivialProps(user,'userID') || user.userID !== this.root.userID ){
			res['message'] = 'please sign in first';			
			return then_cannot_deploy(res)
		}

		if ( trivialProps(image_file,'type') ){
			res['message'] = 'please provide an image or mp4';
			return then_cannot_deploy(res);
		}

		// saving media
	    await uploadPhotoFromURL({ 
	    	url : URL.createObjectURL(image_file),
	    	type: toTokenContentKind(image_file.type),
	    	then_loading: (progress) => {
	    		if ( typeof then_saving_media === 'function' ){
		    		then_saving_media(`uploaded file: ${progress}%`)
		    	}
	    	},
	    	then: async ({ downloadURL }) => {

    			// save collection metadata
    			then_will_deploy("creating merch page");
				await this.write_social_chain_drop_root({
					...params,
					image_url: downloadURL,
					metamask_address: "",
					then: async ({ success, data, message }) => {

						if ( !success || trivialProps(data,'collection_id') ){
							return then_cannot_deploy(message);
						} else {
							res['data'] = data;
							res['message'] = 'deployed!'
							res['success'] = true;
							res['collection_id'] = data.collection_id ?? "";
							then_deploy_progress_done(res);
						}
					}});
			}});
	}



	/**
	 * 
	 * @use: create collection, deploy contract
	 * 
	 **/
	deploy_collection_on_chain = async (params) => {

    	var res  = default_fn_response({ data: {}, collection_id: "" });

		const {
			collection,
			then_cannot_deploy,
			then_will_deploy,
			then_deployed, 
			then_deploy_failed,
			then_deploy_progress,
			then_deploy_progress_done,			
		} = params;

		let user = await this.user_cache.getAdminUser();		
    	let deployment_network = ETH_NETWORK();

		if ( trivialProps(user,'userID') || user.userID !== this.root.userID ){
			res['message'] = 'please sign in first';			
			return then_cannot_deploy(res)
		}

		if ( trivialProps(collection,'ID') ){
			res['message'] = 'please provide a collection to deploy'
			return then_cannot_deploy(res);
		}

		const { token_sym, title, ID, price_in_eth }  = collection;
		let sym = token_sym ?? (title ?? "");
		let collection_id = ID;

		// check metamask exist
	    await getBalanceOfEther({  then: async ({ success, message, balance, pk, chainId }) => {

    		if ( !success || trivialString(pk) ){

    			res['message'] = `no metamask found: ${message}`;
    			return then_cannot_deploy(res)

    		} else if ( deployment_network !== chainId ){

    			if ( deployment_network === '0x1' ){
    				res['message'] = `Please switch your metamask account to ethereum mainnet`;
    				return then_cannot_deploy(res);
    			} else if (deployment_network === '0x4'){
    				res['message'] = `Please switch your metamask account to ethereum sepolia testnet`;
    				return then_cannot_deploy(res);
    			} else {
    				res['message'] = `Wrong network, expected ${deployment_network}, but found ${chainId}`;
    				return then_cannot_deploy(res);
    			}

    		// } else if ( balance < 0.035 ){

    		// 	res['message'] = `Insufficent balance, you have ${balance} ether. Please have at least 0.04 ether in your wallet.`
    		// 	return then_cannot_deploy(res);

    		} else {

				// fetch contract data
				await this.before_deploy_contract_to_project({
					collection_id: collection_id,
					then: async ({ 
						success, message, can_deploy, 
						erc721_address, paymentSplitter_address,
						contract_kind, contract, witness_pk 
					}) => {


						if ( !success || !can_deploy || trivialString(contract_kind) || trivialString(witness_pk) ){
							res['message'] = message
							return then_cannot_deploy(res)
						}

						if (trivialString(erc721_address) || trivialString(paymentSplitter_address) ){
							res['message'] = 'This collection has not been approved for contract deployment yet';
							return then_cannot_deploy(res);							
						}

						then_will_deploy();

				    	await deployContract({ 
				    		name    : title ?? "",
				    		sym     : removeAllSpaces(sym ?? "").toLowerCase(),
				    		price_in_eth: price_in_eth,
							contract: contract,  
							witness_pk: witness_pk,
							network : ETH_NETWORK(), 
							then    : async ({ success, message, hash }) => {

								if ( !success || trivialString(hash) ){
									return then_deploy_failed(message)
								}

								// update deployment info
								await this.did_deploy_contract_to_burn({
								    collection_id: collection_id,
								    contract_kind: contract_kind ?? "",
								    metamask_address: pk ?? "",
								    hash: hash ?? "",
								    then: async ({ success, message, data }) => {

								    	if (!success){
								    		res['message'] = message;
								    		return then_deploy_failed(message)
								    	}
								    	
								    	// monitor deployment
										await monitorDeployedContract({
											hash: hash ?? "",
											current_iter: 0,
											max_depth: 50,
											timeout: 5000,
								    		name        : title ?? "",
								    		sym         : removeAllSpaces(sym ?? "").toLowerCase(),
								    		price_in_eth: price_in_eth,
											witness_pk  : witness_pk,
											erc721_address, paymentSplitter_address,
											then_deploy_progress: (iter) => {
								                if (typeof then_deploy_progress === 'function'){
													then_deploy_progress(`Waiting 5 more seconds, do not close this window`, iter, 50)
												}
											},
											then: async ({ success, message, data, address }) => {
												if ( !success || trivialString(address) ){
													return then_deploy_failed(`We cannot locate the deployed contract at the moment: ${message}`)
												}
												await this.did_finish_deploy_contract_to_burn({ 
													contract_address: address, 
													collection_id: collection_id, 
													then: async({ success, message, data }) => {
														if ( !success ){
															then_deploy_failed(`We cannot locate the deployed contract at the moment: ${message}`)
														} else {
															res['data'] = data;
															res['message'] = 'deployed!'
															res['success'] = true;
															res['collection_id'] = collection_id;
															then_deploy_progress_done(res)
														}
												}})
											}
										});
								    }
								})

				    	}});				
					}
				})						


    		}
   		}});
	}

	// @use: edit social chain drop root.
	edit_collection = async ({
		collection_id, 
		about, 
		num_frees,
		num_editions,
		price_in_eth, 
		price_in_cents,
		then 
	}) => {
		let user = await this.user_cache.getAdminUser();		
		let update_blob = { 
		    userID: user.userID, 
			chain_id: this.chain_id,
			collection_id: collection_id ?? "",
			about: about ?? "",
			num_frees: force_to_num(num_frees,0) ?? 0,
			num_editions: force_to_num(num_editions, 1),
			price_in_eth: force_to_num(price_in_eth, 0.01),
			price_in_cents: force_to_num(price_in_cents,75),
			presale_price_in_cents: force_to_num(price_in_cents,75)
		}
		return await go_axios_post_preset({
			fn_name: "edit_social_chain_drop_root",
			params: update_blob,
			then: then
		})			
	}

	/**
	 * @use: can use existing contract
	 **/
	can_connect_to_deployed_contract = async({ then }) => {
		let user = await this.user_cache.getAdminUser();		
		return await go_axios_post_preset({
			fn_name: "can_connect_to_deployed_contract",
			params: { 
				chain_id: this.chain_id,
				userID: user.userID,
			},
			then: then
		})	
	}

	// @use: connect collection w/ contract
	connect_collection_with_contract = async({
		collection_id,
		connect_collection_id,
		then
	}) => {
		let user = await this.user_cache.getAdminUser();		
		let update_blob = { 
		    userID: user.userID, 
			chain_id: this.chain_id,
			collection_id: collection_id ?? "",
			connect_collection_id: connect_collection_id,
		}
		return await go_axios_post_preset({
			fn_name: "connect_collection_with_contract",
			params: update_blob,
			then: then
		})			
	}
	

	/*******************************************************/
	//  web3 contract read/update

	/**
	 * @use: fetch contract data on chain 
	 * 
	 **/
	fetch_contract_data = async ({ collection_id, then }) => {

		let res = default_fn_response({ 
			paused: true,
			balance_in_eth: 0,
			balance_in_wei: 0, 
			whitelist_only_mode: true, 
			deployed: false 
		});

		if ( trivialString(collection_id) ){
			return res;
		}

		await this.can_mint_nft({ collection_id, then: async ({ success, can_mint, message, contract_kind, contract, collection, tok_id }) => {

			if ( !success || !can_mint 
				|| trivialProps(contract,'abi') 
				|| trivialProps(contract,'bytecode') 
				|| trivialProps(collection,'contract_address') 
				|| trivialString(collection.contract_address) 
			){
				res['message'] = message;
				return then(res);
			}

			const { abi, bytecode } = contract;
			const { contract_address } = collection;

			await readMintIsPaused({ contract_address, abi, bytecode, then: async ({ success, message, isPaused }) => {
		        await readSplits({ contract_address, abi, bytecode, then: async ({ success, message, accounts }) => {
	            	let balance_in_wei = (accounts ?? [])
		            	.map(acct => {
		            		let num = trivialProps(acct,'owed') ? 0  : Number(acct.owed);
		            		return  force_to_num(num,0);
		            	})
		            	.reduce((a,b) => { return a + b },0)				        	
			        let balance_in_eth = Math.round(balance_in_wei/1000000000000000000*1000)/1000;

			        res['balance_in_eth'] = balance_in_eth;
			        res['balance_in_wei'] = balance_in_wei;
					res['success'] = true;
					res['message'] = 'read contract';
					res['paused'] = isPaused;
					res['whitelist_only_mode'] = false;

					let full_res = {
						contract_kind,
						contract,
						collection,
						...res
					}

					return then(full_res);
		        }});

			}});
			
		}});
	}

	/**
	 * @use: fetch all tokens
	 **/
	fetch_all_tokens = async ({ collection_id, then }) => {
		return await go_axios_post_preset({
			fn_name: "fetch_all_tokens",
			params: { collection_id: collection_id ?? "" },
			then: (res) => {
				var _res = res;
				_res['data'] = res.data.sort((a,b) => {
			        return b.timeStampCreated - a.timeStampCreated;
			    });
			    return then(res);
			}
		})			
	}

	// change mint state
	toggle_mint_state = async ({ collection_id, then  }) => {
		var res = default_fn_response({})
		await this.fetch_contract_data({ collection_id, then: async ({ success, message, contract, collection , paused }) => {
			if (!success){
				res['message'] = message;
				return then(res);
			}
			const { abi, bytecode } = contract;
			const { contract_address } = collection;			
			await toggleContractMintStatus({ 
				contract_address,
				abi,
				bytecode,
				should_pause: !paused,
				then: async (res) => {
					if ( res.success ){
						let user = await this.user_cache.getAdminUser();		
						await go_axios_post_preset({
							fn_name: "edit_social_chain_drop_root",
							params: { 
							    userID: user.userID, 
								chain_id: this.chain_id,
								collection_id: collection_id ?? "",
								is_paused: !paused,
							},
							then: cap,
						})			

					}
					then(res)
				}
			})
		}});
	}

	// @use: change item price on chain
	changeItemPrice = async({ collection_id, price_in_eth, then }) => {
		var res = default_fn_response({})
		await this.fetch_contract_data({ collection_id, then: async ({ success, message, contract, collection }) => {
			if (!success){
				res['message'] = message;
				return then(res);
			}
			const { bytecode } = contract;
			const { contract_address } = collection;			
			await changeItemPrice({ 
				collection_id,
				price_in_eth,
				contract_address,
				bytecode,
				then: then,
			})
		}});		
	}


	// @use: release curent balance
	release_balance = async ({ collection_id, then_balance_is_zero, then_monitor_progress, then }) => {
		var res = default_fn_response({})
		await this.fetch_contract_data({ collection_id, then: async ({ success, message, contract, collection }) => {
			if (!success){
				res['message'] = message;
				return then(res);
			}
			const { abi, bytecode } = contract;
			const { contract_address } = collection;			
			await releaseCurrentWindow({ 
				contract_address,
				abi,
				bytecode,
				then: async({ success, message , data, balanceIsZero }) => {
					if (balanceIsZero){
						return then_balance_is_zero()
					} else {						
						await monitorTxOnChain({
							hash: data.hash ?? "",
							current_iter: 0, max_depth: 10,
							timeout: 5000,
						    then_monitor_progress: then_monitor_progress, 
						    then: then ,
						})
					}
				}
			})
		}});		
	}

	/**
	 * @use: update payout window
	 **/
	update_payout_window = async ({ collection_id, pks, shares, then }) => {
		var res = default_fn_response({})
		if ( illValued(pks) || illValued(shares) || pks.length !== shares.length ){
			res['message'] = 'Pks not defined';
			return then(res);
		}
		await this.fetch_contract_data({ collection_id, then: async ({ success, message, contract, collection }) => {
			if (!success){
				res['message'] = message;
				return then(res);
			}
			const {bytecode } = contract;
			const { contract_address } = collection;			
			await updatePayoutWindow({
				bytecode,
				contract_address,
				pks: ["0x20F884125A309a2B8Ef3Bd4a0AA4f25b87578A37", "0xBb9EA84B8FF519eaD8d41a7d0420660f17ECBA6C"],
				shares: [8000,2000],
				then: then
			});
		}});
	}


	/*******************************************************/
	//  creditcard mint

	/***
	 * @use: buy item off chain in presale.
	 * 
	 **/
	mint_collection_item_offchain = async ({
		is_presale,
		collection_id,
		then_cannot_mint,
		then_will_mint,
		then_did_mint_succ,		
	}) => {

    	var res  = default_fn_response({ data: {}, can_mint: false });
		let user = await this.user_cache.getAdminUser();		

    	if ( trivialProps(user,'userID') ){
    		return then_cannot_mint("Please authenticate first");
    	}

    	then_will_mint("purchasing...");
		return await go_axios_post_preset({
			fn_name: "buy_nft_offchain",
			params: {
				userID: user.userID,
				collection_id: collection_id,
				is_presale: typeof is_presale  === 'boolean' ? is_presale : false,
			},
			then: then_did_mint_succ
		})	
	}


	/*******************************************************/
	//  web3 mint

	/**
	 *
	 * @use: mint colleciton on chain client side 
	 * 
	 **/
	mint_collection_item = async ({
		collection_id,
		then_can_mint,
		then_cannot_mint,
		then_payment_failed,
		then_will_mint,
		then_minting,
		then_monitor_progress,
		then_did_mint_fail,
		then_did_mint_succ,		
	}) => {


    	var res  = default_fn_response({ data: {}, can_mint: false });
		let user = await this.user_cache.getAdminUser();		
    	let deployment_network = ETH_NETWORK();

    	if ( trivialProps(user,'userID') ){
    		return then_cannot_mint("Please authenticate first");
    	}

		// check collection contract exist
		await this.can_mint_nft({ collection_id, then: async ({ success, tok_id, can_mint, message, contract_kind, contract, collection }) => {

			if ( !success || !can_mint 
				|| trivialProps(contract,'abi') 
				|| trivialProps(contract,'bytecode') 
				|| trivialProps(collection,'contract_address') 
				|| trivialString(collection.contract_address) 
			){
				return then_cannot_mint(message);
			}


			let _price_in_eth = force_to_num( collection.price_in_eth, 0) ?? -1;

			// check balance of ether and metamask installed
		    await getBalanceOfEther({  then: async ({ success, message, balance, pk, chainId }) => {

	    		if ( !success || trivialString(pk) ){

	    			res['message'] = `No metamask found: ${message}`;
	    			return then_cannot_mint(res.message)

	    		} else if ( deployment_network !== chainId ){

	    			if ( deployment_network === '0x1' ){
	    				res['message'] = `Please switch your metamask account to ethereum mainnet`;
	    				return then_cannot_mint(res.message);
	    			} else if (deployment_network === '0x4'){
	    				res['message'] = `Please switch your metamask account to ethereum sepolia testnet`;
	    				return then_cannot_mint(res.message);
	    			} else {
	    				res['message'] = `Wrong network, expected ${deployment_network}, but found ${chainId}`;
	    				return then_cannot_mint(res.message);
	    			}

	    		} else if ( _price_in_eth <= 0 ){

	    			res['message'] = 'We cannot locate a price for this item';
	    			return then_cannot_mint(res.message);

	    		} else if ( balance < (_price_in_eth + 0.003) ){

	    			res['message'] = `Insufficent balance, you have ${balance} ETH; the price of the item is ${_price_in_eth} ETH. Please factor in the mint cost as well.`;
	    			return then_cannot_mint(res.message);

	    		} else {

	    			const { abi, bytecode } = contract;
	    			const { contract_address } = collection;

					// check if mint is paused by contract owner
					await readMintIsPaused({ contract_address, abi, bytecode, then: async ({ success, message, isPaused }) => {
						if ( !success || isPaused ){
							then_cannot_mint("Minting has been paused at this moment")
							return;
						}
						then_can_mint("Awaiting payment");
				   		await mintToken({ 
				   			abi             : abi, 
				   			bytecode        : bytecode,
				   			contract_address: contract_address, 
				   			contract_kind   : contract_kind, 
				   			collection_id   : collection_id,
				   			price_in_eth    : _price_in_eth,
				   			then_minting: then_minting,
				   			then: async ({ success, message, pk, tok_id, data, raw_data, hash }) => {
				   				if ( !success || trivialString(hash) || trivialString(tok_id) ){
				   					return then_did_mint_fail(message);
				   				} else {
				   					// update lumo db;
									await this.did_mint_nft({ 
										collection_id,
										tok_id, 
										payment_hash: "",
										hash, 
										pk,
										chainId,
										then: async (_res) => { // monitor mint
						   					await monitorTxOnChain({
												hash: hash ?? "",
												current_iter: 0, max_depth: 20,
												timeout: 5000,
											    then_monitor_progress: then_monitor_progress, 
											    then: async (_) => { 
											    	// await getMintedTokenId({
											    	// 	pk,
											    	// 	bytecode,
											    	// 	contract_address, 
											    	// 	then: (res) => {
											    	// 		console.log("@RES", res)
											    	// 	}
											    	// })
											    	then_did_mint_succ(_res) 
											    },
						   					})
										}
									});	
								}
					   		}});
					}});
	    		}

	    	}});			

		}});
	}


	/*******************************************************/
	//  web3 utils


	/**
	 * @use: deploy contract
	 * 
	 **/
	write_social_chain_drop_root = async ({
	    title,
	    sym,
	    about,
	    num_editions,
	    num_editions_presale,
	    presale_price_in_cents,
	    price_in_eth,
	    price_in_cents,
	    image_url,		
	    metamask_address,
	    num_frees,
		exchange_rate,
		drop_timestamp,
		then 
	}) => {
		let user = await this.user_cache.getAdminUser();		
		let params = { 
				chain_id: this.chain_id,
			    userID: user.userID, 
			    title: title ?? "",
			    sym: sym ?? "",
			    about: about ?? "",
			    num_editions: num_editions ?? 0,
			    num_editions_presale: num_editions_presale ?? 0,
			    price_in_eth: price_in_eth ?? 0,
			    price_in_cents: price_in_cents ?? 0,
			    presale_price_in_cents: presale_price_in_cents ?? (price_in_cents ?? 0),
			    image_url: image_url ?? "",		
			    num_frees: num_frees ?? 0,
				exchange_rate: exchange_rate ?? 0,
			    metamask_address: metamask_address ?? "",
			    drop_timestamp: force_to_num(drop_timestamp, 0) ?? 0,
		}
		return await go_axios_post_preset({
			fn_name: "write_social_chain_drop_root",
			params: params,
			then: then
		})		
	}


	before_deploy_contract_to_project = async ({ collection_id, then }) => {
		let user = await this.user_cache.getAdminUser();		
		return await go_axios_post_preset({
			fn_name: "before_deploy_contract_to_burn",
			params: { 
				chain_id: this.chain_id,
			    userID: user.userID, 
			    collection_id: collection_id ?? "",
			},
			then: then
		})		
	}


	did_deploy_contract_to_burn = async ({ contract_kind, collection_id, metamask_address, userID, hash, then }) => {
		let user = await this.user_cache.getAdminUser();		
		let params = { 
				chain_id: this.chain_id,
			    userID: user.userID, 
			    collection_id: collection_id ?? "",
			    contract_kind: contract_kind ?? "",
			    metamask_address: metamask_address ?? "",
			    hash: hash ?? "",
		}
		return await go_axios_post_preset({
			fn_name: "did_deploy_contract_to_burn",
			params: params,
			then: then
		})		
	}

	did_finish_deploy_contract_to_burn = async({ collection_id, contract_address, then })  => {
		let user = await this.user_cache.getAdminUser();		
		const params = { 
		    userID: user.userID, 
		    collection_id: collection_id ?? "",
		    contract_address: contract_address ?? "",
		};
		return await go_axios_post_preset({
			fn_name: "did_finish_deploy_contract_to_burn",
			params: params,
			then: then
		})	
	}

	/**
	 * @use: check can mint
	 * 
	 **/
	can_mint_nft = async ({ collection_id, then }) => {
		return await go_axios_post_preset({
			fn_name: "can_mint_nft",
			params: { 
				chain_id: this.chain_id,
			    collection_id: collection_id ?? "",
			},
			then: then
		})		
	}	

	/**
	 * @use: on did mint, save tok-id and mint hash
	 * 
	 **/
	did_mint_nft = async ({ collection_id, tok_id, hash, payment_hash, pk, chainId, then }) => {
		let user = await this.user_cache.getAdminUser();		
		let params = { 
			chain_id: this.chain_id,
		    collection_id: collection_id ?? "",
			userID: trivialProps(user,'userID') ? "" : (user.userID ?? ""),
		    tok_id: `${tok_id ?? ""}`,
		    payment_hash: payment_hash ?? "",
		    hash: hash,
		    pk:  pk ?? "",
		    chainId: chainId ?? "",
		}
		return await go_axios_post_preset({
			fn_name: "did_mint_nft",
			params: params,
			then: then
		})		
	}	


}






















 








