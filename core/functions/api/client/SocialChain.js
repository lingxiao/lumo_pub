/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: Social chain logic
 * @Date   : Aug 23rd
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
const functions = require('firebase-functions');

const {
    fetch_all,
    fetch_many,
    fetch_one,
    write_to_db,
    update_db,
    fetch_many_2,
    fetch_one_2,
} = require('./../fire');

const { 
    swiftNow, 
    trivialProps, 
    trivialNum, 
    trivialString,    
    ppSwiftTime,
    force_to_num,
} = require('./../utils');

const {
    DbPaths, 
    make_production_web3_account,
    store_keys_in_lumo_core,
    network_flow_to_eth,
    default_fn_response,
    ItemMintState,
    current_eth_network,
    generate_tok_id,
    ContractKind,
    BlockState,
    MemberPermission,
    default_db_blob,    
    LumoDispenseEvent,
    lumo_social_chain_mining_rate,
} = require('./../core');


const { 
    getUserByVendorID, 
} = require('./accounts');

const {
    deploy_custodial_contract_on_polygon
} = require("./../../ethcontracts/scripts/polygon+mint");

const {
    fetch_rewards,
    reward_write_manifesto,
} = require('./SocialChain+reward.js')

// mining rate is 7 days
const { addPool } = require("./../eth/lumoStakingPool");


/******************************************************
    @write/read chain
******************************************************/

const BLOCK_MINING_RATE = lumo_social_chain_mining_rate();


async function create_chain({ userID, name, about, symbol, subdomain, then }){

    var res = default_fn_response({ data: {} });


    if ( trivialString(userID) ){
        res['message'] = 'please specify user-id';
        return then(res);
    }

    let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });

    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return then(res);
    }   

    const { address, privateKey } = make_production_web3_account();

    let id    = address; 
    let _time = swiftNow();

    // @src: https://stackoverflow.com/questions/4328500/how-can-i-strip-all-punctuation-from-a-string-in-javascript-using-regex
    let _user_name = trivialString(user.name) || user.name === "" ? (user.twitterUserName ?? "") : user.name;
    let _burn_name = trivialString(name) || name === "" ? _user_name : name;
    let url                   = (_burn_name ?? "").replace(/\s/g,'').toLowerCase().replace(/[^\w\s\']|_/g, "").replace(/\s+/g, " ");
    let well_formed_subdomain = (subdomain ?? "").replace(/\s/g,'').toLowerCase().replace(/[^\w\s\']|_/g, "").replace(/\s+/g, " ");

    let _subdomain_ = trivialString(well_formed_subdomain) || well_formed_subdomain === ""
        ? url
        : String(well_formed_subdomain);
    
    let _subdomain = await fetch_unique_subdomain({ subdomain: _subdomain_, max_depth:10, iter:0 });

    let expire = _time + lumo_social_chain_mining_rate();

    var blob = {
        ID       : id,
        chain_id : id,
        userID   : userID,
        network  : current_eth_network(),

        // eth acct/subdomain
        eth_address : address,
        subdomain   : _subdomain ?? "",
        mining_rate : BLOCK_MINING_RATE,
        lumo_whitelist_hash: "",
        gnosis_address     : "",        

        // stats + pay
        total_lumo_gifted: 0,
        can_receive_payment: false,
        can_mint: false,

        // project name + about
        name      : _burn_name  ?? "",
        about     : about ?? "",
        symbol    : symbol ?? "",
        twitter   : "",
        instagram : "",
        youtube   : "",
        website   : "",
        discord   : "",
        imdb      : "",

        // forking chain meta
        prev_chain_id: "",
        prev_chain_fork_item_id: "",

        timeStampCreated  : _time,
        timeStampLatest   : _time,
        timeStampCreatedPP: ppSwiftTime(_time) ?? "",
        timeStampLatestPP : ppSwiftTime(_time) ?? "",

        timeStampLatestBlockExpire: expire,
        timeStampLatestBlockExpirePP: ppSwiftTime(expire) ?? "",
        latest_block_id: ""
    }

    // @Important: store keys on seraprate server
    var key_blob = {
        address    : address,
        privateKey : privateKey,
        network    : network_flow_to_eth(current_eth_network()),
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

                let did = await write_to_db({ 
                    ID  : id, 
                    blob: blob, 
                    path: DbPaths.social_chain_root, 
                });

                if ( did ){

                    // await create_block({ chain_id: id });

                    // create item for author
                    let user_social_name = user.twitterUserName ?? (user.instagramUserName ?? "");
                    let username = trivialString(user.name)
                        ? user_social_name
                        : (user.name ?? "")

                    // submit `userID` to block nomination
                    let submit_user_res = await submit_block_item({
                        userID, 
                        chain_id      : id,
                        nomination_id : "",
                        title         : username,
                        about         : user.about ?? "",
                        image_url     : user.profile_image,
                        image_preview_url: user.profile_image,
                        perm: MemberPermission.admin,
                    });

                    // reward manifesto write
                    await reward_write_manifesto({ chain_id: id, userID: userID, then: (_) => {
                        then({      
                            success: true, 
                            message: `created the chain and added block-0`, 
                            data: blob,
                        });
                    }});

                    // 3. [skipped] add social-chain address to staking pool w/ minimum 1min lockup period               

                    // 4. [skipped] on this version
                    // deploy polygon contract, do not wait for it to finish;
                    // note you do not wait for side chain to be deployed and its
                    // contract to be whitelisted on lumo erc20 
                    // await deploy_sidechain_contract_for_chain({
                    //     chain_id: id,
                    //     then: (res) => { return }
                    // });

                } else {

                    res['message'] = 'failed to initialize new chain'
                    return then(res);
                }
            }
        }
    });
}


