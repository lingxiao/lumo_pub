/**
 * @Package: endpoints for all web3 functions
 * @Date   : 6/8/2022
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

const { trivialProps } = require('./../api/utils');
const { assertWellFormedRequest, with_api_response } = require('./endpoint_utils');

const { 
    can_deploy_contract_to_project,
    did_deploy_contract_to_project,
    monitor_project_contract_deployed,
    can_mint_storyboard_item,
    will_mint_item,
    did_mint_storyboard_item,
    monitor_minted_storyboard_item,
    did_fail_to_mint,
    get_minted_tok,
    monitor_all_minting_storyboard_item,
    can_payout_splits,
    did_payout_splits,
    get_all_minted_tok,
    did_charge_and_fail_to_mint,
    get_all_minted_tok_owned_by,
} = require('./../api/client/storyboardWeb3');

const {
    _admin_move_contract_abi_to_server,    
} = require ('./../api/eth/contracts')

const {
    create_safe,
    get_safe,
    add_safe_signer,
    get_all_signers,
    propose_safe_tx,
    approve_safe_tx,
    reject_safe_tx,
    execute_safe_tx,
} = require('./../api/client/gnosisSafe');


// API 
const API = express();

/******************************************************
    @Opensea API
******************************************************/

/**
 * 
 * @Use: metadata for lost souls token
 * @Doc: https://github.com/ProjectOpenSea/metadata-api-nodejs/blob/master/index.js
 *  
 **/
API.get("/token/:id", async (req,res)=> {
    let tokenId = parseInt(req.params.id).toString()
    let response = await get_minted_tok({ tokID: tokenId })
    let tok = trivialProps(response, 'tok') ? {} : response.tok
    res.send(tok);
});


// get all minted toks for client
API.post("/get_minted_tok", async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: [],
        data_format: {},
        fn: get_minted_tok,
    });
});

// get all minted toks for client
API.post("/get_all_minted_tok", async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["contractAddress"],
        data_format: {},
        fn: get_all_minted_tok,
    });
});

// get all minted toks for client
API.post("/get_all_minted_tok_owned_by", async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["userID"],
        data_format: {},
        fn: get_all_minted_tok_owned_by,
    });
});


/******************************************************
    @Contract compile lifeccyle
******************************************************/

//@Use: check contract can be deployed
API.post('/can_deploy_contract_to_project', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["userID", "address"],
        data_format: {},
        fn: can_deploy_contract_to_project,
    });
});

//@Use: on did deploy contract, log update
API.post('/did_deploy_contract_to_project', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        data_format: {},
        fn: did_deploy_contract_to_project,
        params: ["address", "userID", 'hash', 'contract_kind'],
    });
});


//@Use: on did deploy contract, log update
API.post('/monitor_project_contract_deployed', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        data_format: {},
        fn: monitor_project_contract_deployed,
        params: ["address", "userID", 'contract_kind'],
    });
});


/******************************************************
    @Item mint life-cycle
******************************************************/



//@Use: check can mint item
API.post('/can_mint_storyboard_item', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["itemID"],
        data_format: {},
        fn: can_mint_storyboard_item,
    });
});

API.post('/will_mint_storyboard_item', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["userID", "itemID", 'contract_kind', 'contract_address'],
        data_format: {},
        fn: will_mint_item,
    });
});

//@Use: on did mint item, update
API.post('/did_mint_storyboard_item', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["userID", "itemID"],
        data_format: {},
        fn: did_mint_storyboard_item,
    });
});



// @Use: on fail mint, rmv from mint queue
API.post('/did_charge_and_fail_to_mint', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["userID"],
        data_format: {},
        fn: did_charge_and_fail_to_mint,
    });
});

// @Use: on fail mint, rmv from mint queue
API.post('/did_fail_to_mint', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["itemID"],
        data_format: {},
        fn: did_fail_to_mint,
    });
});


//@Use: on did mint item, update
API.post('/monitor_minted_storyboard_item', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ['transaction_hash'],
        data_format: {},
        fn: monitor_minted_storyboard_item,
    });
});


//@Use: on did mint item, update
API.post('/monitor_all_minting_storyboard_item', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: [],
        data_format: {},
        fn: monitor_all_minting_storyboard_item,
    });
});



/******************************************************
    @Contract payout spilt lifecycle
******************************************************/

//@Use: check can mint item
API.post('/can_payout_splits', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["address"],
        data_format: {},
        fn: can_payout_splits,
    });
});

//@Use: check can mint item
API.post('/did_payout_splits', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["address", 'hash'],
        data_format: {},
        fn: did_payout_splits,
    });
});

/******************************************************
    @gnosis-safe
******************************************************/

// get safe
API.post('/get_safe', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["safe_address"],
        data_format: {},
        fn: get_safe,
    });
});

//@Use: make safe
API.post('/create_safe', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["safe_address"],
        data_format: {},
        fn: create_safe,
    });
});


//@Use: make safe signer
API.post('/add_safe_signer', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["safe_address"],
        data_format: {},
        fn: add_safe_signer,
    });
});

//@Use: read safe signer
API.post('/get_all_signers', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["safe_address"],
        data_format: {},
        fn: get_all_signers,
    });
});


//@Use: read safe signer
API.post('/propose_safe_tx', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["safe_address"],
        data_format: {},
        fn: propose_safe_tx,
    });
});



API.post('/approve_safe_tx', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["safe_address"],
        data_format: {},
        fn: approve_safe_tx,
    });
});


API.post('/reject_safe_tx', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["safe_address"],
        data_format: {},
        fn: reject_safe_tx,
    });
});


API.post('/execute_safe_tx', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["safe_address"],
        data_format: {},
        fn: execute_safe_tx,
    });
});



/******************************************************
    @Move contract to server
******************************************************/

//@Use: check contract can be deployed
API.post('/_admin_move_contract_abi_to_server', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: [],
        data_format: {},
        fn: _admin_move_contract_abi_to_server,
    });
});


/******************************************************
    @export
******************************************************/


exports.app_web3 = API;










