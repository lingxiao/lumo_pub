
/**
 * 
 * @Module: core react
 * @Author: Xiao Ling
 * @Date  : 12/16/2021
 *
 * 
*/


const axios = require("axios");
const FIRE_ROOT = require("firebase/app");
const { initializeApp } = require("firebase/app");
const { getFirestore }  = require("firebase/firestore");
const { getStorage, ref, uploadBytesResumable, getDownloadURL } = require("firebase/storage");

const uuid  = require('uuid');
const { illValued, trivialString, trivialProps, swiftNow  } = require('./utils')


/**
 * 
 * @Use: load keys from .env variable
 * @Doc: https://stackoverflow.com/questions/48699820/how-do-i-hide-api-key-in-create-react-app
 * 
**/ 
const REACT_APP_SECRET_STAGING    = process.env.REACT_APP_SECRET_STAGING;
const REACT_APP_SECRET_PRODUCTION = process.env.REACT_APP_SECRET_PRODUCTION;
const REACT_APP_KEY_STAGING       = process.env.REACT_APP_KEY_STAGING;
const REACT_APP_KEY_PRODUCTION    = process.env.REACT_APP_KEY_PRODUCTION;

/******************************************************
    @IMPORTANT: set which project
******************************************************/

/**
 * 
 * @Use: define which config to use in ./fire.js
 * @Note:
 *  
 *  - staging url:  https://staging-lumo-web.firebaseapp.com/
 *  - production url: https://lumo-land.firebaseapp.com/
 *  - dns: https://firebase.google.com/docs/hosting/custom-domain
 *  - config headers: https://stackoverflow.com/questions/48589821/firebase-hosting-how-to-prevent-caching-for-the-index-html-of-an-spa
 * 
 * 
**/ 
const GLOBAL_STAGING = true;

// staging vendorID
const vendorID_staging     = REACT_APP_KEY_STAGING;
const vendorSecret_staging = REACT_APP_SECRET_STAGING;

// production vendorID
const vendorID_production     = REACT_APP_KEY_PRODUCTION;
const vendorSecret_production = REACT_APP_SECRET_PRODUCTION;


/**
 * 
 * @use: pick the correct vendor ID based on which project
 * 
 **/ 
const vendorID = () => {
	if (GLOBAL_STAGING){
		return vendorID_staging
	} else {
		if (trivialString(vendorID_production)){
			const e = new Error(`production vendor id is not specified`)
			throw e;
		} else {
			return vendorID_production
		}
	}
}
const vendorSecret = GLOBAL_STAGING ? vendorSecret_staging : vendorSecret_production;


/******************************************************
	@Initalize firebase
******************************************************/

// STAGING
const STAGING_CONFIG = {
	apiKey            : "",
	authDomain        : "",
	projectId         : "",
	storageBucket     : "",
	messagingSenderId : "",
	appId             : "",
	measurementId     : "",
}

// Production config at mainnet-client
const PRODUCTION_CONFIG = {
  apiKey       : "",
  authDomain   : "",
  projectId    : "",
  storageBucket: "",
  messagingSenderId: "",
  appId        : "",
  measurementId: ""
};


/**
 * 
 * @Use: initalize firebase
 * @Doc: https://firebase.google.com/docs/firestore/manage-data/add-data
 * @Note: see how version 9 changes
 * 
 */
function go_init_firebase(){
	if (GLOBAL_STAGING === false && PRODUCTION_CONFIG['apiKey'] === ""){
		const e = new Error(`@ERROR: PRODUCTION_CONFIG not specified`)
		throw e;
	} else {
		initializeApp( GLOBAL_STAGING ? STAGING_CONFIG : PRODUCTION_CONFIG );
	}
}

// initialize global firebase app instance
go_init_firebase();
const fire_db = getFirestore();
const storage = getStorage();


/******************************************************
	@web3 params
******************************************************/


const Networks = {	
	mainnet       : '0x1',
	ropsten       : '0x3', 
	rinkeby       : '0x4',
	goerli        : '0x5',
	sandbox       : 'sandbox',
	flow_local    : 'flow_local',
	flow_testnet  : 'flow_testnet',
	flow_mainnet  : 'flow_mainnet'
}

