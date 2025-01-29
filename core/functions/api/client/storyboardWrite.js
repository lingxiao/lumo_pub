/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: storyboard API
 * @Date   : March 4th, 2022
 * @Important: must set env. variable for public and private key of admin on local first. 
        >> see: https://medium.com/firelayer/deploying-environment-variables-with-firebase-cloud-functions-680779413484
        ```
            firebase functions:config:set eth.public = "" eth.private = ""
            firebase functions:config:get
        ```
 * @test : firebase serve
 *
 *
*/


// import modules
// const axios = require('axios')
const uuid  = require('uuid');
const fire  = require('./../fire')
const functions = require('firebase-functions');


const { 
    print,
    swiftNow, 
    illValued, 
    trivialProps, 
    trivialNum, 
    trivialString,
    ppSwiftTime,
} = require('./../utils');


const { 
    getUserByVendorID, 
    getUserByMetamask,
} = require('./accounts');


const {
    DbPaths, 
    Networks,
    CollaborationType,
    make_production_web3_account,
    store_keys_in_lumo_core,
    network_flow_to_eth,
    default_fn_response,
    MemberPermission,
    ItemMintState,
    CollectionKind,
} = require('./../core');

const {
    bookSlate
} = require('./slateAPI')


const {
    addCrew,
    createInviteLink,
    // log_collab_type,
} = require("./storyboardUsers");

const {
      getProject
    , getStoryBoard
    , getStoryboardItem
    , getFiatPurchasedStoryboardItems
    , getProjectContracts
    , is_project_owner    
} = require('./storyboardRead');


const {
    logSendTransactionInEth,
} = require("./../eth/transactions")

/******************************************************
    @write project
******************************************************/



/**
 * 
 * @Use: create storyboard root, optionally associate storyboard with `treeID` 
 *       and `tokID`, generate ethereum address for storyboard
 * 
 * 
 **/ 
