/**
 * 
 * @Module: storyboard token API
 * @Author: Xiao Ling
 * @Date  : 3/5/2022
 * 
 * 
*/


const { 
	trivialString, 	
	trivialNum,
} = require('./utils')

const { 
	  POST_ENDPOINTS
	, make_post_params
	, go_axios_post
} = require('./core');



/******************************************************
	@Read
******************************************************/	


/**
 * 
 * @Use: read story board
 * 
 */ 
async function get_project({ address, subdomain, fast, then }){

	let _fast = typeof fast === 'boolean' ? fast : false;
	let post_params = make_post_params({
		address: address ?? "",
		subdomain: subdomain ?? "",
		fast: _fast,
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.get_project,
		post_params: post_params,
		then: then
	})	
}



/**
 * 
 * @Use: read story board
 * 
 */ 
async function get_top_project({ then }){
	let post_params = make_post_params({});
	return await go_axios_post({
		endpoint: POST_ENDPOINTS.get_top_project,
		post_params: post_params,
		then: then
	})	
}




/**
 * 
 * @Use: read story board
 * 
 */ 
async function get_all_projects({ then }){

	let post_params = make_post_params({});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.get_all_projects,
		post_params: post_params,
		then: then
	})	
}


/******************************************************
	@write
******************************************************/	

/**
 * 
 * @Use: create new storyboard
 * 
 */ 
async function create_project({ 
	name     ,
	about    ,
	symbol   ,
	image_url,
	image_preview_url,
	logo_url,
	twitter,
	instagram,
	website,
	discord	,	
	userID   ,
    slate_id ,
    slate_idx_x,
    slate_idx_y,
    budget   ,
    rarity   ,
    date_mo  ,
    date_day ,
    then  
	}){

	let post_params = make_post_params({
		userID   : userID,
		name     : name   ?? "",
		about    : about  ?? "",
		symbol   : symbol ?? "",
		image_url: image_url,
		image_preview_url: image_preview_url ?? "",
		logo_url: logo_url ?? "",
		twitter: twitter ?? "",
		instagram: instagram ?? "",
		website: website ?? "",
		discord: discord ?? "",		
	    budget_in_eth: budget,
	    slate_id     : slate_id,
	    slate_idx_x  : slate_idx_x,
	    slate_idx_y  : slate_idx_y,
	    rarity       : rarity,
	    date_mo      : date_mo,
	    date_day     : date_day, 
	    date_yr      : '2022', 
	    date_hour    : '22', 
	    date_min     : '59', 		
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.create_project,
		post_params: post_params,
		then: (res) => {
			then(res);
		}
	})	
}


/**
 * 
 * @Use: create story board item
 * @Post params:
 *    userID, vendorID, itemID, storyboardID, tokID, prevItemID, tokIDs, image_url, text, network
 * @Doc: refsize file:
 *    - https://stackoverflow.com/questions/61740953/reactjs-resize-image-before-upload
 * 
 * 
 */ 
async function edit_project({
	projectID, 
	about, 
	twitter, 
	instagram, 
	website,
	discord, 
	image_url, 
	image_preview_url,
	logo_url,
	then 
}){

	let post_params = make_post_params({
		projectID: projectID,
		about    : about ?? "",
		twitter  : twitter ?? "",
		instagram: instagram ?? "",
		website  : website ?? "",
		discord  : discord ?? "",
		image_url: image_url ?? "",
		logo_url : logo_url ?? "",
		image_preview_url: image_preview_url ?? "",
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.edit_project,
		post_params: post_params,
		then: then
	});

}



/**
 * 
 * @Use: create story board 
 * 
 */ 
async function create_story_board({  
	userID, 
	address,
	name, 
	about, 
	kind,
	license_id,
	percent_rake,
    is_public,
    num_items,
    is_fiat,
	price_in_eth,
	price_in_cents,
	migrated_contract_address,
	migrated_payout_address,
	migrated_symbol	,
	then 
}){

	let post_params = make_post_params({
		userID : userID ?? "",
		address: address ?? "",
		name: name ?? "",
		about: about ?? "",
		kind : kind ?? "",
		license_id: license_id ?? "",
		is_fiat     : is_fiat ?? false,
		price_in_eth: price_in_eth ?? 0,
		price_in_cents: price_in_cents ?? 0,
		is_public: typeof is_public === 'boolean' ? is_public : true,
		num_items: trivialNum(num_items) ? 0 : Number(num_items),
		percent_rake: trivialNum(Number(percent_rake)) ? 0 : Number(percent_rake),
		migrated_contract_address: trivialString(migrated_contract_address) ? "" : (migrated_contract_address ?? ""),
		migrated_payout_address: trivialString(migrated_payout_address) ? "" : (migrated_payout_address ?? ""),
		migrated_symbol: trivialString(migrated_symbol) ? "" : (migrated_symbol ?? ""),
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.create_story_board,
		post_params: post_params,
		then: then
	});	

}


