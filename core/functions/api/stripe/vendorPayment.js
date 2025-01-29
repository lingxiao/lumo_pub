/* eslint-disable no-await-in-loop */

/**
    @Module: payment 
    @Date  : 3/1/2020
    @Author: Xiao Ling
    @Contact: lingxiao89@gmail.com
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
const fire   = require('./fire');
const uuid   = require('uuid');
const Stripe = require("stripe");
const axios  = require('axios').default;

const { 
    swiftNow, 
    illValued, 
    trivialProps, 
    trivialNum, 
    trivialString 
} = require('./../utils');

// init stripe
const { DbPaths, STRIPE_PARAM } = require('./../core');
const stripe = require('stripe')(STRIPE_PARAM.sec);


/******************************************************
    @Stripe
******************************************************/

/*
    @Use; create customer, save card for later use.
    @Source:
        - https://stripe.com/docs/payments/save-during-payment
        - https://stripe.com/docs/api/payment_methods/attach
        - https://stripe.com/docs/api/payment_methods/create
        - https://www.npmjs.com/package/stripe
        - https://stripe.com/docs/api/charges/create
        - https://stripe.com/docs/connect/collect-then-transfer-guide
    @Example:
        createVendorCustomer({ 
            name: 'xiao ling',
            vendorID: '',
            number: '',
            exp_mo: '',
            exp_yr: '',
            cvc: '...',
        })
*/
exports.createVendorCustomer = async ({ name, vendorID, number, cvc, exp_mo, exp_yr }) => {

    // bring exp_o and exp_year into format conformity
    if (trivialString(name) 
        || trivialString(vendorID) 
        || trivialString(number)
        || trivialString(exp_mo)
        || trivialString(exp_yr)
        || trivialString(cvc)
        ){

        if (!trivialString(vendorID)){
            let message = "We cannot save your card because the inputs were mal-formed."
            await logVendorAlert({ vendorID: vendorID, error: message })
        }

    }  else {

        let exp_month = parseInt(exp_mo);
        let exp_year  = parseInt(exp_yr);
        let cvc_num   = parseInt(cvc);
        let card_num  = parseInt(number);

        if ( trivialNum(exp_month) || trivialNum(exp_year) ){

            let message = "We cannot save your card because expiration year or month were malformed"
            await logVendorAlert({ vendorID: vendorID, error: message })

        } else if ( exp_month < 1 || exp_month > 12 ){            

            let message = "We cannot save your card because the expiration month was invalid"
            await logVendorAlert({ vendorID: vendorID, error: message });

        } else if ( trivialNum(card_num) ){

            let message = "We cannot save your card because the card number was malformed"
            await logVendorAlert({ vendorID: vendorID, error: message });

        } else if (cvc_num > 999) {

            let message = "We cannot save your card because the CVC number was malformed"
            await logVendorAlert({ vendorID: vendorID, error: message });

        } else {

            let exp_year_full = exp_year < 100 ? 2000 + exp_year : exp_year;

            if ( exp_year_full < 2021 || exp_year_full > 3000){

                let message = "We cannot save your card because the expiration year was invalid"
                await logVendorAlert({ vendorID: vendorID, error: message })

            } else {

                goCreateVendorCustomer({ 
                    name: name,
                    vendorID: vendorID,
                    number: number,
                    exp_mo: exp_month,
                    exp_yr: exp_year_full,
                    cvc: cvc,
                })


            }
        }
    }
}

