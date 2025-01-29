
/**
 * 
 * @Module: User model
 * @Author: Xiao Ling
 * @Date  : 12/16/2021
 * @TODO  : see escrow contract: https://docs.replit.com/tutorials/33-escrow-contract-with-solidity
 * 
*/

const { 
	illValued,
	trivialProps,
	trivialString, 	
	swiftNow,
	cap,
} = require('./utils')



const { 
	  POST_ENDPOINTS
	, go_axios_post
	, go_axios_post_preset
	, make_post_params
} = require('./core');

 

/**
 * 
 * @Use: sync user data on web2 and web3
 * 
**/ 
export default class UserModel {

	constructor(userID){

		if ( illValued(userID) || trivialString(userID) ){
			return;
		}

		this.userID   = userID;
		this.delegate = null;

		this.twitterUserID = ""
		this.twitterUserName = ""

		this.view     = {};
		this.twitter  = {};


		// lumo condition
		this.did_sync_lumo   = false;
		this.lumo_balance    = 0.0;
		this.numMints        = 0;

		// metamask + view
		this.name = "";
		this.bio  = "";
		this.profile_image_preview_url = "";

		// addresses
		this.metamask_pk = "";
		this.custodial_ethereum_address = ""
		this.flow_address   = "";
		this.valid_flow_account = false;

		// stripe;
		this.stripe_customerId = "";
		this.did_load_stripe = false;

		// legacy auth regime
		this.uid = ''
		this.timeStampCreatedPP = ""

	}


	// check if a user at `uid` is me
	isMe( uid ){
		if ( trivialString(uid) ){
			return false;
		} else {
			return uid === this.userID || uid === this.metamask_pk || uid === this.uid;
		}
	}

	/**
	 * 
	 * @use: check if i have this address 
	 * 
	 **/
	haveAddress(address){
		let str = address.toLowerCase();
		return this.userID === address
			|| this.metamask_pk.toLowerCase() === str
			|| this.custodial_ethereum_address.toLowerCase() === str
	}

	/**
	 * @use: output seed str for sprite generation
	 **/
	sprite_str(str){
        let base = this.metamask_pk ?? 
            (this.custodial_ethereum_address ?? "");
        return `${base}${str}`;
	}

	sprite_str_default(){
        let base = this.metamask_pk ?? 
            (this.custodial_ethereum_address ?? "");		
        return `${base}${this.name ?? ""}`;
	}

	get_name(){
		if ( !trivialString(this.twitter.name) ){
			return this.twitter.name;
		} else {
			return this.name
		}
	}

	get_twitterUserName(){
		if ( !trivialString(this.twitterUserName) ){
			return this.twitterUserName
		} else {
			return this.twitter.twitterUserName ?? ""
		}
	}

	// @use: fetch twitter name and return
	fetch_twitter_name = async ({ then }) => {
		if ( trivialProps(this.twitter, 'name') ){
			await go_axios_post_preset({
				fn_name: "get_twitter_account",
				params: { twitter_id: this.twitterUserID },
				then: (res) => {
					if ( !trivialProps(res,'ID') ){
						this.twitter = res;
						then(this.twitter.name);
					} else {
						then("");
					}
				}
			})
		} else {
			return then(this.twitter.name)
		}
	}

	/******************************************************
		@Load
	******************************************************/

	/**
	 * 
	 * @Use: sync token with lumo/core db
	 * 
	 */ 
	async sync({ then }){

		await getUserValue({ userID: this.userID, then: async ({ success, message, data }) => {
			if ( success ){

				// parse view
				this.view = data;

				if ( !trivialProps(data,'userID') ){
					const { name, about, image_url, metamask_ethereum_address, custodial_ethereum_address } = data;				
					this.name = name ?? ""
					this.bio = about ?? ""
					this.profile_image_preview_url = image_url ?? ""
					this.metamask_pk = metamask_ethereum_address ?? "";
					this.custodial_ethereum_address = custodial_ethereum_address ?? "";
					this.uid = trivialProps(data,'userID') ? '' : data.userID;
					this.twitterUserID   = data.twitterUserID ?? "";
					this.twitterUserName = data.twitterUserName ?? "";
					this.timeStampCreatedPP = data.timeStampCreatedPP ?? ""
				}

				// load twitter
				await go_axios_post_preset({
					fn_name: "get_twitter_account",
					params: { twitter_id: this.twitterUserID },
					then: (res) => {
						if ( !trivialProps(res,'ID') ){
							this.twitter = res;
						}
					}
				})
				// load stripe
				await this.does_user_have_stripe_customer_id({ then: cap })

				then();


			} else {
				then()
			}
		}});
	}


