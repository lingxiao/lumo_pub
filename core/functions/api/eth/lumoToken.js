/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: Social token fn logic
 * @Date   : Aug 25th
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


const BigNumber = require('bignumber.js');

const {
    fetch_one,
    write_to_db,
    update_db,
} = require('./../fire');

const { 
    print,
    swiftNow, 
    trivialProps, 
    trivialNum, 
    trivialString,
    ppSwiftTime,
} = require('./../utils');


const {
    DbPaths, 
    Networks,
    lumo_decimals,
    default_db_blob,
    current_eth_network,
    default_fn_response,
    get_keys_from_lumo_core,
    network_flow_to_eth,
    alchemySideChainInstance,

    LumoContractAddress,
    LumoStakingPoolContractAddress,
} = require('./../core');


const { 
    getUserByVendorID, 
} = require('./../client/accounts');


const {
    lumo_balance,
    lumo_mint_to,
    lumo_send_to,
    whiteListCustodian,
    lumo_whitelist_staking_contract,
} = require("./../../ethcontracts/scripts/lumo_token");

const {
    offchain_burn,
    offchain_mint_lumo_to,
    offchain_send_lumo_to,
    offchain_balance_of_lumo,   
} = require('./lumoOffChain');

/**
 * 
 * @use: init chain middleware. note this
 *       uses the correct chain based on staging
 *       or production env.
 * 
 **/
const pweb3 = alchemySideChainInstance();


/******************************************************
    @readn
******************************************************/

/**
 * 
 * @use: get balance of user at userid
 * 
**/
async function balance_of_lumo_on_polygon({ userID }){

    var res = default_fn_response({ balance: 0, total_supply: 0 })

    let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });
    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne'
        return res;
    }   
    let pk = trivialString(user.custodial_ethereum_address)
        ? ( user.metamask_ethereum_address ?? "" )
        : user.custodial_ethereum_address;

    try {
        let contract_source = await _get_contract_abi()
        const { polygon, abi_sourceName } = LumoContractAddress();
        let _res = await lumo_balance({
            web3: pweb3,
            pk: pk,
            contract_address: polygon, 
            contract_source: contract_source,
        })
        return _res;
    } catch (e) {
        res['message'] = e;
        return res;
    }   
}




/******************************************************
    @mint + send primitives
******************************************************/

/**
 * 
 * @Use: mint `amt` of lumo to acct
 * 
**/
async function polygon_mint_lumo_to({ userID, amt_in_lumo, offchain, then, then_watching }){

    var res = default_fn_response({ balance_before: 0, balance_after:0, hash: "" });

    // @mint off chain first
    let offchain_res = await offchain_mint_lumo_to({ userID, amt_in_lumo });    

    if ( typeof offchain === 'boolean' && offchain ){

        let { balance } = await offchain_balance_of_lumo({ userID });
        let response = {  ...offchain_res, hash: "offchain", balance_before: balance - amt_in_lumo, balance_after: balance }
        then(response);
        then_watching(response);

    } else {

        try {

            if (  trivialNum(amt_in_lumo) ){
                res['message'] = 'ill valued amt';
                return then(res);
            }

            let amt = BigNumber(`${amt_in_lumo * lumo_decimals()}`);

            let contract_source = await _get_contract_abi()
            const { polygon, abi_sourceName } = LumoContractAddress();
            let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });

            if ( trivialProps(user,'userID') ){
                res['message'] = 'user dne'
                return then(res);
            }   

            let pk = trivialString(user.custodial_ethereum_address)
                ? ( user.metamask_ethereum_address ?? "" )
                : user.custodial_ethereum_address;

            try {
                await lumo_mint_to({
                    web3 : pweb3,
                    pk   : pk, 
                    amt  : amt,
                    contract_address: polygon,
                    contract_source : contract_source,
                    then : then,
                    then_watching: then_watching
                });
            } catch (e) {
                res['message'] = e;
                return then(res);
            }
        } catch (e) {
            res['message'] = e;
            return then(res);
        }
    }

}


