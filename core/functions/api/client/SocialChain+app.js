/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: Social chain application specific functions
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


const referralCodes = require("referral-codes");

const {
    firestore,
    fetch_many,
    fetch_one,
    fetch_many_2,
    fetch_one_2,
    write_to_db,
    update_db,
    remove_from_db,
    fetch_all,
} = require('./../fire');

const { 
    cap,
    trivialProps, 
    trivialNum, 
    trivialString,
    swiftNow,
    force_to_num,
    ppSwiftTime,
} = require('./../utils');


const { 
    getUserByVendorID, 
    incr_amt_lumo_given
} = require('./accounts');


const {
    DbPaths, 
    MemberPermission,
    default_fn_response,
    lumo_decimals,
    lumo_price_in_cents,
    default_db_blob,
    admin_eth_keys,
    lumo_dispensary,
    mk_expire_timestamp,
    LumoDispenseEvent,
    lumo_social_chain_refresh_rate,
    lumo_social_chain_refresh_rate_for_purchase,
} = require('./../core');


const {
    offchain_mint_lumo_to,
    offchain_send_lumo_to,
    offchain_balance_of_lumo,
} = require('./../eth/lumoOffChain');

const {
    charge_customer_and_confirm_charge,
} = require('./../stripe/userPayment');

const {
    fetch_chain,
    submit_block_item,
    fetch_block_item,
} = require('./SocialChain');

const {
    reward_sign_manifesto,    
} = require('./SocialChain+reward');

const {
    satisify_all_liquidity_provisions
} = require("./SocialChain+provision")


/******************************************************
    @application hard settng for nominations
******************************************************/


/**
 * 
 * @Use: make invite code for client side consumption
 **/
function make_invite_code(){
    let codes = referralCodes.generate({ length: 8, count: 1 });
    let code = codes.length > 0 ? codes[0] : "";
    var res = default_fn_response({ code: code });
    res['success'] = true
    res['message'] = 'generated code'
    return res;
}




/**
 * 
 * @use: given code , get nomination
 * 
 **/
async function fech_nomination({ inviteCode }){

    var res = default_fn_response({ data: {} });

    if ( trivialString(inviteCode) ){
        res['message'] = 'invalid invite code'
        return res;
    }

    let nomination = await fetch_one({ 
        field: 'inviteCode',
        value: inviteCode ?? "",
        path: DbPaths.social_chain_nominations,
    })

    if ( trivialProps(nomination, 'userID') ){
        res['message'] = 'this invite code is no longer valid'
        return res;
    }

    res['data'] = nomination;
    res['success'] = true
    res['message'] = 'found nomination';
    return res;
}



/**
 * 
 * @use: fetch all nominatiosn sent to user at tgtUserID/tgtTwitterUserID
 *       filter out expired and cliamed nomintations
 * 
 **/
async function fetch_all_nominations_for({ tgtTwitterUserID, tgtUserID }){

    var res = default_fn_response({ data: [] });
    if ( trivialString(tgtTwitterUserID) && trivialString(tgtUserID) ){
        res['message'] = 'no profile provided';
        return res;
    }

    var nominations = []

    if ( !trivialString(tgtTwitterUserID) ){
        let noms = await fetch_many({ 
            path: DbPaths.social_chain_nominations, 
            field: "tgtTwitterUserID",
            value: tgtTwitterUserID ?? "" 
        });
        nominations = nominations.concat(noms)
    }
    if ( !trivialString(tgtUserID) ){
        let noms_uid = await fetch_many({ 
            path: DbPaths.social_chain_nominations, 
            field: "tgtUserID",
            value: tgtUserID ?? "",
        });
        nominations = nominations.concat(noms_uid)
    }

    var uniques = {}
    nominations.forEach(nom => {
        if ( !nom.claimed && nom.timeStampExpire > swiftNow() ){
            uniques[nom.ID] = nom;
        }
    })
    var final_noms = Object.values(uniques);

    res['success'] = true;
    res['message'] = `found ${final_noms.length} nominations`;
    res['data'] = final_noms;
    return res;
}


/**
 * 
 * @use: nominate leader by sending one lumo token back to 
 *       the admin address. write promise to send lumo token
 * 
 **/
