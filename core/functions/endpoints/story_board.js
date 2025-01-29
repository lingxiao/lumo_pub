/**
 * @Package:  endpoints for storyboard for building stories
 * @Date   : 3/4/2022
 * @Author : Xiao Ling   
 * @Read: https://firebase.google.com/docs/hosting/functions
 *        https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 *        https://firebase.google.com/docs/functions/write-firebase-functions
 * Stripe payment: adnw-esrg-swqh-nixz-vhmh
 * 
 * @Test:   `firebase serve`
 * 
*/

const functions = require('firebase-functions');
const express   = require('express');

const { assertWellFormedRequest, with_api_response } = require('./endpoint_utils');

const {
      getTopProject
    , getProjects
    , getProject
    , getStoryBoard
    , getStoryboardItem
} = require('./../api/client/storyboardRead');

const { 

    createProject,
    editProject,
    editProjectPrivacy,
    editStoryBoard,

    createStoryBoard,
    createStoryBoardItem,
    editStoryBoardItem,
    removeStoryBoardItem,
    maybe_premint_ticket,

    uploadTrailer,
    getTrailer,
    patronizeStoryboardInEth,

} = require('./../api/client/storyboardWrite');


const {
    make_connected_account,
    confirm_connected_account,
    fiat_purchase_and_premint,
    payout_project_express,
    get_express_payable,
    get_fiat_minted_tok_owned_by,
} = require('./../api/client/storyboardStripe');

const {
    deleteCrew,
    readInviteLink,
    createInviteLink,
    acceptInviteLink,    
    get_storyboarditem_collabs,
    getStoryboardWhiteList,
    whiteListUserToStoryboard,    
} = require('./../api/client/storyboardUsers');

const {
    getItemLicensors,
    licenseCollectionItem,
    getItemByLicenseID,
    generateLicenseInvite,
    get_acquired_licenses,
    can_license_item,
} = require('./../api/client/storyboardLicense');



// API 
const API = express();


/******************************************************
    @twitter api
******************************************************/

/**
 * 
 * @Use: serve url for storyboard item
 * 
 **/
API.get("/project/:ethAddress", async (req,res)=> {

    const { ethAddress } = req.params;
    if ( trivialString(ethAddress) || ethAddress === "_HOME_" ){
        let { root } = await getTopProject();
        res.send(root ?? {});
    } else {
        let { root } = await getProject({ address: ethAddress, full: false, eraseKey: true });
        res.send(root ?? {});
    }
})


/**
 * 
 * @Use: serve url for storyboard item
 * 
 **/
API.get("/license/:license_id", async (req,res)=> {

    const { license_id } = req.params;
    let { data } = await getItemByLicenseID({ licenseID: license_id });
    res.send(data ?? {});
})



/**
 * 
 * @Use: serve url for storyboard item
 * 
 **/
API.get("/storyboarditem/:id", async (req,res)=> {

    const { id } = req.params;
    let { success, data } = await getStoryboardItem({ itemID: id })
    res.send(data ?? {})

})


/******************************************************
    @story read
******************************************************/


/**
 * 
 * @Use: get story board at `storyBoardID`
 * 
 **/ 
API.post('/get_top_project', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: [],
        data_format: {},
        fn: getTopProject,
    });
});

/**
 * 
 * @Use: get story board at `storyBoardID`
 * 
 **/ 
API.post('/get_all_projects', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: [],
        data_format: [],
        fn: getProjects,
    });
});


/**
 * 
 * @Use: get story board at `storyBoardID`
 * 
 **/ 
API.post('/get_project', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: [],
        data_format: {},
        fn: getProject,
    });
});




/**
 * 
 * @Use: get story board at `storyBoardID`
 * 
 **/ 
API.post('/get_storyboarditem_collabs', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['itemID'],
        data_format: [],
        fn: get_storyboarditem_collabs
    });
});




/******************************************************
    @write + edit project root
******************************************************/

/**
 * 
 * @Use: get story board at `storyBoardID`
 * 
 **/ 
API.post('/create_project', async (req,res) => {

    let str = JSON.stringify(req.body);
    let body = JSON.parse(str);

    const { wellFormed, message, vendor } = await assertWellFormedRequest(
        req, 
        ["userID", "network"]
    );

    if ( !wellFormed ){

        let res_str = JSON.stringify({ "success": false, "message": message, data: {} });
        res.status(201).send( res_str );

    } else {

        var inputs = body;        
        const vendorID = vendor.vendorID;
        inputs['vendorID'] = vendorID;

        await createProject({
            ...inputs,
            then: (response) => {
                res.status(201).send(JSON.stringify(response));
            }
        });
    }
});


/**
 * 
 * @Use: get story board at `storyBoardID`
 * 
 **/ 
API.post('/edit_project', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['projectID'],
        data_format: {},
        fn: editProject,
    });
});

/**
 * 
 * @Use: edit project
 * 
 **/ 
API.post('/edit_project_privacy', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['address', 'userID'],
        data_format: {},
        fn: editProjectPrivacy,
    });
});


API.post('/patronizeStoryboardInEth', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        data_format: {},
        fn: patronizeStoryboardInEth,
        params: ["from_address", "to_address", 'amt_in_wei', 'userID', 'txHash', 'eth_network'],
    });
});



/******************************************************
    @write + edit project board
******************************************************/


/**
 * 
 * @Use: create storyboard
 * 
 **/ 
API.post('/create_story_board', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['address', 'userID', 'network'],
        data_format: {},
        fn: createStoryBoard,
    });
});


