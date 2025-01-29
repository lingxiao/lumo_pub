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
    ppSwiftTime,    
} = require('./../utils');


const { 
    getUserByVendorID, 
    getUserByMetamask,
} = require('./accounts');

const {
    stripe,
    DbPaths, 
    Networks,
    default_fn_response,
    ItemMintState,
    CollectionKind,
    STRIPE_vendor_payable_after_fee,
} = require('./../core');

const {
    checkout_customer,
    create_pending_express_account,
    confirm_pending_express_account,
    charge_customer_and_confirm_charge,
} = require('./../stripe/userPayment');

const {
    getProject,
    get_connect_account,
    getStoryBoard, 
    getFiatPurchasedStoryboardItems,
} = require('./storyboardRead');

const {
    maybe_premint_ticket,
    removeStoryBoardItem,
} = require("./storyboardWrite");


/******************************************************
    @project stripe express connect
******************************************************/


/**
 * 
 * @use: make connected account
 * @Dashboard: https://dashboard.stripe.com/test/connect/accounts/overview
 * @Dashbord for style: https://dashboard.stripe.com/settings/connect
 * 
 **/
async function make_connected_account({ projectID, userID }){

    var res = default_fn_response({ exists: false, link: "", data: {} });

    if ( trivialString(projectID) || trivialString(userID) ){
        res['message'] = 'please specify userID and projectID'
        return res;
    }

    let { root } = await getProject({  address: projectID, full: false })

    if ( trivialProps(root,'ID') ){
        res['message'] = 'project dne';
        return res;
    }

    if ( root.userID !== userID ){
        res['message'] = 'only project owner can create stripe express account';
        return res;
    }

    let past_acct = await get_connect_account({ projectID, stripe_account_id: "" });

    if ( past_acct.exists || !trivialProps(past_acct.data,'ID') ){
        return past_acct;
    }

    let { link, data, stripe_account_id, message } = await create_pending_express_account({ projectID });

    if ( trivialString(link) || trivialString(stripe_account_id) ){
        res['message'] = `account creation failed: ${message}`;
        return res;
    }
    
    let blob = {
        ...data,
        
        link: link,
        charges_enabled : false,
        payouts_enabled : false, 

        ID: stripe_account_id,
        projectID: projectID,
        address  : projectID,
        userID   : userID,

        timeStampCreated: swiftNow(),
        timeStampLatest : swiftNow(),
        timeStampCreatedPP: ppSwiftTime(swiftNow()) ?? "",        
    }

    let did = await fire.firestore
        .collection(DbPaths.stories_stripe_connected)
        .doc( stripe_account_id )
        .set( blob )
        .then(_ => true)
        .catch(e => false);

    res['exists']  = true;
    res['success'] = true;
    res['message'] = 'created new express account'
    res['data']    = blob;
    res['link']    = link;
    return res;
}



/**
 * 
 * @Use: query stripe and confirm acct is connected 
 *       update saved stripe connected account data
 * 
 **/
async function confirm_connected_account({ projectID }){

    var res = default_fn_response({ approved: false, data: {} });

    if ( trivialString(projectID) ){
        res['message'] = 'please specify projectID'
        return res;
    }

    let past_acct = await get_connect_account({ projectID, stripe_account_id: "" });
    if ( !past_acct.exists || trivialProps(past_acct.data,'ID') || trivialString(past_acct.data.ID) ){
        res['message'] = 'this project did not connect to stripe';
        return res;
    }

    let acct_id = past_acct.data.ID;

    // if acct already approved, return
    if ( past_acct.data.payouts_enabled ){
        res['message'] = 'already confirmed';
        res['success'] = true;
        res['approved'] = true;
        res['data'] = past_acct.data;
        return res;
    }

    // fetch stripe server for acct info
    let { data, success, message } = await confirm_pending_express_account({ stripe_account_id: acct_id })
    if ( trivialProps(data,'id') ){
        res['message'] = 'stripe cannot find this account';
        return res;
    }

    // parse info and create update blob
    const { charges_enabled, payouts_enabled } = data;
    let update = {  charges_enabled: charges_enabled, payouts_enabled: payouts_enabled, timeStampLatest: swiftNow() }

    let did = await fire.firestore
        .collection(DbPaths.stories_stripe_connected)
        .doc( acct_id )
        .update(update)
        .then(_ => true)
        .catch(_ => false);

    return { success: true, message: "updated", approved: payouts_enabled, data: {...data, ...update} };

}