async function createProject({

    name, 
    about, 
    symbol,
    subdomain,

    image_url, 
    image_preview_url,
    logo_url,
    twitter,
    instagram,
    website,
    discord,

    userID, 
    vendorID, 
    network ,

    // slate
    slate_id,
    slate_idx_x,
    slate_idx_y,

    is_syndicate,

    then,

    // budget_in_eth,
    // rarity,
    // date_mo     ,
    // date_yr     , // must be in YYYY format
    // date_day    , 
    // date_hour   ,  // must be in military format
    // date_min    , 

}){

    var res = default_fn_response();

    if ( trivialString(userID) || trivialString(network) ){
        return then(res);
    }    

    // check user and tree exist
    let user = await getUserByVendorID({ userID: userID, vendorID: vendorID, withPrivateKey: false });

    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return then(res);
    }   

    // let bad_num = [ date_mo, date_yr, date_day, date_hour, date_min ].map(trivialNum);
    // if ( bad_num.includes(true) ){
    //     res['message'] = 'please input real date'
    //     return res
    // }
    // convert expiration to timestamp
    // let expire = vernacularDateInESTToSwiftTimeStamp({
    //     yr  : Number(date_yr),
    //     mo  : Number(date_mo),
    //     day : Number(date_day),
    //     hr  : Number(date_hour), // note you need to convert from EST to UTC first
    //     min : Number(date_min),
    // });
    // // pretty print timestamp
    // let pp_expire = prettyPrintUtcTimeStampInESTVernacular(expire); 

    const { address, privateKey } = make_production_web3_account();
    let id = address; // uuid.v4();
    let _is_syndicate = typeof is_syndicate === 'boolean' ? is_syndicate : false;
    let _image_preview_url = trivialString(image_preview_url) 
        ? "" 
        : (image_preview_url ?? "");

    let _subdomain = trivialString(subdomain) ? "" : String(subdomain);

    var blob = {
        ID       : id,
        projectID: id,
        userID   : userID,
        network  : network,

        // eth acct/subdomain
        eth_address: address,
        subdomain  : _subdomain ?? "",

        // project name + about
        name      : name  ?? "",
        about     : about ?? "",
        symbol    : symbol ?? "",
        image_url :  image_url ?? "",
        image_preview_url: _image_preview_url,
        logo_url  : trivialString(logo_url)  ? "" : logo_url,
        twitter   : trivialString(twitter)   ? "" : twitter,
        instagram : trivialString(instagram) ? "" : instagram,
        website   : trivialString(website)   ? "" : website,
        discord   : trivialString(discord)   ? "" : discord,

        num_whitelist: 0,

        // default closed to collab
        is_private: true,

        // if this is a syndicate 
        is_syndicate: _is_syndicate,

        // seed-slate-info, if not well defined, then
        // seeed with idx outside of accepted idx range
        slate_id : trivialString(slate_id) ? "" : slate_id,
        slate_seed_idx_x: trivialNum(slate_idx_x) ? 1000 : Number(slate_idx_x),
        slate_seed_idx_y: trivialNum(slate_idx_y) ? 1000 : Number(slate_idx_y),

        timeStampCreated : swiftNow(),
        timeStampLatest  : swiftNow(),       
        timeStampCreatedPP: ppSwiftTime(swiftNow()) ?? "",        

    }

    // @Important: store keys on seraprate server
    let key_blob = {
        address    : address,
        privateKey : privateKey,
        network    : network_flow_to_eth(network),
    }

    // store keys, if fail then fail
    await store_keys_in_lumo_core({
        post_params: key_blob,
        then: async ({ success, message, data }) => {

            if ( !success ){

                return then({ 
                    success: false, 
                    message: `failed to initiate an eth address: ${message}`, 
                    data: blob 
                });

            } else {

                let did = await fire.firestore
                    .collection(DbPaths.project_root)
                    .doc( id )
                    .set( blob )
                    .then(_ => true)
                    .catch(e => false)

                if ( !did ){

                    res['message'] = 'failed to write to db'
                    return then(res);

                } else {

                    // add owner as crew
                    let existing_user = await getUserByVendorID({ userID: userID, withPrivateKey: false });    
                    let existing_user_view = existing_user ?? {};

                    await addCrew({
                        ...existing_user_view,
                        address: key_blob['address'] ?? "",
                        crewUserID: userID ?? "",
                        img_url: trivialProps(existing_user, 'image_url') ? '' : (existing_user.image_url ?? "") ,
                        crew_eth_address: trivialProps(existing_user, 'metamask_ethereum_address') ? '' : (existing_user.metamask_ethereum_address ?? "") ,
                        split: 0,
                        perm: MemberPermission.admin,
                    })

                    // var book_res = { message: "no slate specified" }

                    // book a slot on the defined slate
                    // if ( !trivialString(slate_id) && !trivialNum(slate_idx_x) && !trivialNum(slate_idx_y) ){
                    //     book_res = await bookSlate({ 
                    //         userID    : userID,
                    //         vendorID  : vendorID,
                    //         slate_id  : slate_id ?? "",
                    //         force_book: true,
                    //         num_slots : 1,
                    //         project_address: id,
                    //         slate_seed_idx_x: slate_idx_x ?? 0,
                    //         slate_seed_idx_y: slate_idx_y ?? 0,
                    //     });
                    // }

                    //NOte; do not create invite link
                    //await createInviteLink({ address: key_blob['address'] ?? "", userID: userID });

                    // continue fn
                    return then({ success: true, message: `created project`, data: blob });

                }
            }

        }
    });
}





/**
 * 
 * @use: edit project
 * 
 **/