//@use: get unique subdomain given suggested
async function fetch_unique_subdomain({ subdomain, max_depth, iter }){
    let { data } = await fetch_chain_id_by_subdomain({ subdomain });
    if ( trivialProps(data,'ID') ){
        return subdomain;
    } else if ( iter > max_depth ){
        return `${subdomain}_${uuid.v4()}`;
    } else {
        return await fetch_unique_subdomain({ subdomain: `${subdomain}_1`, max_depth, iter: iter + 1 });
    }
}


/**
 * @use: setup chain by whitelisting its address on LumoStakingContract
 * 
**/
async function finish_chain_setup({ chain_id, userID, then }){

    // 1. add chain to staking pool
    await addPool({ 
        lockupPeriod: 60, 
        poolAddress : chain_id,
        then: async ({ success, message }) => { 
            if ( !success ){
                then({  
                    success: false,
                    message: `created the chain but failed to whitelist staking pool: ${message}`, 
                    data: {},
                });
            }
        },
        then_watching: async ({ success, hash }) => {
            if ( success && !trivialString(hash) ){
                await update_db({
                    ID: chain_id, 
                    path: DbPaths.social_chain_root,
                    blob: { 
                        lumo_whitelist_hash: hash, 
                    }
                })
            }
            then({  
                success: did,
                message: `created chain and added to staking pool`,
                hash: hash, 
                data: {},
            })       
        }
    });        
}


/**
 * 
 * @use: update chain root
 * 
 **/
async function update_chain_root({
    userID,
    chain_id,
    about,
    twitter,
    discord,
    website,
    instagram,
    youtube,
    imdb,
}){

    var res = default_fn_response({ data: {} });

    if ( trivialString(userID) ){
        res['message'] = 'please specify user-id';
        return res;
    }

    // check user exist
    let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });
    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return res;
    }   

    let { root } = await fetch_chain({ chain_id: chain_id ?? "", full: false });

    if ( trivialProps(root,'ID') ){
        res['message'] = 'burn not found'
        return res;
    }

    if ( root.userID !== userID ){
        res['message'] = 'only burn owner can update the burn'
        return res;
    }

    var blob = {};
    if ( !trivialString(about) ){
        blob['about'] = about;
    }
    if ( !trivialString(discord) ){
        blob['discord'] = discord;
    }
    if ( !trivialString(website) ){
        blob['website'] = website;
    }
    if ( !trivialString(instagram) ){
        blob['instagram'] = instagram;
    }
    if ( !trivialString(youtube) ){
        blob['youtube'] = youtube;
    }
    if ( !trivialString(twitter) ){
        blob['twitter'] = twitter ?? "";
    }
    if ( !trivialString(imdb) ){
        blob['imdb'] = imdb ?? "";
    }

    let did = await update_db({
        ID: chain_id, 
        path: DbPaths.social_chain_root,
        blob: blob,
    });

    if ( !trivialString(about) ){
        await update_db({
            ID: `${chain_id}_0`,
            path: DbPaths.social_chain_block,
            blob: { about: about ?? "" },
        });    
    }

    return did ? { success: true, message: 'updated' } : { success: false, message: "failed to update" }

}