/******************************************************
    @purchase by fiat lifcycle write
******************************************************/


/**
 * 
 * @use: fiat purchase this item, and then put in 
 *       `fiat_purchased_await_mint` state
 * @Dashboard: https://dashboard.stripe.com/test/payments
 * 
 **/
async function fiat_purchase_and_premint({ itemID, storyboardID, userID, vendorID, network, then }){

    var res = default_fn_response({
        paid_in_fiat: false,
        pre_minted  : false,
        price_in_cents: 0,     
    });

    let user = await getUserByVendorID({ userID: userID, vendorID: vendorID, withPrivateKey: false });

    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return then(res);
    }   

    let _board  = await getStoryBoard({ storyboardID: storyboardID, full: true });
    let board   = _board.data  ?? {};
    let items   = _board.items ?? [];



    // checkif board exists and price is set
    if ( trivialProps(board, 'ID') || trivialProps(board,'price_in_cents') || trivialNum(board.price_in_cents) ){
        res['success'] = false;
        res['message'] = 'we cannot locate a price for this item'
        return then(res);
    }

    let max_items = trivialProps(board,'num_items') ? 0 : board.num_items;

    // note since 1st item is throaway, the eq sign here is `<=`
    // @TODO: make sure you check num items < board.num_items;
    if ( items.length >= (max_items + 1) ){
        res['success'] = false;
        res['message'] = 'no more items are available';
        return then(res)
    }

    // find exists item
    let existing_items = items.filter(m => m['ID'] === (itemID ?? ""));
    let existing_item  = trivialString(itemID)
        ? {}
        :  (existing_items.length > 0 ? existing_items[0] : {});

    // if board is tickets or membership, then try premint tok
    if ( board.kind === CollectionKind.tickets || board.kind === CollectionKind.membership ){

        if ( trivialProps(existing_item,'ID') ){

            let { did_premint, message, data } = await maybe_premint_ticket({ storyboardID, userID, vendorID, network })

            if ( !did_premint && !trivialProps(data,'ID') ){

                res['message'] = message;
                return then(res);

            } else {

                // charge customer
                await charge_customer_and_confirm_charge({ 
                    vendorID, 
                    userID, 
                    chargeID: itemID ?? "", 
                    amt: board.price_in_cents, 
                    then: async ({ success, message, paymentId }) => {

                        if ( !success || trivialString(paymentId) ){

                            // if fail to sell, rmv item
                            try {

                                await removeStoryBoardItem({
                                    itemID: data.ID,
                                    userID, 
                                    vendorID,
                                    network
                                });
                                res['message'] = message;
                                return then(res);

                            } catch (e) {

                                res['message'] `failed to purchase ticket ${e.message}`;
                                return then(res);

                            }

                        } else {

                            // if success, 
                            // update minted ticket
                            // with premint info
                            let update_blob = {
                                timeStampLatest  : swiftNow(),
                                fiat_payment_id  : paymentId ?? "",
                                fiat_purchased_by: userID ?? "",
                                price_in_cents   : board.price_in_cents ?? 0,
                                mint_state       : ItemMintState.fiat_purchased_await_mint,
                            }

                            let did = await fire.firestore
                                .collection(DbPaths.stories_board_items)
                                .doc( data.ID )
                                .update(update_blob)
                                .then(_ => true)
                                .catch(e => false)

                            // create stripe payable
                            // for express payout
                            if ( !trivialString(paymentId) ){

                                let _item_id = (data.ID ?? "") ?? (itemID ?? "");

                                let payable_blob = {
                                    ID               : paymentId,
                                    fiat_payment_id  : paymentId ?? "",
                                    price_in_cents   : board.price_in_cents ?? 0,
                                    userID           : userID ?? "",
                                    itemID           : _item_id,
                                    storyboardID     : storyboardID ?? "",
                                    projectID        : board.projectID ?? "",
                                    pending_payout   : false,
                                    payout_id        : "",
                                    paid_out_in_cents: 0,
                                    stripe_express_account_id: "",
                                    timeStampCreated : swiftNow(),
                                    timeStampCreatedPP: ppSwiftTime(swiftNow()) ?? "",        
                                }
                                await fire.firestore
                                    .collection(DbPaths.stories_stripe_items_payable)
                                    .doc( paymentId )
                                    .set( payable_blob )
                                    .then(_ => true)
                                    .catch(e => false)
                            }


                            res['success']     = true;
                            res['paid_in_fiat']= true;
                            res['pre_minted']  = did;
                            res['paymentId']   = paymentId;
                            res['data'] = { ...data, ...update_blob };
                            res['message']     = `purchased item with paymentId: ${paymentId}`;
                            return then(res);
                        }
                }});

            }

        } else {

            res['message'] = 'the ticket you requested has been purchased';
            return then(res)
        }


    } else {

        // if item at itemID dne, then fail
        if ( trivialProps(existing_item,'ID') ){

            res['message'] = 'this item dne'
            return then(res);   

        // if item already exists, then fail
        } else if ( existing_item.mint_state !== ItemMintState.not_minted ){

            res['message'] = `this item already exists and its state is in ${existing_item.state}`;
            return then(res);

        } else {

            // nfts can only be purchased by non-fiat for now
            res['message'] = 'Only tickets can be purchased with USD.'
            return then(res);

        }

    }

}


