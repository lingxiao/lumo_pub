/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: off chain lumo fn
 * @Date   : 9/24/2022
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
    firestore,
    fetch_one,
    write_to_db,
    update_db,
} = require('./../fire');

const { 
    print,
    swiftNow, 
    trivialProps, 
    trivialNum, 
    trivialString,
    ppSwiftTime,
} = require('./../utils');


const {
    DbPaths, 
    Networks,
    default_db_blob,
    current_eth_network,
    default_fn_response,
    get_keys_from_lumo_core,
    network_flow_to_eth,
    alchemySideChainInstance,

    LumoContractAddress,
    LumoStakingPoolContractAddress,
} = require('./../core');


const { 
    getUserByVendorID, 
} = require('./../client/accounts');



/******************************************************
    @server mint/send
******************************************************/

/***
 * 
 * @use: read balance of lumo on server
 * 
 **/
async function offchain_balance_of_lumo({ userID }){

    var res = default_fn_response({ balance: 0, user: {} })

    let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });
    if ( trivialProps(user,'userID') ){
        res['success'] = false;
        res['message'] = 'user dne'
        return res;
    }   

    let balance = await fetch_one({ 
        field: 'userID',
        value: userID,
        path: DbPaths.offchain_users_lumo,
    })

    res['success'] = true;
    res['message'] = 'found balance'
    res['user']    = user;
    res['data']    = balance ?? {}
    res['balance'] = trivialProps(balance,'amt_in_lumo') ? 0 : (balance.amt_in_lumo ?? 0)
    return res;
}


/**
 * 
 * @use: mint lumo to userID off chain
 * 
 **/
async function offchain_mint_lumo_to({ userID, amt_in_lumo }){

    var res = default_fn_response({ balance: 0, })
    let { success, message, data, balance } = await offchain_balance_of_lumo({ userID });

    if ( !success ){
        res['message'] = message;
        return res
    }

    var _amt_in_lumo = (amt_in_lumo ?? 0)
    if (trivialNum(_amt_in_lumo) || _amt_in_lumo === NaN){
        _amt_in_lumo = 0;
    }

    if ( trivialProps(data, 'userID') ){
        var blob = default_db_blob({
            userID,
            amt_in_lumo: _amt_in_lumo,
        });
        blob.ID = userID; 
        await write_to_db({
            ID  : userID,
            path: DbPaths.offchain_users_lumo,
            blob: blob,
        });            
        res['success'] = true;
        res['data']    = blob;
        res['message'] = `minted ${amt_in_lumo} offchain`
        res['balance'] = _amt_in_lumo
        return res;
    } else {
        let base = trivialProps(data,'amt_in_lumo') ? 0 : data.amt_in_lumo;
        let new_balance = Number(base) + Number(_amt_in_lumo);
        await update_db({
            ID  : userID,
            path: DbPaths.offchain_users_lumo,
            blob: { amt_in_lumo: Number(new_balance) }
        })
        res['success'] = true;
        res['message'] = `minted ${amt_in_lumo} offchain`
        res['balance'] = base + _amt_in_lumo;
        return res;
    }
}


/**
 * 
 * @use: send lumo off chain from src to tgt
 * 
 **/
async function offchain_send_lumo_to({ srcUserID, tgtUserID, amt_in_lumo }){

    var res = default_fn_response({ balance_before: 0, balance_after:0 });

    let _amt_in_lumo = (amt_in_lumo ?? 0)

    let src_data = await offchain_balance_of_lumo({ userID: srcUserID ?? "" });
    let tgt_data = await offchain_balance_of_lumo({ userID: tgtUserID ?? "" });

    if ( !src_data.success ){
        res['message'] = `${src_data.message}`
        return res;
    }

    let src_balance = src_data.balance ?? 0;
    let tgt_balance = tgt_data.balance ?? 0;

    if ( src_balance < _amt_in_lumo ){
        res['message'] = `Insufficient balance: ${src_data.amt_in_lumo}`
        return res;
    }

    // burn srce
    await update_db({
        ID  : srcUserID,
        path: DbPaths.offchain_users_lumo,
        blob: { amt_in_lumo: src_balance - _amt_in_lumo }
    })    

    // mint to
    await offchain_mint_lumo_to({ userID: tgtUserID, amt_in_lumo: amt_in_lumo });

    res['success'] = true;
    res['message'] = 'sent'
    res['balance_before'] = tgt_balance
    res['balance_after']  = tgt_balance + _amt_in_lumo;

    return res;
}