/**
 * 
 * @Use: create story board 
 * 
 */ 
async function edit_story_board({  
	userID, 
	storyboardID,
	name, 
	about, 
    is_public,
    num_items,
	price_in_eth,
	price_in_cents,
	image_url,
	then 
}){

	var post_params = make_post_params({
		userID: userID ?? "", 
		storyboardID: storyboardID ?? "",
		name: name ?? "", 
		about: about ?? "", 
		image_url: image_url ?? "",
	});

	if ( !trivialNum(Number(num_items)) ){
		post_params['num_items'] = Number(num_items)
	}

	if ( !trivialNum(Number(price_in_eth))){
		post_params['price_in_eth'] = Number(price_in_eth)
	}

	if ( !trivialNum(Number(price_in_cents))){
		post_params['price_in_cents'] = Number(price_in_cents)
	}

	if ( typeof is_public === 'boolean' ){
		post_params['is_public'] = is_public;
	}

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.edit_story_board,
		post_params: post_params,
		then: then
	});	

}



/**
 * 
 * @Use: accept invite link
 * 
 */ 
async function edit_storyboard_donation({
    address,
    userID, 
    storyboardID,
    text,
    then,
}){

	let post_params = make_post_params({
		address: address ?? "",
		userID: userID ?? "",
		storyboardID: storyboardID ?? "",
		text: text ?? "",
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.edit_storyboard_donation,
		post_params: post_params,
		then: then
	})	
}


/**
 * 
 * @Use: create story board item
 * @Post params:
 *    userID, vendorID, itemID, storyboardID, tokID, prevItemID, tokIDs, image_url, text, network
 * 
 * 
 */ 
async function create_story_board_item({ 
	text,
	image_url,
	animation_url,
	userID, 
	storyboardID, 
	license_id,
	migrated_contract_address,
	migrated_token_id,
	migrated_token_metadata,
	then 
}){

	let post_params = make_post_params({
		userID : userID,
		storyboardID: storyboardID,
		tokID  : "",
		tokIDs : [],
		image_url: image_url ?? "",
		animation_url: animation_url ?? "",
		text     : text ?? "",
	
		using_license_id: license_id ?? "",
		migrated_contract_address: trivialString(migrated_contract_address) ? "" : migrated_contract_address,
		migrated_token_id: trivialString(migrated_token_id) ? "" : migrated_token_id,
		migrated_token_metadata: trivialString(migrated_token_metadata) ? "" : migrated_token_metadata,
	});

	console.log(post_params);
	
	return await go_axios_post({
		endpoint: POST_ENDPOINTS.create_story_board_item,
		post_params: post_params,
		then: then
	});

}



/**
 * 
 * @Use: accept invite link
 * 
 */ 
async function maybe_premint_ticket({
    userID, 
    storyboardID,
    then,
}){


	let post_params = make_post_params({
		userID: userID ?? "",
		storyboardID: storyboardID ?? "",
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.maybe_premint_ticket,
		post_params: post_params,
		then: then
	})	
}


// @use: buy item with fiat
async function fiat_purchase_and_premint({ storyboardID, userID, then }){
	let post_params = make_post_params({ storyboardID, userID });
	return await go_axios_post({
		endpoint: POST_ENDPOINTS.fiat_purchase_and_premint,
		post_params: post_params,
		then: then
	})	
}


/**
 * 
 * @use: remove this item from storyboar 
 * 
 **/
async function remove_story_board_item({ userID, itemID, then }){
	let post_params = make_post_params({
		userID: userID ?? "",
		itemID: itemID ?? "",
	});
	return await go_axios_post({
		endpoint: POST_ENDPOINTS.remove_story_board_item,
		post_params: post_params,
		then: then
	})
}



/**
 * 
 * @Use: edit story board item
 * @Post params:
 *    userID, vendorID, itemID, storyboardID, text, network
 * 
 * 
 */ 
async function edit_story_board_item({ text, userID, itemID, then }){

	let post_params = make_post_params({
		userID : userID,
		itemID : itemID ?? "",
		text   : text ?? "",
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.edit_story_board_item,
		post_params: post_params,
		then: then
	});

}


// @use: get all minted tok at contract-address
async function get_minted_tok({ tokID, itemID, transaction_hash, then }){
	let post_params = make_post_params({
		tokID: tokID ?? "",
		itemID: itemID ?? "",
		transaction_hash: transaction_hash ?? "",
	});
	return await go_axios_post({
		endpoint: POST_ENDPOINTS.get_minted_tok,
		post_params: post_params,
		then: then
	});	
}