	/**
	 * @Use: on did mint, incr counter
	 * 
	 **/ 
	async didMint(){
		return;
	}


	/******************************************************
		@stripe
	******************************************************/	

	/**
	 * 
	 * @use: check user can pay w/ stripe
	 * 
	 **/ 
	async does_user_have_stripe_customer_id({ refresh, then }){
		if ( this.did_load_stripe && !refresh ){
			then({ success: true, customerId: this.stripe_customerId, message: "fetching preloaded data" });
		} else {
			await does_user_have_stripe_customer_id({ userID: this.userID, then: (res) => {
				const {  customerId } = res;
				this.did_load_stripe = true;
				this.stripe_customerId = customerId ?? "";
				then(res)
			}});
		}
	}

	// create stripe account for this user
	async create_user_stripe_account({ number, cvc, exp_mo, exp_yr, then }){
		this.did_load_stripe = false;
		await create_user_stripe_account({
			userID: this.userID,
			number,
			cvc,
			exp_mo,
			exp_yr,
			then: async (res) => {
				await this.does_user_have_stripe_customer_id({ then: (_) => {
					then(res);
				}});
			}
		})
	}

}




/******************************************************
	@User set value
******************************************************/	

/**
 * 
 * @use: make raw user blob
 *
 **/ 
function makeRawUserBlob({ 
	userID, 
	name, 
	twitterUserName, 
	email, 
	password, 
	metamask_ethereum_address 
}){

	let blob = {
		userID           : userID ?? "",
		name             : name ?? "",
		twitterUserName  : twitterUserName ?? "",
		email            : email ?? "",
		password         : password ?? "",
		numMints         : 0,
		hasStaked        : false,
		timeStampLatest  : swiftNow(),
		timeStampCreated : swiftNow(),							
		metamask_ethereum_address: metamask_ethereum_address ?? "",
	}	

	return blob;
}
/**
 *  
 * @Use: get user's value
 * 
 **/
async function setServerUserValue(blob){

	const { userID, then } = blob;
	var inputs = blob;
	inputs['then'] = 0;

	let post_params = make_post_params({
		...inputs,
		userID: userID ?? "",
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.edit_user,
		post_params: post_params,
		then: then
	})	
}

/******************************************************
	@User get/set value from server db
******************************************************/	

/**
 *  
 * @Use: get user's value
 * 
 **/
async function getUserValue({ userID, then }){

	let post_params = make_post_params({
		userID: userID ?? "",
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.get_user,
		post_params: post_params,
		then: then
	})	
}


/******************************************************
	@User stripe
******************************************************/	

/**
 * 
 * @use: check if user has stripe customer id
 * 
 */ 
async function does_user_have_stripe_customer_id({ userID, then }){
	let post_params = make_post_params({ userID: userID });
	return await go_axios_post({
		endpoint: POST_ENDPOINTS.does_user_have_stripe_customer_id,
		post_params: post_params,
		then: then
	})	
}


/**
 * 
 * @Use: create stripe account for user 
 * 
 * 
 **/ 
async function create_user_stripe_account({ userID, number, cvc, exp_mo, exp_yr, then }){
	let post_params = make_post_params({ userID, number, cvc, exp_mo, exp_yr });
	return await go_axios_post({
		post_params: post_params,
		endpoint: POST_ENDPOINTS.create_user_stripe_account,
		then: then
	})
}


/******************************************************
	@export
******************************************************/	


export {
	getUserValue,
	setServerUserValue,
	makeRawUserBlob,
}



























 








