
/**
 * 
 * @Module: metmask and opensea api
 * @Author: Xiao Ling
 * @Date  : 12/16/2021
 * @DOC   : for read only API
 * 		  	- https://docs.opensea.io/reference/retrieving-a-single-asset
 *        	- https://docs.metamask.io/guide/ethereum-provider.html#basic-usage
 *        	- https://github.com/ProjectOpenSea/opensea-js
 *
 * @DOC for web3 compabilitlty with react, you need to use alternate build system, see `README.md` or docs below:
 * 	 - https://ethereum.stackexchange.com/questions/123530/module-not-found-error-cant-resolve-stream-in-react-project-including-web3
 *   - https://stackoverflow.com/questions/57161839/module-not-found-error-cant-resolve-fs-in
 *   - https://ethereum.stackexchange.com/questions/111716/make-offer-to-opensea-asset-through-opensea-js
 * 
 * @DOC: for web3 provider for opensea:
 * 	- https://ethereum.stackexchange.com/questions/111716/make-offer-to-opensea-asset-through-opensea-js
 * 
 * @TODO  : see escrow contract: https://docs.replit.com/tutorials/33-escrow-contract-with-solidity 
 * 
 * 
*/


import axios from "axios";
import { doc, updateDoc } from "firebase/firestore"; 
import { ethers } from "ethers";


const { 
	illValued,
	trivialString, 	
	trivialProps,
	swiftNow,
	trivialNum,
	toWellFormedObject,
} = require('./utils')


const { 
	  fire_db
	, DbPaths
	, POST_ENDPOINTS
	, make_post_params
	, go_axios_post	
	, GLOBAL_STAGING
 } = require('./core');


const { queryMetaMask } = require('./api_web3');

/******************************************************
	@basic metamask transactions
******************************************************/	



/**
 * 
 * @Use: check if the user owns this token
 * 
 */ 
async function doesUserOwnThisToken({ tokID, contractAddress, then }){

    if ( trivialString(tokID) || trivialString(contractAddress) ){

        then({ success: false, tokenExists: false, ownToken: false, message: `improper inputs`, data: {} })

    } else {

        // 1. connect with user's Metamask
        await queryMetaMask({ then: async({ success, message, pk }) => {

            if (!success || trivialString(pk)){
                return then({ success: false, tokenExists: false, ownToken: false, message: `no metamask found: ${message}`, data: {} });
            }

            // 2. query open sea 
            await fetch_nft_from_opensea({
                tokID: tokID,
                contractAddress: contractAddress, 
                then:  async ({ success, message, data }) => {

                    if ( !success || illValued(data) ){

                        return then({ success: false, tokenExists: false, ownToken: false, message: message, data: data })

                    } else {

                        const { owner } = data;

                        if ( trivialProps(owner,'address') || trivialString(owner.address) ){
                            return then({ success: false, tokenExists: true, ownToken: false, message: `malformed owner in opensea data`, data: data })
                        }

                        if ( owner.address === pk ){

                            then({ success: true, tokenExists: true, ownToken: true, message: `fetched!`, data: data })

                        } else {

                            then({  success: true, tokenExists: true, ownToken: false, message: `You do not own this token`, data: data })
                        }
                    }
                }
            });

        }})        
    }

}


/**
 * 
 * @use: sign message 
 * @Doc: https://codesandbox.io/s/react-eth-metamask-signatures-ibuxj?file=/src/SignMessage.js:118-700
 * 
 **/
async function signMessageWithMetamask({ user_message, then }){

    // 1. connect with user's Metamask
    await queryMetaMask({ then: async({ success, message, pk }) => {

        if (!success || trivialString(pk)){
            return then({ success: false, message: `no metamask found: ${message}`, address: "", signature: "" });
        }

		try {

			if (!window.ethereum){
				let str = "No crypto wallet found. Please install it."
				return then({ success: false, message: str, address: "", signature: "" })
			}

			await window.ethereum.send("eth_requestAccounts");
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();
			const signature = await signer.signMessage(`${pk}${user_message}`);
			const address = await signer.getAddress();

			return then({ success: true,  message: message, signature:signature, address: address });

		} catch (err) {
            return then({ success: false, message: err.message, address: "", signature: "" });
		}


    }})    	
}


/******************************************************
	@fetch all user's nft 721tokens synced with db
******************************************************/	

/**
 * 
 * @use: get all nfts owned by `pk`
 * 
 **/ 
