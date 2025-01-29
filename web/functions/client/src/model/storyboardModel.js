/**
 * 
 * 
 * @Module: storyboard model
 * @Author: Xiao Ling
 * @Date  : 3/5/2021
 * 
*/


import { ethers } from "ethers";

const { 
	swiftNow,
	trivialString, 	
	trivialProps,
	trivialNum,
	illValued,
	cap,
	contractMetamaskAddress, 
} = require('./utils');

const {

	get_project,
	get_trailer,
	get_minted_tok,

	accept_invite_link,
	read_invite_link,
	whitelist_user_storyboard,
	get_storyboard_whitelist,
	get_all_minted_tok,

	can_license_item,
	license_collection_item,
	get_item_licensors,
	generate_license_invite,
	get_item_by_license_id,
	get_acquired_licenses,
	fiat_purchase_and_premint,
	edit_story_board,

	make_connected_account,
	confirm_connected_account,

} = require('./api_storyboard');

const {
	readSplits,
	updatePayoutWindow,
	releaseCurrentWindow,
	hardWithdrawlEth,
	readMintIsPaused,
	toggleContractMintStatus,
} = require('./api_web3')

const {
	ETH_NETWORK,
	Networks,
	to_social_links,
	home_page_url,
	uploadPhotoFromURL,
	toTokenContentKind,
	go_axios_post,
	make_post_params,
	POST_ENDPOINTS,
	ETH_ADMIN_ADDRESS,	
} = require('./core');

const {GnosisSAFE} = require('./gnosis_api');




/**
 * 
 * @Use:  model for all story boards at `eth_address`
 * 
 **/ 
export default class StoryboardModel {

	constructor(eth_address, nft_cache, user_cache){

		// associated services
		this.nft_cache  = nft_cache;
		this.user_cache = user_cache;		

		// storyboard id
		this.eth_address = eth_address ?? "";

		// mainnnet contract address
		this.contract_address = "";

		this.root   = {};
		this.boards = {};
		this.items  = {};
		this.safe   = {};
		this.contracts = [];

		this.item_collabs = {};
		this.social_links = [];

		// licenses
		this.licenses = {};
		this.acquired_licenses = [];

		// fiat purchases 
		// and stripe connected account
		// for merchant payouts
		this.fiat_purchases = [];
		this.stripe_connected = {};
		this.did_fetch_fiat_users = false;

		// crew + scheudle
		this.crew = [];

		// playback state
		this.board_ids  = [];
		this.item_history_ids = [];
		this.current_av_item  = {};

		// trailer
		this.trailers = [];
		this.invite_link = "";

		// sync state
		this.didSync    = false;
		this.dne        = false;
		this.delegate   = null;
	}

	/**
	 * 
	 * @Use: trivial token instance
	 * 
	 **/
	static mzero(){
		let em = new StoryboardModel("", null, null);
		return em;
	}

	/**
	 * 
	 * @use: check lt === rt
	 * 
	 **/ 
	static eq(lt, rt){
		if ( trivialProps(lt, 'data') || trivialProps(rt,'data') ){
			return false;
		} else {
			return lt.eth_address === rt.eth_address;
		}
	}

	/******************************************************
		@delegate fn
	******************************************************/

	// @use: alert delegate of update
	bubble_update = () => {
		if ( !trivialProps(this.delegate, 'didUpdateStoryboard')){
			this.delegate.didUpdateStoryboard()
		}				
	}

	/******************************************************
		@Load from db
	******************************************************/

	/**
	 * 
	 * 
	 * @Use: sync token with lumo/core db
	 *       for download all images because some are huge
	 *       fetch all multimedia content if any
	 *       bubble event to delegate to alert delegate that
	 *       syncing has completed.
	 * 
	**/ 
	async sync({ reload, fast, then }){

		if ( this.didSync && !reload ){
			return then();
		}

		// get root first
		// continue if getting project w/
		// `fast`;
		await get_project({
			address: this.eth_address,
			fast: true,
			then: async ({ root, success }) => {
				this.dne  = !success;
				this.root = root;
				if ( fast ){ then() }
			}
		});

		if ( !fast ){
			await this.syncFull({ then });
		}

	}

	async syncFull({ then }){

		// then get full project
		await get_project({
			address: this.eth_address,
			fast: false,
			then: async (response) => {

				let { 
					success, 
					root, 
					story, 
					crew, 
					fiat_items,
					contracts, 
					safe,
					stripe_connected, 
				} = response;

				this.dne        = !success;
				this.root       = root;
				this.crew       = crew ?? [];
				this.contracts  = contracts ?? [];
				this.safe       = GnosisSAFE.mzero();
				this.fiat_purchases = fiat_items ?? [];
				this.stripe_connected = stripe_connected;

				// make social links
				let { about, discord, instagram, website, twitter, imdb } = root;
				this.social_links = to_social_links({ discord, instagram, website, twitter, imdb });

				// load all story-board + board+items
				var items_objs = [];
				story.map(st => {
					const { board, items  } = st;
					if ( !trivialString(board.ID) ){
						this.boards[board.ID] = board;
						this.items [board.ID] = items;
						items_objs.concat(Object.values(items))
					}
					return true;
				});	

				//init safe
				if ( !trivialProps(safe,'safe_address') ){
					let treasury = new GnosisSAFE(safe.safe_address, safe, this.eth_address, this.user_cache);
					await treasury.sync({ then: (res) => { return } })
					this.safe = treasury;
				}

				// get invite link
				await this.get_invite_link({ then: (res) => { return } })

				// complete crew information with user-model	
				await this.fetch_crew_user_model();
				// get all licenses
				let fetch_licenses = await Object.values(this.boards).map(async (b) => {
					await this.get_all_licensors({ storyboardID: b.ID, then: cap });
				})
				await Promise.all(fetch_licenses)

				// complete fiat buyer models
				await this.fetch_fiat_buyers({ then: cap });

				// get trailer
				await this.get_trailer({ then: cap })

				// continue fn
				this.didSync = true;
				then();		

			}
		});
	}


