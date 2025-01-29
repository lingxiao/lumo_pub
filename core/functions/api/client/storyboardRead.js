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
} = require('./accounts');


const {
    DbPaths, 
    Networks,
    make_production_web3_account,
    store_keys_in_lumo_core,
    network_flow_to_eth,
    default_fn_response,
    MemberPermission,
    ItemMintState,
    CollectionKind,
} = require('./../core');

const {
    get_safe_by_project
} = require('./gnosisSafe')


/******************************************************
    @read
******************************************************/

/**
 * 
 * @use: get all projects
 * 
 * 
 **/ 
async function getTopProject(){

    var res = default_fn_response();

    const matches = await fire.firestore
        .collection(DbPaths.stories_top)
        .get();

    var projects = [];    

    if ( matches.empty ){
        res['message'] = 'no top story found'
        return res;
    }

    matches.forEach(doc => {
        if ( !trivialProps(doc,'data') ){
            projects.push(doc.data())
        }
    });

    if ( projects.length === 0 || trivialProps(projects[0],'eth_address') ){
        res['message']= 'no top story found'
        return res;
    }

    const { eth_address } = projects[0];

    let project = await getProject({ address: eth_address, full: false });
    return project;
}


/**
 * 
 * @use: get all projects
 * 
 * 
 **/ 
async function getProjects(){

    var res = default_fn_response();
    res['data'] = [];

    const matches = await fire.firestore
        .collection(DbPaths.project_root)
        .get();

    var projects = [];    

    if ( matches.empty ){
        res['message'] = 'no stories found'
        return res;
    }

    matches.forEach(doc => {
        if ( !trivialProps(doc,'data') ){
            projects.push(doc.data())
        }
    });

    let ps = projects
        .sort((a,b) => {
            let an = Number(a.budget_in_eth)
            let bn = Number(b.budget_in_eth)
            let _bool = ( trivialNum(an) ? 0 : an ) - ( trivialNum(bn) ? 0 : bn )
            return !_bool;
        })
        .filter(a => {
            return !trivialProps(a,'eth_address');
        })

    return { success: true, message: `found ${ps.length} stories`, data: ps }
}


/**
 * 
 * @use: get project by project eth address `or` subdomain
 * 
 * 
 **/ 
async function getProject({ address, subdomain, full }){

    if ( !trivialString(subdomain) ){

        const matches = await fire.firestore
            .collection(DbPaths.project_root)
            .where('subdomain', '==', subdomain)
            .get();

        var projects = [];    
        if ( !matches.empty ){
            matches.forEach(doc => {
                if ( !trivialProps(doc,'data') ){
                    projects.push(doc.data())
                }
            });
        }

        if (  projects.length === 0  ){
            return _goGetProjectByAddress({ address, full });
        } else {
            try {
                let addr = projects[0]['eth_address'] ?? "";
                return await _goGetProjectByAddress({ address: addr, full: full });
            } catch {
                return await _goGetProjectByAddress({ address, full });
            }
        }
    } else {
        return await _goGetProjectByAddress({ address, full });
    }

}



async function _goGetProjectByAddress({ address, full }){


    var res = default_fn_response({
        root: [],
        story: [],
        safe: {},
        fiat_items: [],
    });

    if ( trivialString(address) ){
        return res;
    }

    const matches = await fire.firestore
        .collection(DbPaths.project_root)
        .where('eth_address', '==', address)
        .get();

    var projects = [];    

    if ( matches.empty ){
        res['message'] = 'project dne at address'
        return res;
    }

    matches.forEach(doc => {
        if ( !trivialProps(doc,'data') ){
            projects.push(doc.data())
        }
    });

    let project = projects[0];

    if ( !full ){
        return {  
            success: true, 
            message: 'found project', 
            root: project, 
            story: [],
            characters: [],
            crew: [],
            schedule: [],
            contracts: [],
        }
    }

    var boards = [];
    const match_boards = await fire.firestore
        .collection(DbPaths.stories_boards)
        .where('address', '==', address)
        .get();

    if ( !match_boards.empty ){
        match_boards.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                boards.push(doc.data());
            }
        })
    }

    var full_boards = []
    for ( k = 0; k < boards.length; k ++ ){
        let board = boards[k]
        let { success, data, items } = await getStoryBoard({ storyboardID: board.storyboardID, full: full })
        if ( success ){
            let _item = { board: data, items: items }
            full_boards.push(_item)
        }
    }

    // get crew
    let proj_crew = await getCrew({ address: project.eth_address })

    // get contracts + gnosis
    let safe = await get_safe_by_project({ address: address });
    let proj_contracts = await getProjectContracts({ project_address: address })

    // get fiat purchased items
    let fiat_items = await getFiatPurchasedStoryboardItems({ address });

    /// get connected acct;
    let stripe_acct = await get_connect_account({ projectID: address });

    var res_blob = { 
        success   : true, 
        message   : `found ${full_boards.length} storyboards`,
        root      : project, 
        story     : full_boards ,
        safe      : safe.data ?? {},
        crew      : trivialProps(proj_crew, 'data' ) ? [] : proj_crew.data,
        contracts : trivialProps(proj_contracts,'data') ? [] : (proj_contracts.data ?? []),
        fiat_items: fiat_items.data ?? [],
        stripe_connected: stripe_acct.data ?? {},
     };

     return res_blob;

}


/**
 * 
 * @use: get all contracts assocaited with this storyboard
 *
 **/