async function get_all_nft_owned_by_user({ pk, then }){

	if ( trivialString(pk) ){
		return then({ success: false, message: 'please specify pk', data: [] })
	}

	let post_params = make_post_params({ pk : pk });

	// 1. get all nfts owned by `pk`
	return await go_axios_post({
		post_params: post_params,
		endpoint: POST_ENDPOINTS.get_all_nft_owned_by_user,
		then: async ({ success, message, data }) => {

			if ( !success || data.length === 0 ){
				return then({ success: false, message: message, data: [] });
			}

			// 2. fetch full nft data from opensea
			var full_toks = [];

			let fetch_all_full = await data
				.filter(m => !trivialProps(m,'token_address') && !trivialProps(m,'token_id'))
				.map(async ({ token_address, token_id, network }) => {
					if ( network !== 'rinkeby' || GLOBAL_STAGING ){
			            await fetch_nft_from_opensea({
			                tokID : token_id,
			                contractAddress: token_address,
			                isRinkeby: network === "rinkeby",
			                then:  async ({ success, message, data }) => {
			                	if ( success ){
			                		full_toks.push(data);
			                	}
			                }	
			            });
			        }
			})
		    await Promise.all(fetch_all_full); 
			return then({ success: success, message: message, data: full_toks })
		}
	});

}




/******************************************************
	@opensea api
******************************************************/	


/**
 * 
 * @Use; fetch nft with `tokID` from `contractAddress`
 * @Doc: https://docs.opensea.io/reference/retrieving-a-single-asset
 * @`cons`ider: https://github.com/ringaile/escrow
 * 
 **/ 
async function fetch_nft_from_opensea({ tokID, contractAddress, isRinkeby, then }){

	if (illValued(then)){
		return;
	}

	if ( trivialString(tokID) || trivialString(contractAddress) ){

		return then({ success: false, message: `invalid input value`, data: {} });
	}

    let url = isRinkeby
    	? `https://testnets-api.opensea.io/api/v1/asset/${contractAddress}/${tokID}/?force_update=true`
    	: `https://api.opensea.io/api/v1/asset/${contractAddress}/${tokID}/`;

	axios.get( url )
		.then(async res => {

			if ( trivialProps(res,'data') || illValued(res.data) ){

				return then({
					success: false,
					message: `failed to fetched data from opensea`,
					image_url: '',					
					image_preview_url: "",
					image_thumbnail_url: "",
					data: {},
				})

			} else {

				const { image_thumbnail_url,  image_preview_url, image_url } = res.data;

				return then({
					success: true,
					message: `fetched data from opensea`,
					image_url: image_url ?? "",
					image_preview_url: image_preview_url ?? "",
					image_thumbnail_url: image_thumbnail_url ?? "",
					data: res.data ,
				})

			}
		})
		.catch(e => {

			return then({
				success: false, 
				message: `get request failed, token dne`,
				image_url: '',
				image_preview_url: "",
				image_thumbnail_url: "",
				data: {},
			})
		})

}




/**
 * 
 * @Use; fetch metadata for nft at `url`
 * @Doc: https://docs.opensea.io/reference/retrieving-a-single-asset
 * @consider: https://github.com/ringaile/escrow
 * 
 **/ 
async function fetch_metadata_from_opensea({ url, then }){

	if (illValued(then)){
		return;
	}

	if ( trivialString(url) ){

		return then({ success: false, message: `invalid input value`, data: {} });
	}

	axios.get( url )
		.then(async res => {

			if ( trivialProps(res,'data') || illValued(res.data) ){

				return then({
					success: false,
					message: `failed to fetched data from opensea`,
					data: {},
				})

			} else {

				return then({
					success: true,
					message: `fetched data from opensea`,
					data: res.data ,
				})

			}
		})
		.catch(e => {

			return then({
				success: false, 
				message: `get request failed, token dne`,
				data: {},
			})
		})

}


/**
 * 
 * @Use; fetch metadata for nft at `url`
 * @Doc: https://docs.opensea.io/reference/retrieving-a-single-asset
 * @Example: 0x09900d3a58a93ef82c060c630ec49e8f7315ad25
 * 
 **/ 
async function fetch_opensea_token_metadata({ tok, then }){

	if (illValued(then)){
		return;
	}

	var res = { success: false, message: 'token does not have metadata', data: {} }

	if ( trivialProps(tok, 'token_metadata') ){
		return then(res);
	}

	// note you get blocked by cors here
	axios.get( tok.token_metadata )
		.then(async res => {	

			if ( trivialProps(res,'data') || illValued(res.data) ){
				return then(res);
			} else {	
				return then({ success: true, message: 'found data', data: res.data });
			}
		})
		.catch(e => {
			res['message'] = e;
			return then(res)
		})

}


/**
 * 
 * @use: get contract base and inventory from opensea
 * 
 * 
 **/ 
async function fetch_contract_and_inventory_from_opensea({ contractAddress, then }){

	await fetch_contract_from_opensea({ 
		contractAddress: contractAddress, 
		then: async (res_1) => {

			if (!res_1.success){
				return then(res_1)
			}

			await fetch_inventory_from_opensea({  
				contractAddress: contractAddress, 
				then: async ({ success, message, inventory }) => {

					return then({
						success: success || res_1.success,
						message: message,
						base: res_1.data,
						inventory: inventory
					})
				}
			})

		}
	 })
}

/**
 * 
 * @use: fetch all inventory from opensea
 * @Doc: https://docs.opensea.io/reference/retrieving-a-single-contract
 * 
 **/