	 /**
	  * 
	  * @Use: load trailer 
	  * 
	  **/
	 async get_trailer({ then }){
	 	await get_trailer({ 
	 		projectID: this.eth_address,
	 		then: async ({ success, data }) => {
	 			if ( success ){
	 				this.trailers = data ?? []
	 			}
	 			then(data)
	 		}
	 	})	 	
	 }

	 // @use: get invite link for this story
	 async get_invite_link({ then }){
	 	if ( trivialProps(this.user_cache, 'getAdminUser') ){
	 		return then('', '', {})
	 	}
		let admin_user = await this.user_cache.getAdminUser();
		await read_invite_link({
			address: this.eth_address,
			userID : trivialProps(admin_user,'userID') ? "" : admin_user.userID,
			then: async ({ success, data, message }) => {
				if ( success && !trivialProps(data,'tok') ){
					this.invite_link = `${home_page_url()}/invite/${this.eth_address}?=${data.tok}`
					await this.user_cache.get({ userID: data.userID ?? "", then: (user) => {
						let name = trivialProps(user,'name') ? '' : (user.name ?? "");
						then(this.invite_link, name, data)
					}})
				} else {
					then('', '',{})
				}
			}
		})
	 }

	/**
	  * 
	  * @use: associate each crew with up to date user-model
	  * 
	  * 
	**/
	async fetch_crew_user_model(){

		var updated_crew = [];

		let fetch_all = await (this.crew ?? []).map( async (crew_item) => {
			if ( !trivialProps(crew_item,'crewUserID') ){
				await this.user_cache.get({ userID: crew_item.crewUserID , then: (user) => {
					if ( !trivialProps(user,'view') ){
						let model_links = to_social_links(user.view);
						let item  = { ...crew_item, social_links: model_links, user: user}
						updated_crew.push(item)
					} else {
						let item = { ...crew_item, social_links: to_social_links(crew_item), user: user }
						updated_crew.push(item)
					}
				}})
			}
		})

		await Promise.all(fetch_all);
		this.crew = updated_crew;
	}

	/**
	 * 
	 * @use: for fiat buyers, fech the user model
	 * 
	 **/
	async fetch_fiat_buyers({ then }){
		if ( this.did_fetch_fiat_users ){
			return then(this.fiat_purchases)
		} else {
			var updated_fiats = [];
			let fetch_all = await (this.fiat_purchases ?? []).map( async (fiat_item) => {
				if ( !trivialProps(fiat_item,'fiat_purchased_by') ){
					await this.user_cache.get({ userID: fiat_item.fiat_purchased_by , then: (user) => {
						let item = { ...fiat_item, user: user ?? {} }
						updated_fiats.push(item)
					}})
				}
			})
			await Promise.all(fetch_all);
			this.fiat_purchases = updated_fiats;
			this.did_fetch_fiat_users = true;
			then(updated_fiats);
		}
	}

	/**
	 * 
	 * @use: get all contributors to this all board
	 * 
	 **/ 
	async fetch_contributors({ then }){

	 	// get board item authors
	 	let all_user_ids = this.get_all_board_items()
	 		.map(m => trivialProps(m,'userID') ? "" : m.userID);

	 	let user_ids = Array.from( new Set(all_user_ids) );

	 	var users = [];

		const fetch_all_users = await (user_ids ?? []).map( async (id) => {
			await this.user_cache.get({ userID: id ?? "", then: (_user) => {
				let { name, metamask_ethereum_address } = _user.view;
				const blob = { key: name ?? "", value: metamask_ethereum_address ?? "", user: _user }
				users.push(blob)
			}})				 		
		})	    		
		await Promise.all(fetch_all_users);
	 	then(users);
	}

	/***
	 * 
	 * @use: fetch everyone who contributed to this
	 *        item `at`
	 * 
	 **/
	async fetch_contributors_at({ at, then }){
		if ( trivialString(at) ){
			return then([])
		}
		let item = this.get_item(at);
		if ( trivialProps(item,'userID') ){
			return then([])
		}
		this.user_cache.get({ userID: item.userID ?? "", then: (_user) => {
			let { name, metamask_ethereum_address } = _user.view;
			const blob = { key: name ?? "", value: metamask_ethereum_address ?? "", user: _user }
			then([blob])
		}})				
	}

	/**
	 * 
	 * @Use: get storyboard white-listed users
	 * 
	 **/
	async fetch_storyboard_whitelist({ storyboardID, then }){

		if ( trivialString(storyboardID) ){
			return then([]);
		}
		await get_storyboard_whitelist({ storyboardID, then });
	}

	/**
	 * 
	 * @use: get all items that has been minted
	 * 
	 **/
	async fetch_all_minted_items({ then }){
    	let contract = this.get_contract({ at: "" });
    	let addr = trivialProps(contract,'contract_address') ? '' : contract.contract_address;
		await get_all_minted_tok({
			contractAddress: addr,
			then: then
		})
	}