async function nominate_leader({ 
    userID, 
    chain_id, 
    clientInviteCode,
    tgtUserID, 
    tgtTwitterName, 
    tgtTwitterUserID,
    isGeneral, 
    perm,
}){

    var res = default_fn_response({ data: {}, balance: 0 });

    // need either twitter id or userid
    let no_tgt = trivialString(tgtUserID) && trivialString(tgtTwitterName) && trivialString(tgtTwitterUserID)

    let is_gen  = (typeof isGeneral === 'boolean' && isGeneral)
        || (typeof isGeneral === 'string' && isGeneral === "true" );

    if ( no_tgt && !is_gen ){
        res['message'] = 'please nominate someone';
        return res;
    }

    // check user exist
    let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });
    if ( trivialProps(user,'userID') ){
        res['message'] = 'user does not exist'
        return res
    }       

    let { root } = await fetch_chain({ chain_id: chain_id ?? "", full: false });
    if ( trivialProps(root,'chain_id') ){
        res['message'] = 'burn event does not exist';
        return res
    }

    let { balance } = await offchain_balance_of_lumo({ userID })
    res['balance'] = balance;

    const { public } = await admin_eth_keys();
    const { LumoDispenseEvent, reward } = lumo_dispensary();
    let reward_evt = LumoDispenseEvent.accept_nomination;
    let amt_in_lumo = reward(reward_evt)

    // core team do not need repuutation
    if ( balance < amt_in_lumo && perm !== MemberPermission.t1 ){
        res['message'] = `insufficent balance for nominations`;
        return res;
    }    

    // determine if invite already exists
    var prev_invites = []

    if ( !trivialString(tgtUserID) ){
        prev_invites = await fetch_many_2({ 
            field1: 'chain_id',
            value1: chain_id,
            field2: 'tgtUserID',
            value2: tgtUserID,
            path: DbPaths.social_chain_nominations,
        });
    } else if ( !trivialString(tgtTwitterUserID) ){
        prev_invites = await fetch_many_2({ 
            field1: 'chain_id',
            value1: chain_id,
            field2: 'tgtTwitterUserID',
            value2: tgtTwitterUserID,
            path: DbPaths.social_chain_nominations,
        });        
    } else if ( !trivialString(tgtTwitterName) ){
        prev_invites = await fetch_many_2({ 
            field1: 'chain_id',
            value1: chain_id,
            field2: 'tgtTwitterName',
            value2: tgtTwitterName,
            path: DbPaths.social_chain_nominations,
        });        
    }

    // return early if prior invite exists
    if (prev_invites.length > 0 && !is_gen ){
        res['success'] = true;
        res['message'] = 'An invite was already sent to this person'
        res['data']    = prev_invites[0]
        return res;
    }

    // send lumo tok back to admin
    // when invite is accepted, mint new lumo token
    // to the target
    var send_tx = {}
    if ( perm !== MemberPermission.t1 ){
        send_tx = default_db_blob({
            srcUserID   : userID,
            srcPk       : user.custodial_ethereum_address ?? "",
            tgtPk       : public ?? "",
            tgtUserID   : "",
            tgtItemID   : "",
            tgtChainID  : chain_id ?? "",
            tgtBlockID  : "",
            amt_in_lumo : amt_in_lumo ?? 0,
            send_hash   : "",
            send_message: "",
            send_failed : false,
            event       : reward_evt,
        });
        await write_to_db({
            ID: send_tx.ID,
            path: DbPaths.social_chain_send_lumo,
            blob: send_tx,
        });
    }

    let _codes = referralCodes.generate({ length: 8, count: 1 })
    let code = trivialString(clientInviteCode)
        ? ( _codes.length > 0 ? _codes[0] : "" )
        : clientInviteCode;

    let hostName = trivialProps(user,'name')
        ? (user.twitterUserName ?? "")
        : user.name;

    // log invite link
    var invite_link = default_db_blob({
        userID,
        hostName         : hostName,
        inviteCode       : code,

        // invite by twitter
        tgtUserID        : tgtUserID ?? "",
        tgtTwitterName   : tgtTwitterName ?? "",
        tgtTwitterUserID : tgtTwitterUserID ?? "", 

        // invite by instagram
        tgtInstagramUserID: "",
        tgtInstagramUserName: "",

        send_lumo_tx_id  : trivialProps(send_tx,'ID') ? "" : send_tx.ID,        
        chain_id         : chain_id ?? "",
        block_id         : "",
        claimed          : false,
        claimedUserID    : "",
        isGeneral        : is_gen,
        permission  : trivialString(perm) ? MemberPermission.t2 : (perm ?? ""),
        ...mk_expire_timestamp(60*60*48),
    });
    invite_link.ID = code;
    await write_to_db({
        ID: invite_link.ID,
        path: DbPaths.social_chain_nominations,
        blob: invite_link,
    });

    res['success'] = true;
    res['message'] = 'nominated'
    res['balance'] = Math.max(0,balance - 1)
    res['data'] = invite_link;
    return res
}