// @use: output the correct network or throw;
const FLOW_NETWORK = () => {
	if (GLOBAL_STAGING){
		return Networks.flow_testnet;
	} else {
		if (vendorID_production !== "" ){
			return Networks.flow_mainnet
		} else {
			const e = new Error(`production id is not defined`)
			throw e;
		}
	}
}

const ETH_NETWORK = () => {
	if (GLOBAL_STAGING){
		return Networks.goerli
	} else {
		if (vendorID_production !== "" ){
			return Networks.mainnet
		} else {
			const e = new Error(`production id is not defined`)
			throw e;
		}
	}
}

const ETHERSCAN_TX_LINK = () => {
	if (GLOBAL_STAGING){
		return `https://goerli.etherscan.io/tx/`
	} else {
		return `https://etherscan.io/tx/`
	}
}

const ETHERSCAN_ADDRESS_LINK = () => {
	if (GLOBAL_STAGING){
		return `https://goerli.etherscan.io/address/`
	} else {
		return `https://etherscan.io/address/`
	}
}


/**
 * 
 * @use: address to receive token is @metamask adminSink
 *  
 **/
const ETH_ADMIN_ADDRESS = () => {
	if ( GLOBAL_STAGING ){
		return ""
	} else {
		return ""
	}
}

/**
 * 
 * @use: get all other admin addresses associatd with me
 * 
 **/
const Eth_admin_addresses = () => {
	let xs = [ "",];
	return xs;
}


/**
 * 
 * @use: whole item price
 * 
 **/ 
const Item_wholesale_price = () => {
	return 0.005;
}


/**
 * 
 * @Use: home page url for lumo.com
 * 
 **/ 
const home_page_url = () => {
	let local_root = 'localhost:3000';
    let raw_url    = window.location.href;
    let raw_splits = raw_url.split("/");
    let is_local   = raw_splits.includes(local_root);
	if ( is_local ){
	  	return `http://${local_root}`
	} else if ( GLOBAL_STAGING ){
		return 'https://testnet.studio'
	} else {
		return 'https://www.lumoapp.xyz'
	}
}


/**
 * 
 * @use: create home page urls
 * 
 **/
const app_page_urls = ({ chain_id }) => {
	let home = home_page_url();
	return {
		acid  : `${home}/firehose`,
		mobile: `${home}/thelittleredapp`,
		wallet: `${home}/wallet`,
		chain : `${home}/burn/${chain_id ?? ""}`,
		download: `https://apps.apple.com/us/app/theredapp/id6444138385`
	}
}


/**
 * 
 * @use: generate unique token-id
 * 
 **/
const generate_tok_id = () => {
	let prefix = swiftNow();
	let num = Math.floor(Math.random()*100000);
	let mum = Math.floor(Math.random()*10000);
	let oum = Math.floor(Math.random()*1000);
	let pum = Math.floor(Math.random()*500);
	return prefix + num + mum + oum + pum;
}


/******************************************************
	@API POST endpoints
******************************************************/


/**
 * 
 * @Use: set staging and production endpoints
 * 
 **/ 
const API_root_production = "";
const API_root_staging    = "";


/**
 * 
 * @use: Get correct API end point per 
 *       depending on which env. you are in
 * 
 **/ 
const API_root =  () => {
	if ( GLOBAL_STAGING ){
		return API_root_staging
	} else {
		if (!trivialString(API_root_production)){
			return API_root_production
		} else {
			const e = new Error(`production API root is not specified`)
			throw e;
		}
	}
}

/**
 * 
 * @Use: endpoints for posting to Lumo core server
 * 
 * 
 **/ 
