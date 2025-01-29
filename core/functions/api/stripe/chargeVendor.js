/* eslint-disable no-await-in-loop */

/**
    @Module: charge vendor 
    @Date  : 5/8/2021
    @Author: Xiao Ling
    @Relevant Doc
        - https://stripe.com/docs/connect/destination-charges
        - https://stripe.com/docs/connect/express-accounts#integrating-oauth
        - https://stripe.com/docs/connect/shared-customers
        - https://stripe.com/docs/testing
        - https://dashboard.stripe.com/account/applications/settings
        - https://stripe.com/docs/api/transfers/create
        - error codes: https://stripe.com/docs/error-codes

*/

// import modules
const fire   = require('./fire');
const Stripe = require("stripe");
const uuid   = require('uuid');
const axios = require('axios').default;

const { 
    swiftNow, 
    illValued, 
    trivialProps, 
    trivialNum, 
    trivialString 
} = require('./utils');

const { STRIPE_PARAM, DbPaths, Networks, MintState, PaymentState } = require('./core')
const { getVendorStripeInfo } = require('./api_vendor');

// init stripe;
const stripe = require('stripe')(STRIPE_PARAM.sec)


/******************************************************
    @Constants
******************************************************/

// this platform's service parameters 
const STRIPE_PERCENT   = 0.029    // stripe take 0.029 percent rake
const STRIPE_BASE      = 30       // 30 cents base fee
const LUMO_RAKE        = 0.05     // playhouse take 10% rake
const ETH_TO_WEI       = 1000000000000000000;
const PRICE_API = "";


// @TODO: change this to false;
const BUILD_ROPSTEN_CHARGE = false;

// @use: do not charge these vendors.
//       note you may launch some apps using this
//       API to "dog your own dog food"
const DO_NOT_CHARGE_THESE_VENDORS = [];

/******************************************************
    @Utils
******************************************************/

/**
 * @use: gas => USD
 * @Param:
 *   - gas_in_wei :: Int,    amt of gas used for computation in wei.
 *   - eth_price :: Double,  price of eth at the moment
*/
function fromGasToUSD({ gas_in_wei, eth_price_in_usd }){

    let gas_in_eth = gas_in_wei/ETH_TO_WEI;
    let gas_in_usd = gas_in_eth * eth_price_in_usd

    if (trivialNum(gas_in_wei)){
        return 0
    } else {

        let usd = gas_in_usd; 
        let after_rake = usd * (1+LUMO_RAKE)
        let after_stripe = after_rake * (1+STRIPE_PERCENT) + (STRIPE_BASE/100)
        return after_stripe;
    }
}


/******************************************************
    @Charge vendor
******************************************************/

/**
 * @use: loop over all vendors and build charges
 *       for each vendor.
 *       get current spot price of ETH and bill at this price
*/
const chargeAllVendors = async () =>  {

    let ref = fire.firestore.collection(DbPaths.price_tokens).doc('ETH');

    // get current eth price
    axios({
        method: 'get',
        url: PRICE_API,
    })
    .then( async (res) => { 

        if ( trivialProps(res,'data') || trivialProps(res.data,'USD') ){

            ref.get().then( async (doc) => {

                if (!doc.exists){
                    return;
                }
                let data = doc.data();
                if (trivialProps(data,'price_in_USD') || trivialNum(data.price_in_USD) ){
                    return
                }
                let price = data.price_in_USD;
                loop_over_all_vendors({ price_of_ether_in_usd: price })
            })

        } else {

            // get price and store it
            let price = res.data.USD
            await ref.set({ price_in_USD: price, timeStamp: swiftNow() });

            // charge vendor at this spot price
            loop_over_all_vendors({ price_of_ether_in_usd: price })

        }

    }, (err) => {

        ref.get().then( async (doc) => {

            if (!doc.exists){
                return;
            }
            let data = doc.data();
            if (trivialProps(data,'price_in_USD') || trivialNum(data.price_in_USD) ){
                return
            }
            let price = data.price_in_USD;
            loop_over_all_vendors({ price_of_ether_in_usd: price })
        })

    })
}

exports.chargeAllVendors = chargeAllVendors;



