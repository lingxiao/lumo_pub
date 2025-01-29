/* eslint-disable no-await-in-loop */

/**
    @Module: payment  for users
    @Date  : 8/17/2021
    @Author: Xiao Ling
    @Relevant Doc
        - https://stripe.com/docs/connect/destination-charges
        - https://stripe.com/docs/connect/express-accounts#integrating-oauth
        - https://stripe.com/docs/connect/shared-customers
        - https://stripe.com/docs/testing
        - https://dashboard.stripe.com/account/applications/settings
        - https://stripe.com/docs/api/transfers/create
        - error codes: https://stripe.com/docs/error-codes

The following are the account and routing numbers for your Standard Checking account.
    Account Number: 8619540517
    Routing Number: 031000053        


*/

// import modules
const fire   = require('./../fire');
const uuid   = require('uuid');
const Stripe = require("stripe");
const axios  = require('axios').default;

const { 
    swiftNow, 
    illValued, 
    trivialProps, 
    trivialNum, 
    ppSwiftTime,
    trivialString,
    print,
} = require('./../utils');

const { 
    getUserByVendorID, 
    getUserByMetamask,
} = require('./../client/accounts');

// init stripe
const { 
    stripe,
    DbPaths,
    home_page_url,
    default_fn_response,
    maybe_production_credit_card_number, 
    STRIPE_0XPARC_FEE,
} = require('./../core');


/******************************************************
    @Stripe read
******************************************************/

/**
 * 
 * @use: read stirpe balance 
 * 
 **/
async function read0xPARCBalance({ then }){

    var res = default_fn_response({ available_in_cents: 0, pending_in_cents: 0 });

    await stripe.balance.retrieve(function(err, balance) {

        if ( err || trivialProps(balance, 'available') ){
            res['message'] = err;
            return then(res);

        } else {

            const { available, pending } = balance;

            let available_usd = available.filter(m => m.currency === 'usd');
            let pending_usd = pending.filter(m => m.currency === 'usd');
    
            if ( available_usd.length === 0 && pending_usd.length === 0 ){
                res['message'] = 'cannot read balance in usd'
                return then(res);
            }

            let available_usd_i = available_usd[0].amount ?? 0;
            let pending_usd_i   = pending_usd[0].amount ?? 0;

            res['success'] = true;
            res['message'] = `Balance: ${available_usd_i/100} USD available, ${pending_usd_i/100} USD pending`
            res['pending_in_cents'] = pending_usd_i;
            res['available_in_cents'] = available_usd_i;
            return then(res);

        }
    });
}



/******************************************************
    @Stripe create customer id
******************************************************/