async function editProject({
    projectID,
    about, 
    twitter,
    instagram,
    website,
    discord,
    logo_url,
    image_url,
    image_preview_url,
}){

    var res = default_fn_response();

    let proj = await getProject({ address: projectID, full: false })

    if ( trivialProps(proj, 'root') || trivialProps(proj.root,'ID') ){
        res['message'] = 'project not found'
        return res;
    }

    let id = proj.root.ID
    var change = {};

    if ( !trivialString(about) ){
        change['about'] = about;
    }

    if (!trivialString(twitter)){
        change['twitter'] = twitter
    }

    if ( !trivialString(instagram) ){
        change['instagram'] = instagram
    }

    if ( !trivialString(website) ){
        change['website'] = website
    }

    if ( !trivialString(discord) ){
        change['discord'] = discord
    }

    if ( !trivialString(image_url) ){
        change['image_url'] = image_url;
    }

    if ( !trivialString(logo_url) ){
        change['logo_url'] = logo_url;
    }    

    if ( !trivialString(image_preview_url) ){
        change['image_preview_url'] = image_preview_url ?? "";
    }

    let did = await fire.firestore
        .collection(DbPaths.project_root)
        .doc( id )
        .update( change )
        .then(_ => true)
        .catch(e => false)    

    res['success'] = did;
    res['message'] = did ? 'updated' : 'failed to log to db';
    return res;
}


/**
 *
 * @use: edit privacy of project 
 * 
 **/
async function editProjectPrivacy({ isPrivate, userID, address }){

    var res = default_fn_response();

    let { root } = await getProject({  address: address ?? "", full: false })

    if (  trivialProps(root,'ID') || trivialString(root.ID) || trivialProps(root,'userID') ){
        res['message'] = 'project not found'
        return res;
    }

    let is_owner = await is_project_owner({ address: address, userID: userID });

    if ( !is_owner ){
        res['message'] = 'only project owner can change privacy settings'
        return res;
    }

    const privacy = trivialNum(isPrivate) ? 0 : Number(isPrivate)

    let did = await fire.firestore
        .collection(DbPaths.project_root)
        .doc( root.ID )
        .update({ is_private: privacy, timeStampLatest: swiftNow() })
        .then(_ => true)
        .catch(e => false)    

    res['success'] = did;
    res['message'] = did ? 'updated' : 'failed to log to db';
    return res;
}



/******************************************************
    @project trailer 
******************************************************/


/**
 * 
 * @use: uplaod trailer
 * 
**/
async function uploadTrailer({ projectID, userID, trailer_url }){

    var res = default_fn_response();

    if ( trivialString(projectID) ){
        res['message'] = 'please provide projectID'
        return res;
    }
    if ( trivialString(userID) ){
        res['message'] = 'please provide userID'
        return res;
    }
    if ( trivialString(trailer_url) ){
        res['message'] = 'please provide trailer url'
        return res;
    }
    
    let id = uuid.v4();
    let blob = {
        ID               : id,
        userID           : userID,
        projectID        : projectID,
        trailer_url      : trailer_url,
        timeStampCreated : swiftNow(),
        timeStampLatest  : swiftNow(),
        timeStampCreatedPP: ppSwiftTime(swiftNow()) ?? "",        
    }
    
    let did = await fire.firestore
        .collection(DbPaths.stories_trailers)
        .doc( id )
        .set( blob )
        .then(_ => true)
        .catch(e => false)    

    res['success'] = did;
    res['message'] = did ? 'saved' : 'failed to write to db';
    res['data']    = blob;
    return res;

}


/**
 * 
 * @use: get trailer
 * 
 **/ 
async function getTrailer({ projectID }){

    var res = default_fn_response();
    res['data'] = [];

    if ( trivialString(projectID) ){
        res['message'] = 'please provide projectID'
        return res;
    }

    var trailers = [];

    const fetch_trailers = await fire.firestore
        .collection(DbPaths.stories_trailers)
        .where('projectID', '==', projectID)
        .get();

    if (!fetch_trailers.empty){
        fetch_trailers.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                trailers.push(doc.data())
            }
        })
    }        

    res['success'] = true;
    res['message'] = 'fetched trailers'
    res['data'] = trailers;
    return res;
}


/******************************************************
    @write storyboard
******************************************************/


