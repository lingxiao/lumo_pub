/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: opensea integration
 * @Date   : Dec 20th, 2021
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
const fire  = require('./../fire')
const functions = require('firebase-functions');
const uuid = require('uuid');


const { 
    print,
    swiftNow, 
    illValued, 
    trivialProps, 
    trivialNum, 
    trivialString,
} = require('./../utils');

const { 
    DbPaths, 
    Networks, 
    TokenParsingScheme,
    default_fn_response,     
    alchemyWeb3Instance,
} = require('./../core');

const { getUserByVendorID } = require('./accounts');

const { 
    get_token_with_flow_account,
} = require("./naryTreeFinanceUtils");



/******************************************************
    @read + write modifying exiting nfty record
******************************************************/

/**
 * 
 * @use: get a submission from `ownerPK` on `address` with `tokid`
 * 
 */ 
async function get_opensea_nft({
    openSea_tokID,
    openSea_contractAddress,
}){


    let bs = [
        trivialString(openSea_tokID),
        trivialString(openSea_contractAddress),
    ]

    if ( bs.includes(true) ){
        return {};
    }

    const matches = await fire.firestore
        .collection(DbPaths.leaves)
        .where('openSea_tokID'          , '==', openSea_tokID)
        .where('openSea_contractAddress', '==', openSea_contractAddress)
        .get();

    var subs = [];        

    if (!matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                let data = doc.data();
                subs.push(data)
            }
        })
        return subs.length > 0 ? subs[0] : {};
    } else {
        return {}
    }

}


/**
 * 
 * @Use: parse `metadata` and extract 
 *       verified opensea data key-value pairs
 * 
 **/
function parseOpenSeaRawData(metadata){

    var meta_blob = {}

    if (illValued(metadata)){
        return meta_blob;
    }

    for (key in metadata){
        
        let val = metadata[key];
        let good_keys = [
              'openSea_tokID'
            , 'openSea_contractAddress'
            , 'openSea_creatorName'            
            , 'openSea_creatorAddress'
            , 'openSea_ownerAddress'            
            , 'openSea_ownerName',
            , 'openSea_image_preview_url'
            , 'openSea_image_thumbnail_url'
            , 'openSea_image_url'
            , 'openSea_image_original_url'
            , 'openSea_description'
            , 'openSea_token_metadata'
            , 'openSea_token_name'
            , "openSea_did_download_images"
            , "openSea_image_type",
        ]

        if (  !illValued(val) && good_keys.includes(key) ){
            meta_blob[key] = val;
        }
    }

    return meta_blob;

}


/******************************************************
    @write new record for submission pending mint
******************************************************/


/**
 * 
 * @use: get a submission from `ownerPK` on `address` with `tokid`
 * 
 */ 
async function get_opensea_nft_submission({
    openSeaTokID,
    openSeaContractAddress,
    ownerPublicKey,
}){


    let bs = [
        trivialString(openSeaTokID),
        trivialString(openSeaContractAddress),
        trivialString(ownerPublicKey),
    ]

    if ( bs.includes(true) ){
        return null;
    }

    const matches = await fire.firestore
        .collection(DbPaths.log_opensea_nft_transfer)
        .where('openSeaTokID'          , '==', openSeaTokID)
        .where('ownerPublicKey'        , '==', ownerPublicKey)
        .where('openSeaContractAddress', '==', openSeaContractAddress)
        .get();

    var subs = [];        

    if (!matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                let data = doc.data();
                subs.push(data)
            }
        })
    }

    return subs;
}


/**
 *
 * @Use: get token w/ with flow account
 * 
*/
async function log_opensea_nft_submission({ 
    openSeaTokID,
    openSeaContractAddress,
    openSeaCreatorAddress,
    ownerPublicKey,
    image_preview_url,
    image_thumbnail_url,
    image_url,
    image_original_url,
    parentTokID,
    userID
}){


    let bs = [
        trivialString(openSeaTokID),
        trivialString(openSeaContractAddress),
        trivialString(ownerPublicKey),
        trivialString(`${parentTokID}`)
    ];

    let parent = await get_token_with_flow_account({ tokID: `${parentTokID}`, parse: TokenParsingScheme.FAST });

    const existing_subs = await get_opensea_nft_submission({
        openSeaTokID    : openSeaTokID,
        openSeaContractAddress : openSeaContractAddress,
        ownerPublicKey  : ownerPublicKey,
    });

    if ( bs.includes(true) ){

        return { success: false, message: 'illformed inputs', blob: {} }

    } else if ( trivialProps(parent, 'tokID') ){

        return { success: false, message: 'parent token dne', blob: {} }

    } else if ( !trivialString(`${parent.tokID_10}`) && !trivialString(`${parent.tokID_11}`) ){

        return { success: false, message: `parent token has two children`, blob: {} }

    } else if ( existing_subs.length > 0 ){

        return { success: false, message: 'already submitted', blob: {} }

    } else {

        let id = uuid.v4();

        let blob = {

            ID : id,
            userID          : userID,

            // eth data
            openSeaTokID    : openSeaTokID,
            openSeaContractAddress : openSeaContractAddress,
            ownerPublicKey  : ownerPublicKey,

            // opensea data
            openSeaCreatorAddress  : openSeaCreatorAddress ?? "",
            image_preview_url      : image_preview_url ?? "",
            image_thumbnail_url    : image_thumbnail_url ?? "",
            image_url              : image_url ?? "",
            image_original_url     : image_original_url ?? "",

            // lumo data
            parentTokID     : parentTokID,

            timeStampCreated: swiftNow(),
            timeStampLatest: swiftNow(),

            submissionState: 0,
        }

        let res = await fire.firestore
            .collection(DbPaths.log_opensea_nft_transfer)
            .doc(id)
            .set( blob )
            .then(_ => true)
            .catch(e => { return false })

        return res 
            ? { success: true, message: "success", blob: blob }
            : { success: false, message: "failed to write to db", blob: {} }
    }

}





/******************************************************
    @export
******************************************************/


exports.get_opensea_nft = get_opensea_nft
exports.parseOpenSeaRawData = parseOpenSeaRawData
exports.get_opensea_nft_submission = get_opensea_nft_submission
exports.log_opensea_nft_submission = log_opensea_nft_submission