const POST_ENDPOINTS = {


	// --------------------------------------------------------------------------- //
	//@user account ops

	// user account basic
	createUserAccount           : `${API_root()}/account/createUserAccount`        ,
	saveUserMetamaskPublicKey   : `${API_root()}/account/saveUserMetamaskPublicKey`,
	get_user                    : `${API_root()}/account/get_user`,
	edit_user                   : `${API_root()}/account/edit_user`,
	before_auth_on_mobile       : `${API_root()}/account/before_auth_on_mobile`,

	// stripe account for user
	create_user_stripe_account        : `${API_root()}/stripe/create_user_stripe_account`,
	does_user_have_stripe_customer_id : `${API_root()}/stripe/does_user_have_stripe_customer_id`,
	charge_customer                   : `${API_root()}/stripe/charge_customer`,

	// --------------------------------------------------------------------------- //
	// @opensea nft uri gateway

	contract_uri: (sym) => `${API_root()}/burn/token/${sym ?? ""}/`,

	// --------------------------------------------------------------------------- //
	// social chain ops 

	create_chain    : `${API_root()}/burn/create_chain`    ,		
	fetch_chain     : `${API_root()}/burn/fetch_chain`     ,	
	fetch_all_chains: `${API_root()}/burn/fetch_all_chains`,	
	fetch_chain_id_by_subdomain: `${API_root()}/burn/fetch_chain_id_by_subdomain`,
	get_all_contracts_for_burn: `${API_root()}/burn/get_all_contracts_for_burn`,

	sign_manifesto : `${API_root()}/burn/sign_manifesto`,	
	buy_lumo_token_on_polygon: `${API_root()}/burn/buy_lumo_token_on_polygon`,

	fech_nomination  : `${API_root()}/burn/fech_nomination`,	
	accept_nomination: `${API_root()}/burn/accept_nomination`,	
	nominate_leader  : `${API_root()}/burn/nominate_leader`,	
	update_chain_root: `${API_root()}/burn/update_chain_root`,

	get_twitter_account:  `${API_root()}/burn/get_twitter_account`,

	// --------------------------------------------------------------------------- //
	// social chain ops - web3

	get_collection_for_burn           : `${API_root()}/burn/get_contract_for_burn`,
	write_social_chain_drop_root      : `${API_root()}/burn/write_social_chain_drop_root`,
	edit_social_chain_drop_root       : `${API_root()}/burn/edit_social_chain_drop_root`,
	before_deploy_contract_to_burn    : `${API_root()}/burn/before_deploy_contract_to_project`,
	did_deploy_contract_to_burn       : `${API_root()}/burn/did_deploy_contract_to_project`,
	did_finish_deploy_contract_to_burn: `${API_root()}/burn/did_finish_deploy_contract_to_project`,

	can_connect_to_deployed_contract  : `${API_root()}/burn/can_connect_to_deployed_contract`,
	connect_collection_with_contract  : `${API_root()}/burn/connect_collection_with_contract`,

	//mint
	can_mint_nft: `${API_root()}/burn/can_mint_nft`,
	did_mint_nft: `${API_root()}/burn/did_minted_nft`,
	fetch_all_tokens:`${API_root()}/burn/fetch_all_tokens`,	
	fetch_all_tokens_by:`${API_root()}/burn/fetch_all_tokens_by`,	

	buy_nft_offchain: `${API_root()}/burn/buy_nft_offchain`,

	// admin contract logic layer deployement
	get_erc721LumoV2: `${API_root()}/burn/get_erc721LumoV2`,
	get_PaymetSplitterV2: `${API_root()}/burn/get_PaymetSplitterV2`,
	get_ERC721SplitterProxy: `${API_root()}/burn/get_ERC721SplitterProxy`,

}


/******************************************************
	@AXIOS post utils
******************************************************/

/**
 * 
 * @use: make api post params
 * 
 **/ 
function make_post_params(props){
	var base = {
		vendorID    : vendorID()    ,
		vendorSecret: vendorSecret  ,
		network     : FLOW_NETWORK(),
	}
	let blob = { ...props, ...base };
	var res = {};
	Object.keys(blob).map(key => {
		let val = blob[key];
		if ( !illValued(val) ){
			res[key] = val;
		}
	});
	return res;
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
		response['message'] = `Server error: ${e}`
		then(response)
	})	
}


/**
 * 
 * @use: preset of the above two fns.
 * 
 **/
async function go_axios_post_preset({ fn_name, params, then }){
	let post_params = make_post_params(params);
	return await go_axios_post({
		endpoint: POST_ENDPOINTS[fn_name],
		post_params: post_params,
		then: then
	})	
}

/******************************************************
	@Client side Enums
******************************************************/