	/**
	 *
	 * @use: fetch minted token from the server 
	 * 
	 **/
	async fetch_minted_tok({ tokID, itemID, transaction_hash ,then }){
		await get_minted_tok({ tokID, itemID, transaction_hash,
			then: ({ success, tok }) => {
				if ( trivialProps(tok,'tok_id') || !success ){
					return then({});
				} else {
					return then(tok);
				}
			}
		})
	}

	/******************************************************
		@update story
	******************************************************/

	/***
	 * 
	 * @use: accept invite to this storyboard 
	 * 
	 **/
	async accept_invite({ invite_tok, then }){

		let user = await this.user_cache.getAdminUser();

		if ( trivialProps(user,'userID') || trivialString(user.userID) ){
			return then({ success: false, message: 'please log in first' })
		}
		await accept_invite_link({
			address: this.eth_address,
			userID: user.userID,
			invite_tok: invite_tok,
			then: (res) => {
				then(res)
			}
		})
	}

	/***
	 *
	 * @use: white list the user  
	 * 
	 **/
	async whitelist_user({ storyboardID, then }){

		let user = await this.user_cache.getAdminUser();
		if ( trivialProps(user,'userID') || trivialString(user.userID) ){
			return then({ success: false, message: 'please log in first' })
		}		

		await whitelist_user_storyboard({
			userID: user.userID,
			storyboardID: storyboardID ?? "",
			address: this.eth_address,
			then: then
		})

	}


	/**
	 * 
	 * @use: edit storybaord 
	 * 
	 **/
	async edit_story_board({
	    storyboardID,
	    name, 
	    about,  
	    num_items,
	    price_in_cents,
	    price_in_eth,
	    image_file,
	    push_image_update,		
	    then_progress,
	    then,
	}){

		var local_file_url = "";
		var type = ""
		let user = await this.user_cache.getAdminUser();

		if ( !trivialProps(image_file,'type')  ){
			local_file_url = URL.createObjectURL(image_file)
			type = toTokenContentKind(image_file.type)
		}

		await uploadPhotoFromURL({ 
			url : local_file_url ?? "",
			type: type,
	    	then_loading: (progress) => {
	    		if ( typeof then_progress === 'function' ){
		    		then_progress(`uploaded ${progress}%`)
		    	}
	    	},
			then: async ({ success, downloadURL }) => {
				await edit_story_board({
					storyboardID: storyboardID,
					userID: user.userID,
					name,
					about,
					num_items,
					price_in_cents,
					price_in_eth,
					image_url: downloadURL ?? "",
					push_image_update: true,
					then,
				})
		}});    		

	}

	/******************************************************
		@write/read license
	******************************************************/

	/**
	 * 
	 * @Use: check if this item can be licsnsed 
	 * 
	 **/
	can_license_item = async ({ itemID, then }) => {
		await can_license_item({ itemID, then })
	}

	/**
	 * 
	 * @use: claim this license
	 * 
	 **/
	claim_license = async ({ licenseID, then }) => {
		let user = await this.user_cache.getAdminUser();
		if ( trivialProps(user,'userID') ){
			return then({ success: false, message: 'cannot locate user', data: {} })
		}
		if ( trivialString(user.metamask_pk) ){
			return then({ success: false, message: "Only metamask users can license items", data: {} });
		}
		if ( !trivialString(user.custodial_ethereum_address) ){
			return then({ success: false, message: "Only metamask users can license items", data: {} });			
		}

		await StoryboardModel.get_item_by_license_id({ licenseID, then: async ({ success, data }) => {
			if ( trivialProps(data,'ID') || !success ){
				return then({ success: false, message: 'cannot locate item', data: {} })
			} else {
				await license_collection_item({ 
					userID: user.userID, 
					itemID: data.ID, 
					storyboardID: data.storyboardID,  
					projectID: this.eth_address ?? "",
					then: (res) => {
						then(res);
					}
				});
			}
		}});
	}

	/**
	 * 
	 * @use: get all licenses acquired from other houses
	 * 
	 **/
	get_acquired_licenses = async ({ then }) => {
		if ( this.acquired_licenses.length > 0 ){
			return then(this.acquired_licenses)
		} else {
			await get_acquired_licenses({ projectID: this.eth_address, then: ({ data }) => {
				then(data ?? []);
			}})		
		}
	}

	/**
	 *
	 * @use: get all members who licensed out of this storybaord
	 * 
	 **/
	get_all_licensors = async ({ storyboardID, then }) => {

		if ( !trivialProps(this.licenses,storyboardID) ){
			return then(this.licenses[storyboardID]);
		} 

		let items = this.get_board_items({ storyboardID }).filter(m => !trivialProps(m,'itemID'));
		let itemID = items.length === 0 
			? "" 
			: trivialProps(items[0],'itemID') ? "" : items[0]['itemID'];

		await get_item_licensors({ itemID, then: async ({ data }) => {

			var res = [];
			let fetch = await data.map(async (d) => {
				await this.user_cache.get({ userID: d.userID, then: (user) => {
					let blob = { ...d, user: user };
					res.push(blob);
				}})
			});
			await Promise.all(fetch);
			then(res);

			this.licenses[storyboardID] = res;

		}});
	}

