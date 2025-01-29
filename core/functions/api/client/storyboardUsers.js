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
    ppSwiftTime,    
    swiftNow, 
    illValued, 
    trivialProps, 
    trivialNum, 
    trivialString,
    vernacularDateInESTToSwiftTimeStamp,
    prettyPrintUtcTimeStampInESTVernacular,
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
    getProject,
    is_project_owner,
} = require('./storyboardRead');



/******************************************************
    @write+read storyboard: crew + collabs
******************************************************/


/**
 * 
 * @Use: get a crew at id 
 * 
 **/
async function getCrewAt({ address, crewID }){

    var res = default_fn_response();

    if ( trivialString(address) || trivialString(crewID) ){
        return res;
    }    

    const matches = await fire.firestore
        .collection(DbPaths.stories_crew)
        .where('projectAddress', '==', address)
        .where('ID', '==', crewID)
        .get();

    var data  = [];        

    if (!matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                data.push(doc.data() ?? {})
            }
        })
    }

    if ( data.length > 0 ){
        return { success: true, message: "success", data: data[0] }
    } else {
        return { success: false, message: "crew dne", data: {} }        
    }
}


/**
 *
 * @use: get crew using memer's `crew_eth_address` 
 * 
 **/
async function getCrewAtMetamask({ address, crew_eth_address }){

    var res = default_fn_response();

    if ( trivialString(address) || trivialString(crew_eth_address) ){
        return res;
    }    

    const matches = await fire.firestore
        .collection(DbPaths.stories_crew)
        .where('projectAddress', '==', address)
        .where('crew_eth_address', '==', crew_eth_address)
        .get();

    var data  = [];        

    if (!matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                data.push(doc.data() ?? {})
            }
        })
    }

    if ( data.length > 0 ){
        return { success: true, message: "success", data: data[0] }
    } else {
        return { success: false, message: "crew dne", data: {} }        
    }
}


/**
 * 
 * @use: log collab type, add this person to crew
 * 
 **/ 
async function log_collab_type({ types, itemID, userID, crew_eth_address, storyboardID, address }){

    if ( trivialProps(types,'length') || trivialString(userID) ){
        return false;
    }

    let id = uuid.v4()
    let blob = {
        ID: id,
        userID: userID,
        types : types,
        itemID: trivialString(itemID) ? "" : itemID,
        project_eth_address: address,
        crew_eth_address: crew_eth_address ?? "",
        storyboardID: trivialString(storyboardID) ? "" : storyboardID,
    }

    let did = await fire.firestore
        .collection(DbPaths.stories_board_items_collabs)
        .doc( id )
        .set( blob )
        .then(_ => true)
        .catch(e => false)

    let existing_user = await getUserByVendorID({ userID: userID, withPrivateKey: false });    
    let existing_user_view = existing_user ?? {};

    let log_response = await addCrew({
        ...existing_user_view,
        address: address ?? "",
        crewUserID: userID ?? "",
        img_url: trivialProps(existing_user, 'image_url') ? '' : (existing_user.image_url ?? "") ,
        crew_eth_address: crew_eth_address ?? "", 
        split: 0,
        perm: MemberPermission.t1
    })

    return did;
}

/**
 * 
 * @use: log collab type
 * 
 **/ 
async function get_storyboarditem_collabs({ itemID }){

    var response = default_fn_response({ data: [] });

    var res = [];

    if ( !trivialString(itemID) ){
        const matches_1 = await fire.firestore
            .collection(DbPaths.stories_board_items_collabs)
            .where('itemID', '==', itemID)
            .get();

        if (!matches_1.empty){
            matches_1.forEach(doc => {
                if ( !trivialProps(doc,'data') ){
                    res.push(doc.data())
                }
            })
        }        
    }

    response[`message`] = `found ${res.length} collabs`
    response['success'] = true;
    response['data'] = res;
    return response;
}



/**
 * 
 * @Use: add crew member to production
 * 
 **/