/**
 * 
 * @Use: creato storyboard root, optionally associate storyboard with `treeID` 
 *      and `tokID`, generate ethereum address for storyboard
 * 
 * 
 **/ 
async function createStoryBoard({ 
    userID, 
    vendorID, 
    address, 
    name, 
    about,  
    kind,
    percent_rake,
    network, 
    is_public,
    num_items,
    is_fiat,
    price_in_cents,
    price_in_eth,
    license_id,    // if using licensed item, see here
    migrated_contract_address, 
    migrated_payout_address,
    migrated_symbol,
}){

    var res = default_fn_response();

    if ( trivialString(userID) || trivialString(network) || trivialString(address) ){
        return res;
    }    

    let { root } = await getProject({  address: address, full: false })

    if ( trivialProps(root, 'ID') ){
        res['message'] = 'project dne'
        return res;
    }

    // get user
    let user = await getUserByVendorID({ userID: userID, vendorID: vendorID, withPrivateKey: false });

    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return res;
    }   

    let board_exist = trivialString(migrated_contract_address) 
        ? {}
        : await _get_storyboard_by_migrated_contract_address({ migrated_contract_address: migrated_contract_address ?? "" });

    if ( !trivialProps(board_exist,'ID') ){
        res['message'] = `A collection at ${migrated_contract_address} already exists`
        return res;        
    }

    let id = uuid.v4();
    let _num_items = trivialNum(Number(num_items)) ? 0 : Number(num_items);
    let _percent_rake = trivialNum(Number(percent_rake)) ? 0 : Number(percent_rake);
    let _is_fiat = typeof is_fiat === 'boolean' ? is_fiat : false;

    var blob = {
        ID           : id,
        storyboardID : id,
        projectID    : root.ID ?? "",
        address      : address,
        userID       : userID,
        network      : network,

        name           : name ?? "",
        about          : about ?? "",
        is_public      : Boolean(is_public), 
        num_items      : _num_items,

        price_in_eth   : trivialNum(price_in_eth) ? 0 : Number(price_in_eth),

        is_fiat        : _is_fiat,
        price_in_cents : trivialNum(price_in_cents) ? 0 : Number(price_in_cents), 

        using_license_id: trivialString(license_id) ? "" : license_id,

        kind: trivialString(kind) ? "" : kind, 
        percent_rake: _percent_rake,

        timeStampCreated : swiftNow(),
        timeStampLatest  : swiftNow(),
        timeStampCreatedPP: ppSwiftTime(swiftNow()) ?? "",        

        // donation data    
        donation_accept: false,
        donation_message: "",

        // migration data        
        migrated_symbol: trivialString(migrated_symbol) ? "" : (migrated_symbol ?? ""),
        migrated_contract_address: trivialString(migrated_contract_address) ? "" : (migrated_contract_address ?? ""),
        migrated_payout_address  : trivialString(migrated_payout_address) ? "" : (migrated_payout_address ?? ""),

    }

    let did = await fire.firestore
        .collection(DbPaths.stories_boards)
        .doc( id )
        .set( blob )
        .then(_ => true)
        .catch(e => false)

    res['success'] = did;
    res['message'] = did ? 'success' : 'failed to write to db';
    res['data'] = blob;
    return res;
}


/***
 * 
 * @use: edit storyboard
 * 
 * 
 **/
