/** 
 * 
 * @Package: core.js
 * @Date   : April 30th.2021
 * @Use.   : All nft api for firebase triggers
 * @test   : firebase emulators:start
 * @Important: must set env. variable for public and private key of admin on local first. 

	 see: https://medium.com/firelayer/deploying-environment-variables-with-firebase-cloud-functions-680779413484

	```
		firebase functions:config:set eth.public = "" eth.private = ""
		firebase functions:config:get
	```
*/
const axios = require('axios')
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { firebaseConfig } = require("firebase-functions");
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const uuid   = require('uuid');

// get config:
require('dotenv').config()
const { 
	PUBLIC_KEY,
	PRIVATE_KEY, 
    KEYS_API_VENDOR_ID,
    KEYS_API_VENDOR_SECRET,
} = process.env;


const { 
	swiftNow, 
	ppSwiftTime,
	trivialString, 
	trivialProps,
	trivialNum,
	randomIntFromInterval 
} = require("./utils")

const {
	fetch_all
} = require("./fire");

const {
	GLOBAL_BACKUP,
	GLOBAL_PRODUCTION,
	project_id,
} = require("./dbenv");

const { TwitterApi } = require('twitter-api-v2');



/******************************************************
    @IMPORTANT: reexport which project
******************************************************/

exports.GLOBAL_BACKUP     = GLOBAL_BACKUP;
exports.GLOBAL_PRODUCTION = GLOBAL_PRODUCTION;
exports.project_id = firebaseConfig().projectId;

/******************************************************
	@Airdrop amount
******************************************************/

exports.AIR_DROP_AMOUNT = 0.250;

/******************************************************
    @alchemy, moralis, and other ethreum stuff
******************************************************/

// ropsten
const ALCHEMY_STAGING_ROPSTEN = {
	http: '',
	websocket:''
};

// rinkey
const ALCHEMY_STAGING_RINKEBY = {
	api_key: '',
	http: '',
	websocket:''
}

// polygontest-net
const ALCHEMY_STAGING_MUMBAI = {
	api_key  :  '',
	http     : '',
	websocket:'',
};


// eth main net
const ALCHEMY_PRODUCTION = {
	http: '',
	websocket:'',
};

// polygontest- mainnet
const ALCHEMY_PRODUCTION_POLYGON = {
	api_key  : '',
	http     : '',
	websocket: ''
};



const production_web3 = createAlchemyWeb3(ALCHEMY_PRODUCTION.http);
const staging_web3    = createAlchemyWeb3(ALCHEMY_STAGING_RINKEBY.http);

const staging_sidechain    = createAlchemyWeb3(ALCHEMY_STAGING_MUMBAI.http);
const production_sidechain = createAlchemyWeb3(ALCHEMY_PRODUCTION_POLYGON.http);

/**
 * 
 * @use: make web3 module
 * 
 **/ 
exports.alchemyWeb3Instance = () => {
	if ( GLOBAL_PRODUCTION ){
		return production_web3
	} else {
		return staging_web3
	}
}

exports.alchemySideChainInstance = () => {
	if ( GLOBAL_PRODUCTION ){
		return production_sidechain
	} else {
		return staging_sidechain
	}	
}


/**
 * 
 * @Use: create (pk,pvk) pair on ethereum
 * 
**/ 
exports.make_production_web3_account = () => {
    let { address, privateKey } = production_web3.eth.accounts.create(`2435@#@#@±±±±!!!!678543213456764${Date.now()}`);
    return { address, privateKey }
}


/**
 * 
 * @use: metamask ethereum web3 admin for all contracts on 0x1 and 0x3
 *       note must set keys in firebase config with:
 * 	    `firebase functions:config:set eth.public='...' eth.private='...' `
 * 
 * 
 **/ 
exports.admin_eth_keys = async () => {
	if ( typeof PRIVATE_KEY !== 'string' || typeof PUBLIC_KEY !== 'string' || PRIVATE_KEY === '' || PUBLIC_KEY === '' ){
		throw new Error("firebase config for eth public/private keys are not properly set")
	}
	return { public: PUBLIC_KEY, private: PRIVATE_KEY };
}

/**
 * 
 * @use: eth key pairs with matic/eth in account for calling contract
 *       on server env. with custodial contracts
 * 
 **/ 