async function addCrew({ 
    address,
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
    perm,
}){

    var res = default_fn_response();

    if ( trivialString(address) ){
        res['success'] = false;
        return res;
    }    

    let { root }       = await getProject({ address: address, full: false })
    let crew_user_blob = await getUserByMetamask({ metamask: crew_eth_address });
    let existing_crew  = await getCrewAtMetamask({ address: address, crew_eth_address: crew_eth_address })

    if ( trivialProps(root,'eth_address') ){
        res['success'] = false;
        res['message'] = 'project dne'
        return res;
    }

    if (   !trivialProps(existing_crew,'data') 
        && !trivialProps(existing_crew.data,'ID') 
        && !trivialString(existing_crew.data.ID)
        && !trivialProps(existing_crew.data,'name')
        && !trivialProps(existing_crew.data,'about')
        && !trivialString(existing_crew.data.name)
        && !trivialString(existing_crew.data.about)
    ){
        res['success'] = true;
        res['message'] = 'this crew already exists';
        return res;
    }

    let crew_user_id = crewUserID ?? ( trivialProps(crew_user_blob,'userID') ? "" : crew_user_blob.userID );

    let id = !trivialString(crew_eth_address)
        ? `${address}_${crew_eth_address}`
        : !trivialString(crewUserID)
        ? `${address}_${crewUserID}`
        : uuid.v4();

    let blob = {
        ID            : id,
        projectID     : root.ID ?? "",
        projectAddress: root['eth_address'] ?? "",
        crewUserID    : crew_user_id ?? "",
        crew_eth_address: crew_eth_address ?? "",
        img_url : img_url    ?? "",
        name    : name       ?? "",
        about   : about      ?? "",
        imdb    : imdb       ?? "",
        instagram: instagram ?? "",
        twitter: twitter     ?? "",
        opensea: opensea     ?? "",
        link   : link        ?? "",
        split  : split       ?? 0,
        perm   : trivialString(perm) ? MemberPermission.t1 : (perm ?? ""),
        timeStampCreated: swiftNow(),
        timeStampLatest: swiftNow(),
        timeStampCreatedPP: ppSwiftTime(swiftNow()) ?? "",        
    };

    let did = await fire.firestore
        .collection(DbPaths.stories_crew)
        .doc( id )
        .set( blob )
        .then(_ => true)
        .catch(e => false)

    res['success'] = did;
    res['message'] = did ? 'success' : 'failed to write to db';
    res['data'] = blob;

    return res;        
}

/**
 * 
 * @Use: add crew member to production
 * 
 **/
async function editCrew({ 
    address,
    crewEntryID,
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
    perm,
}){

    var res = default_fn_response();

    if (  trivialString(address) || trivialString(crewEntryID) ){
        return res;
    }    

    let { root } = await getProject({ address: address, full: false });

    if ( trivialProps(root,'eth_address') ){
        res['message'] = 'project dne'
        return res;
    }

    const { data } = await getCrewAt({ address: address, crewID: crewEntryID });

    if ( !trivialProps(data,'ID') ){

        var new_item = { ...data, timeStampLatest: swiftNow() };

        if ( !trivialString(name)){
            new_item['name'] = name
        }
        if ( !trivialString(about)){
            new_item['about'] = about
        }
        if ( !trivialString(imdb)){
            new_item['imdb'] = imdb
        }
        if ( !trivialString(instagram)){
            new_item['instagram'] = instagram
        }
        if ( !trivialString(twitter)){
            new_item['twitter'] = twitter
        }
        if ( !trivialString(opensea)){
            new_item['opensea'] = opensea
        }
        if ( !trivialString(link)){
            new_item['link'] = link
        }
        if ( !trivialNum(split) ){
            new_item['split'] = split;
        }
        if ( !trivialString(img_url) ){
            new_item['img_url'] = img_url;
        }
        if ( !trivialString(crew_eth_address) ){
            new_item['crew_eth_address'] = crew_eth_address;
        }
        if ( !trivialString(perm) ){
            new_item['perm'] = perm ?? "";
        }

        let did = await fire.firestore
            .collection(DbPaths.stories_crew)
            .doc( data['ID'] )
            .update( new_item )
            .then(_ => true)
            .catch(e => false)

        res['success'] = did;
        res['message'] = did ? 'success' : 'failed to update to db';
        res['data'] = new_item;

        return res;                

    } else {

        res['success'] = false;
        res['message'] = 'this person does not exist'
        return res;        

    }
}