/**
 * @Internal use: create stripe card. inputs to this function cannot be invalid
*/
async function goCreateVendorCustomer({ name, vendorID, number, cvc, exp_mo, exp_yr }){

    // create payment method
    const payment = await stripe.paymentMethods.create({
        type: 'card',
        card: {
            number: number,  
            exp_month: exp_mo, 
            exp_year: exp_yr,
            cvc: cvc,
        },
    });

    // create new customer
    const customer = await stripe.customers.create();

    console.log("\n\n\nnew payment: " , payment.id);
    console.log("new customer: ", customer.id);     

    // attach payment to customer
    const payment_method = await stripe.paymentMethods.attach( 
        payment.id, 
        {customer:customer.id} 
    )

    // save customer id if successful
    console.log("3a. payment attached: ", payment_method.id, payment_method.customer)
    console.log("3b. payment attached: ", payment_method.created, payment_method.livemode)

    // retrieve the customer    
    const verify_customer = await stripe.customers.retrieve(customer.id)

    console.log("4. verify customer exist: ", verify_customer.id) 

    const list_payment_methods = await stripe.paymentMethods.list({
        customer: customer.id,
        type: 'card',
    });

    console.log("5. verify customerpayment data: ", list_payment_methods.data)
    console.log("-------------------------")

    // create intent to pay with $xx USD. this will
    // charge the user 
    const intent = await stripe.paymentIntents.create({
        amount: 99,
        currency: 'usd',
        customer: customer.id
    });

    console.log("6. intent: ", intent.id, intent.amount, intent.status, intent.client_secret )
    console.log("=================================================")

    /**
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

    console.log("7. confirmed to pay: ", confirmed.id, confirmed.amount, confirmed.customer, confirmed.confirmation_method, confirmed.status)
    console.log("=================================================")

    var card_brand = "";

    if (payment_method.card && payment_method.card.brand){
        card_brand = payment_method.card.brand;
    }

    // save the customer id:
    let customer_data = {

        vendorID       : vendorID,
        pm_id          : payment_method.id,
        customerId     : customer.id,
        timeStamp      : swiftNow(),
        payment_method : payment_method,
        // customer  : customer,

        // view;
        name           : name || "",
        card_brand     : card_brand || "",
        last_4_digits  : number.slice(-4),
        expirationDate : `${exp_mo}/${exp_yr}`,
    }

    console.log("\n\n customer_data: ", JSON.stringify(customer_data));

    await fire.firestore
        .doc(`vendor_stripe_customer/${vendorID}`)
        .set(customer_data)
        .then(x => x)
        .catch(e => e)

    // remove command
    await fire.remove(`log_vendor_stripe_customer/${vendorID}`)
}





/******************************************************
    @Stripe Connect: Not part of the app's 
    functionality right now. 
******************************************************/

/*
    @use: Post stripe to create new connected user account from token
    @ref: https://www.npmjs.com/package/axios
          https://stripe.com/docs/connect/oauth-standard-accounts
*/
async function createConnectedUser({ userId, token }){

    console.log('-----------------------------')
    console.log("\t\t\tcreateConnectUser")
    console.log('-----------------------------')

    if ( userId === null || userId === undefined || userId === "" ){
        return 
    }

    if ( token === null || token === undefined || token === "" ){
        return 
    }

    // Send a POST request
    axios({
        method: 'post',
        url: `https://connect.stripe.com/oauth/token`,
        data: {
              client_secret: STRIPE_PARAM.sec
            , code         : token
            , grant_type   : "authorization_code"
        }
    })
    .then( async (res) => { 
        
        console.log('-----------------------------')
        console.log('1.', res)
        console.log('2.', res.status)
        console.log('3.', res.data )
        console.log('4.', res.data.access_token, res.data.stripe_user_id, res.data.refresh_token)
        console.log('-----------------------------')

        // let tok = res.data.access_token
        // let stripe_user_id = res.data.stripe_user_id

        var blob = res.data
        blob['userId'] = userId
        blob['timeStamp'] = swiftNow()

        console.log("5.", blob)

        const path = `users_stripe_connected/${userId}`
        await fire.firestore
            .doc(path)
            .set(blob)
            .then(x => console.log("succcessfully wrote"))
            .catch(e => console.log('e:', e) )

    }, (error) => {
        console.log('-----------xxxx---------------')
        console.log(error);
        console.log(error.error);
        console.log(error.error_description);
        console.log('-----------xxxx---------------')
    })

    return true;
}


/**
 * 
 * @Use: charge customer `userId` with stripe `customerId` `amount` in `currency`
 * 
*/
async function chargeCustomer({ userId, customerId, amount, currency }){
}

/*
    @use: payout user `userId` with stripe `customerId` `amount` in `currency`
*/
async function payoutExpressAccount({ userId, customerId, amount, currency }){
}


/******************************************************
    @Utils 
******************************************************/

/**
 * @use: if trnsaction is incomplete, log here
 * 
*/
async function logVendorAlert({ vendorID, error }){

    // record payout log
    let id = uuid.v4();
    let err_log = { ID: id, vendorID: vendorID, timeStamp: swiftNow(), error: error }

    await fire.firestore
        .collection(DbPaths.vendor_alerts)
        .doc(id)
        .set(err_log);    
}


async function removeTask(path){
/**
    @USE: remove task
*/

    if (!path || path === "")
        return false;
    else
        return await fire.remove(path)

}

function toRounded(n){

    if (!n || n === 0)
        return 0
    else
        return Math.round(n,0)
}




















