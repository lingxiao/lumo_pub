/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: Social chain senior liquidity privisons
 * @Date   : 9/18
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

const uuid = require('uuid');

const {
    fetch_many,
    fetch_one,
    fetch_all,
    write_to_db,
    update_db,
} = require('./../fire');

const { 
    trivialProps, 
    trivialNum, 
    trivialString,
    swiftNow,
    force_to_num,
    randomIntFromInterval,
} = require('./../utils');


const { 
    getUserByVendorID, 
} = require('./accounts');


const {
    DbPaths, 
    default_fn_response,
    lumo_decimals,
    lumo_price_in_cents,
    default_db_blob,
    GLOBAL_PRODUCTION,
} = require('./../core');

const {
    fetch_chain,
} = require('./SocialChain');




/******************************************************/
// @payment constants
/******************************************************/

const NFT_TAKE_RATE = 0.10;

const SLP_Tranche_ratio  = 2/5;
const LUMO_Take_ratio    = 0.10;
const StripeFee = (2.9 + 0.5)/100;  // 2.9% plus 0.5% for mannually entered credit card #
const PercentAfterStripeFee = 1 - StripeFee;
const StripeFlatFeeInCents = 30;

// user-id 
const admin_user_id = () => {
    if (GLOBAL_PRODUCTION){
        return 'mNxRTDX41APhHEl5axA5uNxHaC33'
    } else {
        return '63O5QzZ6Nih0d1EnAtZb3WbwFQx2'
    }
}

// core team members
const CORE_MEMBER = {
    lumo  : '<lumo_admin>',
    lawson: '<lawson_quiet_minds>',
    xiao  : admin_user_id(),
}


// issue();
async function issue(){
    // await issue_lumo_SLPs({ 
    //     userID: CORE_MEMBER.xiao,
    //     member: "",
    //     amt_in_slp:1000,
    //     redemption_value_in_cents: 15    
    // });
    // await issue_lumo_SLPs({ 
    //     userID: CORE_MEMBER.lawson,
    //     member: "",
    //     amt_in_slp:1000,
    //     redemption_value_in_cents: 15    
    // });
}


// async function foo(){
//     let customer_payment = await fetch_one({
//         field: 'ID',
//         value: 'd7962b24-2d2d-4706-ac1a-76f66e6dc43b',
//         path : 'sc_lumo_purchase'
//     })
//     await satisify_all_liquidity_provisions(customer_payment);
// }
// foo();



/******************************************************
    @payout LUMO token SLP
******************************************************/


/**
 * 
 * @use: satisfy all provisions given one customer payment tx.
 * 
 **/
async function satisify_all_liquidity_provisions(customer_payment){

    if ( trivialProps(customer_payment,'charge_in_cents')  
        || trivialProps(customer_payment,'amt_in_lumo') 
        || trivialProps(customer_payment, 'obligations_paid_out')
    ){
        return false;
    }

    // do not double pay if already paid out
    if ( customer_payment.obligations_paid_out ){
        return true;
    }

    const { 
        ID,
        chain_id, 
        amt_in_lumo, 
        charge_in_cents, 
    } = customer_payment;

    // get amt after stripe fee
    const charge_in_cents_after_fee = charge_in_cents * PercentAfterStripeFee - StripeFlatFeeInCents;
    const chain_admin_payout    = Math.round(trivialString(chain_id) ? 0 : charge_in_cents_after_fee * (1 - SLP_Tranche_ratio));
    const LUMO_TAKE_IN_CENTS    = Math.round(charge_in_cents_after_fee * LUMO_Take_ratio);
    const slp_tranche_after_fee = Math.round(charge_in_cents_after_fee - chain_admin_payout - LUMO_TAKE_IN_CENTS);

    if ( charge_in_cents_after_fee < 0  || charge_in_cents_after_fee === NaN || trivialNum(charge_in_cents_after_fee) ){
        return false;
    }

    // payout chain admin
    if ( !trivialString(chain_id) ){

        let { root } = await fetch_chain({ chain_id: chain_id ?? "", full: false });

        if ( !trivialProps(root,'userID') ){

            let id = `${ID}_${swiftNow()}_${randomIntFromInterval(1000,10000)}`
            var chain_admin_payout_blob = default_db_blob({
                ...{...customer_payment, obligations_paid_out: "n/a"},
                payable_in_cents : chain_admin_payout ?? 0,
                payout_redeemed  : false,
                payout_pm_id     : "",
                receivable_by    : root.userID,
                chain_id         : chain_id,
            });
            chain_admin_payout_blob['ID'] = id;
            await write_to_db({
                ID  : id,
                path: DbPaths.lumo_accounts_payable,
                blob: chain_admin_payout_blob,
            });          
            
        }
    }

    // payout lumo
    let id1 = `${ID}_${swiftNow()}_${randomIntFromInterval(1000,30000)}`
    var lumo_take_payout_blob = default_db_blob({
        ...{...customer_payment, obligations_paid_out: "n/a"},
        payable_in_cents : LUMO_TAKE_IN_CENTS,
        payout_redeemed  : false,
        payout_pm_id     : "",
        receivable_by    : CORE_MEMBER.lumo,
        chain_id         : chain_id ?? "",
    });
    lumo_take_payout_blob['ID'] = id1;

    await write_to_db({
        ID  : id1,
        path: DbPaths.lumo_accounts_payable,
        blob: lumo_take_payout_blob,
    });   

    // get all *active* liquidity provisiosn on record
    let provisions = await fetch_all({ path: DbPaths.lumo_SLP });
    let active_provs = provisions
        .filter(m => {
            return m.option_expired === false && m.option_live < swiftNow();
        })
        .sort((b,a) => {
            return b.option_live - a.option_live
        });

    // payout SLP provision, all left over goes to
    // lumo take rate again.
    let remainder_waterfall = await go_payout_all({ 
        customer_payment, 
        provisions: active_provs,
        remainder_waterfall: slp_tranche_after_fee 
    });

    // if any remainder left, then payout admin again
    if ( remainder_waterfall > 0 ){
        let updated_take_rate = force_to_num(LUMO_TAKE_IN_CENTS,0) + force_to_num(remainder_waterfall,0);
        await update_db({
            ID: id1,
            path: DbPaths.lumo_accounts_payable,
            blob: { payable_in_cents: updated_take_rate },
        });
    }

    // update purchase blob
    // to reflect paid out.
    await update_db({
        ID: ID, 
        path: DbPaths.social_chain_purchase_lumo,
        blob: { obligations_paid_out: true }
    });


    return true;

}