/**
 * 
 * @Use: add crew member to production
 * 
 **/
async function deleteCrew({ 
    address,
    adminUserID, 
    crewEntryID,
    vendorID,
}){

    var res = default_fn_response();

    if ( trivialString(adminUserID) || trivialString(address) || trivialString(crewEntryID) ){
        return res;
    }    

    let user = await getUserByVendorID({ userID: adminUserID, vendorID: vendorID, withPrivateKey: false });    
    let { root } = await getProject({ address: address, full: false });

    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return res;
    }   

    if ( trivialProps(root,'eth_address') ){
        res['message'] = 'project dne'
        return res;
    }

    let is_owner = await is_project_owner({ address: address, userID: adminUserID });

    if ( !is_owner ){
        res['message'] = 'only project owner can edit crew'
        return res;
    }

    const { data } = await getCrewAt({ address: address, crewID: crewEntryID });

    if ( trivialProps(data,'ID')  ){
        res['success'] = true
        res['message'] = 'removed'
        return res;
    } else {

        await fire.firestore
            .collection(DbPaths.stories_crew)
            .doc(crewEntryID)
            .delete();

        res['success'] = true
        res['message'] = 'removed'
        return res;
    }

}



/******************************************************
    @write+read storyboard: invite
******************************************************/

/***
 * 
 * @Use: read invite link for story at `address` 
 * @TODO: make this a 1 time use link
 * 
 **/
async function readInviteLink({ address, userID }){

    var res = default_fn_response();

    if ( trivialString(address) ){
        res['message'] = 'please input valid address or valid user-id'
        return res;
    }

    const matches = await fire.firestore
        .collection(DbPaths.stories_invite)
        .where('projectAddress', '==', address)
        .get();

    var data  = [];        

    if (!matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                data.push(doc.data() ?? {})
            }
        })
    }

    // if not found, try creating one if this `userID`
    // is the admin userid for story at `address`
    if ( data.length === 0 ){

        let { root } = await getProject({ address: address, full: false })
        let is_owner = await is_project_owner({ address: address, userID: userID });

        if (  !is_owner ){

            res['message'] = 'this invite link has expired'
            return res;

        } else {

            // make link if I'm the admin
            let { success, data } = await createInviteLink({ address, userID });

            if ( !success ){
                res['message'] = 'link not found'
                return res;            
            } else {
                return { success: true, message: 'found invite', data: data }
            }

        }

    } else {

        return { success: true,  message: 'found invite', data: data[0] }

    }

}


/***
 * 
 * @Use: create invite link for story at `address` 
 * 
 **/
