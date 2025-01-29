/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: gnosisSafe
 * @Date   : July 21st, 2022
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
} = require('./../utils');


const { 
    getUserByVendorID, 
} = require('./accounts');

const {
    logSendTransactionInEth,
    getBalanceEth,
    getTransactionEthOn,
} = require("./../eth/transactions")


const {
    DbPaths, 
    default_fn_response,
    ItemMintState,
    alchemyWeb3Instance,
    valid_contract_kind,
    Networks,
    current_eth_network,
    ContractKind,
} = require('./../core');

/******************************************************
    @safe root
******************************************************/


/**
 * 
 * @Use: create storyboard root, optionally associate storyboard with `treeID` 
 *       and `tokID`, generate ethereum address for storyboard
 * 
 * 
 **/ 
async function create_safe({ userID, safe_address, projectID, vendorID, network }){

    var res = default_fn_response({ data: {} });

    if ( trivialString(safe_address) ){
        res['message'] = 'please specify safe address'
        return then(res);
    }    

    let id = safe_address;
    var blob = {
        ID          : id,
        projectID   : projectID ?? "",
        safe_address: safe_address,
        userID      : userID ?? "",

        timeStampCreated : swiftNow(),
        timeStampLatest  : swiftNow(),       
    }

    // store keys, if fail then fail
    let did = await fire.firestore
        .collection(DbPaths.safe_root)
        .doc( id )
        .set( blob )
        .then(_ => true)
        .catch(e => false)

    res['success'] = did
    res['message'] = did ? "saved" : 'server error'
    res['data']    = blob;
    return res;
}

// get safe by project address
async function get_safe_by_project({ address }){

    var res = default_fn_response({ data: {} });

    const matches = await fire.firestore
        .collection(DbPaths.safe_root)
        .where('projectID', '==', address ?? "")
        .get();

    var safes = [];
    if (!matches.empty){    
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                safes.push(doc.data())
            }
        })
    }        


    res['success'] = true;
    res['message'] = `found ${safes.length} safes`
    res['data'] = safes.length > 0 ? safes[0] : {}
    return res;

}

// get safe by safe address
async function get_safe({ safe_address }){

    var res = default_fn_response({ data: {} });

    const matches = await fire.firestore
        .collection(DbPaths.safe_root)
        .where('safe_address', '==', safe_address ?? "")
        .get();

    var safes = [];
    if (!matches.empty){    
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                safes.push(doc.data())
            }
        })
    }        

    let { data }  = await get_all_proposals({ safe_address });
    let approvals = await get_all_approvals({ safe_address })
    let rejects   = await get_all_rejects({ safe_address });
    let execs     = await get_all_executes({ safe_address })

    res['success'] = true;
    res['message'] = `found ${safes.length} safes`
    res['data'] = safes.length > 0 ? safes[0] : {}
    res['proposals'] = data ?? [];
    res['approvals'] = approvals.data ?? [];
    res['rejects']   = rejects.data ?? [];
    res['executes']  = execs.data ?? [];
    return res;

}

/******************************************************
    @safe proposals
******************************************************/

/**
 *
 * @Use: when user proposes transaction 
 * 
 **/
async function propose_safe_tx({ safe_address, projectID, userID, proposal_hash, proposal, name, message, type }){

    var res = default_fn_response({ data: {} });

    if ( trivialString(safe_address) || trivialString(proposal_hash) ){
        res['message'] = 'please specify safe_address and proposal_hash'
        return res;
    }

    let id = uuid.v4()
    let blob = {
        id              : id,
        execution_hash  : "",
        userID          : userID ?? "",
        proposal_hash   : proposal_hash,
        safe_address    : safe_address,
        projectID       : projectID ?? "",
        timeStampLatest : swiftNow(),
        timeStampCreated: swiftNow(),
        sent            : false,
        type            : trivialString(type) ? "" : type,
    }

    let meta_blob = {
        id              : id,
        safe_address    : safe_address ?? "",
        proposal_hash   : proposal_hash,
        projectID       : projectID ?? "",
        proposal        : proposal ?? "",
        name            : name ?? "",
        message         : message ?? "", 
        timeStampCreated: swiftNow(),
    }

    // save base
    let did = await fire.firestore
        .collection(DbPaths.safe_proposal)
        .doc( id )
        .set( blob )
        .then(_ => true)
        .catch(e => false)

    // save meta
    await fire.firestore
        .collection(DbPaths.safe_proposal_meta)
        .doc( id )
        .set( meta_blob )
        .then(_ => true)
        .catch(e => false)

    res['success'] = did
    res['message'] = did ? "saved" : 'server error'
    res['data']    = blob;
    return res;       
}