	// generate an invite for this licens
	generate_license_invite = async ({ storyboardID, then }) => {
		let items = this.get_board_items({ storyboardID }).filter(m => !trivialProps(m,'itemID'));
		let user = await this.user_cache.getAdminUser();
		if ( trivialProps(user,'userID') || items.length === 0 ){
			return then("", "")
		}
		let userID = user.userID;
		let { itemID } = items[0];
		await generate_license_invite({ 
			userID, 
			storyboardID, 
			itemID, 
			then: async ({ success, license_id }) => {
			if ( trivialString(license_id)){
				return then("", "");
			} else {
				let url = `${home_page_url()}/referral/${license_id}`;
				return then(url, license_id);
			}
		}});
	}

	// @get read the item given inviteID
	static async get_item_by_license_id({ licenseID, then }){
		await get_item_by_license_id({ licenseID, then: then });
	}


	/******************************************************
		@read + update split on chain
	******************************************************/	

	/***
	 * 
	 * @use: release all funds owed 
	 * 
	 **/
	 release_current_window_at_erc1155 = async ({ then_releasing_funds, then_released_funds_fail, then_released_funds_success }) => {

    	if ( trivialString(this.eth_address) ){
    		return then_released_funds_fail('Please specify project address');
    	}

		let user = await this.user_cache.getAdminUser();
    	if ( trivialProps(user,'userID') ){
    		return then_released_funds_fail('Please sign in first')
    	}		

		await go_axios_post({
			post_params: make_post_params({ userID: user.userID, address: this.eth_address }),
			endpoint   : POST_ENDPOINTS.can_payout_splits,
			then: async ({ success, message, contract }) => {

				if ( !success || trivialProps(contract,'contract_address') || trivialString(contract.contract_address)  ){
		    		return then_released_funds_fail('Please deploy an ERC1155 first');
				}

				const { contract_address, abi, bytecode , contract_deployer_address} = contract;

				await releaseCurrentWindow({ 
					contract_address, 
					abi, 
					bytecode, 
					then: async ({ success, message, data }) => {
						if ( !success || trivialProps(data,'hash') ){
							return then_released_funds_fail(message)
						} else {
							await go_axios_post({
								endpoint   : POST_ENDPOINTS.did_payout_splits,
								post_params: make_post_params({ userID: user.userID, address: this.eth_address, hash: data.hash ?? "" }),
								then: (res) => {
									then_released_funds_success(res)
								}
							});
						}

					}
				})
			}
		});

	}

	/**
	 * 
	 * @use: get current read on split
	 * 
	 **/
	fetch_current_split_at_erc1155 = async ({  then_read_fail, then_read_success }) => {

    	if ( trivialString(this.eth_address) ){
    		return then_read_fail('Please specify project address');
    	}

		let user = await this.user_cache.getAdminUser();
    	if ( trivialProps(user,'userID') ){
    		return then_read_fail('Please sign in first')
    	}		

		await go_axios_post({
			post_params: make_post_params({ userID: user.userID, address: this.eth_address }),
			endpoint   : POST_ENDPOINTS.can_payout_splits,
			then: async ({ success, message, contract }) => {

				if ( !success || trivialProps(contract,'contract_address') || trivialString(contract.contract_address)  ){
		    		return then_read_fail('Please deploy an ERC1155 first');

				} else {

					const { contract_address, abi, bytecode } = contract;

					await readSplits({ contract_address, abi, bytecode, then: async (res) => {

						let { accounts } = res;

						var _accounts = [];

						let safe_address = trivialProps(this.safe,'safe_address') 
							? ""
							: this.safe.safe_address;

						// get all acct names if any
						let fetch_all_existing_accts = await accounts.map( async (acct) => {							
							if ( acct.pk === ETH_ADMIN_ADDRESS() ){
								_accounts.push({ ...acct, note: '0xPARC', name: '0xPARC' });
							} else if ( acct.pk === safe_address ){
								_accounts.push({ ...acct, note: 'Treasury', name: 'Treasury' });								
							} else {								
								await this.user_cache.get({ userID: acct.pk ?? "", then: (user) => {
									let name = trivialString(user.name) 
										? contractMetamaskAddress({ pk: acct.pk, m: 5, n: 3 })
										: user.name
									_accounts.push({ ...acct, note: 'split', name: name });
								}})
							}
						});
						await Promise.all(fetch_all_existing_accts);						

						// get total owed
		            	let total_owed = accounts
			            	.map(acct => {
			            		let num = trivialProps(acct,'owed') ? 0  : Number(acct.owed);
			            		return trivialNum(num) ? 0 : Number(num);
			            	})
			            	.reduce((a,b) => { return a + b },0)						

			            let owed = Math.round(total_owed/1000000000000000000*1000)/1000;
						then_read_success({  ...res, accounts: _accounts, balance: owed });

					}});
				}
			}
		});    	
	}