/**
 * 
 * 
 * @Use; create customer, save card for later use.
 * @Example:
        createVendorCustomer({ 
            name: 'xiao ling',
            vendorID: '',
            number: '',
            exp_mo: '',
            exp_yr: '',
            cvc: '...',
        })
* @Doc: https://stripe.com/docs/terminal/features/saving-cards/save-cards-directly
*
* 
*/
exports.create_user_stripe_account = async ({ vendorID, userID, number, cvc, exp_mo, exp_yr, then }) => {

    var res = default_fn_response({ account_created: false, data: {}, customerId: "" });

    let user = await getUserByVendorID({ userID: userID, vendorID: vendorID, withPrivateKey: false });

    // bring exp_o and exp_year into format conformity
    if ( [userID, number, exp_mo, exp_yr, cvc ].map(trivialString).includes(true) ){

        res['message'] = 'invalid inputs';
        return then(res);

    } else if ( trivialProps(user, 'userID') || trivialString(user.userID) ){

        res['message']  = 'this user dne';
        return then(res);

    }  else {

        let exp_month = parseInt(exp_mo);
        let exp_year  = parseInt(exp_yr);
        let cvc_num   = parseInt(cvc);
        let card_num  = parseInt(number);

        if ( trivialNum(exp_month) || trivialNum(exp_year) ){

            res['message'] = "We cannot save your card because expiration year or month were malformed";
            return then(res);

        } else if ( exp_month < 1 || exp_month > 12 ){            

            res['message'] = "We cannot save your card because the expiration month was invalid";
            return then(res);

        } else if ( trivialNum(card_num) ){

            res['message'] = "We cannot save your card because the card number was malformed";
            return then(res);

        } else if (cvc_num > 999) {

            res['message'] = "We cannot save your card because the CVC number was malformed";
            return then(res);


        } else {

            let exp_year_full = exp_year < 100 ? 2000 + exp_year : exp_year;

            if ( exp_year_full < 2021 || exp_year_full > 3000){

                res['message'] = "We cannot save your card because the expiration year was invalid"
                return then(res);

            } else {

                try {

                    let _card_number = maybe_production_credit_card_number(card_num);

                    const payment = await stripe.paymentMethods.create({
                        type: 'card',
                        card: {
                            number   : _card_number,
                            exp_month: exp_mo, 
                            exp_year : exp_year_full,
                            cvc      : cvc,
                        },
                    });

                    // create new customer
                    const customer = await stripe.customers.create();

                    // attach payment to customer
                    try {

                        const payment_method = await stripe.paymentMethods.attach( 
                            payment.id, 
                            {customer:customer.id} 
                        )

                        // save customer id if successful

                        // retrieve the customer    
                        const verify_customer = await stripe.customers.retrieve(customer.id)

                        // console.log("4. verify customer exist: ", verify_customer.id) 

                        const list_payment_methods = await stripe.paymentMethods.list({
                            customer: customer.id,
                            type: 'card',
                        });

                        // console.log("5. verify customerpayment data: ", list_payment_methods.data)
                        // console.log("-------------------------")

                        // create intent to pay with $xx USD. this will
                        // charge the user 
                        const intent = await stripe.paymentIntents.create({
                            amount   : 99,
                            currency : 'usd',
                            customer : customer.id
                        })

                        // console.log("6. intent: ", intent.id, intent.amount, intent.status, intent.client_secret, payment_method.id )
                        // console.log("=================================================")

                        /*
                          write client secret to log_confirm_payment_intent/userID
                          so that on the client side, the App can confirm payment intent
                          and charge 99cents from the user, to affirm that payment method is real
                          - also write down:
                                - payment method
                                - customer
                                - { payment_method.id, customer.id, client_secret, userID } 
                                - set flag to confirmed: false
                                - once the client confirms the payment
                                - set flag to confirmed: true
                        */
                        // confirm intent to pay
                        const confirmed = await stripe.paymentIntents.confirm(
                            intent.id,
                            {payment_method: payment_method.id } // 'pm_card_visa'}
                        )

                        // console.log("7. confirmed to pay: ", confirmed.id, confirmed.amount, confirmed.customer, confirmed.confirmation_method, confirmed.status)
                        // console.log("=================================================")

                        var card_brand = "";

                        if (payment_method.card && payment_method.card.brand){
                            card_brand = payment_method.card.brand;
                        }
                        
                        // save the customer id:
                        let customer_data = {

                            vendorID       : vendorID ?? "",
                            userID         : userID,
                            pm_id          : payment_method.id ?? "",
                            customerId     : customer.id,
                            payment_method : payment_method,

                            // view;
                            card_brand     : card_brand || "",
                            last_4_digits  : number.slice(-4),
                            expirationDate : `${exp_mo}/${exp_yr}`,

                            timeStampCreated: swiftNow(),
                            timeStampLatest: swiftNow(),
                            timeStampCreatedPP: ppSwiftTime(swiftNow()) ?? "",        

                        }

                        //console.log("\n\n customer_data: ", JSON.stringify(customer_data));

                        let did = await fire.firestore
                            .collection(DbPaths.users_stripe)
                            .doc( userID )
                            .set( customer_data )
                            .then(x => true)
                            .catch(e => false);

                        res['success'] = did;
                        res['account_created'] = did;
                        res['message'] = did ? "account created" : 'failed to save to db';
                        res['customerId'] = customer_data.customerId;
                        res['data']       = customer_data;
                        return then(res);

                    } catch (err) {

                        let message = `Error in payment attachment: ${err}`
                        res['message'] = message;
                        return then(res);

                    }                    

                } catch (err) {

                    let message = `Error in payment creation: ${err}`
                    res['message'] = message;
                    return then(res);
                }
            }
            }
        }
}