/**
 * 
 * @Use: mint `amt` of lumo to acct
 * 
**/
async function polygon_send_lumo_to({ srcUserID, tgtUserID, amt_in_lumo, offchain, then }){

    //@send off chain first
    let offchain_res =  await offchain_send_lumo_to({ srcUserID, tgtUserID, amt_in_lumo });


    if ( typeof offchain === 'boolean' && offchain ){

        let { balance } = await offchain_balance_of_lumo({ userID: srcUserID });
        let response = {  
            ...offchain_res, 
            hash: "offchain", 
            balance_before: balance - amt_in_lumo, 
            balance_after: balance 
        }
        then(response);

    } else {

        try {

            var res = default_fn_response({ balance_before: 0, balance_after:0, hash: "" });

            let contract_source = await _get_contract_abi()
            const { polygon, abi_sourceName } = LumoContractAddress();

            if ( trivialNum(amt_in_lumo) ){
                res['message'] = 'ill valued amt in lumo';
                return then(res);
            }

            let amt = BigNumber(`${amt_in_lumo * lumo_decimals()}`)
            let src = await getUserByVendorID({ userID: srcUserID, vendorID: "", withPrivateKey: false });
            let tgt = await getUserByVendorID({ userID: tgtUserID, vendorID: "", withPrivateKey: false });

            if ( trivialProps(src,'userID') || trivialProps(tgt,'userID') ){
                res['message'] = 'src/tgt user dne'
                return then(res);
            }   

            let srcPk = trivialString(src.custodial_ethereum_address)
                ? ( src.metamask_ethereum_address ?? "" )
                : src.custodial_ethereum_address;

            let tgtPk = trivialString(tgt.custodial_ethereum_address)
                ? ( tgt.metamask_ethereum_address ?? "" )
                : tgt.custodial_ethereum_address;

            let post_param = {
                eth_address     : srcPk,
                hide_private_key: false,
                network         : network_flow_to_eth(current_eth_network()),
            }

            await get_keys_from_lumo_core({ 
                post_params: post_param,
                then: async ({ success, message, data }) => {

                    if ( !success || trivialProps(data,'eth_private_key') ){
                        res['message'] = 'no private key found for user'
                        return then(res)
                    }

                    try {
                        await lumo_send_to({  
                            web3 : pweb3,
                            contract_address: polygon, 
                            contract_source: contract_source,
                            srcPk     : srcPk,
                            srcPrivate: data.eth_private_key,
                            tgtPk     : tgtPk,
                            amt       : amt,
                            then      : (res) => {
                                if ( !res.success ){
                                    return then(res);
                                }
                            },
                            then_watching: then
                        });
                    } catch (e) {
                        res['message'] = e;
                        return then(res);
                    }
                }
            });  

        } catch (e) {
            res['message'] = e;
            return then(res);

        }   

    }       

}

