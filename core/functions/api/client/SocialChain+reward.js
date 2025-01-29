/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: Social chain system reward functions
 * @Date   : 9/10
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


const {
    write_to_db,
    update_db,
    fetch_many,
} = require('./../fire');

const { 
    trivialProps, 
    trivialNum, 
    trivialString,
    cap,
    swiftNow,
} = require('./../utils');


const { 
    getUserByVendorID, 
    incr_amt_lumo_given,
} = require('./accounts');


const {
    DbPaths, 
    default_fn_response,
    lumo_decimals,
    default_db_blob,
    lumo_dispensary,
    admin_eth_keys,
} = require('./../core');


const {
    offchain_mint_lumo_to,
    offchain_send_lumo_to,
} = require("./../eth/lumoOffChain");



/******************************************************
    @rewards read
******************************************************/

/**
 * 
 * @use: fetch all rewards for this chain
 * 
 **/
async function fetch_rewards({ chain_id }){
    let res = await fetch_many({ path: DbPaths.social_chain_reward_lumo, field: "chain_id", value: chain_id  ?? "" });
    return { success: true, message: `found ${res.length} rewards`, data: res }
}


/**
 * 
 * @use: get recent rewards for userID
 * 
 **/
async function fetch_recent_rewards({ userID, num_days }){

    var res = default_fn_response({ rewards: [], sends: [] });

    if ( trivialString(userID) ){
        return res;
    }

    var _num_days = Number(num_days);
    _num_days = trivialNum(_num_days) ? 21 : _num_days;

    let rs = await fetch_many({ path: DbPaths.social_chain_reward_lumo, field: "userID", value: userID  });
    let ss = await fetch_many({ path: DbPaths.social_chain_send_lumo, field: "tgtUserID", value: userID });

    // activity last 21 days
    let now = swiftNow();
    let dt  = 60*60*24*21;

    let rs_short = rs.sort((a,b) => {
        return b.timeStampCreated - a.timeStampCreated
    })
    // .filter(m => {
    //     return now - m.timeStampCreated  < dt
    // })
    // .slice(0,_max)

    let ss_short = ss.sort((a,b) => {
        return b.timeStampCreated - a.timeStampCreated
    })
    .filter(m => {
        return now - m.timeStampCreated  < dt
    })

    res['success'] = true;
    res['message'] = `found ${rs_short.length + ss_short.length} items`
    res['rewards'] = rs_short;
    res['sends']   = ss_short;

    return res;

}


/******************************************************
    @rewards write
******************************************************/

/**
 * 
 * @use: reward writing manifest 
 * 
 **/
async function reward_write_manifesto({ userID, chain_id, then }){
    const { LumoDispenseEvent, reward } = lumo_dispensary();
    return await go_reward({
        userID,
        chain_id,
        block_id: "",
        on_chain: false,
        reward_evt: LumoDispenseEvent.write_manifesto,
        then,
    })
}

/**
 * 
 * @use: sign manfiesto
 * 
 **/
async function reward_sign_manifesto({ userID, chain_id, block_id, signer_metamask_pk, then }){
    const { LumoDispenseEvent, reward } = lumo_dispensary();
    return await go_reward({
        userID,
        chain_id,
        block_id,
        reward_evt: LumoDispenseEvent.sign_manifesto,
        on_chain: false,
        signer_metamask_pk: signer_metamask_pk ?? "",
        then
    })
}



// @use: reward fn
async function go_reward({ userID, chain_id, reward_evt, block_id, on_chain, signer_metamask_pk, then  }){

    var res = default_fn_response({ data: {} });

    if ( trivialString(userID) || trivialString(chain_id) || trivialString(reward_evt) ){
        return then(res)
    }

    let user = await getUserByVendorID({ userID, vendorID: "", withPrivateKey: false });
    if (  trivialProps(user,'userID') ){
        return then(res)
    }    

    const { reward } = lumo_dispensary();
    let amt_in_lumo = reward(reward_evt)
    let blob = default_db_blob({
        userID,
        chain_id,
        event: reward_evt,
        reward: amt_in_lumo,
        amt_in_lumo: amt_in_lumo,
        mint_hash: "",
        block_id: block_id ?? "",
        airdrop_failed: false,
        signer_metamask_pk: signer_metamask_pk ?? "",
    });

    await write_to_db({
        ID  : blob.ID,
        path: DbPaths.social_chain_reward_lumo,
        blob: blob,
    });            

    res['success'] = true;
    res['message'] = "saved promise to airdrop lumo"
    return then(res);

}

/******************************************************
    @us: respond to db command
******************************************************/


/***
 *
 *  @use: respond to db command and send on chain
 * 
 **/
async function airdrop_lumo_reward({ ID, userID, reward, amt_in_lumo, then }){

    var res = default_fn_response({ data: {} });

    if ( trivialString(userID) || trivialString(ID) ){
        return then(res)
    }

    let airdrop_amt = trivialNum(amt_in_lumo) ? reward : amt_in_lumo;
    let offchain_res = await offchain_mint_lumo_to({ userID, amt_in_lumo: airdrop_amt });    
    return then(offchain_res);
}


// @use: airdrop lumo then update db
async function send_lumo_on_chain({ ID, srcUserID, tgtUserID, srcPk, tgtPk, amt_in_lumo, then }){

    var res = default_fn_response({ data: {} });

    if ( trivialString(srcPk) || trivialString(tgtPk) ){
        res['message'] = 'ill valued src or tgt pk'
        return then(res)
    }

    if ( trivialNum(amt_in_lumo) ){
        res['message'] = 'ill valued amt_in_lumo';
        return then(res);
    }

    await _go_incr_amt_lumo_given ({ srcUserID, amt_in_lumo })

    let offchain_res =  await offchain_send_lumo_to({
        srcUserID: srcUserID,
        tgtUserID: tgtUserID,
        amt_in_lumo: amt_in_lumo ?? 0,
    });
    return then(offchain_res);

}

// increment in user's base datasouce 
async function _go_incr_amt_lumo_given({ srcUserID, amt_in_lumo }){
    if ( !trivialString(srcUserID) ){
        try {
            await incr_amt_lumo_given ({ userID: srcUserID, amt_in_lumo })
        } catch (e){
            return
        }
    } else {
        return
    }
}



/******************************************************
    @export
******************************************************/

exports.fetch_rewards = fetch_rewards
exports.reward_write_manifesto = reward_write_manifesto;
exports.reward_sign_manifesto = reward_sign_manifesto
exports.fetch_recent_rewards  = fetch_recent_rewards

exports.airdrop_lumo_reward  = airdrop_lumo_reward;
exports.send_lumo_on_chain   = send_lumo_on_chain;






