/**
 * 
 * @use: accept nomination, send lumo token from admin address
 *       to this. if token dne, then mint lumo tok and send to user
 *       add user to nomination pool for voting booth
 * 
 **/
async function accept_nomination({ userID, inviteCode, image_url, image_preview_url }){

    var res = default_fn_response({ data: {} });

    if ( trivialString(inviteCode) ){
        res['message'] = 'invalid invite code'
        return res;
    }

    // check user exist
    let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });
    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return res;
    }       

    let nomination = await fetch_one({ 
        field: 'inviteCode',
        value: inviteCode ?? "",
        path: DbPaths.social_chain_nominations,
    });

    if ( trivialProps(nomination, 'userID') ){
        res['message'] = 'this invite code is no longer valid'
        return res;
    }

    let { 
        chain_id,
        claimed, 
        timeStampExpire,
        tgtUserID, 
        tgtTwitterUserID,
        tgtTwitterName,
        isGeneral,
        claimedUserID,
        permission
    } = nomination;


    // if nomination is general
    // then have the user sign the nomination instead. 
    // and then create an item where the nominee is the
    // person that has penned the manifesto
    if ( isGeneral ){

        return await go_accept_nomination();

    } else {


        if ( claimed ){
            if ( claimedUserID === userID ){
                res['success'] = true;
                res['message'] = 'You have already accepted the nomination';
                res['data'] = nomination;
                return res;
            } else {
                res['message'] = `This invite was claimed by someone else`;
                return res;
            }
        } else {

            let not_for_me = user.twitterUserID !== tgtTwitterUserID //&& ( !trivialString(tgtUserID) && tgtUserID !== userID  );
            if ( not_for_me && !isGeneral ){
                res['message'] = `This invite was sent to ${tgtTwitterName}`
                return res;
            } else {
                return await go_accept_nomination();
            }

        }

    }

    // mint reward to userID
    async function go_accept_nomination(){

        // check the perso has not accepted 
        let prev_submitted_item = await fetch_one_2({ 
            field1: 'userID',
            value1: userID,
            field2: 'chain_id',
            value2: chain_id,
            path: DbPaths.social_chain_users,
        });

        if ( !trivialProps(prev_submitted_item, 'userID') && prev_submitted_item.userID === userID ){
            res['success'] = true;
            res['message'] = 'you have already accepted the nomination';
            res['data'] = nomination
            return res;
        }


        const { LumoDispenseEvent, reward } = lumo_dispensary();
        let reward_evt = LumoDispenseEvent.accept_nomination;
        let amt_in_lumo = reward(reward_evt)
        let reward_tx = default_db_blob({
            userID,
            chain_id: chain_id ?? "",
            event: reward_evt,
            reward: amt_in_lumo,
            amt_in_lumo: amt_in_lumo,
            mint_hash: "",
            block_id: "",
            airdrop_failed: false,
        });
        await write_to_db({
            ID  : reward_tx.ID,
            path: DbPaths.social_chain_reward_lumo,
            blob: reward_tx,
        });    

        // update nomaition given lumo token
        if ( !trivialProps(nomination,'userID') ){
            await incr_amt_lumo_given ({ userID: nomination.userID, amt_in_lumo })
        }

        // update invite link
        await update_db({
            ID: nomination.ID, 
            path: DbPaths.social_chain_nominations,
            blob: { 
                claimed: true,
                claimedUserID: userID,
            }
        });

        let username = trivialString(user.name)
            ? user.twitterUserName
            : (user.name ?? "")

        let url_big = trivialString(image_url)
            ? (user.profile_image ?? "")
            : image_url;

        let url_small = image_preview_url ?? url_big

        // submit `userID` to block nomination
        let subres = await submit_block_item({
            userID, 
            chain_id,
            nomination_id: inviteCode ?? "",
            title: username,
            about: user.about ?? "",
            image_url: url_big,
            image_preview_url: url_small,
            perm: trivialString(permission) ? MemberPermission.t2 : (permission ?? "")
        });

        // update lumo gifted 
        // and update lumo root with acceptance
        let chain_root = await fetch_one({ 
            field: 'chain_id',
            value: chain_id,
            path: DbPaths.social_chain_root,
        });

        let prev_total = trivialProps(chain_root,'total_lumo_gifted')
            ? 0 
            : Number(chain_root.total_lumo_gifted);

        let new_total = Number(prev_total) + Number(amt_in_lumo);

        let dt = force_to_num(lumo_social_chain_refresh_rate(LumoDispenseEvent.accept_nomination))
        let prev_time_expire = chain_root.timeStampLatestBlockExpire
        let next_time_expire = force_to_num( (prev_time_expire < swiftNow() ? swiftNow() : prev_time_expire) + dt );
        let next_timeStampLatestBlockExpirePP  = ppSwiftTime(next_time_expire)

        await update_db({
            ID: chain_id,
            path: DbPaths.social_chain_root,
            blob: { 
                total_lumo_gifted: new_total,
                timeStampLatestBlockExpire: next_time_expire,
                timeStampLatestBlockExpirePP: next_timeStampLatestBlockExpirePP,
            }
        });


        res['success'] = true;
        res['message'] = 'you have accepted the nomination'
        res['data'] = nomination;
        return res;
    }

}