/**
 * @Use: get all vendors and start charge
 *
*/
async function loop_over_all_vendors({ price_of_ether_in_usd }){

    if (trivialNum(price_of_ether_in_usd)){
        return;
    }

    const all_vendors = await fire
        .firestore
        .collection(DbPaths.vendors)
        .get();

    if (all_vendors.empty){
        return;
    }

    // charge each vendor
    all_vendors.forEach( async doc => {

        if (!trivialProps(doc,'data') && !illValued(doc.data())){

            let data = doc.data();
            let vendorID = data.vendorID || "";

            if ( DO_NOT_CHARGE_THESE_VENDORS.includes(vendorID) === false ){

                // charge vendor for mainnet listing
                mk_charge_for_each_vendor({ 
                    vendorID: data.vendorID, 
                    network: Networks.mainnet,
                    price_of_ether_in_usd: price_of_ether_in_usd,
                })

                // in DEBUG mode, build charge for rospten spending
                if (BUILD_ROPSTEN_CHARGE){
                    mk_charge_for_each_vendor({ 
                        vendorID: data.vendorID, 
                        network: Networks.ropsten, 
                        price_of_ether_in_usd: price_of_ether_in_usd,
                    });
                }
            }
        }
    })

}


/**
 * @Use: get all outstanding charges for `vendorID` and create charge 
 *       convert cumulative gas spent on txs into USD at current eth price
 *       then build STRIPE charge for the vendor
 *
*/
async function mk_charge_for_each_vendor({ vendorID, network, price_of_ether_in_usd }){


    if (trivialString(vendorID) || trivialString(network) ){
        return;
    }

    let vendor = await getVendorStripeInfo(vendorID);

    if ( trivialProps(vendor,'customerId') || trivialString(vendor.customerId)){
        return;
    }

    if ( trivialProps(vendor,'pm_id') || trivialString(vendor.pm_id)){
        return;
    }

    let customerId = vendor.customerId;
    let pm_id = vendor.pm_id;


    // grab all recently requested and error state mint + trade requests
    // where the transaction has been approved
    let root_nft_ref = fire.firestore.collection(DbPaths.nfts);
    let root_trade_ref = fire.firestore.collection(DbPaths.trades);

    const nft_outstanding_1 = await root_nft_ref
        .where('state', '==', MintState.APPROVED)
        .where('vendorPaymentState', '==', PaymentState.DID_NOT_CHARGE)
        .where('network', '==', network)
        .where('vendorID', '==', vendorID )
        .get();

    const nft_outstanding_2 = await root_nft_ref
        .where('state', '==', MintState.APPROVED)
        .where('vendorPaymentState', '==', PaymentState.CHARGED_FAILURE)
        .where('network', '==', network)
        .where('vendorID', '==', vendorID )
        .get();


    const trade_outstanding_1 = await root_trade_ref
        .where('state', '==', MintState.APPROVED)
        .where('vendorPaymentState', '==', PaymentState.DID_NOT_CHARGE)
        .where('network', '==', network)
        .where('vendorID', '==', vendorID )
        .get();

    const trade_outstanding_2 = await root_trade_ref
        .where('state', '==', MintState.APPROVED)
        .where('vendorPaymentState', '==', PaymentState.CHARGED_FAILURE)
        .where('network', '==', network)
        .where('vendorID', '==', vendorID )
        .get();


    var outstandings = [];
    var cumulative = 0;

    if (!nft_outstanding_1.empty){
        nft_outstanding_1.forEach( async doc => {
            if (!trivialProps(doc,'data') && !illValued(doc.data())){
                let data = doc.data();
                let gas = data['gasUsed'] || 0;
                let shared = Math.max(data['numMintersInThisBatch'], 1);                
                cumulative += (gas/shared)
                outstandings.push(data);
            }
        })
    }

    if (!nft_outstanding_2.empty){
        nft_outstanding_2.forEach( async doc => {
            if (!trivialProps(doc,'data') && !illValued(doc.data())){
                let data = doc.data();
                let gas = data['gasUsed'] || 0;
                let shared =  Math.max(data['numMintersInThisBatch'], 1);
                cumulative += (gas/shared)
                outstandings.push(data);
            }
        })
    }


    if (!trade_outstanding_1.empty){
        trade_outstanding_1.forEach( async doc => {
            if (!trivialProps(doc,'data') && !illValued(doc.data())){
                let data = doc.data();
                let gas = data['gasUsed'] || 0;
                let shared = Math.max(data['numTradesInThisBatch'],1);
                cumulative += (gas/shared)
                outstandings.push(data);
            }
        })
    }

    if (!trade_outstanding_2.empty){
        trade_outstanding_2.forEach( async doc => {
            if (!trivialProps(doc,'data') && !illValued(doc.data())){
                let data = doc.data();
                let gas = data['gasUsed'] || 0;
                let shared = Math.max(data['numTradesInThisBatch'],1);
                cumulative += (gas/shared)
                outstandings.push(data);
            }
        })
    }

    // convert cumulative gas spent to spot price of ether
    let price_in_usd = fromGasToUSD({ gas_in_wei: cumulative, eth_price_in_usd: price_of_ether_in_usd });

    // do not charge if spending is less than 0.99
    if ( price_in_usd < 0.99 ){

        return console.log(`\n\nno charges for vendor ${vendorID} because amt is: ${price_in_usd}`);

    } else {

        await go_charge_vendor_using_Stripe({

            network: network,

            vendorID  : vendorID, 
            customerId: customerId, 
            pm_id     : pm_id,

            cumulative  : cumulative, 
            price_in_usd: price_in_usd, 
            outstandings: outstandings, 

            price_of_ether_in_usd: price_of_ether_in_usd                     
        });

    }
}


