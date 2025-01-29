/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: vendorApi
 * @Date   : April 30th.2021
 * @Use.   : API hooks for vendors

 * @Important: must set env. variable for public and private key of admin on local first. 
        >> see: https://medium.com/firelayer/deploying-environment-variables-with-firebase-cloud-functions-680779413484
        ```
            firebase functions:config:set eth.public = "" eth.private = ""
            firebase functions:config:get
        ```
 * @test : firebase emulators:start
 *
 *
*/


// import modules
const functions = require('firebase-functions');
const config = functions.config();

const uuid = require('uuid');
const crypto = require('crypto');
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");

const fire  = require('./../fire')

const { 
    print,
    swiftNow, 
    illValued, 
    trivialProps, 
    trivialNum, 
    trivialString,
    strHex
} = require('./../utils');

const { DbPaths, Networks, ALCHEMY_PRODUCTION } = require('./../core');

/******************************************************
    @Vendor crud
******************************************************/

/**
 *
 * @Use: create new user wallet
 * @Params:
 *    - vendorToken  :: String
 *    - userID :: String
 *    - then :: (Bool, String, String) of (succ = yes|no, succ or failure message, public_key)
 *    
 * @Action:
 *    - if `vendorID` dne, then fail
 *    - if other fields are malformed, do nothing
 *    - if `userID` dne, then create new user with
 *         { email, userID, lumoUserID, PublicKey, TimeStamp }
 *
*/
exports.createVendor = async ({ vendorID, email, path }) => {

    if (trivialString(vendorID)){
        return {};
    }

    // generate keys
    let cvid    = crypto.randomBytes(48).toString('hex');
    let sk_live = crypto.randomBytes(48).toString('hex');
    let sk_test = crypto.randomBytes(48).toString('hex');

    // base blob
    let blob = {
          vendorID          : vendorID
        , client_vendor_id  : `pk_${cvid}`
        , email             : email || ""
        , bio               : ""
        , name              : ""
        , timeStampCreated  : swiftNow()
        , timeStampLatest   : swiftNow()            
        , profileImageLarge : ""
        , profileImageMedium: ""
        , profileImageSmall : ""            
    }

    // stripe
    let blob_payment = { 
        vendorID    : vendorID, 
        pm_id       : "",
        customerId  : "",
        timeStamp   : swiftNow() ,
    }

    // stripe connected account
    let blob_connect = {
        vendorID  : vendorID,
        timeStamp : swiftNow(),
        stripe_user_id: '',
    }

    // metamask account
    let blob_metaMask = {
        vendorID: vendorID,
        eth_public_key: '',
        timeStamp: swiftNow()
    }

    // set all fields
    await fire.firestore.doc(`${DbPaths.vendors}/${vendorID}`).set(blob);
    await fire.firestore.doc(`${DbPaths.vendor_metamask_wallet}/${vendorID}`).set(blob_metaMask);
    await fire.firestore.doc(`${DbPaths.vendor_stripe_customer}/${vendorID}`).set(blob_payment);
    await fire.firestore.doc(`${DbPaths.vendor_stripe_connected}/${vendorID}`).set(blob_connect);

    // update creation command
    if ( !trivialString(path) ){
        await fire.firestore.doc(path).update({ didCreate: true })
    }

    // create payment record
    let blob_perm = {

        // api keys
        vendorID: vendorID,
        client_vendor_id: `pk_${cvid}`,
        sk_live: `sk_live_${sk_live}`,
        sk_test: `sk_test_${sk_test}`,

        did_show_sk_live : false,

        timeStamp: swiftNow(),
        timeStamp_sk_live_created: swiftNow(),
        timeStamp_sk_test_created: swiftNow(),
        timeStamp_sk_live_latest : swiftNow(),
        timeStamp_sk_test_latest : swiftNow(),
    }

    // save vendor secret
    await fire.firestore.doc(`${DbPaths.vendor_permissions}/${vendorID}`).set(blob_perm)

    return blob;
}


/**
 *
 * @Use: find user by severSide vendorID
 * @Params:
 *    - vendorID :: String
 *
*/
exports.updateApiKeyDateUsed = async ({ vendorID, isLive }) => {

    if ( trivialString(vendorID) ){
        return;
    }

    let is_live = illValued(isLive) ? false : isLive

    let res = is_live 
        ? { timeStamp_sk_live_latest: swiftNow() }
        : { timeStamp_sk_test_latest: swiftNow() }

    await fire.firestore.doc(`${DbPaths.vendor_permissions}/${vendorID}`).update(res);
}


/**
 *
 * @Use: find user by severSide vendorID
 * @Params:
 *    - vendorID :: String
 *
*/
exports.getVendor = async ( vendorID ) =>  {

    if ( trivialString(vendorID) ){
        return null;
    }

    const matches = await fire.firestore
        .collection(DbPaths.vendors)
        .where('vendorID', '==', vendorID)
        .get();

    var vendors = [];        

    if (!matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                let data = doc.data();
                vendors.push(data)
            }
        })
    }

    return vendors.length === 0 ? null : vendors[0];
}


/**
 *
 * @Use: find user by vendorEmail
 * @Params:
 *    - email :: String
 *
*/
exports.getVendorByEmail = async ( email ) =>  {

    if ( trivialString(email) ){
        return null;
    }

    const matches = await fire.firestore
        .collection(DbPaths.vendors)
        .where('email', '==', email)
        .get();

    var vendors = [];        

    if (!matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                let data = doc.data();
                vendors.push(data)
            }
        })
    }

    return vendors.length === 0 ? null : vendors[0];
}


/**
 *
 * @Use: find user by client side vendorID
 *       build out record with sk_live and sk_test
 * @Params:
 *    - vendor_client_id  :: String
 * @returns:
 *    - vendor record with sk_live and sk_test
 *
*/
exports.getVendorByClientID = async ( vendor_client_id ) =>  {

    if ( trivialString(vendor_client_id) ){
        return null;
    }

    const matches = await fire.firestore
        .collection(DbPaths.vendors)
        .where('client_vendor_id', '==', vendor_client_id)
        .get();

    var vendors = [];        

    if (!matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                let data = doc.data();
                vendors.push(data)
            }
        })
    }

    var the_vendor = vendors.length === 0 ? null : vendors[0]

    if ( the_vendor === null ){
        return null;
    }

    var perms = [];

    const match_perms = await fire.firestore
        .collection(DbPaths.vendor_permissions)
        .where('vendorID', '==', the_vendor.vendorID)
        .get();     

    if (!match_perms.empty){
        match_perms.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                let data = doc.data();
                perms.push(data)
            }
        })
    }

    let perm_record = perms.length === 1 ? perms[0] : null;

    if (perm_record === null){
        return null;
    }

    the_vendor['sk_test'] = perm_record.sk_test || ""
    the_vendor['sk_live'] = perm_record.sk_live || ""

    return the_vendor;
}