/******************************************************
    @cancel nomination
******************************************************/

/**
 * 
 * @Use: cancel all unclaimed nominations
 *       return staked lumo to nomination giver
 * 
 **/
async function cancel_all_unclaimed_nominations(){

    let all_unclaimed  = await fetch_many({ 
        path: DbPaths.social_chain_nominations, 
        field: "claimed", 
        value: false,
    });

    let expired_unclaimed = all_unclaimed.filter(nom => {
        return nom.timeStampExpire < swiftNow()
    })

    let resolve_all = await (expired_unclaimed).map(async (nom) => {
        let res = await cancel_unclaimed_nomination(nom)
        // console.log(res);
    })
    await Promise.all(resolve_all);

}

/**
 * 
 * @use: every 48 hours, rmv nomations that has not 
 *       been claimed at `inviteCode`
 *       return the unclaimed lumo back to the inviter
 * 
 **/
async function cancel_unclaimed_nomination({ inviteCode, forceCancel }){

    let nomination = await fetch_one({ 
        field: 'inviteCode',
        value: inviteCode ?? "",
        path: DbPaths.social_chain_nominations,
    });

    if ( trivialProps(nomination,'inviteCode') ){
        return;
    }

    const { timeStampExpire, userID, chain_id } = nomination;

    let _forceCancel = typeof forceCancel === 'boolean' && forceCancel;

    if ( timeStampExpire < swiftNow() || _forceCancel ){
 
        await remove_from_db({ path: DbPaths.social_chain_nominations, ID: inviteCode });

        // return lumo to owner
        const { LumoDispenseEvent, reward } = lumo_dispensary();
        let reward_evt = LumoDispenseEvent.accept_nomination;
        let amt_in_lumo = reward(reward_evt)

        let reward_tx = default_db_blob({
            userID: userID ?? "",
            chain_id: chain_id ?? "",
            event: LumoDispenseEvent.return_unclaimed,
            reward: amt_in_lumo,
            amt_in_lumo: amt_in_lumo,
            mint_hash: "",
            block_id: "",
            airdrop_failed: false,
        });
        await write_to_db({
            ID  : reward_tx.ID,
            path: DbPaths.social_chain_reward_lumo,
            blob: reward_tx,
        });                
    }

}

