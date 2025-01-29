/**
 * @Package: account endpoints for flow
 * @Date   : Dec 7th, 2021
 * @Author : Xiao Ling   
 * @Read: https://firebase.google.com/docs/hosting/functions
 *        https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 *        https://firebase.google.com/docs/functions/write-firebase-functions
 * Stripe payment: adnw-esrg-swqh-nixz-vhmh
 * 
 * @Test:   `firebase serve`
 * 
*/

const functions  = require('firebase-functions');
const express    = require('express');

const { Networks } = require("./../api/core")


const { 
    illValued,
    trivialProps,
    trivialString,
    trivialNum, 
    swiftNow,
    print
} = require('./../api/utils');


const { 
    createVendor    ,
    getVendor       ,
    getVendorByEmail,
 } = require('./../api/client/vendor');

const { 
    editUser,
    createUserStub    ,
    createFlowUser    ,
    getUserByVendorID ,
    getUserByMetamask,
    saveMetamaskPublicKey,
    before_auth_on_mobile,
    try_auth_on_mobile,
    did_auth_on_mobile,
 } = require('./../api/client/accounts');


const { assertWellFormedRequest } = require('./endpoint_utils');
const { with_api_response } = require('./endpoint_utils');


// API 
const API = express();


/******************************************************
    @account: vendor
******************************************************/

/**
 * 
 * @Use: 1. create account for vendor
 * @Param:
 *   - email: String
 *   - password; String
 * 
 */ 
API.post('/createVendorAccount', async (req,res) => {

    let str  = JSON.stringify(req.body);
    let body = JSON.parse(str);


    if (illValued(body)){

        let raw = { wellFormed: false, didCreate: false, message: `Malformed input data ${str}, request must be well formed JSON`, vendor: {} }
        let str_res = JSON.stringify(raw)
        res.status(201).send( str_res );


    } else if ( trivialProps(body, 'vendorEmail') || trivialString(body.vendorEmail) ){

        let raw = { wellFormed: false, didCreate: false, message: `Must provide vendor email for the request`, vendor: {} }
        let str_res = JSON.stringify(raw)
        res.status(201).send( str_res );

    } else if ( trivialProps(body, 'vendorID') || trivialString(body.vendorID) ){

        let raw = { wellFormed: false, didCreate: false, message: `Must provide vendor id for the request`, vendor: {} }
        let str_res = JSON.stringify(raw)
        res.status(201).send( str_res );
        
   } else {

        const { vendorEmail, vendorID } = body;

        let existing_vendor = await getVendorByEmail(vendorEmail);
        let existing_vendor_2 = await getVendor(vendorID);

        if ( !trivialProps(existing_vendor, 'vendorID') ) {

            let raw = { wellFormed: true, didCreate: false, message: `vendor already exists`, vendor: {} }
            let str_res = JSON.stringify(raw)
            res.status(200).send( str_res );           

        } else if ( !trivialProps(existing_vendor_2, 'vendorID') ) {

            let raw = { wellFormed: true, didCreate: false, message: `vendor already exists`, vendor: {} }
            let str_res = JSON.stringify(raw)
            res.status(200).send( str_res );            

        } else {

            let new_vendor = await createVendor({
                vendorID : vendorID,
                email    : vendorEmail, 
                path     : ""
            });

            if (!trivialProps(new_vendor, 'client_vendor_id')){

                let raw = { wellFormed: true, didCreate: true, message: `vendor created`, vendor: {} }
                let str_res = JSON.stringify(raw)
                res.status(200).send( str_res );                

            } else {

                let raw = { wellFormed: true, didCreate: false, message: `vendor failed to create`, vendor: {} }
                let str_res = JSON.stringify(raw)
                res.status(201).send( str_res );            

            }
        }

    }
});



/**
 * 
 * @Use: check if vendor has account
 * @Param:
 *   - email: String
 *   - password: String
 * 
 */ 