API.post('/edit_story_board', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['storyboardID', 'userID', 'network'],
        data_format: {},
        fn: editStoryBoard,
    });
});




/**
 * 
 * @Use: create bord item
 * 
 **/ 
API.post('/create_story_board_item', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['storyboardID', 'userID', 'network'],
        data_format: {},
        fn: createStoryBoardItem,
    });
});


//@Use: check can mint item
API.post('/maybe_premint_ticket', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["storyboardID", "userID"],
        data_format: {},
        fn: maybe_premint_ticket,
    });
});



/**
 * 
 * @Use: create bord item
 * 
 **/ 
API.post('/edit_story_board_item', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['itemID', 'userID', 'network'],
        data_format: {},
        fn: editStoryBoardItem,
    });
});



/**
 * 
 * @Use: remove board item
 * 
 **/ 
API.post('/remove_story_board_item', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['itemID', 'userID'],
        data_format: {},
        fn: removeStoryBoardItem,
    });
});

/**
 * 
 * @Use: get preminted items
 * 
 **/ 
API.post('/get_fiat_minted_tok_owned_by', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['userID'],
        data_format: {},
        fn: get_fiat_minted_tok_owned_by,
    });
});




/******************************************************
    @crew 
******************************************************/


// @Use: add crew
API.post('/add_crew', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['address'],
        data_format: {},
        fn: addCrew,
    });
});

// @use: delete crew
API.post('/delete_crew', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['address', 'adminUserID'],
        data_format: {},
        fn: deleteCrew,
    });
});



/******************************************************
    @stripe
******************************************************/



API.post('/make_connected_account', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        data_format: {},
        fn: make_connected_account,
        params: ["projectID", 'userID']
    });
});


API.post('/confirm_connected_account', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        data_format: {},
        fn: confirm_connected_account,
        params: ["projectID"]
    });
});

// buy ticket w/fiat
API.post('/fiat_purchase_and_premint', async (req,res) => {

    let str = JSON.stringify(req.body);
    let body = JSON.parse(str);

    const { wellFormed, message, vendor } = await assertWellFormedRequest(req, ['userID']);

    if ( !wellFormed ){

        let res_str = JSON.stringify({ "success": false, "message": message, data: {} });
        res.status(201).send( res_str );

    } else {

        var inputs = body;        
        const vendorID = vendor.vendorID;
        inputs['vendorID'] = vendorID;

        await fiat_purchase_and_premint({
            ...inputs,
            then: (response) => {
                res.status(201).send(JSON.stringify(response));
            }
        });
    }
});


// payout accounts payable to stripe merchant acct.
API.post('/payout_project_express', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        data_format: {},
        fn: payout_project_express,
        params: ["projectID"]
    });
});


// get how much is owed
API.post('/get_express_payable', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        data_format: {},
        fn: get_express_payable,
        params: ["projectID"]
    });
});




/******************************************************
    @license
******************************************************/


/**
 * 
 * @Use: read license
 * 
 **/ 
API.post('/can_license_item', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['itemID'],
        data_format: {},
        fn: can_license_item,
    });
});

/**
 *  * @Use: write license
 * 
 **/ 
API.post('/license_collection_item', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['itemID'],
        data_format: {},
        fn: licenseCollectionItem,
    });
});

/**
 * 
 * @Use: read license
 * 
 **/ 
API.post('/get_item_licensors', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['itemID'],
        data_format: {},
        fn: getItemLicensors,
    });
});

/**
 * 
 * @Use: read license
 * 
 **/ 
API.post('/generate_license_invite', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['itemID'],
        data_format: {},
        fn: generateLicenseInvite,
    });
});


/**
 * 
 * @Use: read license
 * 
 **/ 
API.post('/get_item_by_license_id', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: [],
        data_format: {},
        fn: getItemByLicenseID,
    });
});



/**
 * 
 * @Use: read license
 * 
 **/ 
API.post('/get_acquired_licenses', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['projectID'],
        data_format: {},
        fn: get_acquired_licenses,
    });
});


/******************************************************
    @whitelist
******************************************************/


/**
 * 
 * @Use: whitelist user
 * 
 **/ 
API.post('/whitelist_user_storyboard', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['address', 'storyboardID', 'userID'],
        data_format: {},
        fn: whiteListUserToStoryboard,
    });
});


/**
 * 
 * @Use: remove board item
 * 
 **/ 
API.post('/get_storyboard_whitelist', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['storyboardID'],
        data_format: {},
        fn: getStoryboardWhiteList,
    });
});


/*******************************************************
    @write+read storyboard: invite
******************************************************/

/**
 * 
 * @use: read-invite 
 * 
 **/
API.post('/read_invite_link', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['address', 'userID'],
        data_format: {},
        fn: readInviteLink,
    });
});


/**
 * 
 * @use: accept-invite 
 * 
 **/
API.post('/accept_invite_link', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['address', 'userID', 'invite_tok'],
        data_format: {},
        fn: acceptInviteLink,
    });
});


/******************************************************
    @trailer
******************************************************/

/**
 * 
 * @Use: upload trailer
 * 
 **/ 
API.post('/upload_trailer', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['projectID', 'userID', 'trailer_url'],
        data_format: {},
        fn: uploadTrailer
    });
});



/**
 * 
 * @use: get trailers 
 * 
 **/
API.post('/get_trailer', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['projectID'],
        data_format: {},
        fn: getTrailer
    });
});





/******************************************************
    @export
******************************************************/


exports.app_story_board = API;