// @use: get all minted tok at contract-address
async function get_all_minted_tok({ contractAddress, then }){
	let post_params = make_post_params({
		contractAddress: contractAddress,
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.get_all_minted_tok,
		post_params: post_params,
		then: then
	});	
}


// @use: get all minted tok owned by userID
async function get_all_minted_tok_owned_by({ userID, then }){
	let post_params = make_post_params({ userID });
	return await go_axios_post({
		endpoint: POST_ENDPOINTS.get_all_minted_tok_owned_by,
		post_params: post_params,
		then: then
	});	
}


// @use: get all minted tok owned by userID
async function get_fiat_minted_tok_owned_by({ userID, then }){
	let post_params = make_post_params({ userID });
	return await go_axios_post({
		endpoint: POST_ENDPOINTS.get_fiat_minted_tok_owned_by,
		post_params: post_params,
		then: then
	});	
}



/******************************************************
	@trailer + whitelist
******************************************************/	


/**
 * 
 * @Use: read story board
 * 
 */ 
async function get_trailer({ projectID, then }){

	let post_params = make_post_params({
		projectID: projectID,
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.get_trailer,
		post_params: post_params,
		then: then
	})	
}

/**
 * 
 * @Use: upload trailer
 * 
 */ 
async function upload_trailer({ projectID, num_whitelist, userID, trailer_url, then }){

	let post_params = make_post_params({
		projectID: projectID,
		userID: userID,
		trailer_url: trailer_url,
		num_whitelist: num_whitelist ?? 0,
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.upload_trailer,
		post_params: post_params,
		then: then
	})	
}


/******************************************************
	@crew
******************************************************/	


/**
 * 
 * @Use: edit crew info
 * 
 */ 
async function add_crew({
    address,
    adminUserID, 
    crewUserID,
    img_url,
    crew_eth_address, 
    split,
    name, 
    about,  
    imdb,
    instagram,
    twitter,
    opensea,
    link,
    then,
}){


	var post_params = make_post_params({
		address: address ?? "",
		adminUserID: adminUserID ?? "",
		crewUserID : crewUserID ?? "",
		split: split ?? 0,
		name: name ?? "",
		about: about ?? "",
		imdb: imdb ?? "",
		instagram: instagram ?? "",
		twitter: twitter ?? "",
		opensea: opensea ?? "",
		img_url: img_url ?? "",
		link: link ?? "",
		crew_eth_address: crew_eth_address ?? "",
		crewEntryID: ""
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.add_crew,
		post_params: post_params,
		then: then
	})	
}


/**
 * 
 * @Use: edit crew info
 * 
 */ 
async function delete_crew({
    address,
    adminUserID, 
    crewEntryID,
    then,
}){

	var post_params = make_post_params({
		address: address ?? "",
		adminUserID: adminUserID ?? "",
		crewEntryID: crewEntryID ?? "",
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.delete_crew,
		post_params: post_params,
		then: then
	})	
}

/******************************************************
	@schedule
******************************************************/	

/**
 * 
 * @Use: read story board
 * 
 */ 
async function get_schedule(params){

	let post_params = make_post_params({
		...params,
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.get_schedule,
		post_params: post_params,
		then: params.then
	})	
}

/**
 * 
 * @Use: edit schedule
 * 
 */ 
async function edit_schedule({
    address,
    userID, 
    projectState,
    done,
    about,
    then,
}){


	let post_params = make_post_params({
		address: address ?? "",
		userID: userID ?? "",
		projectState: projectState ?? "",
		done: done ?? false,
		about: about ?? "",		
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.edit_schedule,
		post_params: post_params,
		then: then
	})	
}

/******************************************************
	@whitelist
******************************************************/	


/**
 * 
 * @Use: whitelist users
 * 
 */ 
async function whitelist_user_storyboard({
    address,
    userID, 
    storyboardID,
    then,
}){

	let post_params = make_post_params({
		address: address ?? "",
		userID: userID ?? "",
		storyboardID: storyboardID ?? "",
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.whitelist_user_storyboard,
		post_params: post_params,
		then: then
	})	
}


/**
 * 
 * @Use: read whitelist
 * 
 */ 
async function get_storyboard_whitelist({
    address,
    userID, 
    storyboardID,
    then,
}){

	let post_params = make_post_params({
		storyboardID: storyboardID ?? "",
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.get_storyboard_whitelist,
		post_params: post_params,
		then: then
	})	
}


/******************************************************
	@invite
******************************************************/	


/**
 * 
 * @Use: read invite link
 * 
 */ 