async function fetch_contract_from_opensea({ contractAddress, then }){

	var res = { success: false, message: 'illValued inputs', data: {} }

	if ( trivialString(contractAddress) ){
		res['message'] = 'please specify contract address';
		return res;
	}	

	// get basic inventory
	let project_info_url = `https://api.opensea.io/api/v1/asset_contract/${contractAddress}`

	axios.get( project_info_url )
		.then(async res => {
			
			const data = res.data;

			if ( trivialProps(res.data,'address') ){
				res['message'] = 'contract dne'
				return then(res)
			} 	
			// flatten data
			let col_data = data['collection'] ?? {}
			var tree_data = { ...data, ...col_data}
			tree_data['collection'] = 0;
			tree_data['display_data'] = 0;

			let well_formed_data = toWellFormedObject(tree_data);

			return then({ success: true, message: 'found data', data: well_formed_data });

		})
		.catch(e => {

			res['message'] = e;
			return then(res)

		});


}

/**
 * 
 * @use: fetch the first 20 nfts from opensea collection
 * 
 **/ 
async function fetch_inventory_from_opensea({ contractAddress, then }){

	var res = { success: false, message: 'illValued inputs', inventory: [], next: "" }
	let project_inventory_url = `https://api.opensea.io/api/v1/assets?asset_contract_address=${contractAddress}`

	if ( trivialString(contractAddress) ){
		res['message'] = 'please specify contract address';
		return res;
	}	

	axios.get( project_inventory_url )
		.then(async res => {

			const data = res.data;

			if ( trivialProps(res.data,'assets') ){
				res['message'] = 'contract inventory dne'
				return then(res)
			} 	

			return then({ success: true, message: 'found data', inventory: data.assets, next: data.next });
		})
		.catch(e => {
			res['message'] = e;
			return then(res)
		});
}



/******************************************************
	@fetch token as profile image
******************************************************/	

/**
 * 
 * @Use: use NFT as profile image
 *       if user own this token then
 *       save token image
 * 
 **/ 
async function save_nft_as_profile_image({ 
	userID,
	tokID, 
	contractAddress,
	_force_,  // <- debug param
	then 
}){

    if ( trivialString(tokID) || trivialString(contractAddress) || trivialString(userID) ){
        return then({ success: false, message: `invalid inputs: ${tokID}, ${contractAddress}`, preview_url: "" , data: {} });
    }

    await doesUserOwnThisToken({
        tokID: tokID, 
        contractAddress: contractAddress,
        then: async ({ success, ownToken, message, data }) => {

        	let force_save = !illValued(_force_) && _force_ === true

        	if ( (success && ownToken) || force_save ){

        		const { image_preview_url, image_thumbnail_url, image_url } = data;

        		if (  !trivialString(image_preview_url) || !trivialString(image_thumbnail_url) || !trivialString(image_url) ){

        			let blob = {
        				timeStampLatest: swiftNow(),
						profile_image_preview_url: image_preview_url,
						profile_image_thumbnail_url: image_thumbnail_url,
						profile_image_url: image_url,
        			}

        			// problem: this is not updating
					const userRef = doc(fire_db, DbPaths.users, userID);
					await updateDoc(userRef, blob);

					then({ success: true, message: `saved NFT as profile image`, preview_url: image_preview_url , data: {} })

        		} else {

        			return then({ success: false, message: `nft does not have preview image`, preview_url: "" , data: {} })
        		}


        	} else if ( !success || ownToken === false ){

        		return then({ success: false, message: `FAILED to save token, you do not own token`, preview_url: "" , data: {} })

            } else {

                then({  success: success, message: `failed to sumbit token: ${message}`, preview_url: "", data: {}  })
            }


        }
    })

}



/******************************************************
	@utils
******************************************************/	


/**
 * 
 * @use: get eth price
 * @Doc: https://ethereum.stackexchange.com/questions/38309/what-are-the-popular-api-to-get-current-exchange-rates-for-ethereum-to-usd
 * 
 **/ 
async function getEthPrice({ then }){

	let url = 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR'
	axios.get( url )
		.then(async (res) => {
			then(res.data)
		})
		.catch(e => {
			return then({ success: false, message: e, USD: 0, BTC: 0, EUR: 0 })
		});
}



/**
 * 
 * @use: parse url
 * 
 **/
function parseOpenSeaURL(url){

	if ( typeof url !== 'string' ){
		return []
	}

    let bits = url.split('/');
    if ( bits.length < 2 ){
        return []
    } else {
	    let address = bits[bits.length-2];
	    let tokID   = bits[bits.length-1];		
	    return [ address, tokID ];
	}
}


/******************************************************
	@export
******************************************************/	



export {
	doesUserOwnThisToken,
	fetch_nft_from_opensea,
	save_nft_as_profile_image,
	fetch_metadata_from_opensea,
	fetch_contract_from_opensea,
	fetch_inventory_from_opensea,
	fetch_opensea_token_metadata,
	fetch_contract_and_inventory_from_opensea,
	parseOpenSeaURL,
	getEthPrice,
	signMessageWithMetamask,

	get_all_nft_owned_by_user,

}