/*
 * 
 * @use: get all fiat pre-minted tok owned by userID 
 * 
 **/
async function get_fiat_minted_tok_owned_by({ userID }){

    var res = default_fn_response({ data: [] });
    if ( trivialString(userID) ){
        res['message'] = 'please specify userID'
        return res;
    }

    var toks = [];

    const matching_toks = await fire.firestore
        .collection(DbPaths.stories_board_items)
        .where('userID', '==', userID)
        .where("mint_state", '==', ItemMintState.fiat_purchased_await_mint)
        .get();

    if (!matching_toks.empty){
        matching_toks.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                toks.push(doc.data())
            }
        })
    }   

    res['success'] = true;
    res['message'] = `found ${toks.length} toks`;
    res['data'] = toks;
    return res;

}



/******************************************************
    @project stripe express payout
******************************************************/



/**
 *
 * @use: payout project express account
 *       by paying out each purchase one by one until 
 *       0xparcs' vendor account balance is gone
 * @Doc: https://stripe.com/docs/connect/add-and-pay-out-guide
 *       
 * @Steps:
 *    1. go `https://dashboard.stripe.com/settings/payouts` and turn off automatic payout
 *    2. top up account
 *    3. payout express account
 *         https://stripe.com/docs/connect/add-and-pay-out-guide
 * 
 **/