const ItemMintState = {
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



const MemberPermission = {
	admin : 'admin',
	t1    : 't1',
	t2    : 't2',
}


const CollectionKind = {
    rare   : 'rare_1_of_1',
    simple : 'standard_collection',
    tickets: 'tickets',
    license: 'license', 
    membership: 'membership',       
}

/**
 * 
 * @use: appblogger-item
 * 
 **/ 
const AppBloggerItem = {
	text_h1: 'text_h1',
	text_h2: 'text_h2',
	text_h3: 'text_h3',
	text_h4: 'text_h4',
	quote  : 'quote'  ,
	progress: 'text_progress',
	crew    : 'crew',
	youtube: 'youtube',
	space   : 'space'  ,
	imageLeft: 'imageLeft',
	social  : 'social',
	user_row: 'user_row',

	mint_block_a: 'mint_block_a',
	mint_block_b: 'mint_block_b',
	mint_block_c: 'mint_block_c',
	mint_block_d: 'mint_block_d',
}


/**
 * 
 * @Use: project state
 * 
 **/ 
const ProjectState = {
	preproduction: 'preproduction',
	production   : 'production',
	postproducton: 'postproducton',
	premier      : 'premier',
	replay       : 'replay',
	done         : 'done',
}
const ProjectStates = [
	ProjectState.preproduction,
	ProjectState.production,
	ProjectState.postproducton,
	ProjectState.premier,
	ProjectState.replay,
	ProjectState.done,
]

const GnosisTxType = {
	sendETH: 'sendETH',
	addSigner: 'addSigner',
}


/**
 *
 *  @Use: links names 
 * 
 **/
const dname      = 'name'
const dabout     = 'about this person'
const dwebsite   = 'website'
const dopensea   = 'opensea'
const dinstagram = 'instagram'
const dtwitter   = 'twitter'
const dimdb      = 'imdb'
const ddiscord   = 'discord'
const dmetamask  = 'metamask address'
const ddonation  = 'tell us how you will spend the funds'
const daboutItem = 'tell us about this item'
const daboutProject = 'tell us about your project';

function well_formed_social_links(str, _default){
	return typeof str === 'string' 
		&& str !== "" 
		&& str !== _default
		&& str !== `${_default} link`
}

/***
 * 
 * @use: build social links 
 * 
 **/
function to_social_links({ instagram, website, imdb, twitter, opensea, discord }){

	var social_icons = {};
	if ( well_formed_social_links(discord, ddiscord)   ){
		social_icons[ddiscord] =  { kind: ddiscord,link: discord, key: ddiscord, value: discord };
	} 
	if ( well_formed_social_links(instagram, dinstagram)   ){
		social_icons[dinstagram] =  { kind: dinstagram, link: instagram, key: dinstagram, value: instagram };
	} 
	if ( well_formed_social_links(website, dwebsite)   ){
		social_icons[dwebsite] =  { kind: dwebsite, link: website, key: dwebsite, value: website }
	} 
	if ( well_formed_social_links(twitter, dtwitter)   ){
		social_icons[dtwitter] =  { kind: dtwitter, link: twitter, key: dtwitter, value: twitter }
	}
	if ( well_formed_social_links(imdb, dimdb)   ){
		social_icons[dimdb] =  { kind: dimdb, link: imdb, key: dimdb, value: imdb }	;
	}

	return Object.values(social_icons);
}


/******************************************************
	@File  extension enums
******************************************************/

const TokenContentKind = {
	PNG  : 'png',
	GIF  : 'gif',
	MP4  : 'mp4',
	MP3  : 'mp3',
	URL  : 'url',
	SVG  : 'svg',
	OTHER: 'other'	
}


/**
 * 
 * @Use: pare starndard client side js 
 *       representation to recongizable
 *       token cont kind
 * 
**/ 
const toTokenContentKind = (xs) => {

	switch (xs){
		case "audio/mpeg":
			return TokenContentKind.MP3
		case "image/gif":
			return TokenContentKind.GIF
		case 'image/webp':
			return TokenContentKind.GIF
		case 'image/png':
			return TokenContentKind.PNG
		case 'images/*':
			return TokenContentKind.PNG		
		case 'image/vnd.microsoft.icon':
			return TokenContentKind.PNG		
		case "image/jpeg":
			return TokenContentKind.PNG		
		case "video/*":
			return TokenContentKind.MP4
		case "video/mp4":
			return TokenContentKind.MP4
		case "svg":
			return TokenContentKind.SVG;
		default:
			return TokenContentKind.OTHER;
	}

}



/**
 * 
 * @use: to file extension
 * 
 **/ 
function toFileExtension(xs){

	switch (xs){
		case "audio/mpeg":
			return "mp3"
		case "image/gif":
			return "gif"
		case 'image/webp':
			return "webp"
		case 'image/png':
			return "png"
		case 'image/vnd.microsoft.icon':
			return "png"
		case "image/jpeg":
			return "jpg"
		case "video/*":
			return "mp4"
		case "video/mp4":
			return "mp4"
		case "svg":
			return "svg";
		case "mp4":
			return "mp4";
		default:
			return "png"
	}
}

/**
 * 
 * @use: dtermine if url is mp4
 * 
 **/ 
function urlToFileExtension(_url){

	if ( trivialString(_url) || trivialProps(_url,'toLowerCase') ){

		return TokenContentKind.OTHER;

	} else {

		let url = _url.toLowerCase();

		let ismp4  = url.match('.mp4');
		let ismp3  = url.match('.mp3');
		let ispng  = url.match('.png') 
			|| url.match('.jpg')
			|| url.match('.jpeg')

		let issvg = url.match('.svg');
		let isgif = url.match('.gif') || url.match('.webp')

		if ( ismp4 ){
			return TokenContentKind.MP4
		} else if ( ismp3 ){
			return TokenContentKind.MP3
		} else if ( ispng ){
			return TokenContentKind.PNG
		} else if ( isgif ){
			return TokenContentKind.GIF
		} else if ( issvg ){
			return TokenContentKind.SVG;
		} else {
			return TokenContentKind.PNG; //OTHER
		}

	}
}

/******************************************************
	@File download/upload
******************************************************/

/**
 * 
 * @Use: download mp3 or mp4 file and create video player instance
 * @Doc: https://firebase.google.com/docs/storage/web/download-files
 *       https://www.codegrepper.com/code-examples/javascript/react+play+audio+from+url
 * 
 **/ 
async function download_mp3_from_storage({ url, then }){

	var res = { success: false, message: "trivial url", downloadURL: "", player: null }

	if ( trivialString(url) ){
		return then(res)
	}

	const media_ref = ref(storage, url)

	// Get the download URL
	getDownloadURL(media_ref)
		.then((downloadURL) => {

			res['player'] = new Audio(downloadURL);
			res['downloadURL'] = downloadURL
			res['success'] = true;
			return then(res);

		})
		.catch((error) => {
		// A full list of error codes is available at
		// https://firebase.google.com/docs/storage/web/handle-errors
		switch (error.code) {
			case 'storage/object-not-found':
				res['message'] = 'object-not-found'
				return then(res);

			case 'storage/unauthorized':
				res['message'] = 'unauthorized'
				return then(res);

			case 'storage/canceled':
				res['message'] = 'canceled'
				return then(res);

			case 'storage/unknown':
				res['message'] = 'unknown'
				return then(res);

			default:
				res['message'] = 'unknown'
				return then(res);
		}
	});

}

/**
 * 
 * @Use: givern downloadURL:
 * 			1. fetch blob 
 * 			2. upload to firebase
 * 			3. get downloadURL 
 * @Doc: 
 * 	- https://firebase.google.com/docs/storage/web/upload-files
 *  - https://stackoverflow.com/questions/54987876/getting-a-js-file-through-axios-and-firebase
 * 
 **/ 
function uploadPhotoFromURL({ url, type, then_loading, then }){

	if (illValued(then)){
		return;
	}

	if (trivialString(url)){
		return then({  success: false, message: "illValued url", downloadURL: "" })
	}

	// @note: make sure file extension is set correctly
	// or you will not be able to download the file
	// with the correct extension
	let suffix   = !trivialString(type) ? `.${toFileExtension(type)}` : ''
	let filename = `${uuid.v4()}${suffix}`;

	const config = {
		responseType: 'blob',
	    headers: {'Access-Control-Allow-Origin': '*'}
	};

	axios.get(url, config)
		.then((response) => {

			const file = new File([response.data], filename);

			const storageRef = ref(storage, filename);
			const uploadTask = uploadBytesResumable(storageRef, file);

			// Register three observers:
			// 1. 'state_changed' observer, called any time the state changes
			// 2. Error observer, called on failure
			// 3. Completion observer, called on successful completion
			uploadTask.on('state_changed', 
			  (snapshot) => {
			    // Observe state change events such as progress, pause, and resume
			    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
			    const progress = trivialProps(snapshot,'bytesTransferred') || trivialProps(snapshot,'totalBytes')
			    	? 0
			    	: (snapshot.bytesTransferred / Math.max(1,snapshot.totalBytes)) * 100;
			    // console.log('Upload is ' + progress + '% done');
			    switch (snapshot.state) {
			      case 'paused':
			        then({ success: false, message: 'upload paused', downloadURL: "" })
			        break;
			      case 'running':
			      	if ( typeof then_loading == 'function' ){
			      		let percent = Math.round(progress*10,1)/10
			      		then_loading(percent)
			      	}
			        break;
			    default:
			        break;
			    }
			  }, 
			  (error) => {
					return then({ success: false, downloadURL: "", message: 'unable to upload file to db' })
			  }, 
			  () => {
			    // Handle successful uploads on complete
			    // For instance, get the download downloadURL: https://firebasestorage.googleapis.com/...
			    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
					return then({ success: true, downloadURL: downloadURL, message: "fetched data and uploaded!" });
			    });
			  }
			);	

		})
		.catch(e => {
			return then({  success: false, message: `unable to fetch data from url ${e}`, downloadURL: "" });
		})


}