exports.with_custodial_eth_keys = async ({ then }) => {

    var keys = await get_all_custodial_eth_keys();
    let idx = randomIntFromInterval(0, keys.length-1);

    if ( keys.length === 0 ){
		return then({ public: PUBLIC_KEY, private: PRIVATE_KEY, success: true, idx: -1 });
    }

    let { ID, address } = keys[idx];
    let post_param = {
        network: GLOBAL_PRODUCTION ? Networks.mainnet : Networks.ropsten,
        eth_address: address,
        hide_private_key: false,
    }
    await get_keys_from_lumo_core({ 
        post_params: post_param,
        then: async ({ success, message, data }) => {
        	if ( !success ){
				return then({ public: PUBLIC_KEY, private: PRIVATE_KEY, success: true, idx: -1 });
        	} else {
        		const { eth_address, eth_private_key } = data;
        		return then({ public: eth_address, private: eth_private_key, idx: idx, success: true });
        	}        		
        }
    });
}


async function get_all_custodial_eth_keys(){
	return await fetch_all({ path: DbPaths.custodial_keys });
}

exports.get_all_custodial_eth_keys = get_all_custodial_eth_keys;


/******************************************************
    @Stripe
******************************************************/

/** 
 * 
 * @Use: TEST stripe key
 * @Link; https://dashboard.stripe.com/test/apikeys
 * 
 **/
const STRIPE_TEST = {
    pub: "",
    sec: "",
    endpointSecret: '',
}

/**
 * 
 * @Use: LIVE api keys
 * @Url: https://dashboard.stripe.com/apikeys
 * 
**/
const STRIPE_LIVE = {
    pub: "",
    sec: "",
    endpointSecret: ","
}

// define stripe param
const STRIPE_PARAM =  GLOBAL_PRODUCTION ? STRIPE_LIVE : STRIPE_TEST

exports.STRIPE_PARAM      = STRIPE_PARAM;
exports.STRIPE_0XPARC_FEE = 0.0250
exports.STRIPE_vendor_payable_after_fee = 0.975;
exports.stripe = require('stripe')(STRIPE_PARAM.sec);


/**
 * 
 * @use: on staging server, map to pre-approved staging credit number
 * 
 **/ 
exports.maybe_production_credit_card_number = (num) => {
	if ( GLOBAL_PRODUCTION ){
		return num;
	} else {
		return '4242424242424242'
	}
}


/**
 * 
 * @use: vendor payment state
 *       when nft is minted or trade is requested,
 *       item is in DID_NOT_CHARGE state
 *       after stripe intent is built for the vendor
 *       every item is moved to `charged_await_confirmation`
 *       state.
 *       once the charge clears they are moved to
 *       `charrged_success` state
 *
*/
exports.PaymentState = {
	DID_NOT_CHARGE: 'did_not_charge',
	CHARGED_AWAIT_CONFIRMATION: 'charged_await_confirmation',
	CHARGED_SUCCESS: 'charged_success',
	CHARGED_FAILURE: 'charged_failure',
}

/******************************************************
	@twitter
******************************************************/


/**
 * 
 * @use: dev twitter permission for lumo.xyz account
 * 
 **/
const twitter_developer_account = () => {

	// dev
	let staging_blob = {
		api_key        :  "",
		api_key_secret : "",
		bearer_token   : ""

		oauth_client_id     : "",
		oauth_client_secret : ","

		call_back: "",
	}

	// lumoproductionclient
	let production_blob = {
		api_key       : "",
		api_key_secret: "",
		bearer_token  : "",
		oauth_client_id    : "",
		oauth_client_secret: "",
		call_back: "",

		access_token: "",
		access_token_secret: "",
	}

	return GLOBAL_PRODUCTION ? production_blob : staging_blob;
}

exports.twitter_developer_account = twitter_developer_account;

/**
 * 
 * @use: create twitter client instance
 * 
 **/
exports.twitter_client = () => {
	try {
		let twitter_auth = twitter_developer_account();
		let twitterClient = new TwitterApi(twitter_auth.bearer_token)
		return twitterClient;
	} catch (e) {
		return {};
	}
}


/******************************************************
	@database paths
******************************************************/

