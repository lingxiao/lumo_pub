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
} = require('./../utils');


const { 
    getUserByVendorID, 
    getUserByMetamask,
} = require('./accounts');



const {
    DbPaths, 
    Networks,
    CollaborationType,
    TokenParsingScheme,
    make_production_web3_account,
    store_keys_in_lumo_core,
    network_flow_to_eth,
    default_fn_response,
    MemberPermission,
    ItemMintState,
    CollectionKind,
} = require('./../core');

const {
      getProject
    , getStoryBoard
    , getStoryboardItem
} = require('./storyboardRead');



/******************************************************
    @license
******************************************************/


/**
 * 
 * @use: generate licensing invite 
 * 
 **/
async function generateLicenseInvite({ userID, storyboardID, itemID, network }){

    var res = default_fn_response({ license_id: "", data: {} });
    if ( [itemID].map(trivialString).includes(true)  ){
        res['message'] = 'please specify and storyboardID-itemID';
        return res;
    }

    // check if item exists
    const { data } = await getStoryboardItem({ itemID });

    if ( data.length === 0 || trivialProps(data[0],'ID') ){
        res['message'] = 'item dne'
        return res;
    }


    // if license id already generated,
    // then return id
    let item = data[0];
    if ( !trivialProps(item,'license_id') ){
        res['success'] = true;
        res['message'] = 'found'
        res['license_id'] = item.license_id;
        return res;
    }

    // else set licnese id
    const { address, privateKey } = make_production_web3_account();
    let license_id = address ?? uuid.v4();
    await fire.firestore
        .collection(DbPaths.stories_board_items)
        .doc( itemID )
        .update({ license_id: license_id ?? "" })
        .then(_ => true)
        .catch(e => false);

    res['success'] = true;
    res['message'] = 'found'
    res['license_id'] = license_id;
    return res;
}

/**
 * 
 * @use: get license invite
 **/
async function getItemByLicenseID({ licenseID }){

    var res = default_fn_response({ data: [] });
    if ( trivialString(licenseID) ){
        res['message'] = 'please specify licenseID';
        return res;
    }    

    var list = [];
    let root = await fire.firestore
        .collection(DbPaths.stories_board_items)
        .where('license_id', '==', licenseID)
        .get();

    if (!root.empty){
        root.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                list.push(doc.data())
            }
        })
    }     

    res['success'] = true;
    res['message'] = `found ${list.length} invites`;
    res['data'] = list.length > 0 ? list[0] : {}
    return res;    

}


/**
 * 
 * @use: licnese this item
 *  
 **/
async function licenseCollectionItem({ userID, itemID, projectID, network }){

    var res = default_fn_response({ data: {}, can_license: false });
    if ( [itemID,projectID,userID].map(trivialString).includes(true)  ){
        res['message'] = 'please specify projectID and storyboardID-itemID';
        return res;
    }

    let { message, data, can_license } = await can_license_item({ itemID: itemID, projectID: projectID });

    if ( !can_license ){
        res['message'] = message;
        return res;
    }

    const { storyboardID } = data;

    // project `projectID` by `userID` licenses
    // `itemID <- collectionID`
    let id = uuid.v4();
    let blob = {
        ID                    : id,
        licensed_itemID       : itemID,
        licensed_storyboardID : storyboardID ?? "",
        licensing_projectID   : projectID,
        userID                : userID,
        network               : network ?? "",
        timeStampCreated      : swiftNow(),
        timeStampLatest       : swiftNow(),
    }

    let did = await fire.firestore
        .collection(DbPaths.stories_licenses)
        .doc( id )
        .set( blob )
        .then(_ => true)
        .catch(e => false)

    res['can_license'] = can_license;
    res['success'] = did;
    res['message'] = did ? 'success' : 'failed to write to db';
    res['data'] = blob;

    return res;            

}

/**
 * 
 * @use: check if this item can be licensed
 * 
 **/
async function can_license_item({ itemID, projectID, network }){

    var res = default_fn_response({ data: {}, can_license: false });
    if ( [itemID].map(trivialString).includes(true)  ){
        res['message'] = 'please specify itemID';
        return res;
    }

    let { data } = await getStoryboardItem({ itemID });

    if ( data.length === 0 ){

        res['message'] = 'item dne';
        return res;

    } else {

        let item = data[0];
        const { storyboardID } = item;

        let _licensors  = await getItemLicensors({ itemID });
        let _board = await getStoryBoard({ storyboardID: storyboardID, full: true });

        let board    = _board.data;
        let licenses = _licensors.data;
        let ratio    = `${licenses.length}/${board.num_items}`;


        if ( board.num_items <= licenses.length ){
            res['data'] = item;
            res['success'] = true
            res['message'] = `${ratio} licenses have been issued`;
            return res;
        } else if ( !trivialString(projectID) ){
            let did_license = licenses.filter(m => m.licensing_projectID === projectID );
            if ( did_license.length > 0  ){
                res['data'] = item;
                res['success'] = true
                res['message'] = `${ratio} licenses have been issued, an license has already been issued to you`;
                return res;                
            } else {
                let str = `can license: ${ratio} licenses have been claimed`
                return { success: true, can_license: true, message: str, data: item }
            }
        } else {
            let str = `can license: ${ratio} licenses have been claimed`
            return { success: true, can_license: true, message: str, data: item }
        }
    }
}