async function editStoryBoard({ 
    userID, 
    vendorID, 
    storyboardID,
    name, 
    about,  
    network, 
    is_public,
    num_items,
    price_in_cents,
    price_in_eth,
    image_url,
    push_image_update,
}){

    var res = default_fn_response();

    if ( trivialString(userID) || trivialString(network) || trivialString(storyboardID) ){
        return res;
    }    

    // get user
    let user = await getUserByVendorID({ userID: userID, vendorID: vendorID, withPrivateKey: false });

    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return res;
    }   

    let _board = await getStoryBoard({ storyboardID: storyboardID, network: network, full: true });
    let board  = _board.data;
    let items  =  _board.items ?? [];

    if ( trivialProps(board,'ID') ){
        res['message'] = `board at ${storyboardID} dne`;
        return res;        
    }

    if ( board.userID !== userID ){
        res['message'] = 'only collection creator can update this collection';
        return res;
    }

    var update = {
        timeStampLatest: swiftNow(),
    }

    if ( !trivialString(name) ){
        update['name'] = name;
    }

    if ( !trivialString(about) ){
        update['about'] = about;
    }

    if ( typeof is_public === 'boolean' ){
        update['is_public'] = is_public;
    }

    if ( !trivialNum(Number(num_items)) && Number(num_items) >= items.length ){
        update['num_items'] = num_items;
    }

    if ( !trivialNum(Number(price_in_eth)) ){
        update['price_in_eth'] = Number(price_in_eth);
    }

    if ( !trivialNum(Number(price_in_cents)) ){
        update['price_in_cents'] = Number(price_in_cents);
    }

    let did = await fire.firestore
        .collection(DbPaths.stories_boards)
        .doc( storyboardID )
        .update( update )
        .then(_ => true)
        .catch(e => false);


    // if updating board w/ one item, then
    // update item's image url;
    if (  !trivialString(image_url) && items.length > 0 ){

        let first_img = items[0]['image_url'];
        let is_ticket_board_1 = items.length === 1        
        let is_ticket_board_2 = items.filter(m => {
            return m['image_url'] !== first_img;
        });

        // if only one item, or all items have the same image
        // then push the update because this is a license or 
        // ticketing board whose ticket being updated
        if ( is_ticket_board_1 || is_ticket_board_2.length === 0 ){

            let new_img_blob = { timeStampLatest: swiftNow(), image_url: image_url };
            let license_id = items[0]['license_id']
            
            // get all items with this license_id
            var items_with_img = [];
            if ( !trivialString(license_id) ){
                const matching_items = await fire.firestore
                    .collection(DbPaths.stories_board_items)
                    .where('using_license_id', '==', license_id)
                    .get();
                if (!matching_items.empty){
                    matching_items.forEach(doc => {
                        if ( !trivialProps(doc,'data') ){
                            items_with_img.push(doc.data())
                        }
                    })
                }   
            }

            // @TODO: update all minted itmes too!

            // update all items with this image
            let _update_items = push_image_update ? items_with_img : items;
            let update_all_imgs = await _update_items.map(async (item) => {
                let id = item.ID ?? "";
                if ( !trivialString(id) ){
                    await fire.firestore
                        .collection(DbPaths.stories_board_items)
                        .doc( id )
                        .update(new_img_blob)
                        .then(_ => true)
                        .catch(e => false);
                }
            });
            await Promise.all(update_all_imgs);
        }
    }

    res['success'] = did;
    res['message'] = did ? 'success' : 'failed to update to db';
    res['data'] = update;
    return res;
}







/**
 * 
 * @use: get storyboard byits `migrated_contract_address` 
 * 
 **/
async function _get_storyboard_by_migrated_contract_address({ migrated_contract_address }){

    if ( trivialString(migrated_contract_address) ){
        return {}
    }

    var items = [];
    const match_boards = await fire.firestore
        .collection(DbPaths.stories_boards)
        .where('migrated_contract_address', '==', migrated_contract_address)
        .get();

    if ( !match_boards.empty ){
        match_boards.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                items.push(doc.data());
            }
        })
    }

    return items.length > 0 ? items[0] : {};
}

/**
 * 
 * @Use: create story board item
 * 
 **/ 