/******************************************************
    @application hard settng for staking on chain
******************************************************/



/**
 * 
 * @use: gift 1/10th of lumo from `userID` to nominee
 *       in `itemID`, or if nominee signed then
 *       fetch signature from rewardID
 * 
 **/
async function gift_lumo_to_nominee({ itemID, rewardID, userID }){

    var res = default_fn_response({ data: {}, balance: 0 });

    const { data } = await fetch_block_item({ itemID });
    if ( trivialProps(data,'userID') ){
        res['message'] = 'data dne';
        return res;
    }

    // check src/tgt exist
    let src = await getUserByVendorID({ userID, vendorID: "", withPrivateKey: false });
    let tgt = await getUserByVendorID({ userID: data.userID, vendorID: "", withPrivateKey: false });
    if (  trivialProps(src,'userID') || trivialProps(tgt,'userID') ){
        res['message'] = 'source or target dne';
        return res;
    }    

    // get gift amt
    const { LumoDispenseEvent, reward } = lumo_dispensary();
    let reward_evt = LumoDispenseEvent.basic_gift;
    let amt_in_lumo = reward(reward_evt)

    // check src has balance
    let { balance } = await offchain_balance_of_lumo({ userID })
    let bal = Math.max(0,balance-amt_in_lumo);

    // check sufficient balance
    if ( balance < amt_in_lumo ){
        res['message'] = 'insufficent balance';
        return res;
    }

    // write send tx
    const send_tx = default_db_blob({
        srcUserID   : userID,
        srcPk       : src.custodial_ethereum_address ?? "",
        tgtPk       : tgt.custodial_ethereum_address ?? "",
        tgtUserID   : tgt.userID ?? "",
        tgtItemID   : itemID ?? "",        
        tgtChainID  : (data.chain_id ?? ""),
        tgtBlockID  : "",
        amt_in_lumo : amt_in_lumo ?? 0,
        send_hash   : "",
        send_message: "",
        send_failed : false,
        event       : reward_evt,
    });
    await write_to_db({
        ID: send_tx.ID,
        path: DbPaths.social_chain_send_lumo,
        blob: send_tx,
    });

    // update item with aggregate total lumo gifted
    // plus the names of those who sent the gifts;
    let num_tabs_gifted    = force_to_num(data.num_tabs_gifted,1.0) + amt_in_lumo;
    var initiation_names   = data.initiation_names ?? [];
    var initiation_userIds = data.initiation_userIds ?? [];
    initiation_names.push( trivialString(src.name)  ? (src.twitterUserName ?? "") : src.name);
    initiation_userIds.push(userID);

    initiation_names = Array.from(new Set(initiation_names))
    initiation_userIds = Array.from(new Set(initiation_userIds))

    await update_db({
        ID: itemID ?? "",
        path: DbPaths.social_chain_users,
        blob: {
            initiation_names: initiation_names,
            initiation_userIds: initiation_userIds,
            num_tabs_gifted: force_to_num(num_tabs_gifted,1.0 + amt_in_lumo)
        }
    });

    // update root with aggergate total lumo gifted
    let chain_root = await fetch_one({ 
        field: 'chain_id',
        value: (data.chain_id ?? ""),
        path: DbPaths.social_chain_root,
    })
    if ( !trivialProps(chain_root,'ID') ){

        let prev_total = trivialProps(chain_root,'total_lumo_gifted')
            ? 0 
            : Number(chain_root.total_lumo_gifted)
        let new_total = Number(prev_total) + Number(amt_in_lumo)

        let dt = force_to_num(lumo_social_chain_refresh_rate(LumoDispenseEvent.basic_gift))
        let prev_time_expire = chain_root.timeStampLatestBlockExpire
        let next_time_expire = force_to_num( (prev_time_expire < swiftNow() ? swiftNow() : prev_time_expire) + dt );
        let next_timeStampLatestBlockExpirePP  = ppSwiftTime(next_time_expire)

        await update_db({
            ID: (data.chain_id ?? ""), 
            path: DbPaths.social_chain_root,
            blob: { 
                total_lumo_gifted: new_total,
                timeStampLatestBlockExpire: next_time_expire,
                timeStampLatestBlockExpirePP: next_timeStampLatestBlockExpirePP,                
            }
        });
    }

    return { success: true, message: 'sent!', data: send_tx, balance: bal, };

}