/**
 * 
 * @use: get all ppl on whitelist
 * 
 **/ 
async function getItemLicensors({ itemID }){

    var res = default_fn_response();

    res['data'] = [];

    if ( trivialString(itemID) ){
        res['message'] = 'please specify item'
    }

    var list = [];

    const fetchwhitelist = await fire.firestore
        .collection(DbPaths.stories_licenses)
        .where('licensed_itemID', '==', itemID)
        .get();

    if (!fetchwhitelist.empty){
        fetchwhitelist.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                list.push(doc.data())
            }
        })
    }     

    res['success'] = true;
    res['message'] = `found ${list.length} projects that licensed this item`;
    res['data'] = list;
    return res;
}


/***
 * 
 * @use: get the storyboard at storyboardID where itemID
 *       belongs, in it is the licensing terms 
 * 
 **/
async function getItemLicenseStoryboard({ storyboardID, itemID }){

    var res = default_fn_response();

    res['data'] = [];

    if ( trivialString(storyboardID) ){
        res['message'] = 'please specify storyboardID'
    }

    var list = [];

    const fetchstoriboards = await fire.firestore
        .collection(DbPaths.stories_boards)
        .where('storyboardID', '==', storyboardID)
        .get();

    if (!fetchstoriboards.empty){
        fetchstoriboards.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                list.push(doc.data())
            }
        })
    }     

    res['success'] = true;
    res['message'] = `found ${list.length} storyboards`;
    res['data'] = list.length > 0 ? list[0] : {};
    return res;    
}


/**
 * 
 * @use: get all the items acquired by `projectID`
 *       in licensing deal
 * 
 **/
async function get_acquired_licenses({ projectID }){

    var res = default_fn_response({ data:[] });

    if ( trivialString(projectID) ){
        res['message'] = 'please specify projectID'
    }

    var list = [];

    const fetchstoriboards = await fire.firestore
        .collection(DbPaths.stories_licenses)
        .where('licensing_projectID', '==', projectID)
        .get();

    if (!fetchstoriboards.empty){
        fetchstoriboards.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                list.push(doc.data())
            }
        })
    }     

    let items = [];
    let fetch_items = await list
        .filter(m => !trivialProps(m,'licensed_itemID') && !trivialString(m.licensed_itemID))
        .map(async (m) => {
            let id = m.licensed_itemID
            const { licensed_storyboardID } = m;

            let { data } = await getStoryboardItem({ itemID: id })

            let _board = await getStoryBoard({ storyboardID: licensed_storyboardID, full: false, eraseKey: true })
            let _percent_rake = trivialProps(_board,'data')
                ? 0
                : trivialProps(_board.data, 'percent_rake')
                ? 0
                : Number(_board.data.percent_rake);

            if ( data.length > 0 ){
                let item = { ...data[0], timeStampLicensed: m.timeStampCreated ?? 0, percent_rake: _percent_rake }
                items.push(item);
            }
        })

    await Promise.all(fetch_items);

    res['success'] = true;
    res['message'] = `found ${items.length} licenses`;
    res['data'] = items;
    return res;    

}


/**
 * 
 * @use: get character for sotryboard id
 * 
 **/ 
async function getCharacter({ tokID, address }){

    var res = default_fn_response();
    if ( trivialString(address) || trivialString(tokID) ){
        return res;
    }    

    const matches = await fire.firestore
        .collection(DbPaths.stories_characters)
        .where('projectAddress', '==', address)
        .where('tokID', '==', tokID)
        .get();

    var data = [];        

    if (!matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                data.push(doc.data())
            }
        })
    }

    return { success: true, message: "succeess", data: data.length > 0 ? data[0] : {} }    

}

/**
 * 
 * @use: get all characters for sotryboard id
 * 
 **/
async function getAllCharacters({ address }){


    var res = default_fn_response();

    if ( trivialString(address) ){
        return res;
    }    

    const matches = await fire.firestore
        .collection(DbPaths.stories_characters)
        .where('projectAddress', '==', address)
        .get();

    var data = [];        

    if (!matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                data.push(doc.data())
            }
        })
    }

    return { success: true, message: `found ${data.length} characters`, data: data };
}


/******************************************************
    @exports
******************************************************/

// license
exports.getItemLicensors = getItemLicensors;
exports.licenseCollectionItem = licenseCollectionItem;
exports.getItemByLicenseID = getItemByLicenseID;
exports.generateLicenseInvite = generateLicenseInvite
exports.get_acquired_licenses = get_acquired_licenses;
exports.can_license_item      = can_license_item;

// stake characters
exports.getCharacter   = getCharacter;
exports.getAllCharacters = getAllCharacters;