async function createStoryBoardItem({
    userID,
    vendorID,
    storyboardID,
    tokIDs, 
    image_url, 
    animation_url,
    using_license_id,
    text,
    network,
    do_not_add_collab,
    migrated_contract_address, 
    migrated_token_id, 
    migrated_token_metadata,
}){

    var res = default_fn_response();

    if ( trivialString(userID) || trivialString(storyboardID) || trivialString(network) ){
        return res;
    }    

    let user  = await getUserByVendorID({ userID: userID, vendorID: vendorID, withPrivateKey: false });    
    let board = await getStoryBoard({ storyboardID: storyboardID, network: network, full: false });

    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return res;
    }   

    if ( !board.success || trivialProps(board.data,'storyboardID') ){
        res['message'] = 'storyboard dne'
        return res;
    }

    // get full board 
    var all_items = [];
    if ( board.data.kind === CollectionKind.rare ){
        let full_board = await getStoryBoard({ storyboardID: storyboardID, network: network, full: true });
        let all_items = full_board.items ?? []
    }

    if ( board.data.kind === CollectionKind.rare && all_items.length > 0 ){
        res['message'] = `you cannot add another item to a 1/1 collection`;
        return res;
    }

    let tids = tokIDs ?? [];
    let id = uuid.v4();
    const  _web_acct = make_production_web3_account();

    var blob = {
        ID           : id,
        itemID       : id,
        storyboardID : storyboardID,
        projectID    : board.data['projectID'] ?? "",
        address      : board.data['address'] ?? "",

        // id to license this item
        license_id   : _web_acct.address ?? (uuid.v4 ?? ""),
        // id this item licensed from
        using_license_id: trivialString(using_license_id) ? "" : (using_license_id ?? ""),

        userID       : userID,
        characterIDs : tids,
        network      : network,


        text             : text ?? "",
        image_url        : image_url ?? "",
        animation_url    : animation_url ?? "",

        timeStampCreated : swiftNow(),
        timeStampLatest  : swiftNow(),        
        timeStampCreatedPP: ppSwiftTime(swiftNow()) ?? "",

        // migration data
        migrated_token_id: "",
        migrated_token_metadata: "",
        migrated_contract_address: "",

        // fiat state
        fiat_payment_id   : "",        
        fiat_purchased_by : "",
        fiat_payout_id    : "",

        // mint state
        mint_state         : ItemMintState.not_minted, 
        contract_address   : "",
        tok_id             : "",
        mint_timeStampStart: 0,
        mint_timeStampEnd  : 0,
        mint_tx_hash       : "",
        mint_payment_hash  : "",
        minter_address     : "",
    }

    if ( !trivialString(migrated_token_id) && !trivialString(migrated_contract_address) ){

        blob['migrated_contract_address'] = migrated_contract_address ?? "";
        blob['migrated_token_id'] = migrated_token_id ?? "";

        blob['mint_state'] = ItemMintState.minted;
        blob['contract_address'] = migrated_contract_address ?? "";
        blob['tok_id'] = migrated_token_id ?? "";
        blob['mint_timeStampStart'] = swiftNow();
        blob['mint_timeStampEnd'] = swiftNow();
    }

    if ( !trivialString(migrated_token_metadata) ){
        blob['migrated_token_metadata'] = migrated_token_metadata
    }


    let did = await fire.firestore
        .collection(DbPaths.stories_board_items)
        .doc( id )
        .set( blob )
        .then(_ => true)
        .catch(e => false)

    res['success'] = did;
    res['message'] = did ? 'success' : 'failed to write to db';
    res['data'] = blob;

    var types = [];
    if ( !trivialString(image_url) ){
        types.push(CollaborationType.visual)
    }

    if ( !trivialString(text) ){
        types.push(CollaborationType.text)        
    }

    if ( typeof do_not_add_collab === 'boolean' && do_not_add_collab ){

        return res;

    } else {

        // do not log collab
        // await log_collab_type({
        //     types: types,
        //     userID: userID,
        //     storyboardID: storyboardID,
        //     address: board.data['address'] ?? "",
        //     crew_eth_address: user['metamask_ethereum_address'] ?? "",
        //     itemID: id,
        // })
        return res;        
    }

}



/**
 *  
 * @use: special use case where ticket items are created lazily
 *       if all tickets have been created, then fail
 * 
 **/