/**
 * 
 * @use: fetch chain by subdomain
 * 
 **/
async function fetch_chain_id_by_subdomain({ subdomain }){

    var res = default_fn_response({  data:{} });    
    let by_dom = await fetch_many({ path: DbPaths.social_chain_root, field: "subdomain", value: subdomain ?? "" });

    if ( by_dom.length > 0 ){
        return { success: true, message: 'found burn', data: by_dom[0] }
    } else {
        res['message'] = 'burn not found'
        return res;
    }
}




/**
 * 
 * @use: fetch chain by `id`, `symbol` or `subdomain`
 *      if `full`, then get entire chain
 * 
 **/
async function fetch_chain({ chain_id, symbol, subdomain, full, partial }){

    var res = default_fn_response({ 
        data             : {}, 
        root             : {},
        blocks           : [], 
        items            : [],
        rewards          : [],
        gifts            : [],
        nominations      : [],
        eth_contract     : {},
        polygon_contract : {},
    });    

    let by_id  = await fetch_many({ path: DbPaths.social_chain_root, field: "ID"       , value: chain_id  ?? "" });
    let by_sym = await fetch_many({ path: DbPaths.social_chain_root, field: "symbol"   , value: symbol    ?? "" });
    let by_dom = await fetch_many({ path: DbPaths.social_chain_root, field: "subdomain", value: subdomain ?? "" });

    let all_roots = by_id.concat(by_sym).concat(by_dom);

    if (  all_roots.length === 0 ){
        res['message'] = 'found zero chains'
        return res;
    }

    let root = all_roots[0];
    
    if ( !full && !partial ){

        res['success'] = 'fetched root';
        res['data'] = root;
        res['root'] = root;
        return res;

    } else if ( partial ) {

        // let rewards   = await fetch_rewards({ chain_id: chain_id ?? "" });
        let { users } = await fetch_chain_users({ chain_id: root.chain_id ?? "" });
        
        return { 
            success: true, 
            data: root, 
            root: root,
            blocks: [], 
            message: `fetched partial chain`,
            items: users ?? [],
            rewards: [], //rewards.data ?? [],
            gifts  : [],
            staking_txs: [],
            nominations: [],
        }

    } else {

        // let _blocks = await fetch_block_root({ chain_id, symbol, subdomain })
        // let blocks = trivialProps(_blocks,'data') ? [] : (_blocks.data ?? []);

        let rewards     = await fetch_rewards({ chain_id: chain_id ?? "" });
        let nominations = await fetch_many({ 
            path: DbPaths.social_chain_nominations,
            field: "chain_id",
            value: root.chain_id ?? "",
        })

        // @TODO: do not fetch all the gifts, only fetch on
        // maximal recurisve fetch, because it's too expensive.
        let gifts = await fetch_gift_txs({ chain_id });
        let { users } = await fetch_chain_users({ chain_id: root.chain_id ?? "" });

        //let { polygon_contract, eth_contract } = await fetch_contracts({ chain_id });
        return { 
            success: true, 
            data: root, 
            root: root,
            blocks: [],
            message: 'found chain', 
            items: users ?? [],
            rewards: rewards.data ?? [],
            gifts  : gifts.data ?? [],
            staking_txs: [],
            nominations: nominations,
            // eth_contract, 
            // polygon_contract,
        }

    }
}


/**
 * @Use: fetch chain user
 * 
 **/
async function fetch_chain_users({ subdomain, chain_id }){

    var res = default_fn_response({  data:[] });        

    if ( trivialString(subdomain) && trivialString(chain_id) ){
        return res;
    }

    var _chain_id = chain_id
    if (trivialString(chain_id)){
        let { data } = await fetch_chain_id_by_subdomain({ subdomain });
        _chain_id = trivialProps(data,'chain_id') ? "" : data.chain_id;
    }

    if ( trivialString(subdomain) && trivialString(_chain_id) ){
        return res;
    }

    let users = await fetch_many({ 
        field: 'chain_id',
        value: _chain_id,
        path: DbPaths.social_chain_users,
    });

    res['users'] = users;
    res['data'] = users;
    res['success'] = true;
    return res;
}