API.post('/doesVendorExist', async (req,res) => {

    let str  = JSON.stringify(req.body);
    let body = JSON.parse(str);

    if ( illValued(body) ){
        
        let raw = { wellFormed: false, exists: false, message: `Malformed input data ${str}, request must be well formed JSON`, vendor: {} }
        let str_res = JSON.stringify(raw)
        res.status(201).send( str_res );
    
    } else if ( trivialProps(body, 'vendorEmail') || trivialString(body.vendorEmail) ){

        let raw = { wellFormed: false,  exists: false, message: `Must provide vendor email for the request`, vendor: {} }
        let str_res = JSON.stringify(raw)
        res.status(201).send( str_res );

   } else {

        const { vendorEmail } = body;

        let existing_vendor = await getVendorByEmail(vendorEmail);

        if (existing_vendor && !trivialProps(existing_vendor, 'vendorID')) {

            let raw = { wellFormed: true, exists: true, message: `vendor does exist`, vendor: existing_vendor }
            let str_res = JSON.stringify(raw)
            res.status(200).send( str_res );           

        } else {

            let raw = { wellFormed: true, exists: false,  message: `vendor does not exist`, vendor: {} }
            let str_res = JSON.stringify(raw)
            res.status(200).send( str_res );

        }
   }
}); 



/******************************************************
    @account: user
******************************************************/


/**
 * 
 * @Use: create account for user
 * @Param:
 *   - vendorID: String
 *   - vendorSecret: String
 *   - userID  : String
 * 
 */ 
API.post('/createUserAccount', async (req,res) => {

    let str = JSON.stringify(req.body);
    let body = JSON.parse(str);

    const { wellFormed, message, vendor } = await assertWellFormedRequest(
        req, 
        ["userID", "network"]
    );

    if ( !wellFormed || illValued(vendor) ){

        let res_str = JSON.stringify({ "success": false, "message": message, data: {} });
        res.status(201).send( res_str );

    } else {

        var inputs = body;        
        const vendorID = vendor.vendorID;
        inputs['vendorID'] = vendorID;

        await createUserStub({
            ...inputs,
            then: (response) => {
                res.status(201).send(JSON.stringify(response));
            }
        });
    }
});



/**
 * 
 * @Use: create bord item
 * 
 **/ 
API.post('/edit_user', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["userID"],
        data_format: {},
        fn: editUser,
    });
});    


/**
 * 
 * @Use: create bord item
 * 
 **/ 
API.post('/get_user', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["userID"],
        data_format: {},
        fn: _go_getUserByVendorID,
    });
});    


// @use:  client side compliant fetch-user fn
async function _go_getUserByVendorID(input){
    let user = await getUserByVendorID(input);
    if ( trivialProps(user,'userID') ){
        return { success: false, message: 'user dne', data: {} }
    } else {
        return { success: true, message: 'found user', data: user }
    }

}



/******************************************************
    @mobile-desktop QR link API
******************************************************/

/**
 * 
 * @Use: make qr code seed
 * 
 **/ 
API.post('/before_auth_on_mobile', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["userID", 'ugc_seed'],
        data_format: {},
        fn: before_auth_on_mobile,
    });
});    


/**
 * 
 * @Use: get user auth info from qr code
 * 
 **/ 
API.post(`/try_auth_on_mobile`, async (req,res) => {

    let str = JSON.stringify(req.body);
    let body = JSON.parse(str);

    const { wellFormed, message, vendor } = await assertWellFormedRequest(req, ['decoded_qr_code']);

    if ( !wellFormed ){

        let res_str = JSON.stringify({ "success": false, "message": message, data: {} });
        res.status(201).send( res_str );

    } else {

        var inputs = body;        
        const vendorID = vendor.vendorID;
        inputs['vendorID'] = vendorID;

        await try_auth_on_mobile({
            ...inputs,
            then: (response) => {
                res.status(201).send(JSON.stringify(response));
            }
        });
    }
});

/**
 * 
 * @Use: update user with firebase auth token
 * 
 **/ 
API.post('/did_auth_on_mobile', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        params: ["userID", 'firebase_auth_uuid'],
        data_format: {},
        fn: did_auth_on_mobile,
    });
});    




/******************************************************
    @exports
******************************************************/



exports.app_flow_accounts = API