/***
 *
 * @Use: get all proposals by address 
 * 
 **/
async function get_all_proposals({ safe_address }){

    var res = default_fn_response({ data: [] });

    if ( trivialString(safe_address) ){
        return res;
    }

    const matches = await fire.firestore
        .collection(DbPaths.safe_proposal)
        .where('safe_address', '==', safe_address ?? "")
        .get();

    var proposals = [];
    if (!matches.empty){    
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                proposals.push(doc.data())
            }
        })
    }        

    const meta_matches = await fire.firestore
        .collection(DbPaths.safe_proposal_meta)
        .where('safe_address', '==', safe_address ?? "")
        .get();

    var metas = [];
    if (!meta_matches.empty){    
        meta_matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                metas.push(doc.data())
            }
        })
    }        

    // compile metadata with hahs
    let ps = proposals.map(p => {
        let meta_ps = metas.filter(m => m['id'] === p['id']);
        let meta_p = meta_ps.length > 0 ? meta_ps[0] : {}
        let blob = { ...meta_p, ...p }
        return blob;
    })

    res['success'] = true;
    res['message'] = `found ${proposals.length} proposals`
    res['data']    = ps ?? [];
    return res;    

}

/******************************************************
    @safe tx approval hash
******************************************************/

/**
 *
 * @Use: when user approve transaction, save approval transaction hash here
 * 
 **/
async function approve_safe_tx({ safe_address, projectID, userID, proposal_hash, approval_hash, message }){

    var res = default_fn_response({ data: {} });

    if ( trivialString(safe_address) || trivialString(proposal_hash) || trivialString(approval_hash) ){
        res['message'] = 'please specify safe_address, approval_hash, and proposal_hash'
        return res;
    }

    let id = uuid.v4()
    let blob = {
        id              : id,
        userID          : userID ?? "",
        proposal_hash   : proposal_hash,
        approval_hash   : approval_hash,
        safe_address    : safe_address,
        projectID       : projectID ?? "",
        message         : message ?? "",
        timeStampLatest : swiftNow(),
        timeStampCreated: swiftNow(),
    }

    // save base
    let did = await fire.firestore
        .collection(DbPaths.safe_approvals)
        .doc( id )
        .set( blob )
        .then(_ => true)
        .catch(e => false)

    res['success'] = did
    res['message'] = did ? "saved" : 'server error'
    res['data']    = blob;
    return res;       
}


/***
 *
 * @Use: get all proposals by address 
 * 
 **/
async function get_all_approvals({ safe_address }){

    var res = default_fn_response({ data: [] });

    if ( trivialString(safe_address) ){
        return res;
    }

    const matches = await fire.firestore
        .collection(DbPaths.safe_approvals)
        .where('safe_address', '==', safe_address ?? "")
        .get();

    var approvals = [];
    if (!matches.empty){    
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                approvals.push(doc.data())
            }
        })
    }        


    res['success'] = true;
    res['message'] = `found ${approvals.length} approvals`
    res['data']    = approvals ?? []
    return res;    
}



/**
 *
 * @Use: when user approve transaction, save approval transaction hash here
 * 
 **/
async function execute_safe_tx({ safe_address, projectID, userID, proposal_hash, execution_hash }){

    var res = default_fn_response({ data: {} });

    if ( trivialString(safe_address) || trivialString(proposal_hash) || trivialString(execution_hash) ){
        res['message'] = 'please specify safe_address, and proposal_hash/execution_hash'
        return res;
    }

    let id = uuid.v4()
    let blob = {
        id              : id,
        userID          : userID ?? "",
        proposal_hash   : proposal_hash,
        safe_address    : safe_address,
        execution_hash  : execution_hash,
        projectID       : projectID ?? "",
        timeStampLatest : swiftNow(),
        timeStampCreated: swiftNow(),
    }

    // save base
    let did = await fire.firestore
        .collection(DbPaths.safe_executes)
        .doc( id )
        .set( blob )
        .then(_ => true)
        .catch(e => false)

    res['success'] = did
    res['message'] = did ? "saved" : 'server error'
    res['data']    = blob;
    return res;       
}


/***
 *
 * @Use: get all proposals by address 
 * 
 **/