async function payout_project_express({ userID, vendorID, projectID }){

    var res = default_fn_response({ paid: [], unpaid: [], payout_amt_in_cents: 0, data: {} });

    let user = await getUserByVendorID({ userID: userID, vendorID: vendorID ?? "", withPrivateKey: false });

    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return res;
    }   

    if ( trivialString(projectID) ){
        res['message'] = 'please specify projectID'
        return res;
    }
    
    let { data, exists } = await get_connect_account({ projectID });

    if ( !exists || trivialProps(data,'ID') || trivialProps(data,'stripe_account_id') ){
        res['message'] = 'this project did not connect to stripe express and cannot accept payout';
        return res;
    }
    
    if ( data.userID !== userID ){
        res['message'] = 'only the account connected to Stripe Express can enact payouts';
        return res;
    }

    // get connect express acct id;
    const { stripe_account_id } = data;    

    // 1. get obligations and obligaton receipts 
    let _owed  = await get_express_payable({ projectID });
    let unpaid_items = _owed.data ?? [];

    try {

        let { paid, unpaid, message, payout_amt_in_cents } = await _rec_payout_each_payable({
            paid: [],
            unpaid: unpaid_items,
            payout_amt_in_cents: 0,
            projectID,
            stripe_account_id
        });

        let paid_ids = paid.map(item => item.ID) ?? [];
        let unpaid_ids = unpaid.map(item => item.ID) ?? [];

        let unpaid_in_cents = unpaid.reduce((a,b) => { 
            let ap = trivialNum(a.price_in_cents) ? 0 : Number(a.price_in_cents)
            let bp = trivialNum(b.price_in_cents) ? 0 : Number(b.price_in_cents);
            return ap + bp
        }, 0)        

        let lid = uuid.v4();
        let log = {
            ID: lid,
            paid_ids,
            unpaid_ids,
            message: message ?? "",
            payout_amt_in_cents,
            unpaid_in_cents: unpaid_in_cents ?? 0,
            projectID: projectID ?? "",
            userID: userID ?? "",
            timeStampCreated: swiftNow(),
            timeStampLatest: swiftNow(),
            timeStampCreatedPP: ppSwiftTime(swiftNow()) ?? "",        
        }

        // save significant payouts
        if ( payout_amt_in_cents > 0 ){
            await fire.firestore
                .collection(DbPaths.stories_stripe_items_payable_job_log)
                .doc( lid )
                .set(log)
                .then(_ => true)
                .catch(e => false)
        }

        return { success: true, message: message, paid, unpaid, payout_amt_in_cents, data: log };


    } catch (e) {

        let lid = uuid.v4();
        let log = {
            ID: lid,
            paid_ids: [],
            unpaid_ids: [],
            message: e.message ?? "",
            payout_amt_in_cents: 0,
            projectID: projectID ?? "",
            userID: userID ?? "",
            timeStampCreated: swiftNow(),
            timeStampLatest: swiftNow(),
            timeStampCreatedPP: ppSwiftTime(swiftNow()) ?? "",        
        }
        await fire.firestore
            .collection(DbPaths.stories_stripe_items_payable_job_log)
            .doc( lid )
            .set(log)
            .then(_ => true)
            .catch(e => false)        

        res['message'] = e.message
        return res;
    }

}


/**
 * 
 * @Use: recusively payout each payable item
 * 
 **/
async function _rec_payout_each_payable({ paid, unpaid, payout_amt_in_cents, projectID, stripe_account_id }){

    if (  unpaid.length === 0 ){

        return { unpaid, paid, payout_amt_in_cents, message: "all paid" }

    } else if ( trivialString(projectID) || trivialString(stripe_account_id) ){

        return { unpaid, paid, payout_amt_in_cents, message: "trivialStrings" }

    } else {

        let item = unpaid[0];
        let _unpaid = unpaid.slice(1,);
        let _paid   = paid.concat(item);

        const { pending_payout, price_in_cents, payout_id, ID } = item;

        if ( pending_payout || !trivialString(payout_id) || trivialString(ID) ){

            return _rec_payout_each_payable({ paid: _paid, unpaid: _unpaid, projectID, stripe_account_id })

        } else {

            //1.  lock item;
            await fire.firestore
                .collection(DbPaths.stories_stripe_items_payable)
                .doc( ID )
                .update({ pending_payout: true, timeStampLatest: swiftNow() })
                .then(_ => true)
                .catch(e => false)

            // compute payable after fees
            let owed_in_cents = Math.round(Number(STRIPE_vendor_payable_after_fee) * Number(price_in_cents));

            // 2. try payout merchant
            try {

                // payout
                const transfer = await stripe.transfers.create({
                    amount: owed_in_cents,
                    currency: "usd",
                    destination: stripe_account_id,
                }); 

                // check if payout success
                let payout_id = trivialProps(transfer,'destination_payment')
                    ? ""
                    : (transfer.destination_payment ?? "")

                // update payable log
                let update = {
                    ...transfer,
                    payout_id: payout_id,
                    pending_payout    : false,
                    paid_out_in_cents : owed_in_cents,
                    stripe_express_account_id: stripe_account_id,
                    timeStampLatest: swiftNow(),
                }   

                await fire.firestore
                    .collection(DbPaths.stories_stripe_items_payable)
                    .doc( ID )
                    .update( update )
                    .then(_ => true)
                    .catch(e => false)

                // pay next payable
                return _rec_payout_each_payable({ 
                    paid: _paid,
                    unpaid: _unpaid, 
                    projectID, stripe_account_id,
                    payout_amt_in_cents: payout_amt_in_cents + owed_in_cents 
                })

            } catch (e) {
                // if 0xparc does not have enough funds, then 
                // caatch error here:

                //3.  lock item;
                await fire.firestore
                    .collection(DbPaths.stories_stripe_items_payable)
                    .doc( ID )
                    .update({ pending_payout: false, timeStampLatest: swiftNow() })
                    .then(_ => true)
                    .catch(e => false)

                return {  unpaid, paid, message: `payable crone job ended early: ${e.message}`, payout_amt_in_cents: payout_amt_in_cents }
            }


        }
    }
}