/**
 * 
 * @use: send lumo off chain from src to tgt
 * 
 **/
async function offchain_burn({ userID, amt_in_lumo }){

    var res = default_fn_response({ balance_before: 0, balance_after:0 });

    let _amt_in_lumo = (amt_in_lumo ?? 0)
    let src_data = await offchain_balance_of_lumo({ userID: userID ?? "" });

    if ( !src_data.success ){
        res['message'] = `${src_data.message}`
        return res;
    }

    let src_balance = src_data.balance ?? 0;

    if ( src_balance < _amt_in_lumo ){
        res['message'] = `Insufficient balance: ${src_data.amt_in_lumo}`
        return res;
    }

    await update_db({
        ID  : userID,
        path: DbPaths.offchain_users_lumo,
        blob: { amt_in_lumo: src_balance - _amt_in_lumo }
    })    

    res['success'] = true;
    res['message'] = 'sent'
    res['balance_before'] = src_balance
    res['balance_after']  = src_balance - _amt_in_lumo

    return res;
}

/******************************************************
    @server batch unstaking
******************************************************/

/**
 * 
 * @use: off chain batch unstake users, with interests
 * 
 **/
async function offchain_batchUnstakeWithInterest({ poolAddress, chain_id, userIDs, interests }){

    var res = default_fn_response({ data: [] });

    if ( userIDs.length !== interests.length ){
        res['message'] = 'users do not correspond to interest rates';
        return res;
    }

    await go_batchunstake({  poolAddress, chain_id, userIDs, interests });
    return { success: true, message: 'done!' }

}

// @Use: unstake and recurse down list to unstake the rest
async function go_batchunstake({  poolAddress, chain_id, userIDs, interests }){
    if ( userIDs.length === 0 || interests.length === 0 ){
        return true;
    } else {
        let userID = userIDs[0];
        let utail  = userIDs.slice(1,)
        let interest = interests[0]
        let uinterests = interests.slice(1,);
        await go_unstake_and_reward({ poolAddress, chain_id, userID, interest });
        return await go_batchunstake({ poolAddress, chain_id, userIDs: utail, interests: uinterests })
    }
}


// @use: unstake and reward each item
async function go_unstake_and_reward({ poolAddress, chain_id, userID, interest }){

    var txs = [];
    var amt_staked = 0;
    const matches = await firestore
        .collection(DbPaths.offchain_staking_txs)
        .where('userID'  , '==', userID)
        .where('chain_id', '==', chain_id)
        .where('unstaked', '==', false)
        .get();

    if ( !matches.empty ){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                let data = doc.data();
                txs.push(data);
                amt_staked += (data.amt_in_lumo ?? 0);
            }
        });
    }

    if (  amt_staked > 0 && txs.length > 0  ){

        let { success, message } = await offchain_unstake({ poolAddress, userID, amt_in_lumo: amt_staked });
        let earned_amt = amt_staked * interest;
        await offchain_mint_lumo_to({ userID, amt_in_lumo: earned_amt });
        let unstake_after = await txs.map(async (tx) => {
            if ( !trivialProps(tx,'ID') ){
                await update_db({
                    ID: tx.ID,
                    path: DbPaths.offchain_staking_txs,
                    blob: { unstaked: true }
                })
            }
        })
        await Promise.all(unstake_after);
    }
}