/**
 * 
 * @Use: check if `userID` has account
 * 
 **/
async function does_user_have_stripe_customer_id({ userID }){

    var res = default_fn_response({ data: {}, customerId: "", pm_id: "" })

    if (  trivialString(userID) ){

        let message = "invalid userID"
        return { success: false, message: message, customerId: "", pm_id: "" }        

    }  else {

        const matches = await fire.firestore
            .collection(DbPaths.users_stripe)
            .where('userID', '==', userID)
            .get();

        var user_payments = [];        
        if (!matches.empty){
            matches.forEach(doc => {
                if ( !trivialProps(doc,'data') ){
                    user_payments.push(doc.data())
                }
            });
        }

        if ( user_payments.length === 0 ){
            res['message'] = 'no customer';
            return res;
        } else {
            res['success'] = true;
            res['message'] = 'found user'
            let _res = { ...res, ...user_payments[0] };
            return _res;
        }
    }
}




/******************************************************
    @charge + refund
******************************************************/


/**
 * 
 * @use: checkout customer, and payout to connected vendor
 *       immediately.
 * Steps:
 *   1. create a product obj
 *   2. create a price obj
 *   3. create a checkout session
 * 
 * @Doc: https://stripe.com/docs/connect/collect-then-transfer-guide?platform=web
 * @Doc: https://stripe.com/docs/api/products/object
 * 
 **/
exports.checkout_customer = async ({ userID, amt, projectID, productID, vendor_express_id, then }) => {

    let { success, message, customerId, pm_id } = await does_user_have_stripe_customer_id({ userID, vendorID: "" });

    let fee = Math.round(amt * STRIPE_0XPARC_FEE);

    const product = await stripe.products.create({ name: productID });

    const price = await stripe.prices.create({
        unit_amount: amt,
        currency: 'usd',
        product: product.id,
    });    


    try {

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [{ price: price.id, quantity: 1}],
            success_url: `${home_page_url()}/house/${projectID}`,
            cancel_url : `${home_page_url()}/house/${projectID}`,
            payment_intent_data: {
                application_fee_amount: fee,
                transfer_data: {
                    destination: vendor_express_id,
                },
            },
        });

        const { payment_intent } = session;

        then()

    } catch (e){

        then();
    }
}