	/**
	 * 
	 * @use: fetch suggested splits on onboarding, suggest:
	 *      1. 1% to contract notorizer
	 *      2. x% to licensed item
	 *      3. 5% to 0xPARC
	 *      4. remaining goes to treaury
	 * 
	 **/
	fetch_suggested_splits_at_onboarding = async ({ add_all_licenses, then }) => {

		let user = await this.user_cache.getAdminUser();

		// 0. hard syncFull this storyboard
		this.syncFull({ then: async () => {
			setTimeout(async () => {
				// 1. get current split
				await this.fetch_current_split_at_erc1155({
					then_read_fail: () => {
						return then({ success: false, message: 'failed to read', accounts: []  })
					},
					then_read_success: async ({ accounts }) => {

						// 2. get all licensed items and add them
						await this.get_acquired_licenses({ then: async (license_items) => {

							var licenses = [];

							// enumerate all licenses
							let fetch_all_licensors = await license_items.map(async(item) => {
								const { percent_rake, userID } = item;
								await this.user_cache.get({ userID, then: (user) => {
									let split_item = {
										denominator: 1,
										name: user.name,
										note: 'license',
										pk: user.metamask_pk ?? user.custodial_ethereum_address,
										share: percent_rake,
										share_in_percent: percent_rake/100
									}
									licenses.push(split_item)
								}})
							});
							await Promise.all(fetch_all_licensors);


							// if adding all licenses, then 
							var suggestd = [];
							if (add_all_licenses){
								suggestd = accounts.concat(licenses)
							} else {
								suggestd = accounts;
							}

							// 3.add treasury to this as well
							if ( !trivialProps(this.safe, 'safe_address') && !trivialString(this.safe.safe_address) ){
								let treasury_split = {
									denominator: 100,
									name: 'Treasury',
									note: 'operations',
									pk: this.safe.safe_address ?? "",
									share: 25,
									share_in_percent: 0.25,
								}
								suggestd.push(treasury_split);
							}

							// 4. re-adjust personal payout at 1%, note only deployment it's set at 95%
							let my_items = suggestd.filter(m => m.pk.toLowerCase() === user.metamask_pk.toLowerCase());
							var suggestd_mod_my_item = suggestd.filter(m => m.pk.toLowerCase() !== user.metamask_pk.toLowerCase());
							if ( my_items.length > 0 ){
								var my_item = { ...my_items[0], share_in_percent: 0.01 }
								suggestd_mod_my_item.push(my_item);
							}
							let { splits } = this.compute_splits_st_constraints({  license_constraint: true, splits: suggestd_mod_my_item })

							then({ success: true, message: 'found accounts', accounts: splits });

						}});		

					}
				})
			},3000);

		}})

	}

	/**
	 *
	 * @Use: reweight splits subject to these constraints
     *     - 0xPARC admin always gets 5%,  
     *     - licensed items w/ % always get their %
     *     - all non-treasury items always get their %
     *     - treasury gets remaining items after splits
     * 
	 * @Note: this fn does not set the split on gnosis
	 *        you have to ask the user to confirm the 
	 *        precomputed split
	 *
	 **/
	compute_splits_st_constraints = ({ license_constraint, splits }) => {

		if (  trivialProps(splits,'length') || splits.length === 0 ){
			return { splits, denominator: 0 };
		}

		// filter out invalid pks, 0% split, and 
		// admin address
		var small_splits = splits.filter(item => {
			let b1 = Number(item.share_in_percent) > 0 
			let b2 = ethers.utils.isAddress(item.pk.toLowerCase())
			let b3 = item.pk !== ETH_ADMIN_ADDRESS();
			return b1 && b2 && b3
		});

		// combine double entres
		var combined_splits = {};

		small_splits.map(item => {
			let p = Number(item.share_in_percent);
			if ( trivialProps(combined_splits, item.pk) ){
				combined_splits[item.pk] = item;
				return true;
			} else {
				let _percent0 = Number(combined_splits[item.pk]['share_in_percent']);
				let _percent1 = Number( item.share_in_percent );
				var _percent2 = 0;
				if ( !trivialNum(_percent0) ){
					_percent2 += _percent0
				}
				if ( !trivialNum(_percent1) ){
					_percent2 += _percent2						
				}
				combined_splits[item.pk]['share_in_percent'] = _percent2;
				return true;
			}
		});

		combined_splits = Object.values(combined_splits);

		//  add in SAFE item is it's not in the combinedsplits constraint
		if ( !trivialProps(this.safe, 'safe_address') && !trivialString(this.safe.safe_address) ){
			let safe_address = this.safe.safe_address;
			// make sure user deposits into safe
			if ( combined_splits.filter(m => m.pk === safe_address).length === 0 ){
				var safe_item = {
					name  : 'Treasury',
					note  : 'operations',
					pk    : safe_address,
					share : 1,
					denominator: 100,
					share_in_percent: 0.01,
				}		
				combined_splits.push(safe_item)
			}
		}		

		// if license constraints are observed, filter them out of comibned splits
		var license_items = [];
		var license_percent = 0;
		if ( license_constraint ){
			license_items = combined_splits
				.filter(item => item['note'] === "license" && !trivialNum(item.share_in_percent))
				.map( item => {
					let _item = { ...item, denominator: 100 };
					return _item;
				})
			license_percent = license_items
				.map(a =>  Number(a.share_in_percent) ?? 0 )
				.reduce((a,b) => a+b, 0)
			combined_splits = combined_splits.filter(item => item['note'] !== 'license');
		}

		// set aside parc item
		let parc_item = {
			name  : 'fee',
			note  : '0xPARC',
			pk    : ETH_ADMIN_ADDRESS(),
			share : 5,
			denominator: 100,
			share_in_percent: 0.05
		}

		// rebalance w/o parc, licenses
		let _sum = combined_splits
			.map(item => Number(item.share_in_percent ?? 0))
			.reduce((a,b) => a+b,0);


		var total_share_ratio = Number(1 - 0.05 - license_percent ) ?? 0 
		total_share_ratio = Math.round(total_share_ratio*100)/100

		var combined_splits_reweigh = combined_splits
			.map(item => {
				let ps = Math.round(item.share_in_percent/_sum*total_share_ratio*100)/100;
				let ps_numerator = Math.round(ps * 100)
				return { ...item, share_in_percent: ps, share: ps_numerator, denominator: 100  }
			});

		combined_splits_reweigh = [parc_item]
			.concat(license_items)
			.concat(combined_splits_reweigh)			

		let denominator = combined_splits_reweigh
			.map(m => Number(m.share_in_percent) ?? 0)
			.reduce((a,b) => a+b,0);

		return { splits: combined_splits_reweigh, denominator: denominator };
	}