/**
 * 
 * @use: allocate as much payout FIFO until `payout_amt_in_cents` is filled
 * 
 **/
async function go_payout_all({ customer_payment, provisions, remainder_waterfall }){
    if ( provisions.length === 0 || remainder_waterfall <= 1 ){
        return remainder_waterfall;
    } else {
        let head = provisions[0];
        let tail = provisions.slice(1,);
        let remainder_to_payout = await go_payout_each_obligation({
            customer_payment,
            provision: head,
            remainder_waterfall,
        });
        return await go_payout_all({ 
            customer_payment, 
            provisions: tail,
            remainder_waterfall: remainder_to_payout,
        });
    }
}


/**
 * @Use: log accounts payable for each set of obligations asesociatd with one user 
 *       return how much was charged
 * 
 **/
async function go_payout_each_obligation({ provision, customer_payment, remainder_waterfall }){

    const { ID, chain_id } = customer_payment;

    if ( trivialProps(provision,'amt_in_slp') || trivialNum(provision.amt_in_slp) || trivialString(ID) ){
        return 0;
    }
    if ( trivialProps(provision,'redemption_value_in_cents') || trivialNum(provision.redemption_value_in_cents)  ){
        return 0;
    }
    if ( trivialNum(remainder_waterfall) || remainder_waterfall <= 1 ){
        return 0;
    }

    // compute total obligations
    const { target_userID, target_member, redemption_value_in_cents, amt_in_slp } = provision;
    let total_obligations_in_cents = Math.round(redemption_value_in_cents * amt_in_slp);

    // get full-filled obligations
    let full_filled_obligation_list_1 = await fetch_many({
        path: DbPaths.lumo_accounts_payable, 
        field: "receivable_by",
        value: target_member ?? "",
    })
    let full_filled_obligation_list_2 = await fetch_many({
        path: DbPaths.lumo_accounts_payable, 
        field: "receivable_by",
        value: target_userID ?? "",
    });
    var uniques = {};
    full_filled_obligation_list_1.map(ob => {
        uniques[ob.ID] = ob;
    })
    full_filled_obligation_list_2.map(ob => {
        uniques[ob.ID] = ob;
    });
    let full_filled_obligation_list = Object.values(uniques);
    let full_filled_obligation_in_cents = full_filled_obligation_list
        .map(ob => ob.payable_in_cents)
        .reduce(maybe_add, 0);

    // determine net obligations;
    let net_obligations_in_cents = total_obligations_in_cents - full_filled_obligation_in_cents;

    if ( net_obligations_in_cents < 1 ){
        return remainder_waterfall;
    }

    var satisfiable_obligation_in_cents = 0

    if ( net_obligations_in_cents > remainder_waterfall ){
        satisfiable_obligation_in_cents = remainder_waterfall
    } else {
        satisfiable_obligation_in_cents = Math.max(0, remainder_waterfall - net_obligations_in_cents );
    }

    // payout lumo
    let id2 = `${ID}_${swiftNow()}_${randomIntFromInterval(1000,20000)}`
    var water_fall = default_db_blob({
        ...{...customer_payment, obligations_paid_out: "n/a"},
        payable_in_cents : satisfiable_obligation_in_cents,
        payout_redeemed  : false,
        payout_pm_id     : "",
        receivable_by    : trivialString(target_userID) ? (target_member ?? "") : target_userID,
        provision_ID     : provision.ID ?? "",
    });
    water_fall['ID'] = id2;
    await write_to_db({
        ID  : id2,
        path: DbPaths.lumo_accounts_payable,
        blob: water_fall,
    });   

    return Math.max(0,remainder_waterfall-satisfiable_obligation_in_cents);

}