async function maybe_premint_ticket({ storyboardID, userID, vendorID, network }){


    var res = default_fn_response({ did_premint: false, data: {} });
    res['did_premint'] = false;
    res['message'] = 'we failed to mint your ticket';

    if ( trivialString(userID) || trivialString(storyboardID) || trivialString(network) ){
        res['message'] = 'please specify userID, storyboardID, or network'
        return res;
    }    

    let user  = await getUserByVendorID({ userID: userID, vendorID: vendorID, withPrivateKey: false });    
    let { success, message, data, items } = await getStoryBoard({ storyboardID: storyboardID, network: network, full: true });

    if ( trivialProps(user,'userID') ){
        res['message'] = 'user does not exist'
        return res;
    }   

    if ( !success || trivialProps(data,'storyboardID') || trivialProps(data,'kind') || trivialProps(data, 'num_items') ){
        res['message'] = `this ticket collection does not exist: ${message}`;
        return res;
    }

    if ( trivialNum(data.num_items) ){
        res['message'] = 'this collection does not have a specified supply';
        return res;
    }

    // tickets and 
    if ( data.kind !== CollectionKind.tickets && data.kind !== CollectionKind.membership ){
        res['message'] = `You can only premint items from tickets or membership collections`;
        return res;
    }

    let good_items = (items ?? []).filter(m => !trivialProps(m,'image_url') || !trivialProps(m,'animation_url'));            

    if ( good_items.length === 0 ){

        res['message'] = 'this collection is not well formed';
        return res;

    } else if ( (items ?? []).length  >= ( data.num_items + 1) ){ 
    // the first ticket minted from collection is a throw-away

        res['message'] = 'sold out!'
        return res;

    } else {

            let item = good_items[0];

            let premint_response = await createStoryBoardItem({
                userID: user.userID,
                vendorID: "",
                storyboardID: storyboardID,
                tokIDs: [], 
                image_url: item.image_url ?? "" , 
                animation_url: item.animation_url ?? "",
                text: item.text ?? "",
                network: network,
                do_not_add_collab: true,
            });

            if ( !premint_response.success ){
                res['message'] = `failed to create ticket metadata: ${premint_response.message}`
                return res;
            } else {                
                res['success'] = true;
                res['did_premint'] = true;
                res['message'] = `did premint this ticket ${message}`;
                res['data'] = premint_response.data ?? {};
                return res;
            }

    }

}


/**
 * 
 * @Use: edit story board item by changing text
 * 
 **/ 
async function editStoryBoardItem({ userID, vendorID, itemID, network, text }){

    var res = default_fn_response();

    if ( trivialString(userID) || trivialString(itemID) ){
        return res;
    }    

    // let { user } = await getUserFlowAccountOrCreate({ vendorID: vendorID, userID: userID, network: network });
    let user = await getUserByVendorID({ userID: userID, vendorID: vendorID, withPrivateKey: false });    
    let { data } = await getStoryboardItem({ itemID: itemID })

    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return res;
    }   

    if (  trivialProps(data,'length') || data.length === 0 ){
        res['message'] = 'item dne'
        return res;
    }    

    let did = await fire.firestore
        .collection(DbPaths.stories_board_items)
        .doc( itemID )
        .update({ text: text })
        .then(_ => true)
        .catch(e => false)

    res['success'] = did;
    res['message'] = did ? 'success' : 'failed to write to db';
    res['data'] = {};

    // await log_collab_type({
    //     types: [CollaborationType.text],
    //     userID: userID,
    //     storyboardID: data['storyboardID'] ?? "",
    //     itemID: itemID,
    // })    

    return res;    
}




/**
 * 
 * @Use: remove storyboard item
 * 
 **/ 