	/**
	 * 
	 * @use: adjust splits
	 * 
	 **/
	update_payout_window =  async ({ splits, then }) => {

		let user = await this.user_cache.getAdminUser();
    	if ( trivialProps(user,'userID') ){
    		return then({ success: false, message: 'no user found', data: {} });
    	}		

		await go_axios_post({
			post_params: make_post_params({ userID: user.userID, address: this.eth_address }),
			endpoint   : POST_ENDPOINTS.can_payout_splits,
			then: async ({ success, message, contract, witness_pk }) => {

				if ( !success || trivialProps(contract,'contract_address') || trivialString(contract.contract_address)  ){
			   		return then({ success: false, message: 'no splitter contract found', data: {} });
				}

				const { contract_address, abi, bytecode , contract_deployer_address} = contract;

				// var split_blobs = {};
				var pks = [];
				var shares = [];
				splits.map(item => {
					const { share_in_percent, pk } = item;
					pks.push(pk)
					shares.push(share_in_percent*100);
				});

				await updatePayoutWindow({ 
					contract_address, 
					abi, 
					bytecode, 
					pks: pks,
					shares: shares,
					witness_pk: witness_pk,
					then: async ({ success, message, data }) => {
						return then({ success, message, data })
					}
				})
			}
		});

	}

	/**
	 * 
	 * @use: adjust splits
	 * 
	 **/
	_hardWithdrawlEth =  async ({ then }) => {

		let user = await this.user_cache.getAdminUser();
    	if ( trivialProps(user,'userID') ){
    		return then({ success: false, message: 'no user found', data: {} });
    	}		

		await go_axios_post({
			post_params: make_post_params({ userID: user.userID, address: this.eth_address }),
			endpoint   : POST_ENDPOINTS.can_payout_splits,
			then: async ({ success, message, contract, witness_pk }) => {

				if ( !success || trivialProps(contract,'contract_address') || trivialString(contract.contract_address)  ){
			   		return then({ success: false, message: 'no splitter contract found', data: {} });
				}

				const { contract_address, abi, bytecode , contract_deployer_address} = contract;

				await hardWithdrawlEth({ contract_address, abi, bytecode, witness_pk,
					then: async ({ success, message, data }) => {
						return then({ success, message, data })
					}
				})
			}
		});
	}

	/******************************************************
		@ERC155 mint pause / resume
	******************************************************/	

	/**
	 * 
	 * @use: read if contract is puased
	 * 
	 **/
	read_mint_is_paused =  async ({ then }) => {

		let user = await this.user_cache.getAdminUser();
    	if ( trivialProps(user,'userID') ){
    		return then({ success: false, message: 'no user found', data: {} });
    	}		

		await go_axios_post({
			post_params: make_post_params({ userID: user.userID, address: this.eth_address }),
			endpoint   : POST_ENDPOINTS.can_payout_splits,
			then: async ({ success, message, contract }) => {

				if ( !success || trivialProps(contract,'contract_address') || trivialString(contract.contract_address)  ){
			   		return then({ success: false, message: 'no erc1155 contract found', data: {} });
				}

				const { contract_address, abi, bytecode , contract_deployer_address} = contract;

				await readMintIsPaused({ 
					contract_address, 
					abi, 
					bytecode,
					then: async ({ success, message, isPaused }) => {
						return then({ success, message, isPaused })
					}
				})
			}
		});
	}


	/***
	 * 
	 * @Use: toggle mint state
	 * 
	 **/
	 toggle_mint_state = async ({ should_pause, then }) => {
		let user = await this.user_cache.getAdminUser();
    	if ( trivialProps(user,'userID') ){
    		return then({ success: false, message: 'no user found', data: {} });
    	}		

		await go_axios_post({
			post_params: make_post_params({ userID: user.userID, address: this.eth_address }),
			endpoint   : POST_ENDPOINTS.can_payout_splits,
			then: async ({ success, message, contract, witness_pk }) => {

				if ( !success || trivialProps(contract,'contract_address') || trivialString(contract.contract_address)  ){
			   		return then({ success: false, message: 'no erc1155 contract found', data: {} });
				}

				const { contract_address, abi, bytecode , contract_deployer_address} = contract;

				await toggleContractMintStatus({
					contract_address, 
					abi, 
					bytecode,
					should_pause,					
					then: async ({ success, message, isPaused }) => {
						return then({ success, message, isPaused })
					}
				})
			}
		});
	 }


	/******************************************************
		@fiat + stripe operations
	******************************************************/	


	// purchaseitem by fiat w/ stripe
	fiat_purchase_and_premint = async ({ storyboardID, then_posting, then }) => {
		let user = await this.user_cache.getAdminUser();
		then_posting("purchasing item")
		return await fiat_purchase_and_premint({  storyboardID, userID: user.userID ?? "", then })
	}


	make_connected_account = async ({ then }) => {
		let user = await this.user_cache.getAdminUser();
		await make_connected_account({
			userID: user.userID ?? "",
			projectID: this.eth_address,
			then: then
		})
	}

