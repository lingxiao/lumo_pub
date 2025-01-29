/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: create custodial keys
 * @Date   : Aug 28th
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
    fetch_many,
    fetch_all,
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
    current_eth_network,
    network_flow_to_eth,
    alchemySideChainInstance,
    store_keys_in_lumo_core,
    make_production_web3_account,    
    with_custodial_eth_keys,
    get_all_custodial_eth_keys,
} = require('./../core');

const {
    read_eth_balance,
    send_admin_eth_to,    
    read_admin_eth_balance,
} = require("./../../ethcontracts/scripts/utils");

const {
    addCustodian
} = require("./LumoStakingPool");

const {
    polygon_whitelist_custodian
} = require("./lumoToken");


/**
 * 
 * @use: init chain middleware. note this
 *       uses the correct chain based on staging
 *       or production env.
 * 
 **/
const pweb3 = alchemySideChainInstance();


/******************************************************
    @generate keys
************************************n******************/

// !use: gen keys and whitelist them
async function main(){
    console.log('\n main: custodial keys')
    // await whitelist_keys();
    // await gen_keys_and_seed_funds({ num_keys: 3 })
    // await read_admin_eth_balance({ web3: pweb3, then: console.log });
    // await seed_all_keys_with_funds();
    // await with_custodial_eth_keys({ then: console.log });
}

/**
 * 
 * @Use: gen custodial keys and seed with funds
 * 
 * 
 **/
async function gen_keys_and_seed_funds({ num_keys }){

    await go({ iter: num_keys ?? 1 });

    async function go({ iter }){

        if ( iter === 0 ){
            return;
        }

        const { address, privateKey } = make_production_web3_account();

        // @Important: store keys on seraprate server
        let key_blob = {
            address    : address,
            privateKey : privateKey,
            network    : network_flow_to_eth(current_eth_network()),
        }

        let public_key_blob = { 
            ID: address,  
            address: address, 
            balance_in_wei: 0,
            balance_in_eth: 0,
            timeStampCreated: swiftNow(),
            timeStampCreatedPP: ppSwiftTime(swiftNow()),
            timeStampLatest: swiftNow(),
            timeStampLatestPP: ppSwiftTime(swiftNow()),
        }

        // store keys, if fail then fail
        await store_keys_in_lumo_core({
            post_params: key_blob,
            then: async ({ success, message, data }) => {

                if ( !success ){
                    return go({ iter: iter-1 })
                }

                let did = await write_to_db({ 
                    ID: address, 
                    path: DbPaths.custodial_keys,
                    blob: public_key_blob 
                });

                if ( !did ){
                    return go({ iter: iter-1 })                    
                }

                // add custodian to erc20 and staking-contract
                await polygon_whitelist_custodian({
                    pk: address,
                    then: console.log,
                    then_watching: async(res) => {
                        console.log(res);
                        if ( !success ){
                            return go({ iter: iter-1 });
                        }
                        await addCustodian({
                            pk: address,
                            then: console.log,
                            then_watching: async(res) => {{
                                console.log(res);
                                return go({ iter: iter -1 })
                            }}
                        })
                    }
                })
            }
        })

    }
}


/**
 * 
 * @use: seed all keys with funds
 * 
 **/
async function seed_all_keys_with_funds(){

    let keys = await fetch_all({ path: DbPaths.custodial_keys });

    console.log(`\n seeding ${keys.length} custodial accounts with funds`)

    await go_seed_funds({ keys });

    async function go_seed_funds({  keys }){

        if ( keys.length === 0){

            return keys;

        } else {

            let key  = keys[0];
            let tail = keys.slice(1,);
            const { address } = key;

            console.log(key)

            send_admin_eth_to({ 
                web3 : pweb3, 
                tgt  : address, 
                amt_in_eth: 0.1, 
                then: console.log,
                then_watching: async (res) => {

                    console.log(res);

                    // read funds and update
                    await read_admin_eth_balance({ web3: pweb3, then: console.log });
                    await read_eth_balance({ web3: pweb3, pk: address, then: async ({ pk, success, eth, wei }) => {
                        console.log('custodial_key balance: ', eth, wei, '\n\n\n');
                        if (  !success ){
                            return;
                        }
                        await update_db({ path: DbPaths.custodial_keys, ID: pk, blob: {
                            balance_in_wei: Number(wei),
                            balance_in_eth: Number(eth),
                            timeStampLatest: swiftNow(),
                            timeStampLatestPP: ppSwiftTime(swiftNow()),
                        }});

                    }});
                    return await go_seed_funds({ keys: tail })
                }
            });
        }
    }

}


/***
 * 
 * @use: whitelist all keys, when you run
 *      this fn, make sure you use the admin key in 
 *      with_custodial_eth_keys fn in core.js
 *      or all the fn will fail
 * 
 **/
async function whitelist_keys(){
    let keys = await get_all_custodial_eth_keys();
    console.log('keys;', keys)
    await go_whitelist({ keys });
}

async function go_whitelist({ keys }){

    if ( keys.length === 0 ){
        return console.log('done!')
    }

    let { address } = keys[0];
    let tail = keys.slice(1,);

    // add custodian to erc20 and staking-contract
    await polygon_whitelist_custodian({
        pk: address,
        then: console.log,
        then_watching: async (res) => {
            console.log(res)
            await addCustodian({
                pk: address,
                then: console.log,
                then_watching: async (res) => {
                    console.log(res)
                    await go_whitelist({
                        keys: tail,
                    });
                }
            })
        }
    });    
}


/******************************************************
    export
******************************************************/


exports.gen_keys_and_seed_funds = gen_keys_and_seed_funds;





