const DbPaths = {

	// --------------------------------------------------------------------------- //
	// external API

	lumo_keys_api_root :  "",
	_migration_endpoint : "",

	// --------------------------------------------------------------------------- //
	// web3 txs

	transactions_0x03: 'transactions_0x03',
	transactions_0x04: 'transactions_0x04',
	transactions_0x01: 'transactions_0x01',
	price_tokens     : 'price_tokens',

	// --------------------------------------------------------------------------- //
	// contracts

	contract_abi: 'contract_abi',
	custodial_keys: 'custodial_keys',

	// nfts
	token_endpoints : 'contract_token_endpoints',

	// --------------------------------------------------------------------------- //
	// vendors

	vendors             : 'vendors',
	vendor_permissions  : 'vendor_permissions',		

	// client side commands from `/dashboard` (use this instead of POST)
	log_new_vendor: 'log_new_vendor',
	vendor_charges: 'vendor_charges',

	// --------------------------------------------------------------------------- //
	// users

	users: 'users',
	users_flow_accounts: 'users_flow_accounts',	
	users_qr_seed: 'users_qr_seed',

	// --------------------------------------------------------------------------- //
	// stripe

	users_stripe           : "users_stripe",
	users_stripe_charges   : "users_stripe_charges",
	users_stripe_refunds   : 'users_stripe_refunds',

	// --------------------------------------------------------------------------- //
	// twitter

	twitter_accounts: 'twitter_accounts',
	twitter_edges   : 'twitter_edges',

	// --------------------------------------------------------------------------- //
	// social-chain

	social_chain_root : 'sc_root' ,
	social_chain_users: 'sc_users',
	social_chain_nominations: 'sc_nominations',

	// lumo token specific events
	social_chain_reward_lumo   : 'sc_reward_lumo'  ,
	social_chain_send_lumo     : 'sc_send_lumo'    ,
	social_chain_purchase_lumo : 'sc_lumo_purchase',

	// web3 drops
	social_chain_drop_root       : 'sc_eth_collection',
	social_chain_eth_metadata    : 'sc_eth_metadata'  ,
	// social_chain_drop_packet     : `sc_drop_packet`   ,

	// --------------------------------------------------------------------------- //
	// off chain

	offchain_users_lumo : 'oc_users_lumo',
	offchain_pools_lumo : 'oc_pools_lumo',
	offchain_staking_txs: 'oc_staking_txs',

	lumo_SLP             : "sc_lumo_SLPs",
	lumo_accounts_payable: 'sc_lumo_SLP_payable',

	// --------------------------------------------------------------------------- //
	// depricated

	// keys on flow
	key_pairs_testnet: 'key_pairs',
	key_pairs_mainnet: 'key_pairs_mainnet',	

};


exports.DbPaths = DbPaths;


/******************************************************
	@Enums for web3 params
******************************************************/

// networks vendors can deploy on.
const Networks = {	
	
	sandbox      : 'sandbox',
	ropsten      : '0x3',
	rinkeby      : '0x4',
	goerli       : '0x5',

	mainnet      : '0x1',

	mumbai       : 'mumbai',
	polygon      : "polygon",

	flow_local   : 'flow_local',
	flow_testnet : 'flow_testnet',
	flow_mainnet : 'flow_mainnet'
}

exports.Networks = Networks;

// when backing up account, this is used
exports.network_flow_to_eth = (name) => {
	let locals = [ 
		Networks.flow_local, 
		Networks.flow_testnet, 
		Networks.ropsten,
		Networks.rinkeby, 
		Networks.goerli,
		Networks.mumbai, 
	]
	let mains = [
		Networks.flow_mainnet, 
		Networks.mainnet, 
		Networks.polygon, 
	]
	if ( locals.includes(name) ){
		return Networks.goerli
	} else if ( mains.includes(name) ){
		return Networks.mainnet
	} else {
		return Networks.sandbox
	}
}

/**
 * 
 * @use: get current network 
 * 
 **/
exports.current_eth_network = () => {
	if ( GLOBAL_PRODUCTION ){
		return Networks.mainnet;
	} else {
		return Networks.goerli;
	}
}