/**
 * 
 * @Use: charge `userID` `amt` in cents
 *       note in this case you are holding the funds
 * @Param:
 *  - vendorID: String
 *  - userID: String
 *  - chargeID: String
 *  - amt :: Int
 *  - then: () -> 
 * 
*/
exports.charge_customer_and_confirm_charge = async ({  vendorID, userID, chargeID, amt, then }) => {

    var res = default_fn_response({ paymentId: "", no_payment: true, data: {} });

    let amt_in_cents = parseInt(amt)

    if ( trivialString(userID) || trivialNum(amt_in_cents) ){

        res['message'] = 'ill valued inputs';
        return then(res);

    } else {

        let { success, message, customerId, pm_id } = await does_user_have_stripe_customer_id({ 
            userID  : userID, 
            vendorID: vendorID ?? "",
        })

        if ( !success || trivialString(customerId)  || trivialString(pm_id) ){

            res['no_payment'] = true;
            res['message'] = 'No payment method found!'
            return then(res);

        } else {

            res['no_payment'] = false;


            // attach payment to customer
            try {

                // create intent to pay with $xx USD. this will
                // charge the user and deposit the funds into 0xPARC
                // balance, you have to payout the stripe connected account
                // balance later. 
                const intent = await stripe.paymentIntents.create({
                    amount: amt_in_cents,
                    currency: 'usd',
                    customer: customerId
                })

                // confirm intent to pay, this will charge the user's 
                // saved credit card
                try {

                    const confirmed = await stripe.paymentIntents.confirm(
                        intent.id,
                        {payment_method: pm_id}
                    )

                    const { status, id } = confirmed;

                    if ( !trivialString(id) ){

                        let charge_blob = {
                            ID               : id,
                            chargeID         : chargeID ?? id,
                            userID           : userID,
                            vendorID         : vendorID ?? "",
                            amtInCents       : amt_in_cents,
                            confirmedID      : confirmed.id, 
                            confirmedStatus  : status,
                            message          : status == "succeeded" ? "success!" : "failed",
                            timeStampCreated : swiftNow(),
                            timeStampCreatedPP: ppSwiftTime(swiftNow()) ?? "",        
                        }                    

                        await fire.firestore
                            .collection(DbPaths.users_stripe_charges)
                            .doc(id)
                            .set(charge_blob)
                            .then(x => x)
                            .catch(e => e)

                        res['success'] = true;
                        res['no_payment'] = false;
                        res['message'] = 'created charge'
                        res['paymentId'] = confirmed.id;
                        res['data'] = charge_blob;

                        return then(res);

                     } else {

                        res['message'] = `failed to charge`;
                        return then(res);
                    }

                } catch (e) {

                    res['message'] = e.message;
                    return then(res);

                }



            } catch (err) {

                // print(`assert in else error case ${err}`)
                let message = `Error in payment intent creation: ${err}`
                res['message'] = message;
                return then(res);

            }       

        }

    }

}

/**
 * 
 * @use: refund customer given paymentId;
 * @doc: https://stripe.com/docs/refunds
 * 
 **/ 
exports.refundCustomer = async ({ paymentId }) => {

    var res = { success: false, message: 'illValued paymentId' };

    if ( trivialString(paymentId) ){
        return res;
    }

    var refund = await stripe.refunds.create({
        payment_intent: paymentId,
    });

    if ( trivialProps(refund,'id') ){

        let _id = uuid.v4();
        await fire.firestore
            .doc(`${DbPaths.users_stripe_refunds}/${_id}`)
            .set({ id: _id, payment_intent: paymentId, status: 'failed', timeStamp: swiftNow() })
            .then(b => true)
            .catch(e => false)
        res['message'] = 'failed to issue refund for payment'
        return res;
    }

    refund['timeStamp'] = swiftNow();

    await fire.firestore
        .doc(`${DbPaths.users_stripe_refunds}/${refund.id}`)
        .set(refund)
        .then(b => true)
        .catch(e => false)

    return { success: true, message: 'refunded' }
}



/******************************************************
    @Stripe Connected Express account
******************************************************/


/**
 * 
 * @Use: create pending account awaiting user's bank info
 * @Setup profile: https://dashboard.stripe.com/settings/connect
 *        setup logo, color and redirect-uri
 * @Doc: https://stripe.com/docs/connect/add-and-pay-out-guide
 *       https://stripe.com/docs/connect/collect-then-transfer-guide?platform=web#create-an-account-link
 * @Use: 
 *    1. create an account here and send to client
 *    2. after client fill out information, redirect client to 
 *       redirect URL and get token
 *    3. call `confirm_pending_express_account` with token 
 *       to finish setting up payout account.
 * @Note: make sure redirect URI is set here:
 *    - https://dashboard.stripe.com/settings/connect
 * 
 **/