async function read_invite_link({
    address,
    userID, 
    then,
}){

	let post_params = make_post_params({
		address: address ?? "",
		userID: userID ?? "",
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.read_invite_link,
		post_params: post_params,
		then: then
	})	
}


/**
 * 
 * @Use: accept invite link
 * 
 */ 
async function accept_invite_link({
    address,
    userID, 
    invite_tok,
    then,
}){

	let post_params = make_post_params({
		address: address ?? "",
		invite_tok: invite_tok ?? "",
		userID: userID ?? "",
	});

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.accept_invite_link,
		post_params: post_params,
		then: then
	})	
}


/******************************************************
	@license
******************************************************/	

/**
 * 
 * @Use: license
 * 
 */ 
async function license_collection_item({ userID, itemID, storyboardID, projectID, then }){

    let post_params = make_post_params({ userID, itemID, storyboardID, projectID });
    return await go_axios_post({
        endpoint: POST_ENDPOINTS.license_collection_item,
        post_params: post_params,
        then: then
    })  
}


/**
 * 
 * @Use: license
 * 
 */ 
async function get_item_licensors({ itemID, then }){
    let post_params = make_post_params({ itemID });
    return await go_axios_post({
        endpoint: POST_ENDPOINTS.get_item_licensors,
        post_params: post_params,
        then: then
    })  
}


/**
 * 
 * @Use: license
 * 
 */ 
async function generate_license_invite({ userID, storyboardID, itemID, then }){
    let post_params = make_post_params({ userID, storyboardID, itemID });
    return await go_axios_post({
        endpoint: POST_ENDPOINTS.generate_license_invite,
        post_params: post_params,
        then: then
    })  
}

/**
 * 
 * @Use: license
 * 
 */ 
async function get_item_by_license_id({ licenseID, then }){
    let post_params = make_post_params({ licenseID });
    return await go_axios_post({
        endpoint: POST_ENDPOINTS.get_item_by_license_id,
        post_params: post_params,
        then: then
    })  
}

/**
 * 
 * @Use: license
 * 
 */ 
async function get_acquired_licenses({ projectID, then }){
    let post_params = make_post_params({ projectID });
    return await go_axios_post({
        endpoint: POST_ENDPOINTS.get_acquired_licenses,
        post_params: post_params,
        then: then
    })  
}

/**
 * 
 * @Use: license
 * 
 */ 
async function can_license_item({ itemID, projectID, then }){
    let post_params = make_post_params({ itemID: itemID ?? "", projectID: projectID ?? "" });
    return await go_axios_post({
        endpoint: POST_ENDPOINTS.can_license_item,
        post_params: post_params,
        then: then
    })  
}


/******************************************************
	@stripe
******************************************************/	


async function make_connected_account({  projectID, userID, then }){
    let post_params = make_post_params({ userID, projectID }); 
    return await go_axios_post({
        endpoint: POST_ENDPOINTS.make_connected_account,
        post_params: post_params,
        then: then
    })  
}

async function confirm_connected_account({  projectID, then }){
    let post_params = make_post_params({ projectID }); 
    return await go_axios_post({
        endpoint: POST_ENDPOINTS.confirm_connected_account,
        post_params: post_params,
        then: then
    })  
}





/******************************************************
	@youtube integration
******************************************************/	

/**
 * 
 * @use: convert youtube link to mp4 and output donwload url
 * 
 **/ 	
async function download_youtube_mp4({ url, then }){

	let post_params = make_post_params({ url: url });

	return await go_axios_post({
		endpoint: POST_ENDPOINTS.download_youtube_mp4,
		post_params: post_params,
		then: then
	})		

}


/******************************************************
	@export
******************************************************/	


export {
	get_project,
	get_top_project,
	get_all_projects,

	get_minted_tok,
	get_all_minted_tok,
	get_all_minted_tok_owned_by,
	get_fiat_minted_tok_owned_by,

	create_project,
	edit_project,
	edit_story_board,

	create_story_board,
	edit_story_board_item,
	create_story_board_item,
	maybe_premint_ticket,
	remove_story_board_item,
	fiat_purchase_and_premint,

	// trailer 
	upload_trailer,
	get_trailer,

	// invite
	read_invite_link,
	accept_invite_link,
	edit_storyboard_donation,

	// whitelist
	whitelist_user_storyboard,
	get_storyboard_whitelist,

	// license
	can_license_item,
	license_collection_item,
	get_item_licensors,
	generate_license_invite,
	get_item_by_license_id,
	get_acquired_licenses,

	// stripe
	make_connected_account,
	confirm_connected_account,

	// crew
	add_crew,
	delete_crew,

	edit_schedule,
	get_schedule,

	download_youtube_mp4,


}