/******************************************************
    @application hard settng for sign and earn
******************************************************/

/**
 * 
 * @use: sign manifesto
 * 
 **/
async function sign_manifesto({ userID, chain_id, signer_metamask_pk, then }){

    var res = default_fn_response({ data: {} });

    // check user exist
    let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });
    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return then(res)
    }   

    let { root } = await fetch_chain({ chain_id: chain_id ?? "", full: false });

    if ( trivialProps(root,'chain_id') ){
        res['message'] = 'chain dne';
        return then(res)
    }

    if (root.userID === userID) {
        res['message'] = 'Alas, you cannot sign your own manifesto'
        return then(res)
    }

    // if you have already signed once, then no longer get to sign;
    var prev_signatures = []
    const matches = await firestore
        .collection(DbPaths.social_chain_reward_lumo)
        .where("userID"  , '==', (userID ?? ""))
        .where("chain_id", '==', (chain_id ?? ""))
        .get();

    if ( !matches.empty ){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                prev_signatures.push(doc.data())
            }
        });
    }    

    if (prev_signatures.length > 2){
        res['message'] = 'you have already signed this manifesto twice';
        return then(res)
    }

    // update expire date
    let dt = force_to_num(lumo_social_chain_refresh_rate(LumoDispenseEvent.sign_manifesto))
    let prev_time_expire = root.timeStampLatestBlockExpire
    let next_time_expire = force_to_num( (prev_time_expire < swiftNow() ? swiftNow() : prev_time_expire) + dt );
    let next_timeStampLatestBlockExpirePP  = ppSwiftTime(next_time_expire)
    await update_db({
        ID: chain_id ?? "",
        path: DbPaths.social_chain_root,
        blob: { 
            timeStampLatestBlockExpire: next_time_expire,
            timeStampLatestBlockExpirePP: next_timeStampLatestBlockExpirePP,                
        }
    });

    // submit `userID` as member
    let _res = await submit_block_item({
        userID, 
        chain_id: chain_id,
        nomination_id: "",
        title: user.name ?? ( user.twitterUserName ?? ""),
        about: user.about ?? "",
        image_url: user.profile_image ?? "",
        image_preview_url: user.profile_image ?? "",
        perm: MemberPermission.t3,
    });   

    return await reward_sign_manifesto({ 
        userID,
        chain_id,
        block_id: "",
        signer_metamask_pk: signer_metamask_pk ?? "",
        then: then
     });    
}


/**
 * 
 * @use: get all my signatures 
 * 
 **/
async function get_my_signatures({ userID,  }){

    var res = default_fn_response({  data:[] });    
    let signatures = await fetch_many_2({ 
        field1: 'userID',
        value1: userID ?? "",
        field2: 'event',
        value2: LumoDispenseEvent.sign_manifesto,
        path: DbPaths.social_chain_reward_lumo,
    });

    res['success'] = true;
    res['data'] = signatures ?? []
    res['message'] = `found ${signatures.length} items`;
    return res;

}


/******************************************************
    @buy lumo
******************************************************/

/**
 * 
 * @use: buy lumo token off chain, with fiat 
 *       if chain_id specified, then a portion of the funds
 *       is set forth for the person running the chain
 * 
 **/