/******************************************************
    @payout NFT offchain purchase
******************************************************/

/**
 * 
 * @use: satisfy liquidity provision for NFT sale
 * 
 **/
async function satisify_all_liquidity_provisions_for_NFT_sales(params){

    const {
        paymentId, 
        charge_in_cents,
        chain_id,
        collection_id,
        tok_id,
        buyer_userID,
        seller_userID,
    } = params;

    var res = default_fn_response({ data: {} });

    if ( [paymentId, chain_id].map(trivialString).includes(true) ){
        res['message'] = 'illValued inputs;'
    }

    let n_charge_in_cents = force_to_num(charge_in_cents,1);

    // get amt after stripe fee
    const charge_in_cents_after_fee = n_charge_in_cents * PercentAfterStripeFee - StripeFlatFeeInCents;    
    const LUMO_TAKE_IN_CENTS    = Math.round(charge_in_cents_after_fee * NFT_TAKE_RATE);
    const chain_admin_payout    = Math.round( charge_in_cents_after_fee - LUMO_TAKE_IN_CENTS );

    if ( charge_in_cents_after_fee < 0  || charge_in_cents_after_fee === NaN || trivialNum(charge_in_cents_after_fee) ){
        return false;
    }

    // payout burn evt owner
    if ( !trivialString(chain_id) ){
        let id = `${paymentId}_${swiftNow()}_${randomIntFromInterval(100,10000)}`
        var chain_admin_payout_blob = default_db_blob({
            ...params,
            payable_in_cents : chain_admin_payout ?? 0,
            payout_redeemed  : false,
            payout_pm_id     : "",
            receivable_by    : seller_userID ?? "",
        });
        chain_admin_payout_blob['ID'] = id;
        await write_to_db({
            ID  : id,
            path: DbPaths.lumo_accounts_payable,
            blob: chain_admin_payout_blob,
        });          
    }

    // payout lumo-admin
    let id1 = `${paymentId}_${swiftNow()+1}_${randomIntFromInterval(1000,30000)}`
    var lumo_take_payout_blob = default_db_blob({
        ...params,
        payable_in_cents : LUMO_TAKE_IN_CENTS,
        payout_redeemed  : false,
        payout_pm_id     : "",
        receivable_by    : CORE_MEMBER.lumo,
    });
    lumo_take_payout_blob['ID'] = id1;
    await write_to_db({
        ID  : id1,
        path: DbPaths.lumo_accounts_payable,
        blob: lumo_take_payout_blob,
    });       

    res['success'] = true;
    res['message'] = 'logged';
    return res;

}


/**
 * @use: payout connected accounts
 * 
 **/
async function payout_connected_accounts({ userID, chain_id, collection_id }){


}




/******************************************************
    @log+read obligations
******************************************************/



/**
 * 
 * @use: issue lumo liquidity provision to person
 *       note: do not overwrite existing blob
 *       issue new blob
 * 
 **/
async function issue_lumo_SLPs({ userID, member, amt_in_slp, redemption_value_in_cents }){

    let amt = Number(amt_in_slp);

    if ( (trivialString(userID) && trivialString(member)) || trivialNum(amt) || amt === NaN || trivialNum(redemption_value_in_cents) ){
        return false;
    }

    let uid = trivialString(userID) ? (member ?? "") : userID;
    let id = `${uid}_${swiftNow()}`

    var provision = default_db_blob({

        // target
        target_userID: uid,
        target_member: trivialString(member) ? "" : member,

        // option terms
        amt_in_slp     : amt,
        option_live    : swiftNow(),
        option_expired : false,
        issuance_price_in_eth    : 0.0,
        redemption_value_in_eth  : 0.0,
        issuance_price_in_cents  : 0.0,
        redemption_value_in_cents: Number(redemption_value_in_cents),

        // issuance info.
        tok_id: id,
        contract_address: "",
        issued_by_userID: "",
        issued_by_member: CORE_MEMBER.lumo,
        issued_by_metamask_address: "",
        issuance_transaction_hash: "",
    });
    provision.ID = id;

    await write_to_db({
        ID  : provision.ID,
        path: DbPaths.lumo_SLP,
        blob: provision,
    });          

    return true;
}


// @use: add numbers
function maybe_add(a,b){
    if ( trivialNum(a) ){
        return Number(b) ?? 0
    } else if ( trivialNum(b) ){
        return Number(a) ?? 0
    } else {
        return a+b;
    }
}




/******************************************************
    @export
******************************************************/

exports.satisify_all_liquidity_provisions = satisify_all_liquidity_provisions;
exports.satisify_all_liquidity_provisions_for_NFT_sales = satisify_all_liquidity_provisions_for_NFT_sales;
