/** 
 * @Use: build out stripe charge, log charge blob in db
 *       and update the state of each nft/trade in db.
*/
async function go_charge_vendor_using_Stripe({ 

    network,

    vendorID, 
    customerId, 
    pm_id,  

    cumulative, 
    price_in_usd, 
    outstandings, 

    price_of_ether_in_usd     
}){

    // charge with stripe
    // attach payment to customer
    const payment_method = await stripe.paymentMethods.attach( 
        pm_id,
        {customer: customerId}
    )    

    //console.log('\n1.', payment_method)

    // create intent to pay with $xx USD. this will
    // charge the user 
    const intent = await stripe.paymentIntents.create({
        amount: parseInt(price_in_usd*100),
        currency: 'usd',
        customer: customerId,
    });

    // console.log('\n2', intent)

    // confirm intent to pay
    const confirmed = await stripe.paymentIntents.confirm(
        intent.id,
        {payment_method:payment_method.id}
    )

    // console.log('\n3.', confirmed['status'])

    // create charge record
    let cid = uuid.v4();
    let tx_paths  = outstandings.map(x => x.path || "" );
    let tx_hashes = outstandings.map(x => x.txHash || "");

    var str_price_in_usd = 'n/a';

    if ( !trivialProps(parseFloat(price_in_usd), 'toFixed')){
        str_price_in_usd = parseFloat(price_in_usd).toFixed(2)
    }

    let charge_record = {

        ID: cid, 
        timeStamp: swiftNow(),

        // tx infos
        tx_paths : tx_paths,
        tx_hashes: tx_hashes,
        network  : network, 
        num_items_in_charge: outstandings.length,

        // gas used
        price_in_gas   : cumulative,
        price_in_usd   : str_price_in_usd,
        price_in_cents : parseInt(price_in_usd*100),
        spot_price_of_ether_in_usd: price_of_ether_in_usd,

        // stripe response
        stripe_message : confirmed['status'] || 'undefined',
        stripe_response: confirmed,

        // stripe info
        customerId: customerId,
        pm_id: pm_id,
    }

    // save payment record
    await fire.firestore.collection(DbPaths.vendor_charges).doc(cid).set(charge_record);

    //  update all the blobs
    if (confirmed['status'] === 'succeeded' ){
        for ( path of tx_paths ){
            if (!trivialString(path)){
                await fire
                    .firestore
                    .doc(path)
                    .update({ vendorPaymentState: PaymentState.CHARGED_AWAIT_CONFIRMATION })
            }
        }

    }


}