/**
 * 
 * @use: fetch all chains roots
 * 
 **/
async function fetch_all_chains({ userID }){
    var chains = [];
    if ( !trivialString(userID) ){
        chains = await fetch_many({ path: DbPaths.social_chain_root, field: "userID", value: userID })
    }
    return { success: true, message:  `found ${chains.length} chains`, data: chains }
}



/**
 * 
 * @use: get all items frm userID across chain-id
 * 
 **/
async function fetch_chain_containing({ userID }){

    var res = default_fn_response({ chains: [], nominations: [], items: [] });    
    let user = await getUserByVendorID({ userID: userID ?? "", vendorID: "", withPrivateKey: false });

    if ( trivialString(userID) || trivialProps(user,'userID') ){
        res['message'] = 'please specify userid';
        return res;
    }

    var noms  = [];
    let items = await fetch_many({ path: DbPaths.social_chain_users, field: 'userID' , value: userID });

    let sigs = await fetch_many_2({ 
        field1: 'userID',
        value1: userID  ,
        field2: 'event' ,
        value2: LumoDispenseEvent.sign_manifesto,
        path: DbPaths.social_chain_reward_lumo  ,
    });    

    if ( !trivialString(user.twitterUserName) ){
        let _xs = await fetch_many({ path: DbPaths.social_chain_nominations, field: "tgtTwitterName", value: user.twitterUserName });
        noms = noms.concat(_xs)
    }
    if ( !trivialString(user.twitterUserID) ){
        let _zs = await fetch_many({ path: DbPaths.social_chain_nominations, field: "tgtTwitterUserID", value: user.twitterUserID });
        noms = noms.concat(_zs)        
    }
    let _ys = await fetch_many({ path: DbPaths.social_chain_nominations, field: "tgtUserID", value: user.userID });
    noms = noms.concat(_ys)        


    // get all chain ids where i signed or have been admitted
    let chains_ids = Array.from(new Set(
        []
        .concat( items.map(i => i.chain_id) )
        .concat( sigs.map(i => i.chain_id) )
    ))
    var chains = [];
    let fetch_roots = chains_ids.map(async id => {
        let root = await fetch_one({ path: DbPaths.social_chain_root, field: "ID", value: id })
        if (!trivialProps(root,'ID') ){
            chains.push(root)
        }
    })
    await Promise.all(fetch_roots);

    // filter out accepted nominations
    noms = noms.filter(nom => {
        return chains_ids.includes(nom.chain_id) === false;
    });

    var unique_noms = {};
    noms.forEach(nom => { 
        unique_noms[nom.chain_id] = nom;
    })
    unique_noms = Object.values(unique_noms);

    // populate response
    res['success']     = true
    res['items']       = items;
    res['chains']      = chains;
    res['nominations'] = unique_noms;
    res['message']     = `found ${chains.length} burns`

    return res;
}




/******************************************************
    @write/read block items
******************************************************/

/**
 * 
 * @use: submit item to social chain. Note this is a firebase
 *       only operation, but a tok-id will be specified here
 * 
 **/