async function create_pending_express_account({ projectID }){

    var res = default_fn_response({ link: "", stripe_account_id: "", data: {} });    

    if ( trivialString(projectID) ){
        res['message'] = 'please specify projectID and userID';
        return res;
    }

    const account = await stripe.accounts.create({type: 'express' });

    if ( trivialProps(account, 'id') ){
        res['message'] = 'failed to create account id'
        return then(res)
    }

    let refresh_url = `${home_page_url()}/house/${projectID}?=confirm_stripe`;
    let return_url  = `${home_page_url()}/connectstripe/${projectID}?=confirm_stripe`;

    try {

        const accountLink = await stripe.accountLinks.create({
            account    : account.id,
            refresh_url: refresh_url,
            return_url : refresh_url, //return_url,
            type: 'account_onboarding',
        });    

        let data = { ...accountLink, stripe_account_id: account.id };

        res['link']    = accountLink.url ?? "";
        res['success'] = true;
        res['message'] = 'generated account link'
        res['data']    = data;
        res['stripe_account_id'] = account.id;

        return res;

    } catch (e) {
        res['message'] = e;
        return res;
    }

}


/**
 * 
 * @use: Post stripe to create new connected user account from token
 * @Doc: https://stripe.com/docs/api/accounts/retrieve
 * @ref: https://www.npmjs.com/package/axios
 *         https://stripe.com/docs/connect/oauth-standard-accounts
*/
async function confirm_pending_express_account({ stripe_account_id }){

    var res = default_fn_response({ data: {}, approved: false });    

    if ( trivialString(stripe_account_id) ){
        res['message'] = 'please specify stripe_account_id';
        return res;
    }

    const account = await stripe.accounts.retrieve( stripe_account_id );

    if (trivialProps(account,'id')){
        res['message'] = `acct at ${stripe_account_id} dne`;
        return res;
    }

    const { charges_enabled, payouts_enabled } = account;

    res['success '] = true;
    res['data']     = account;
    res['approved'] = payouts_enabled;
    res['message']  = `payouts_enabled: ${payouts_enabled}, charges_enabled: ${charges_enabled}`;
    return res;
}


/*
    @use: payout user `userId` with stripe `customerId` `amount` in `currency`
*/
async function payoutExpressAccount({ userId, customerId, amount, currency, then }){

    return then(false)
}



/******************************************************
    @Stripe top up: DEBUG
******************************************************/


/**
 * 
 * @use: top up connected account so you 
 *       can payout express merchanges
 * 
 * @Dashboard: https://dashboard.stripe.com/test/payouts
 * 
 * @Step: 
 *    1. add funds : https://dashboard.stripe.com/test/balance/overview
 *    2. read balance: https://stripe.com/docs/api/balance/balance_retrieve
 *    2. turn off automatic payouts: https://dashboard.stripe.com/settings/payouts   
 *          -> this ensures funds are in stripe balance, not in SVB
 *    3. call this fn: 
 *    4. see topups here: https://dashboard.stripe.com/test/topups
 *       doc: https://stripe.com/docs/api/topups
 *       see inbound payments here: https://dashboard.stripe.com/test/payments
 *    5. retreive balance for user
 * 
 * @Doc: https://dashboard.stripe.com/test/balance/overview
 * 
 **/
async function top_up_0x_account(){

    await read0xPARCBalance({ then: ({ success, message, available_in_cents, pending_in_cents }) => {
        print("-----------------------")
        console.log(message, available_in_cents, pending_in_cents)
        print("-----------------------")
    }})

    // const topup = await stripe.topups.create({
    //     amount: 151797,
    //     currency: 'usd',
    //     description: 'Top-up for Aug-4th',
    //     statement_descriptor: 'Weekly top-up',
    // });

    // const transfer = await stripe.transfers.create({
    //     amount: 99,
    //     currency: "usd",
    //     destination: "acct_1LSjWSQ8UCS9iAUK"
    // });    
    // console.log(transfer)

}


/******************************************************
    @export
******************************************************/

exports.read0xPARCBalance = read0xPARCBalance;
exports.create_pending_express_account = create_pending_express_account;
exports.confirm_pending_express_account = confirm_pending_express_account
exports.does_user_have_stripe_customer_id = does_user_have_stripe_customer_id





