async function removeStoryBoardItem({ itemID, userID, vendorID, network }){

    var res = default_fn_response();

    if ( trivialString(userID) || trivialString(itemID) ){
        return res;
    }    

    let user = await getUserByVendorID({ userID: userID, vendorID: vendorID, withPrivateKey: false });    
    let { data } = await getStoryboardItem({ itemID: itemID })

    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return res;
    }

    if (  trivialProps(data,'length') || data.length === 0 ){
        res['message'] = 'item dne'
        return res;
    }


    await fire.firestore
        .collection(DbPaths.stories_board_items)
        .doc(itemID)
        .delete();

    return { success: true, message: 'removed', data: {} }
}


/******************************************************
    @write storyboard patronize 
******************************************************/

/**
 * 
 * @use: when `userID` send `amt_in_wei` to storyboard,
 *       on client side via metamask, record `txHash` and monitor
 *       the `txHash` for completion
 * 
 **/ 
async function patronizeStoryboardInEth({ from_address, to_address, amt_in_wei, userID, txHash, eth_network }){

    var res = default_fn_response();

    if ( trivialString(from_address) ){
        res['message'] = 'please specify from address'
        return response;
    }

    if ( trivialString(to_address) ){
        res['message'] = 'please specify to address'
        return response;
    }

    let num = Number(amt_in_wei);
    if ( illValued(num) ){
        res['message'] = 'please specify send amt'
        return response;
    }

    if ( trivialString(txHash) ){
        res['message'] = 'please specify txHash'
        return response;        
    }

    return await logSendTransactionInEth({
        fn_origin: 'storyboard.patronizeStoryboardInEth',
        from_address: from_address, 
        to_address  : to_address, 
        amt_in_wei  : num, 
        userID      : userID ?? "",
        txHash      : txHash, 
        eth_network : eth_network,
    });
}



/******************************************************
    @delete
******************************************************/


/**
 * 
 * @use: remove all items in storyboard
 * 
 **/
async function remove_storyboard(){

    let ids = [
    ];    

    const rmv_all = await ids.map(async (id) => {
        await go_rmv(id)
    })

    await Promise.all(rmv_all);

    async function go_rmv(storyboardID){

        await fire.firestore
            .collection(DbPaths.stories_boards)
            .doc(storyboardID)
            .delete();    

        var items = [];
        const match_boards = await fire.firestore
            .collection(DbPaths.stories_board_items)
            .where('storyboardID', '==', storyboardID)
            .get();

        if ( !match_boards.empty ){
            match_boards.forEach(doc => {
                if ( !trivialProps(doc,'data') ){
                    items.push(doc.data().ID);
                }
            })
        }

        const rmv_all_items = await items.map( async (itemID) => {
            await fire.firestore
                .collection(DbPaths.stories_board_items)
                .doc(itemID)
                .delete();        
        })

        await Promise.all(rmv_all_items);

        var collabs = [];
        const mlabs = await fire.firestore
            .collection(DbPaths.stories_board_items_collabs)
            .where('storyboardID', '==', storyboardID)
            .get();

        if ( !mlabs.empty ){
            mlabs.forEach(doc => {
                if ( !trivialProps(doc,'data') ){
                    collabs.push(doc.data().ID);
                }
            })
        }        

        const rmv_all_collabs = await collabs.map(async (cid) => {
            await fire.firestore
                .collection(DbPaths.stories_board_items_collabs)
                .doc(cid)
                .delete();        
        })
        await Promise.all(rmv_all_collabs);

    }
}


/******************************************************
    @exports
******************************************************/


// write project
exports.createProject      = createProject;
exports.editProject        = editProject;
exports.editProjectPrivacy = editProjectPrivacy;

// write storyboard
exports.createStoryBoard     = createStoryBoard;
exports.editStoryBoard       = editStoryBoard;
exports.createStoryBoardItem = createStoryBoardItem;
exports.editStoryBoardItem   = editStoryBoardItem;
exports.removeStoryBoardItem = removeStoryBoardItem;
exports.maybe_premint_ticket = maybe_premint_ticket;

// write trailer
exports.uploadTrailer = uploadTrailer
exports.getTrailer    = getTrailer
exports.patronizeStoryboardInEth = patronizeStoryboardInEth;