async function submit_block_item({ 

    chain_id,
    nomination_id,
    symbol, 
    subdomain,    

    userID,
    perm,

    title, 
    about, 
    video_url, 
    image_url,
    image_preview_url, 
    video_preview_url 
}){

    var res = default_fn_response({ data: {} });    

    if ( trivialString(userID) ){
        res['message'] = 'please specify user-id';
        return res;
    }

    // check user exist
    let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });

    if ( trivialProps(user,'userID') ){
        res['message'] = 'cannot submit item: user does not exist'
        return res;
    }   

    let { data } = await fetch_chain({ chain_id: chain_id ?? "", symbol: symbol ?? "", subdomain: subdomain ?? "", full: true });
    if ( trivialProps(data,'ID') ){
        res['message'] = 'burn dne'
        return res
    }

    // check item dne;
    let prev_item = await fetch_one_2({ 
        field1: 'chain_id',
        value1: chain_id ?? "",
        field2: 'userID',
        value2:  userID ??"",
        path: DbPaths.social_chain_users, 
    });

    if ( !trivialProps(prev_item, 'userID') ){
        res['success'] = true;
        res['message'] = 'already a member';
        return res;
    }

    let _time = swiftNow();
    let id    = `${chain_id}_${userID}_${_time}`;

    let blob = default_db_blob({

        ID: id,
        itemID: id,
        chain_id: chain_id,

        userID: userID ?? "",
        nominationID: nomination_id ?? "",
        permission: trivialString(perm) ? MemberPermission.t2 : perm, 

        title     : title ?? "", 
        about     : about ?? "", 
        video_url : video_url ?? "", 
        image_url : image_url ?? "",
        image_preview_url : image_preview_url ?? "", 
        video_preview_url : video_preview_url ?? "", 

        num_tabs_gifted   : 0.0,
        initiation_names  : [],
        initiation_userIds: [],
    });

    let did = await write_to_db({ path: DbPaths.social_chain_users, ID: id, blob: blob });
    res['success'] = did;
    res['message'] = did ? 'logged' : 'fail to log item';
    res['data']    = blob;
    return res;        
}


/**
 * 
 * @Use: edit block item
 * 
 **/
async function edit_block_item({ 
    userID, 
    itemID, 
    video_url,
    image_url, 
    image_preview_url, 
    video_preview_url 
}){

    var res = default_fn_response({ data: {} });    

    if ( trivialString(userID) ){
        res['message'] = 'please specify user-id';
        return res;
    }

    // check user exist
    let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });

    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return res;
    }   

    // get item
    const { data } = await fetch_block_item({ itemID });

    if ( trivialProps(data,'ID') ){
        res['message'] = 'item dne';
        return res;
    }

    var update = {};

    if ( !trivialString(image_url) ){
        update['image_url'] = image_url
    }

    if ( !trivialString(video_url) ){
        update['video_url'] = video_url;
    }

    await update_db({
        ID: itemID,
        path: DbPaths.social_chain_users,
        blob: update,
    });
}


/******************************************************
    @fetch block items
******************************************************/

/**
 * 
 * @use: get all items by chain-id
 * 
 **/
async function fetch_chain_items({ chain_id }){

    var res = default_fn_response({ data: [] });    

    if ( trivialString(chain_id) ){
        res['message'] = 'please specify chain_id';
        return res;
    }

    let items = await fetch_many({ path: DbPaths.social_chain_users, field: 'chain_id' , value: chain_id });
    res['success'] = true
    res['message'] = `found ${items.length} items`
    res['data']    = items;

    return res;
}





/**
 * 
 * @Use: get one item from the block 
 * 
 **/
async function fetch_block_item({ itemID }){
    var res = default_fn_response({ data: [] })
    let item       = await fetch_one({ path: DbPaths.social_chain_users, field: 'ID' , value: itemID ?? "" });
    res['success'] = !trivialProps(item,'ID')
    res['message'] = `found item: ${item.ID ?? ""}`
    res['data']    = item;
    return res;
}


/**
 * 
 * @use: fetch all send tx for chain_id
 * 
 **/
async function fetch_gift_txs({ chain_id }){

    var res = default_fn_response({ data: [] });    

    if ( trivialString(chain_id) ){
        res['message'] = 'please specify chain_id';
        return res;
    }

    let items = await fetch_many({ path: DbPaths.social_chain_send_lumo, field: 'tgtChainID' , value: chain_id });
    res['success'] = true
    res['message'] = `found ${items.length} gifts`
    res['data']    = items;
    return res;

}




/******************************************************
    @export
******************************************************/

exports.create_chain = create_chain;
exports.fetch_chain  = fetch_chain;
exports.fetch_all_chains = fetch_all_chains;
exports.fetch_chain_id_by_subdomain = fetch_chain_id_by_subdomain
exports.fetch_chain_users = fetch_chain_users
exports.fetch_chain_containing = fetch_chain_containing;

exports.finish_chain_setup   = finish_chain_setup
exports.update_chain_root    = update_chain_root;

exports.submit_block_item = submit_block_item
exports.edit_block_item   = edit_block_item

exports.fetch_block_item  = fetch_block_item
exports.fetch_chain_items = fetch_chain_items;





