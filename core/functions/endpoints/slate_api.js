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
    getSlates,
    createSlate,
    bookSlate,
    can_book_slot,
    fetch_each_slate,
    migrate_orphans,
} = require('./../api/client/slateAPI');

const {
    acceptMigration,
    MigrateAll,    
} = require('./../api/client/migrationAPI');


// API 
const API = express();


/******************************************************
    @Slate fns    
******************************************************/


//@Use: on did deploy contract, log update
API.post('/create_slate', async (req,res) => {

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
        inputs['num_row'] = 10;
        inputs['num_col'] = 10;

        await createSlate({
            ...inputs,
            then: (response) => {
                res.status(201).send(JSON.stringify(response));
            }
        });
    }
});



//@Use: check contract can be deployed
API.post('/get_slates', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: [],
        data_format: {},
        fn: getSlates,
    });
});


//@Use: check contract can be deployed
API.post('/get_slate', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["slate_id"],
        data_format: {},
        fn: fetch_each_slate,
    });
});


API.post('/can_book_slot', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        data_format: {},
        fn: can_book_slot,
        params: ["slate_id"],
    });
});


API.post('/migrate_orphans', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: [],
        data_format: {},
        fn: migrate_orphans,
    });
});



/*****************************************************
    @migration
******************************************************/

//@Use: on did deploy contract, log update
API.post('/accept_migration', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        data_format: {},
        fn: acceptMigration,
        params: ["collection_name", "id", 'data'],
    });
});


//@Use: on did deploy contract, log update
API.post('/migrate_all', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        data_format: {},
        fn: MigrateAll,
        params: [],
    });
});




/*****************************************************
    @export
******************************************************/


exports.app_slate = API;