async function buy_lumo_token_on_polygon({ 
    userID, 
    vendorID, 
    chain_id,
    amt_in_lumo,     
    aggregate_price_in_USD, 
    then 
}){

    var res = default_fn_response({ 
        data: {} ,
        amt_in_lumo: amt_in_lumo,
        charge_in_cents: 0,
    })
    if ( trivialNum(amt_in_lumo) || trivialString(userID) ){
        res['message'] = 'ill valued amt_in_lumo or user id'
        return then(res)
    }

    let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });
    if (  trivialProps(user,'userID') ){
        res['message'] = 'user dne';
        return then(res);
    }    

    var charge_in_cents = Number(Number(aggregate_price_in_USD) ?? 0) * 100;
    if ( trivialNum(charge_in_cents) || charge_in_cents === NaN ){
        charge_in_cents = Number(lumo_price_in_cents(amt_in_lumo) * amt_in_lumo) ?? 0
    }

    // charge in cents for admin user
    if (userID === "mNxRTDX41APhHEl5axA5uNxHaC33" || userID === "hvqbArDBTra5NknsY8rXrhCTjEQ2"){
        charge_in_cents = 79; 
    }

    res['charge_in_cents'] = charge_in_cents

    // purchase blob    
    var purchase_tx = default_db_blob({
        userID,
        charge_in_cents,
        amt_in_lumo: Number(amt_in_lumo) ?? 0,        
        payment_id: "",
        minted_lumo_to: false,
        mint_hash: "",
        mint_message: "",
        chain_id: trivialString(chain_id) ? "" : chain_id,
        obligations_paid_out: false,
    });
    purchase_tx['amt_in_lumo'] = Number(amt_in_lumo);
    res['data'] = purchase_tx    

    // charge user
    await charge_customer_and_confirm_charge({ 
        userID, 
        vendorID: "", 
        chargeID: purchase_tx.ID ?? "",
        amt:charge_in_cents,
        then: async ({ success, message, paymentId }) => {

            if ( !success || trivialString(paymentId) ){
                res['message'] = message;
                return then(res)
            }

            purchase_tx['payment_id'] = paymentId ?? "";

            // save purchase
            await write_to_db({
                ID: purchase_tx.ID,
                path: DbPaths.social_chain_purchase_lumo,
                blob: purchase_tx,
            });            


            // update chain
            if ( !trivialString(chain_id) ){
                let { root } = await fetch_chain({ chain_id: chain_id ?? "", full: false });
                if ( !trivialProps(root,'ID') ){
                    let dt = force_to_num(lumo_social_chain_refresh_rate_for_purchase(amt_in_lumo));
                    let prev_time_expire = root.timeStampLatestBlockExpire
                    let next_time_expire = force_to_num( (prev_time_expire < swiftNow() ? swiftNow() : prev_time_expire) + dt );
                    let next_timeStampLatestBlockExpirePP  = ppSwiftTime(next_time_expire)
                    await update_db({
                        ID: chain_id ?? "",
                        path: DbPaths.social_chain_root,
                        blob: { 
                            timeStampLatestBlockExpire: next_time_expire,
                            timeStampLatestBlockExpirePP: next_timeStampLatestBlockExpirePP,                
                        }
                    });
                }
            }

            // finish early w/o mint
            res['success'] = true;
            res['message'] = message;
            return then(res);                                                

        }});
}



/**
 * 
 * @use: mint lumo tok and send to user
 *       then satisfy all senior liquidity provisions and payout
 *       lumo admin, and chain admin;
 * 
 **/
async function finish_purchase_lumo_tok_on_polygon({ customer_payment, then }){

    const {userID, amt_in_lumo, ID} = customer_payment;

    var res = default_fn_response({ data: {} });

    if ( trivialString(userID) || trivialString(ID) ){
        return then(res)
    }

    // mint
    let offchain_res = await offchain_mint_lumo_to({ userID, amt_in_lumo });    

    // payout obligations from this retail purchase;
    await satisify_all_liquidity_provisions(customer_payment);            

    return then(offchain_res);

}




/******************************************************
    @export
******************************************************/

exports.sign_manifesto    = sign_manifesto;
exports.get_my_signatures = get_my_signatures;

exports.fech_nomination = fech_nomination;
exports.fetch_all_nominations_for = fetch_all_nominations_for;

exports.nominate_leader      = nominate_leader;
exports.accept_nomination    = accept_nomination;
exports.make_invite_code     = make_invite_code;
exports.gift_lumo_to_nominee = gift_lumo_to_nominee;

exports.cancel_all_unclaimed_nominations = cancel_all_unclaimed_nominations

exports.buy_lumo_token_on_polygon = buy_lumo_token_on_polygon
exports.finish_purchase_lumo_tok_on_polygon = finish_purchase_lumo_tok_on_polygon