// @use: contract names
const ContractKind = {

	// splits
	Splitter: 'Splitter',
	SplitFactory: 'SplitFactory',

	//erc1155
	ERC1155_0x01_v1    : 'ERC1155SupplySplitterAdjustable',
	ERC1155_0x04_v1    : 'ERC1155SupplySplitterAdjustable',
	ERC1155_0x05_v1    : 'ERC1155SupplySplitterAdjustable',
	ERC1155_v1_witness : '0xD5E0379964ec3ae2fd51F62D7B3F92d8Cc0F5300',

	// erc721/splitter logic layer, and the proxy storage layer
	ERC721LumoV2        : "ERC721LumoV2",
	PaymentSplitterV2   : 'PaymentSplitterV2',
	ERC721SplitterProxy : "ERC721SplitterProxy",

	// erc721 logic address
	ERC721LumoV2_address_mainnet : "",
	ERC721LumoV2_address_goerli  : "",

	// paymentSplitter logic address;
	paymentSplitterV2_address_mainnet: "",
	paymentSplitterV2_address_goerli:  "",

	abi_sourceName: `contracts/erc1155/ERC1155SupplySplitterAdjustable.sol` ,

}

exports.ContractKind = ContractKind;
exports.valid_contract_kind = (kind) => {
	let xs = Object.values(ContractKind);
	return xs.includes(kind);
}


/**
 * 
 * @use: social chain block state
 * 
 **/
exports.BlockState = {
	pending: 'pending',
	mining : 'mining',
	mined  : 'mined',
}

exports.winningInterestRate = {
	t1: 1000,
	t2: 800,
	t3: 400,
	t4: 200,
	denominator: 10000
}

/**
 * 
 * @Use: any item underoing minting
 *       will transition to this states
 * 
 **/ 
exports.ItemMintState = {
	not_minted : 'not_minted',
	pre_flight : 'pre_flight',
	in_flight  : 'in_flight',
	minted     : 'minted',
	mint_failed: 'mint_failed',

	// item has been purchased by fiat, and is 
	// awaiting minting
	fiat_purchased_await_mint: 'fiat_purchased_await_mint',
	selected_for_mint_await_contract_deployment: 'selected_for_mint_await_contract_deployment'
}


/**
 * 
 * @use: kinde of collection
 * 
 **/
exports.CollectionKind = {
    rare   : 'rare_1_of_1',
    simple : 'standard_collection',
    tickets: 'tickets',
    license: 'license',
    membership: 'membership',
}

exports.GnosisTxType = {
	sendETH: 'sendETH',
	addSigner: 'addSigner',
}


/******************************************************
	@Enums for lumo web3 params
******************************************************/


const LumoDispenseEvent = {
	write_manifesto  : 'write_manifesto',
	sign_manifesto   : 'sign_manifesto',		
	accept_nomination: 'accept_nomination',		
	basic_gift       : 'basic_gift',
	return_unclaimed : 'return_unclaimed',
}

exports.LumoDispenseEvent = LumoDispenseEvent;

/**
 * 
 * @use: lumo contract address
 * 
**/
exports.LumoContractAddress = () => {

	let polygon = "";
	let mainnet = "";
	let mumbai  = "";

	let blob = {
		polygon : GLOBAL_PRODUCTION ? polygon : mumbai,
		ethereum: mainnet,
		abi_sourceName: "contracts/project/LumoToken.sol"
	}

	return blob;
}


/**
 * 
 * @use: lumo staking contract address
 * 
 **/
exports.LumoStakingPoolContractAddress = () => {

	let polygon = "";
	let mainnet = "";
	let mumbai  = "";
	
	let blob = {
		polygon : GLOBAL_PRODUCTION ? polygon : mumbai,
		ethereum: mainnet,
		abi_sourceName: "contracts/project/LumoStakingPool.sol"
	}

	return blob;
}


// @use: number of decimals lumo token
//       has, same as eth.
exports.lumo_decimals = () => {
	return 10 ** 18;
}

// @use: lumo token price
exports.lumo_price_in_cents = (num) => {
	if ( num > 100 ){
		return 500;
	} else {
		return 500;
	}
}

/**
 * @Use: mining rate in production vs staging
 *
*/
exports.lumo_social_chain_mining_rate = () => {
	return GLOBAL_PRODUCTION 
		? 60*60*24*7 
		: 60*60*24*1;
}

