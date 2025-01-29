/**
 * @Package: account endpoints for stripe
 * @Date   : Dec 8th, 2021
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

const { 
    illValued,
    trivialProps,
    trivialString,
    trivialNum, 
    swiftNow,
    print
} = require('./../api/utils');

const { 
	with_api_response,
	assertWellFormedRequest, 
} = require('./endpoint_utils');


const { 
	charge_customer,
	create_user_stripe_account,
	does_user_have_stripe_customer_id,
    confirm_pending_express_account,
 } = require('./../api/stripe/userPayment');

 const {
    stripe,
    STRIPE_PARAM,
} = require('./../api/core');


// API 
const API = express();


/******************************************************
    @create
******************************************************/


/**
 *
 * @use: create user's stripe account given credit card, mo/yy, and cvv
 * @params:
 *    - vendorToken
 *    - vendorSecret
 *    - userID
 *
*/
API.post('/create_user_stripe_account', async (req,res) => {

    let str = JSON.stringify(req.body);
    let body = JSON.parse(str);

    const { wellFormed, message, vendor } = await assertWellFormedRequest(
        req, 
        ["userID", "number",'cvc', 'exp_mo', 'exp_yr']
    );

    if ( !wellFormed || illValued(vendor) ){

        let res_str = JSON.stringify({ "success": false, "message": message, data: {} });
        res.status(201).send( res_str );

    } else {

        var inputs = body;        
        const vendorID = vendor.vendorID;
        inputs['vendorID'] = vendorID;

        await create_user_stripe_account({
            ...inputs,
            then: (response) => {
                res.status(201).send(JSON.stringify(response));
            }
        });
    }
});


/**
 *
 * @use: create user's stripe account given credit card, mo/yy, and cvv
 * @params:
 *    - vendorToken
 *    - vendorSecret
 *    - userID
 *
*/
API.post('/charge_customer', async (req,res) => {

    let str = JSON.stringify(req.body);
    let body = JSON.parse(str);

    const { wellFormed, message, vendor } = await assertWellFormedRequest(req, ['userID', 'chargeID', 'amt']);

    if ( !wellFormed || illValued(vendor) ){

        let res_str = JSON.stringify({ "success": false, "message": message, data: {} });
        res.status(201).send( res_str );

    } else {

        var inputs = body;        
        const vendorID = vendor.vendorID;
        inputs['vendorID'] = vendorID;

        await charge_customer({
            ...inputs,
            then: (response) => {
                res.status(201).send(JSON.stringify(response));
            }
        });
    }
});




/******************************************************
    @read
******************************************************/


//@Use: on did deploy contract, log update
API.post('/does_user_have_stripe_customer_id', async (req,res) => {
    with_api_response({
        req: req,
        res: res,
        data_format: {},
        fn: does_user_have_stripe_customer_id,
        params: ["userID"],
    });
});





exports.app_stripe_accounts = API