	// @use: recurisvely check stripe to see if
	// this conncted account has been approved
	confirm_connected_account = async ({ iter, then }) => {
		if ( iter === 0 ){
			return then({ 
				success: false,
				approved: false ,
				message: 'Pending Stripe KYC',
				data: {}, 
			});
		} else {
			await confirm_connected_account({
				projectID: this.eth_address,
				then: (res) => {
					const { approved } = res;
					if ( approved ){
						return then(res);
					} else {
						setTimeout( async () => {
							await this.confirm_connected_account({ iter: iter - 1, then });
						},5000)
					}
				}
			})
		}
	}


	/******************************************************
		@av stack read
	******************************************************/

	/**
	 *
	 * @use: play trailer 
	 * 
	 **/
	play_trailer = ({ then }) => {

		if ( this.trailers.length === 0 ){
			return then({ success: false, message: 'no trailers found', data: {} })
		} else {
			let sorted_trailers =  this.read_trailer();
			var trailer = sorted_trailers[0];
			trailer['image_url'] = trailer['trailer_url'];
			this.current_av_item = trailer;
			return then({ success: true, message:'found trailer', data: trailer })
		}
	}

	/**
	 * 
	 * @use: read-trailer 
	 * 
	 **/
	read_trailer = () => {
		let ls = this.trailers.sort((a,b) => b.timeStampCreated - a.timeStampCreated)
		return ls;
	}

	/******************************************************
		@boolean read
	******************************************************/

	// check if i created this space
	is_owner = async () => {
		if ( trivialProps(this.user_cache, 'getAdminUser')  ){
			return false;
		} else {
			let user = await this.user_cache.getAdminUser();
			if ( trivialProps(user, 'userID') ){
				return false;
			} else if ( trivialProps(this.root,'userID') ){
				return false;
			} else {
				return user.isMe(this.root.userID)
			}
		}
	}

	/**
	 * 
	 * @use: check i am a member
	 * 
	 **/
	is_member = async () => {
		if ( trivialProps(this.user_cache, 'getAdminUser')  ){
			return false;
		} else {
			let user = await this.user_cache.getAdminUser();
			if ( trivialProps(user, 'userID') ){
				return false;
			} else if ( trivialProps(this.root,'userID') ){
				return false;
			} else if ( !this.root.is_private ) {
				return true;
			} else {

				let ids = this.crew.map(c => trivialProps(c,'crewUserID') ? '' : c.crewUserID);
				let part_of_crew = ids
					.map(id => {
						return user.isMe(id)
					})
					.filter(b => b);				
				return user.isMe(this.root.userID) || part_of_crew.length > 0
			}
		}
	}

	/**
	 * 
	 * @Use: check storyboard has board items
	 * 
	 **/
	has_board_items = () => {
		let items = this.items;
		if ( illValued(items) ){
			return false;
		} else {
			return Object.keys(items).length > 0;
		}
	}

	/******************************************************
		@basic read
	******************************************************/

	// get project eth address
	get_id = () => {
		return this.eth_address ?? ""
	}

	/**
	 * 
	 * @use: get proj. namej
	 * 
	 **/ 
	get_name = () => {
		return this.root.name ?? ""
	}


	get_owner_user_id = () => {
		return this.root.userID ?? "";
	}

	/******************************************************
		@view read
	******************************************************/


	/**
	 * 
	 * @Use: get board roots
	 * 
	 **/
	get_board_roots = () => {
		return Object
			.values(this.boards)
			.sort((a,b) => a.timeStampCreated - b.timeStampCreated);			
	}

	/**
	 * 
	 * @Use: get storyboard at id 
	 * 
	 **/
	get_board = ({ at }) => {
		if ( trivialString(at) ){
			return {}
		} else {
			return this.boards[at] ?? {}
		}
	}

	/**
	 * 
	 * @Use: get storyboards
	 * 
	 **/ 
	get_board_items = ({ storyboardID }) => {
		if ( trivialString(storyboardID) ){
			return []
		}
		let xs = this.items[storyboardID] ?? [];
		let ys = xs.sort((a,b) => a.timeStampCreated - b.timeStampCreated)
		return ys;
	}

	get_board_from_item = ({ itemID }) => {
		if ( trivialString(itemID) ){
			return {}
		}

	}

	/**
	 * 
	 * @use: get all board items
	 * 
	 **/ 
	get_all_board_items = () => {
		var res = [];
		Object.keys(this.boards).map(id => {
			let xs = this.get_board_items({ storyboardID: id });
			res = res.concat(xs)
			return true;
		});
		return res;
	}


	/**
	 * 
	 * @use: get item given itemid
	 * 
	 **/ 
	get_item = ( itemID ) => {

		let id = itemID ?? "";
		let all_items = Object
			.values(this.get_all_board_items())
			.filter(m => m.itemID === id )	

		return all_items.length > 0 ? all_items[0] : {}
	}	

	/**
	 * 
	 * @use: get name and about of project
	 * 
	 **/ 
	get_first_root = () => {
		return this.root;
	}


	/**
	 * 
	 * @Use: get hero image url
	 * 
	 **/ 
	get_hero_image = () => {
		let root_url = this.root.image_url ?? ""
		let items = this.get_all_board_items().filter(m => !trivialString(m.image_url));
		return root_url ?? (items[0].image_url ?? "");
	}

	get_preview_hero_img = () => {
		let _default = this.get_hero_image();
		return this.root.image_preview_url ?? _default;
	}