async function get_all_executes({ safe_address }){

    var res = default_fn_response({ data: [] });

    if ( trivialString(safe_address) ){
        return res;
    }

    const matches = await fire.firestore
        .collection(DbPaths.safe_executes)
        .where('safe_address', '==', safe_address ?? "")
        .get();

    var execs = [];
    if (!matches.empty){    
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                execs.push(doc.data())
            }
        })
    }        


    res['success'] = true;
    res['message'] = `found ${execs.length} executions`
    res['data']    = execs ?? []
    return res;    
}





/**
 *
 * @Use: when user approve transaction, save approval transaction hash here
 * 
 **/
async function reject_safe_tx({ safe_address, projectID, userID, proposal_hash, message }){

    var res = default_fn_response({ data: {} });

    if ( trivialString(safe_address) || trivialString(proposal_hash) ){
        res['message'] = 'please specify safe_address, and proposal_hash'
        return res;
    }

    let id = uuid.v4()
    let blob = {
        id              : id,
        userID          : userID ?? "",
        proposal_hash   : proposal_hash,
        safe_address    : safe_address,
        projectID       : projectID ?? "",
        message         : message ?? "",
        timeStampLatest : swiftNow(),
        timeStampCreated: swiftNow(),
    }

    // save base
    let did = await fire.firestore
        .collection(DbPaths.safe_rejects)
        .doc( id )
        .set( blob )
        .then(_ => true)
        .catch(e => false)

    res['success'] = did
    res['message'] = did ? "saved" : 'server error'
    res['data']    = blob;
    return res;       
}


/***
 *
 * @Use: get all proposals by address 
 * 
 **/
async function get_all_rejects({ safe_address }){

    var res = default_fn_response({ data: [] });

    if ( trivialString(safe_address) ){
        return res;
    }

    const matches = await fire.firestore
        .collection(DbPaths.safe_rejects)
        .where('safe_address', '==', safe_address ?? "")
        .get();

    var rejects = [];
    if (!matches.empty){    
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                rejects.push(doc.data())
            }
        })
    }        


    res['success'] = true;
    res['message'] = `found ${rejects.length} rejects`
    res['data']    = rejects ?? []
    return res;    
}





/******************************************************
    @safe signers
******************************************************/

/**
 * 
 * @use: add safe signer 
 * 
 **/
async function add_safe_signer({ safe_address, userID, projectID, user_pk }){

    var res = default_fn_response({ data: {} });

    if ( trivialString(safe_address) || (trivialString(userID) && trivialString(user_pk)) ){
        res['mespsage'] = 'please specify safe_address and userID/pk'
        return res;
    }

    const { data } = await get_all_signers({ safe_address, user_pk });
    let did_add = data.filter(m => m.user_pk === user_pk )

    if ( did_add.length > 0 ){

        res['success'] = true;
        res['message'] = 'already added'
        res['data']    = did_add[0]
        return res;

    } else {

        let id = uuid.v4();
        var blob = {
            ID          : id,
            projectID   : projectID ?? "",
            safe_address: safe_address,
            userID      : userID ?? "",
            user_pk     : user_pk,

            timeStampCreated : swiftNow(),
            timeStampLatest  : swiftNow(),       
        }

        // store keys, if fail then fail
        let did = await fire.firestore
            .collection(DbPaths.safe_signers)
            .doc( id )
            .set( blob )
            .then(_ => true)
            .catch(e => false)

        res['success'] = did
        res['message'] = did ? "saved" : 'server error'
        res['data']    = blob;
        return res;        

    }

}


/**
 * 
 * @use: read safe signers
 * 
 **/
async function get_all_signers({ safe_address }){

    var res = default_fn_response({ data: {} });
    if ( trivialString(safe_address) ){
        res['message'] = 'please specify safe_address'
        return res;
    }


    const matches = await fire.firestore
        .collection(DbPaths.safe_signers)
        .where('safe_address', '==', safe_address)
        .get();

    var signers = [];
    if (!matches.empty){    
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                signers.push(doc.data())
            }
        })
    }        


    res['success'] = true;
    res['message'] = `found ${signers.length} signer in this safe`
    res['data'] = signers;
    return res;

}

/******************************************************
    @export
******************************************************/

exports.get_safe        = get_safe;
exports.create_safe     = create_safe;
exports.add_safe_signer = add_safe_signer;
exports.get_all_signers = get_all_signers;
exports.get_safe_by_project = get_safe_by_project;

exports.propose_safe_tx   = propose_safe_tx;
exports.reject_safe_tx    = reject_safe_tx;
exports.execute_safe_tx   = execute_safe_tx;

exports.approve_safe_tx   = approve_safe_tx