async function createInviteLink({ address, userID }){

    var res = default_fn_response();

    if ( trivialString(address) || trivialString(userID) ) {
        res['message'] = 'pleasep input valid address or valid user-id'
        return res;
    }    

    let id = address;
    let tok = uuid.v4();

    let blob = {
        ID : id,
        tok: tok,
        userID: userID,
        projectAddress: address,
        timeStampCreated: swiftNow(),
        timeStampCreatedPP: ppSwiftTime(swiftNow()) ?? "",        
    }

    let did = await fire.firestore
        .collection(DbPaths.stories_invite)
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
 * @Use: accept invite link for project `address?=invite_tok`
 *       by user `userID`, this will add user as `t1`
 * 
 **/
async function acceptInviteLink({ address, invite_tok, userID }){

    var res = default_fn_response();

    if ( trivialString(address) || trivialString(userID) ) {
        res['message'] = 'please input valid address or valid user-id'
        return res;
    }

    if ( trivialString(invite_tok) ){
        res['message'] = 'please include invite token'
        return res;
    }

    let user = await getUserByVendorID({ userID: userID, vendorID: '', withPrivateKey: false });    
    if ( trivialProps(user,'userID') ){
        res['message'] = 'this user dne'
        return res;
    }    

    let { root } = await getProject({ address: address, full: false })
    if ( trivialProps(root,'ID') ){
        res['message'] = 'project dne'
        return res;
    }

    let is_owner = await is_project_owner({ address: address, userID: userID });

    if ( is_owner ){
        return { success: true, message: `You're the owner of this project!`, data: {} };
    }


    const { success, message, data } = await readInviteLink({  address, userID });

    if ( !success ){
        res['message'] = message
        return res;
    }

    if ( invite_tok === data['tok'] ){

        // add core member
        let log_response = await addCrew({
            ...user,
            address: address ?? "",
            crewUserID: userID ?? "",
            img_url: trivialProps(user, 'image_url') ? '' : (user.image_url ?? "") ,
            crew_eth_address: trivialProps(user, 'metamask_ethereum_address') ? '' : (user.metamask_ethereum_address ?? "") ,
            split: 0,
            perm: MemberPermission.t1
        });

        // delete invite link after accepting.
        // this prevent the link being used again by another person. 
        if ( !trivialProps(data,'ID') && !trivialString(data.ID) ){
            await fire.firestore
                .collection(DbPaths.stories_invite)
                .doc(data.ID)
                .delete();
        }

        if ( log_response['success'] ){
            res['success'] = true;
            res['message'] = 'ok invited!'
            return res;
        } else {
            return log_response;
        }

    } else {

        res['message'] = 'this invite token has expired'
        return res;
    }

}




/******************************************************
    @whitelist
******************************************************/


/**
 * 
 * @use: add user to project address
 *  
 **/
async function whiteListUserToStoryboard({ address, storyboardID, userID, network }){

    var res = default_fn_response({ data: {} });
    if ( [address,storyboardID,userID].map(trivialString).includes(true)  ){
        res['message'] = 'please specify collection and user';
        return res;
    }

    let { success, data } = await getStoryboardWhiteList({ storyboardID });
    let did_whitelist = data.filter(m => m.userID === userID );

    if ( did_whitelist.length > 0 ){
        res['success'] = true;
        res['data'] = did_whitelist[0]
        res['message'] = 'already whitelisted!'
        return res;
    }


    let id = uuid.v4();
    let blob = {
        ID           : id,
        storyboardID : storyboardID,        
        projectID    : address, 
        address      : address,
        userID       : userID,
        network      : network,

        timeStampCreated : swiftNow(),
        timeStampLatest  : swiftNow(),
        timeStampCreatedPP: ppSwiftTime(swiftNow()) ?? "",        
    }

    let did = await fire.firestore
        .collection(DbPaths.collection_whitelist)
        .doc( id )
        .set( blob )
        .then(_ => true)
        .catch(e => false)

    res['success'] = did;
    res['message'] = did ? 'success' : 'failed to write to db';
    res['data'] = blob;

    return res;            

}

/**
 * 
 * @use: get all ppl on whitelist
 * 
 **/ 
async function getStoryboardWhiteList({ storyboardID }){

    var res = default_fn_response();

    res['data'] = [];

    if ( trivialString(storyboardID) ){
        res['message'] = 'please specify collection'
    }

    var list = [];

    const fetchwhitelist = await fire.firestore
        .collection(DbPaths.collection_whitelist)
        .where('storyboardID', '==', storyboardID)
        .get();

    if (!fetchwhitelist.empty){
        fetchwhitelist.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                list.push(doc.data())
            }
        })
    }     

    res['success'] = true;
    res['message'] = `found ${list.length} whitelisted addresses`
    res['data'] = list;
    return res;
}


/******************************************************
    @exports
******************************************************/



// write crew
exports.editCrew = editCrew;
exports.addCrew  = addCrew;
exports.getCrewAtMetamask = getCrewAtMetamask;
exports.deleteCrew = deleteCrew;

// invite
exports.readInviteLink   = readInviteLink
exports.createInviteLink = createInviteLink
exports.acceptInviteLink = acceptInviteLink

exports.log_collab_type = log_collab_type;
exports.get_storyboarditem_collabs = get_storyboarditem_collabs;

// make white-list
exports.getStoryboardWhiteList    = getStoryboardWhiteList
exports.whiteListUserToStoryboard = whiteListUserToStoryboard