/**
 * 
 * @use: default fn response
 * 
 **/ 
const default_fn_response = (blob) => {
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



/******************************************************
	@contract and url addresses
******************************************************/

/**
 * 
 * @Use: get url to minted lumo token
 *
 * 
 **/ 
const erc_721_tok_opensea_url = (contract_address, tok_id) => {
	let url = GLOBAL_STAGING
		? `https://testnets.opensea.io/assets/${contract_address ?? ""}/${tok_id}/?force_update=true`
		: `https://opensea.io/assets/${contract_address ?? ""}/${tok_id}/?force_update=true`;
	let url_api = GLOBAL_STAGING
		? `https://testnets-api.opensea.io/api/v1/asset/${contract_address ?? ""}/${tok_id}/?force_update=true`
		: `https://api.opensea.io/api/v1/asset/${contract_address ?? ""}/${tok_id}/?force_update=true`;
	return { url, url_api };	
}



/******************************************************
	Export
******************************************************/


export { 

	// deployment constants
	  GLOBAL_STAGING
	, vendorID
	, vendorSecret
	, POST_ENDPOINTS

	// web 3 constants
	, FLOW_NETWORK
	, ETH_NETWORK
	, ETHERSCAN_TX_LINK
	, ETHERSCAN_ADDRESS_LINK
	, ETH_ADMIN_ADDRESS
	, Eth_admin_addresses
	, generate_tok_id
	, MemberPermission

	// @urls
	, home_page_url
	, app_page_urls
	, erc_721_tok_opensea_url
	

	, Item_wholesale_price

	// firebase
	, fire_db
	// , DbPaths
	, uploadPhotoFromURL
	, download_mp3_from_storage
	, go_axios_post
	, make_post_params
	, go_axios_post_preset
	, API_root

	// enums
	, Networks
	, AppBloggerItem
	, ProjectState
	, ProjectStates
	, CollectionKind
	, GnosisTxType
	, ItemMintState

	// form defaults
	, dname
	, dabout
	, dwebsite
	, dopensea
	, dinstagram
	, dtwitter
	, dimdb
	, ddiscord
	, dmetamask
	, ddonation
	, daboutItem
	, well_formed_social_links
	, to_social_links
	, daboutProject

	, default_fn_response

	// content ext
	, TokenContentKind
	, toTokenContentKind
	, toFileExtension
	, urlToFileExtension

}


