async function getProjectContracts({ project_address }){

    var res = default_fn_response();
    res['data'] = []

    if ( trivialString(project_address) ){
        res['message'] = 'project address unspecified'
        return res
    }

    const matches = await fire.firestore
        .collection(DbPaths.project_contracts)
        .where('project_address', '==', project_address)
        .get();

    var data  = [];        

    if (!matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                data.push(doc.data());
            }
        })
    }

    return { success: true, message: `found ${data.length} contracts`, data: data };

}


/**
 * 
 * @use: get story board at boardID for storyID
 * 
 **/ 
async function getStoryBoard({ storyboardID, full, eraseKey }){

    var res = default_fn_response();

    res['items'] = [];

    if ( trivialString(storyboardID) ){
        return res;
    }    

    const matches = await fire.firestore
        .collection(DbPaths.stories_boards)
        .where('storyboardID', '==', storyboardID)
        .get();

    var data  = [];        

    if (!matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                var storydata = doc.data();
                if ( eraseKey ){
                    storydata['eth_private_key'] = ""
                }
                data.push(storydata)
            }
        })
    }

    let story = data.length > 0 ? data[0] : {};
    var items = [];

    if ( full && !trivialProps(story,'storyboardID') ){
        const db_items = await fire.firestore
            .collection(DbPaths.stories_board_items)    
            .where('storyboardID', '==', storyboardID)
            .get();
        if (!db_items.empty){
            db_items.forEach(doc => {
                if ( !trivialProps(doc,'data') ){
                    items.push(doc.data())
                }
            })
        }            
    }

    return { success: true, message: "succeess", data: story, items: items }

}


/**
 * 
 * @use: get story board item
 * 
 **/ 
async function getStoryboardItem({ itemID }){

    var res = default_fn_response();

    if ( trivialString(itemID) ){
        return res;
    }    

    const matches = await fire.firestore
        .collection(DbPaths.stories_board_items)
        .where('itemID', '==', itemID)
        .get();

    var data = [];        

    if (!matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                data.push(doc.data())
            }
        })
    }

    return { success: true, message: "succeess", data: data }
}


/**
 * 
 * @use: get all board items purchased by fiat
 * 
 **/
async function getFiatPurchasedStoryboardItems({ address }){

    var res = default_fn_response({ data: [] });

    if ( trivialString(address) ){
        res['message'] = 'please specify project address'
        return res;
    }    

    const matches = await fire.firestore
        .collection(DbPaths.stories_board_items)
        .where('address', '==', address)
        .get();

    var items = [];        

    if (!matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                items.push(doc.data())
            }
        })
    }

    let fiat_items = items.filter(m => m['mint_state'] === ItemMintState.fiat_purchased_await_mint);
    res['success'] = true;
    res['message'] = `found ${fiat_items.length} items`
    res['data']    = fiat_items;
    return res;
}



/**
 * 
 * @Use: determin if project at `address` is owned by
 *       userID 
 * 
 **/
async function is_project_owner({ address, userID }){

    if ( trivialString(userID) || trivialString(address) ){
        return false;
    }

    let { root } = await getProject({ address: address, full: false })
    let user   = await getUserByVendorID({ userID: userID, vendorID: '', withPrivateKey: false });    

    let user_id = trivialProps(user,'userID') ? '' : user.userID;
    let user_pk = trivialProps(user,'metamask_ethereum_address') ? '' : user.metamask_ethereum_address;
    let root_user_id = trivialProps(root,'userID') ? '' : root.userID;

    return user_id === root_user_id || user_pk === root_user_id;
}

/******************************************************
    @project stripe
******************************************************/

/**
 *
 * @Use: get connected acount blob 
 * 
 **/
async function get_connect_account({ projectID, stripe_account_id }){

    var res = default_fn_response({ exists: false, expired: false, data: {} });

    if ( trivialString(projectID) && trivialString(stripe_account_id) ){
        res['message'] = 'not projectID/stripe_account_id found';
        return res;
    }

    var acct = [];

    var matches = { empty: true }
    const match_root = fire.firestore.collection(DbPaths.stories_stripe_connected);

    if ( !trivialString(projectID)  ){
        matches = await match_root.where('projectID', '==', projectID).get();
    } else if ( !trivialString(stripe_account_id) ){
        matches = await match_root.where('ID', '==', stripe_account_id ?? "").get();        
    }

    if (!matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                acct.push(doc.data())
            }
        })
    }  

    if ( acct.length === 0 ){
        res['message'] = 'no account created';
        return res;
    }

    let { ID, link, expires_at, charges_enabled, payouts_enabled } = acct[0];

    // if expired, then delete
    res['data']    = acct[0];
    res['link']    = link ?? "";
    res['exists']  = true;
    res['success'] = true;
    res['message'] = 'found acct';
    res['expired'] = swiftNow() > expires_at && (!charges_enabled || !payouts_enabled);

    return res;
}


/**
 * 
 * @Use: add crew member to production
 * 
 **/
async function getCrew({ address }){

    var res = default_fn_response();

    if ( trivialString(address) ){
        return res;
    }    

    const matches = await fire.firestore
        .collection(DbPaths.stories_crew)
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

    return { success: true, message: "success", data: data }
}


/******************************************************
    @exports
******************************************************/


// read
exports.getTopProject  = getTopProject;
exports.getProjects    = getProjects;
exports.getProject     = getProject;
exports.getStoryBoard  = getStoryBoard;
exports.getStoryboardItem = getStoryboardItem;
exports.getFiatPurchasedStoryboardItems = getFiatPurchasedStoryboardItems
exports.getProjectContracts = getProjectContracts;
exports.is_project_owner  = is_project_owner;
exports.get_connect_account = get_connect_account;
exports.getCrew = getCrew;