/**
 *
 * @use: therate at which mining rate refresh 
 * 
 **/
exports.lumo_social_chain_refresh_rate = (evt) => {
	if ( evt === LumoDispenseEvent.write_manifesto ){
		return 0.0
	} else if ( evt === LumoDispenseEvent.sign_manifesto ){
		return 15.0 * 60
	} else if ( evt === LumoDispenseEvent.accept_nomination ){
		return 30.0 * 60
	} else if  (evt === LumoDispenseEvent.basic_gift){
		return 3.0 * 60
	} else {
		return 0.0
	}
}
//@Use: refresh rate for purchasing lumo
exports.lumo_social_chain_refresh_rate_for_purchase = (num) => {
	if (trivialNum(num)){
		return 0;
	} else {
		return Number(num)*30.0*60
	}

}


// @use: events and how lumo is dispensed
exports.lumo_dispensary = () => {

	function reward(evt){
		if ( evt === LumoDispenseEvent.write_manifesto ){
			return 5.0
		} else if ( evt === LumoDispenseEvent.sign_manifesto ){
			return 1.0
		} else if ( evt === LumoDispenseEvent.accept_nomination ){
			return 1.0
		} else if  (evt === LumoDispenseEvent.basic_gift){
			return 0.1
		} else {
			return 0.0
		}
	}
	return { LumoDispenseEvent, reward }
}	


/**
 * @use: pricing tiers and how much it cost/recive 
 * 
 **/
exports.lumo_price_tiers = () => {
	return {
		tier1: { price: 5   , amt_in_lumo: 1   },
		tier2: { price: 50  , amt_in_lumo: 10  },
		tier3: { price: 500 , amt_in_lumo: 100 },
		tier4: { price: 1000, amt_in_lumo: 200 },
	}
}


/******************************************************
	@other enums
******************************************************/

exports.NotificationType = {
	in_staked     : 'in_staked',
	out_staked    : 'out_staked',
	in_submitted  : 'in_submitted',
	out_submitted : 'out_submitted',
	reward_staking: 'reward_staking',
	reward_nft    : 'reward_nft'
}

/**
 * 
 * @Use: collab type
 * 
 **/
exports.CollaborationType = {
	spec  : 'spec',
	text  : 'text',
	visual: 'visual',
	sound : 'sound',
}

/**
 * 
 *  paymenttype
 * 
 **/
exports.PaymentType = {
	donation: 'donation',
	pay_nft : 'pay_nft',
}


/**
 * 
 * @Use: storyboard member permissio 
 * 
 **/
exports.MemberPermission = {
	admin : 'admin',
	t1    : 't1',
	t2    : 't2',
	t3    : 't3',
}


/**
 *
 * token parsing scheme
 *
*/
exports.TokenParsingScheme = {
	FULL   : 'full',
	PARTIAL: 'partial',
	FAST   : 'fast'
}


const TokenContentKind = {
	PNG  : 'png',
	GIF  : 'gif',
	VIDEO: 'video',
	MP3  : 'mp3',
	URL  : 'url',
	OTHER: 'other'
}

exports.TokenContentKind = TokenContentKind;

/**
 * 
 * @Use: pare starndard client side js 
 *       representation to recongizable
 *       token cont kind
 * 
 **/ 
exports.toTokenContentKind = (xs) => {

	switch (xs){
		case "audio/mpeg":
			return TokenContentKind.MP3
		case "image/gif":
			return TokenContentKind.GIF
		case 'image/webp':
			return TokenContentKind.GIF			
		default:
			return TokenContentKind.OTHER
	}

}


/**
 * 
 * @Use: home page url for lumo.com
 * 
 **/ 
exports.home_page_url = () => {
	if ( GLOBAL_PRODUCTION ){
		return 'https://www.lumoburn.xyz'		
	} else {
		return 'https://testnet.studio'
	}
}



/******************************************************
    @utility fn
******************************************************/

/**
 * 
 * @use: default fn response
 * 
 **/ 
exports.default_fn_response = (blob) => {
    let base = {
        success: false,
        message: 'invalid inputs',
        data   : {},
    }
    if ( typeof blob === 'object' ){
    	let out = { ...base, ...blob };
    	return out;
    } else {
    	return base
    }
}