/**
 * 
 * @use: compute how much is owed to the merchange at 
 *       `projectID`  
 * 
 **/
async function get_express_payable({ projectID }){

    var res = default_fn_response({ payout_amt_in_cents: 0, data: [] });

    if ( trivialString(projectID) ){
        res['message'] = 'no project specified';
        return res;
    }

    // // get all items purchased 
    var payment_record = [];
    const matches = await fire.firestore
        .collection(DbPaths.stories_stripe_items_payable)
        .where('projectID', '==', projectID)
        .get();
    if (!matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                payment_record.push(doc.data())
            }
        })
    }

    // compute payable obligations
    let unpaid_items = payment_record
        .filter(m => {
            let pending  = !trivialProps(m,'pending_payout') && m.pending_payout;
            let paid_out = !trivialProps(m,'payout_id') && !trivialString(m.payout_id);
            return !pending && !paid_out;
        })
        .map(m => {
            let _price = trivialProps(m,'price_in_cents') ? 0 : Number(m.price_in_cents);
            let price = trivialNum(_price) ? 0 : Number(_price);
            return { ...m, price_in_cents: price };
        })

    let express_payable_in_cents = unpaid_items.reduce((a,b) => { 
        let ap = trivialNum(a.price_in_cents) ? 0 : Number(a.price_in_cents)
        let bp = trivialNum(b.price_in_cents) ? 0 : Number(b.price_in_cents);
        return ap + bp
    }, 0)
    let express_payable_after_fee_in_cents = Math.floor(Number(express_payable_in_cents) * Number(STRIPE_vendor_payable_after_fee));

    let res_succ = { 
        success: true, 
        message: `owed ${express_payable_after_fee_in_cents}`, 
        payout_amt_in_cents: express_payable_after_fee_in_cents, 
        data: unpaid_items,
    };

    return res_succ;
}


async function _migrate(projectID){

    let _items = await getFiatPurchasedStoryboardItems({ address:projectID });
    let items = _items.data;

    let mark_all = await items.map(async (item) => {

        let { paymentId, fiat_payment_id, itemID, userID, projectID, storyboardID } = item;
        let _board = await getStoryBoard({ storyboardID: storyboardID, full: false })

        let id = fiat_payment_id ?? paymentId;
        let cents = _board.data.price_in_cents ?? 0;

        let payable_blob = {
            ID               : id,
            fiat_payment_id  : id ?? "",
            price_in_cents   : cents,
            userID           : userID ?? "",
            itemID           : itemID ?? "", 
            storyboardID     : storyboardID ?? "",
            projectID        : projectID,
            pending_payout   : false,
            payout_id        : "",
            stripe_express_account_id: "",
            timeStampCreated : swiftNow(),
            timeStampLatest  : swiftNow(),
            timeStampCreatedPP: ppSwiftTime(swiftNow()) ?? "",        
        }
        let did = await fire.firestore
            .collection(DbPaths.stories_stripe_items_payable)
            .doc( id )
            .set( payable_blob )
            .then(_ => true)
            .catch(e => e)
    })
    await Promise.all(mark_all);   
}


/******************************************************
    @exports
******************************************************/


// stripe
exports.make_connected_account    = make_connected_account;
exports.confirm_connected_account = confirm_connected_account
exports.fiat_purchase_and_premint = fiat_purchase_and_premint;
exports.payout_project_express    = payout_project_express;
exports.get_express_payable       = get_express_payable;
exports.get_fiat_minted_tok_owned_by = get_fiat_minted_tok_owned_by;