/******************************************************
    @server staking/unstaking
******************************************************/

/**
 * 
 * @use: staking amt-in-lumo off chain to pooladdress
 * 
 **/
async function offchain_stake({ poolAddress, chain_id, block_id, userID, amt_in_lumo }){

    var res = default_fn_response({ pool: {} });

    let _amt_in_lumo = (amt_in_lumo ?? 0)
    let { user, success, balance } = await offchain_balance_of_lumo({ userID });

    if ( !success ){
        res['message'] = balance;
        return res;
    }
    if ( balance < _amt_in_lumo ){
        res['message'] = `Insufficient balance: ${balance} LUMO`;
        return res;
    }

    if ( trivialProps(user,'userID') ){
        res['message'] = 'trivial user'
        return res;
    }

    await offchain_burn({ userID, amt_in_lumo });

    let { data } = await offchain_get_staking_pool({ poolAddress });

    let staking_tx = default_db_blob({
        userID,
        chain_id: chain_id ?? "",
        block_id: block_id ?? "",
        amt_in_lumo: _amt_in_lumo,
        unstaked: false,
    })
    await write_to_db({
        ID  : staking_tx.ID,
        path: DbPaths.offchain_staking_txs,
        blob: staking_tx,
    });                   

    if ( trivialProps(data,'ID') ){

        var pool = default_db_blob({
            address: poolAddress,
            amt_in_lumo: _amt_in_lumo,            
        })
        pool.ID = poolAddress;
        await write_to_db({
            ID  : poolAddress,
            path: DbPaths.offchain_pools_lumo,
            blob: pool,
        });                   

        res['success'] = true;
        res['pool']    = pool;
        res['message'] = 'staked into pool'
        return res;

    } else {

        await update_db({
            ID  : poolAddress,
            path: DbPaths.offchain_pools_lumo,
            blob: { amt_in_lumo: data.amt_in_lumo + _amt_in_lumo }
        });
        res['success'] = true;
        res['pool']    = data;
        res['message'] = 'staked into pool'
        return res
    }
}


/**
 * 
 * @use: staking amt-in-lumo off chain to pooladdress
 * 
 **/
async function offchain_unstake({ poolAddress, userID, amt_in_lumo }){

    let _amt_in_lumo = (amt_in_lumo ?? 0)
    var res = default_fn_response({ pool: {} });

    let { data } = await offchain_get_staking_pool({ poolAddress });
    let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });

    if ( trivialProps(data,'ID') ){
        res['message'] = 'pool not found' ;
        return res;
    }
    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return res;
    }       

    await update_db({
        ID  : poolAddress,
        path: DbPaths.offchain_pools_lumo,
        blob: { amt_in_lumo: Math.max(0,data.amt_in_lumo - _amt_in_lumo) }
    });

    await offchain_mint_lumo_to({ userID, amt_in_lumo });

    res['success'] = true;
    res['message'] = `unstaked ${amt_in_lumo}`;
    return res;

}


/**
 * 
 * @use: get offchain staking pool
 * 
 **/
async function offchain_get_staking_pool({ poolAddress }){

    var res = default_fn_response({ data: {} });

    let data = await fetch_one({ 
        field: 'ID',
        value: poolAddress,
        path: DbPaths.offchain_pools_lumo,
    })

    res['success'] = true;
    res['message'] = 'found pool'
    res['data']    = data;
    return res;

}



/******************************************************
    @export
******************************************************/

// off chain
exports.offchain_balance_of_lumo = offchain_balance_of_lumo;
exports.offchain_mint_lumo_to = offchain_mint_lumo_to;
exports.offchain_send_lumo_to = offchain_send_lumo_to;

exports.offchain_burn  = offchain_burn;
exports.offchain_stake = offchain_stake;
exports.offchain_batchUnstakeWithInterest = offchain_batchUnstakeWithInterest;