// @use: output default fn blob
exports.default_db_blob = (blob) => {
	let raw = blob ?? {};
	let id  = trivialProps(blob,'ID') || trivialString(blob.ID) ? uuid.v4() : blob.ID;
    let _tm = swiftNow();
    let _ppt = ppSwiftTime(_tm);
	let out = {
		...blob,
		ID: id,
        timeStampLatest: _tm,
        timeStampLatestPP: _ppt,
        timeStampCreated: _tm,
        timeStampCreatedPP: _ppt,		
	}
	return out;
}


exports.mk_expire_timestamp = (dt) => {
	if (trivialNum(dt)){
		return {}
	} else {
	    let _tm = swiftNow() + dt;
	    let _ppt = ppSwiftTime(_tm);
		let out = {
	        timeStampExpire: _tm,
	        timeStampExpirePP: _ppt,		
		}
		return out;
	}
}

/**
 * 
 * @use: go post axios with `post_params` made by 
 *       `make_post_params`
 * 
 **/ 
async function go_axios_post({ endpoint, post_params, then }){

	var response = {  success: false, message: '', data: {} }

	axios.post(endpoint, post_params).then(async res => {
		if ( res.data ){
			then(res.data)
		} else {
			response['message'] = 'failed to post'
			then(response);
		}
	})
	.catch(e => {
		response['message'] = `failed to post: ${e}`
		then(response)
	})	
}

exports.go_axios_post = go_axios_post;


/**
 * 
 * @Use: post lumo core api to store keys
 * 
 **/ 
exports.store_keys_in_lumo_core = async ({ post_params, then }) => {

    var params = post_params;
    params['vendorID'] = KEYS_API_VENDOR_ID
    params['vendorSecret'] = KEYS_API_VENDOR_SECRET

    // change this to be backward compatible w/
    // server permission
    if ( params['network'] !== Networks.mainnet ){
    	params['network'] = '0x3';
    }

    let url = `${DbPaths.lumo_keys_api_root}make_keys`

    return await go_axios_post({
    	endpoint: url,
    	post_params: params,
    	then: then
    })
}

/**
 * 
 * @Use: post lumo core api to store keys
 * 
 **/ 
async function get_keys_from_lumo_core({ post_params, then }){

    var params = post_params;
    params['vendorID'] = KEYS_API_VENDOR_ID
    params['vendorSecret'] = KEYS_API_VENDOR_SECRET

    // make network backward compatible
    if ( params['network'] !== Networks.mainnet ){
    	params['network'] = '0x3';
    }    

    let url = `${DbPaths.lumo_keys_api_root}get_keys`

    return await go_axios_post({
    	endpoint: url,
    	post_params: params,
    	then: then
    })
}

exports.get_keys_from_lumo_core = get_keys_from_lumo_core;

exports.password_from_metamask_pk = (pk) => {
	if ( pk === null || pk === undefined || pk === '' || pk.split === undefined ){
		return ''
	} else {
		let kp = pk.split('').reverse().join('');
		return `${pk}${kp}`
	}
}

/**
 * 
 * @Use: post lumo core api to store keys
 * 
 **/ 
exports.migrate_data_to = async ({ post_params, then }) => {
    var params = post_params;
    params['vendorID']     = "";
    params['vendorSecret'] = "";
    return await go_axios_post({
    	endpoint: DbPaths._migration_endpoint,
    	post_params: params,
    	then: then
    })
}


/**
* @use: generate nft token
*/
exports.gen_nft_id = (suffix) => {
	var prefix = Date.now() + parseInt(Math.random(10,1000)*1000);
	let middle = parseInt(parseInt(Math.random(100,10000)*10000));
	let suff   = parseInt(suffix) || parseInt(Math.random(100,10000)*10000)
	return `${prefix}${middle}${suff}`;
}


// @use: alt gen tok-id 
exports.generate_tok_id = () => {
	let prefix = swiftNow();
	let num = Math.floor(Math.random()*100000);
	let mum = Math.floor(Math.random()*10000);
	let oum = Math.floor(Math.random()*100);
	return prefix + num + mum + oum;
}