	/**
	 * 
	 * @use: get user
	 * 
	 **/ 
	get_owner = async ({ then }) => {
		const { userID } = this.get_first_root();
		if (  trivialProps(this.user_cache,'get') ){
			return then({})
		} else {
			this.user_cache.get({ userID: userID ?? "", then: (user) => {
				then(user)
			}})
		}
	}

	/**
	 * 
	 * @use: get user for this item at `data`
	 * 
	 **/ 
	get_user_for = async ({ data, then }) => {
		if ( trivialProps(data,'userID') ){
			return then({})
		} else {
			this.user_cache.get({ userID: data.userID ?? "", then: (user) => {
				then(user)
			}})			
		}
	}

	/***
	 *
	 * @use: get storyboard crew, filter out non-well formed ones 
	 *       and filter out admin crew
	 * 
	 **/
	read_crew = async () => {
		if ( trivialProps(this.user_cache,'getAdminUser') ){
			return [];
		}
		let admin_user = await this.user_cache.getAdminUser();
		let good_crew = this.crew.filter(data => {
			let should_include_2 = !trivialProps(data,'ID')
			// let should_include_3 = !trivialProps(data,'name')  && !trivialString(data.name)
			// let should_include_4 = !trivialProps(data,'about') && !trivialString(data.about)			
			// let should_include_1 = !trivialProps(data,'crewUserID')
				// && !trivialProps(admin_user, 'userID')
				// && (data.crewUserID === admin_user.userID 
					// || data.crewUserID === admin_user.uid
					// || data.crew_eth_address === admin_user.userID 
					// || data.crew_eth_address === admin_user.metamask_pk
				// )
			return should_include_2; // should_include_2 && (should_include_1 || should_include_3 || should_include_4);
		});
		return good_crew;
	}

	/**
	 *
	 * @use: pretty print crew names 
	 * 
	 **/
	pretty_print_crew_names = async ({ num_names, then }) => {

		await this.get_owner({ then: async (owner) => {

			if ( trivialProps(owner,'userID') ){
				return  then("")
			}

			let crews = await this.read_crew();
			let other_crews = crews
				.filter(c => !trivialProps(c,'user') && !trivialProps(c.user,'isMe'))
				.filter(c => !c.user.isMe(owner.userID))
				.map(c => c.user.name ?? "");

			if ( other_crews.length === 0 ){
				return then(owner.name);
			} else if ( other_crews.length === 1 ){
				return then(`${owner.name} and ${other_crews[0]}`);
			} else if ( other_crews.length === 2 ){
				return then(`${owner.name}, ${other_crews[0]}, and ${other_crews[1]}`);
			} else {
				return then(`${owner.name}, ${other_crews[0]}, and ${other_crews.length - 1} others`);
			}

		}})		
	}

	/**
	 * 
	 * @use: get contract of kind from contracts
	 * 
	 **/
	get_contract = ({ at }) => {
		let cs = this.contracts;
		if ( trivialString(at) ){
			return cs.length === 0 ? {} : cs[0];
		} else {
			let os = cs.filter(m => m['contract_kind'] === at);
			return os.length > 0 ? os[0] : {}
		}
	}

	// get any conract address for view pruposes
	get_any_contract_address = () => {
		let goods = this.contracts.filter(m => !trivialString(m.contract_address))
		if ( goods.length === 0 ){
			return ""
		} else {
			return goods[0].contract_address;
		}
	}

	/**
	 * 
	 * @use: ifthe project has imported contract, get this 
	 * 
	 **/
	get_imported_contract_address = () => {
		let imported = Object.values(this.boards)
			.filter(m => !trivialProps(m,'migrated_contract_address') && !trivialString(m.migrated_contract_address))
			.map(m => m.migrated_contract_address);
		return imported.length > 0 ? imported[0] : "";
	}


	/**
	 * 
	 * @Use: get etherscan url for all tx associated with this token
	 * 
	 **/ 
	getEtherscanAddressURL = (hash) => {	
		let _hash = trivialString(hash) ? this.eth_address : hash
		switch ( ETH_NETWORK() ){
			case Networks.ropsten: 
				return `https://ropsten.etherscan.io/address/${_hash}`
			case Networks.rinkeby: 
				return `https://rinkeby.etherscan.io/address/${_hash}`;
			case Networks.mainnet:
				return `https://etherscan.io/address/${_hash}`
			default:
				return ""
		}
	}

	/**
	 * 
	 * @use: go to tx at `hash` on etherscan
	 * 
	 **/ 
	getEtherscanTxURL = (hash) => {
		if ( trivialString(hash) ){
			return ""
		}
		switch ( ETH_NETWORK() ){
			case Networks.ropsten: 
				return `https://ropsten.etherscan.io/tx/${hash}`
			case Networks.rinkeby: 
				return `https://rinkeby.etherscan.io/tx/${hash}`
			case Networks.mainnet:
				return `https://etherscan.io/tx/${hash}`
			default:
				return ""
		}
	}	


	/**
	 * 
	 * @use: get getDropDate
	 * 
	 **/ 
	getDropDate = () => {
		let hero = this.get_first_root();
		return trivialProps(hero,'timeStampExpire')
			? swiftNow()
			: hero.timeStampExpire;
	}

	/**
	 * 
	 * @use: get est. date
	 * 
	 **/ 
	getEstDate = () => {
		let hero = this.get_first_root()
		return trivialProps(hero, 'timeStampCreated')
			? swiftNow()
			: hero.timeStampCreated
	}

	/**
	 * 
	 * @use: get project budget
	 * 
	 **/ 
	get_budget = () => {
		return 0;
	}
}