
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
	releaseFunds,
	getBalanceOfEther,
	sendEthFromMetamaskAccount,
	readMintIsPaused,
	readSplits,
	monitorDeployedContract,
	toggleContractMintStatus,
	releaseCurrentWindow,
} from './api_web3';

import ChainModel from './chainModel';

const { 
	illValued,
	trivialProps,
	trivialString, 	
	swiftNow,
	cap,
	force_to_num,
	removeAllSpaces,
} = require('./utils')

const { 
	make_post_params,
	go_axios_post_preset,
	default_fn_response,
	ETH_NETWORK,
	uploadPhotoFromURL,
	toTokenContentKind,
	MemberPermission,
} = require('./core');



/******************************************************
	@exported service
******************************************************/	

 

/**
 * 
 * @Use: sync user data on web2 and web3
 * 
**/ 
export default class ChainService {


	constructor(user_cache){

		this.user_cache = user_cache;
		this.delegate = null;

		this.chains = {};
	}

	// @use: load chains
	sync = async () => {
		return;
	}

	/******************************************************/
	// @use: fiat buy

	buy_lumo_token_on_polygon = async ({ amt_in_lumo, chain_id, then }) => {
		let user = await this.user_cache.getAdminUser();		
		return await go_axios_post_preset({
			fn_name: "buy_lumo_token_on_polygon",
			params: { userID: user.userID, amt_in_lumo, chain_id: chain_id ?? "" },
			then: then
		})
	}


	/******************************************************/
	// @use: create/edit chain

	// @use: create new chain
	create_chain = async ({ name, about, symbol, subdomain, then }) => {
		let user = await this.user_cache.getAdminUser();		
		return await go_axios_post_preset({
			fn_name: "create_chain",
			params: { userID: user.userID, name, about, symbol, subdomain },
			then: then
		})
	}

	/******************************************************/
	// @use: read chain

	// @use: fetch chain given url subdomain
	fetch_chain_by_subdomain = async({ subdomain, then }) => {
		return await go_axios_post_preset({
			fn_name: "fetch_chain_id_by_subdomain",
			params: { subdomain: subdomain ?? "" },
			then: async ({ success, message, data }) => {
				if ( !success || trivialProps(data,'chain_id') ){
					return then({})
				} else {
					const { chain_id } = data;
					await this.fetch({ chain_id, data, then: (chain) => {
						return then(chain)
					}})
				}
			}
		})				
	}

	// @use:fetch chain from db or cache
	fetch = async ({ chain_id, data, then }) => {
		let chain = this.chains[chain_id ?? ""];
		if ( !trivialProps(chain,'chain_id') && !trivialString(chain.chain_id) ){
			return then(chain)
		} else {
			let chain = new ChainModel(chain_id, this.user_cache, data ?? {});
			this.chains[chain_id] = chain;
			await chain.sync({  then: (_) => {
				return then(chain);
			}})
		}
	}

	/**
	 *
	 * @Use: fetch chain by invite code
	 * 
	 **/
	fetch_by_invite = async ({ code, then }) => {
		if ( trivialString(code) ){
			return then ({})
		}
		return await go_axios_post_preset({
			fn_name: "fech_nomination",
			params: { inviteCode: code ?? "" },
			then: async ({ success, message, data }) => {
				if ( !success || trivialProps(data,'chain_id') ){
					return then({})
				} else {
					const { chain_id, userID } = data;
					await this.user_cache.get({ userID: userID ?? "", then: async (user) => {
						await this.fetch({ chain_id, then: (chain) => {
							return then({  chain: chain, invite: data, user: user ?? {} })
						}})
					}}) 
				}
			}
		})		
	}

	fetch_all_tokens_by = async ({ userID, then }) => {
		return await go_axios_post_preset({
			fn_name: "fetch_all_tokens_by",
			params: { userID: userID ?? "" },
			then: (res) => {
				var _res = res;
				_res['data'] = res.data.sort((a,b) => {
			        return b.timeStampCreated - a.timeStampCreated;
			    });
			    return then(res);
			}
		})				
	}

	/**
	 * 
	 * @use: accept nomination at code
	 * 
	 **/
	// accept_nomination = async ({ code, then }) => {
	// 	let user = await this.user_cache.getAdminUser();		
	// 	return await go_axios_post_preset({
	// 		fn_name: "accept_nomination",
	// 		params: { inviteCode: code ?? "", userID: user.userID ?? "" },
	// 		then: then
	// 	})		
	// }	


}























 