/**
 * 
 * @Use: mint `amt` of lumo to acct
 * 
**/
async function polygon_send_lumo_with_pk({ srcPk, tgtPk, amt_in_lumo, offchain, then }){

    //@send lumo off chain first
    let src = await fetch_one({ 
        path: DbPaths.users,
        field: 'custodial_ethereum_address', 
        value: srcPk,
    })
    let tgt = await fetch_one({ 
        path: DbPaths.users,
        field: 'custodial_ethereum_address', 
        value: tgtPk,
    })

    // send or burn off chain first
    var offchain_res = { success: false, message: "ill valued inputs" };

    if ( !trivialProps(src,'userID') ){ 
        if ( !trivialProps(tgt,'userID') ){
            offchain_res =  await offchain_send_lumo_to({
                srcUserID: src.userID,
                tgtUserID: tgt.userID,
                amt_in_lumo: amt_in_lumo ?? 0,
            });
        } else {
            offchain_res = await offchain_burn({ userID: src.userID, amt_in_lumo: amt_in_lumo ?? 0})            
        }
    }

    if ( typeof offchain === 'boolean' && offchain ){

        let { balance } = await offchain_balance_of_lumo({ userID: src.userID });
        let response = {  
            ...offchain_res, 
            hash: "offchain", 
            balance_before: balance - amt_in_lumo, 
            balance_after: balance 
        }
        then(response);

    } else {

        try {

            var res = default_fn_response({ balance_before: 0, balance_after:0, hash: "" });

            let contract_source = await _get_contract_abi()
            const { polygon, abi_sourceName } = LumoContractAddress();

            if ( trivialNum(amt_in_lumo) ){
                res['message'] = 'ill valued amt in lumo';
                return then(res);
            }

            let amt = BigNumber(`${amt_in_lumo * lumo_decimals()}`)

            if ( trivialString(srcPk) || trivialString(tgtPk) ){
                res['message'] = 'src/tgt pk illvalued'
                return then(res);
            }   

            let post_param = {
                eth_address     : srcPk,
                hide_private_key: false,
                network         : network_flow_to_eth(current_eth_network()),
            }

            await get_keys_from_lumo_core({ 
                post_params: post_param,
                then: async ({ success, message, data }) => {

                    if ( !success || trivialProps(data,'eth_private_key') ){
                        res['message'] = 'no private key found for user'
                        return then(res)
                    }
                    try {
                        await lumo_send_to({  
                            web3 : pweb3,
                            contract_address: polygon, 
                            contract_source: contract_source,
                            srcPk     : srcPk,
                            srcPrivate: data.eth_private_key,
                            tgtPk     : tgtPk,
                            amt       : amt,
                            then      : (res) => {
                                if ( !res.success ){
                                    return then(res);
                                }
                            },
                            then_watching: then
                        });
                    } catch (e) {
                        res['message'] = e;
                        return then(res);
                    }                    
                }
            });    

        } catch (e) {
            res['message'] = e;
            return then(res);

        }

    }
}


/******************************************************
    @whitelists
******************************************************/


// @use: whitelist lumo-staking-pool
//       this is done the first time the staking pool contract has
//       been deployed, it only needs to be done once.
async function polygon_whitelist_staking_contract({ then, then_watching }){

    try {

        var res = default_fn_response({});

        let contract_source = await _get_contract_abi()
        const { polygon, abi_sourceName } = LumoContractAddress();

        await lumo_whitelist_staking_contract({
            web3 : pweb3,
            contract_address: polygon,
            contract_source : contract_source,
            staking_address : LumoStakingPoolContractAddress().polygon,
            then : then,
            then_watching: then_watching        
        })

    } catch (e) {
        res['message'] = e;
        return then(res);
    }        

}


// @use: whitelist lumo-staking-pool
//       this is done the first time the staking pool contract has
//       been deployed, it only needs to be done once.
async function polygon_whitelist_custodian({ pk, then, then_watching }){

    try {
        var res = default_fn_response({});

        let contract_source = await _get_contract_abi()
        const { polygon, abi_sourceName } = LumoContractAddress();

        await whiteListCustodian({
            web3 : pweb3,
            contract_address: polygon,
            contract_source : contract_source,
            pk: pk,
            then : then,
            then_watching: then_watching        
        })
    } catch (e) {
        res['message'] = e;
        return then(res);
    }

}


/******************************************************/
// @utils


/**
 * @use: get lumo contract abi 
 * 
 **/
async function _get_contract_abi(){

    const { abi_sourceName } = LumoContractAddress();

    let contract = await fetch_one({ 
        path: 'contract_abi', 
        field: 'sourceName', 
        value: abi_sourceName,
    })
    return trivialProps(contract, 'abi') ? {} : contract
}



/******************************************************
    @export
******************************************************/



// on chain
exports.polygon_mint_lumo_to = polygon_mint_lumo_to;
exports.polygon_send_lumo_to = polygon_send_lumo_to;
exports.polygon_send_lumo_with_pk = polygon_send_lumo_with_pk;
exports.balance_of_lumo_on_polygon = balance_of_lumo_on_polygon;
exports.polygon_whitelist_custodian = polygon_whitelist_custodian;



