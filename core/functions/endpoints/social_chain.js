/**
 * @Package:  endpoints social chain
 * @Date   : 8/23/2022
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

const {
    GLOBAL_PRODUCTION
} = require('./../api/core');


const { 
    assertWellFormedRequest, 
    with_api_response 
} = require('./endpoint_utils');

const {
    create_chain,
    fetch_chain,
    fetch_all_chains,
    submit_block_item,
    edit_block_item,
    get_full_block,
    update_chain_root,
    finish_chain_setup,
    fetch_chain_items,
    fetch_chain_id_by_subdomain,
    fetch_chain_users,
    fetch_chain_containing,
} = require('./../api/client/SocialChain');

const {
    sign_manifesto,
    get_my_signatures,
    nominate_leader,
    accept_nomination,
    fech_nomination,
    make_invite_code,
    buy_lumo_token_on_polygon,
    fetch_all_nominations_for,
    gift_lumo_to_nominee,
} = require('./../api/client/SocialChain+app');

const {
    fetch_recent_rewards
} = require('./../api/client/SocialChain+reward');


const {
    get_twitter_graph ,
    get_twitter_account,
} = require('./../api/client/SocialChain+twitter');

const {
    get_contract_for_burn,
    get_erc721LumoV2,
    get_PaymetSplitterV2,
    get_ERC721SplitterProxy,

    write_social_chain_drop_root,
    before_deploy_contract_to_project,
    did_deploy_contract_to_project,
    did_finish_deploy_contract_to_project,
    edit_social_chain_drop_root,
    get_all_contracts_for_burn,
    can_connect_to_deployed_contract,
    connect_collection_with_contract,

    can_mint_nft,
    did_mint_nft,
    buy_nft_offchain,
    fetch_all_tokens,
    fetch_all_tokens_by,

    gen_token_qr_code_seed,
    read_token_qr_code,

    token_uri,
} = require('./../api/client/SocialChain+mint');

const {
    balance_of_lumo_on_polygon,
} = require('./../api/eth/lumoToken');

const {
    offchain_balance_of_lumo
} = require('./../api/eth/lumoOffChain');



// @note: make sure you whitelist all custodial keys
// const custodialKeys = require('./../api/eth/genCustodialKeys');
if (GLOBAL_PRODUCTION === false) {
    const staging = require('./../api/client/SocialChain+staging');
} 

const API = express();

/******************************************************
    @Opensea API
******************************************************/

/**
 * 
 * @Use: metadata for lost souls token
 * @Doc: https://github.com/ProjectOpenSea/metadata-api-nodejs/blob/master/index.js
 *  
 **/
API.get("/token/:sym/:id", async (req,res)=> {
    let symbol  = parseInt(req.params.sym).toString()
    let tokenId = parseInt(req.params.id).toString()
    let response = await token_uri({ symbol, tokenId })
    res.send(response);
});


/******************************************************
    @API with continuation fn
******************************************************/

let api_endpoints_then = {
    'create_chain'             : create_chain,
    'sign_manifesto'           : sign_manifesto,
    'buy_lumo_token_on_polygon': buy_lumo_token_on_polygon,
    "buy_nft_offchain"         : buy_nft_offchain,
}


// serve API
Object.keys(api_endpoints_then).map( key => {

    let fn = api_endpoints_then[key];

    API.post(`/${key}`, async (req,res) => {

        let str  = JSON.stringify(req.body);
        let body = JSON.parse(str);

        const { wellFormed, message, vendor } = await assertWellFormedRequest(req, []);

        if ( !wellFormed ){

            let res_str = JSON.stringify({ "success": false, "message": message, data: {} });
            res.status(201).send( res_str );

        } else {

            var inputs = body;        
            const vendorID = vendor.vendorID;
            inputs['vendorID'] = vendorID;

            await fn({
                ...inputs,
                then: (response) => {
                    res.status(201).send(JSON.stringify(response));
                }
            });
        }
    });    
});


/******************************************************
    @wapi w/o continuation fn
******************************************************/

let api_endpoints = {

    // chain core
    "fetch_chain"                 : fetch_chain,
    "fetch_all_chains"            : fetch_all_chains,
    "fetch_chain_users"           : fetch_chain_users,
    'fetch_chain_id_by_subdomain' : fetch_chain_id_by_subdomain,
    'get_all_contracts_for_burn'  : get_all_contracts_for_burn,

    // read chain basics
    "get_full_block"    : get_full_block,
    'get_my_signatures' : get_my_signatures,
    'fetch_all_tokens'  : fetch_all_tokens,

    // submission
    "submit_block_item"  : submit_block_item,
    'edit_block_item'    : edit_block_item  ,
    "update_chain_root"  : update_chain_root,
    
    // patronage + invite
    "make_invite_code"    : make_invite_code,
    'fech_nomination'     : fech_nomination ,
    'fetch_all_nominations_for': fetch_all_nominations_for,
    'fetch_recent_rewards': fetch_recent_rewards,
    'fetch_chain_items'   : fetch_chain_items   ,
    'fetch_all_tokens_by' : fetch_all_tokens_by ,
    'fetch_chain_containing': fetch_chain_containing,

    'nominate_leader'     : nominate_leader  ,
    "accept_nomination"   : accept_nomination,
    'gift_lumo_to_nominee': gift_lumo_to_nominee,

    // twitter read
    'get_twitter_graph'  : get_twitter_graph  ,
    'get_twitter_account': get_twitter_account,    

    // lumo
    "balance_of_lumo_on_polygon": balance_of_lumo_on_polygon,
    'offchain_balance_of_lumo'  : offchain_balance_of_lumo  ,

    // read/make qr
    "gen_token_qr_code_seed"    : gen_token_qr_code_seed,
    "read_token_qr_code"        : read_token_qr_code,

    // deploy collection contract
    'get_contract_for_burn'  : get_contract_for_burn,
    'get_erc721LumoV2'       : get_erc721LumoV2,
    "get_PaymetSplitterV2"   : get_PaymetSplitterV2,
    "get_ERC721SplitterProxy": get_ERC721SplitterProxy,
    'can_connect_to_deployed_contract': can_connect_to_deployed_contract,
    'connect_collection_with_contract': connect_collection_with_contract,

    'write_social_chain_drop_root'          : write_social_chain_drop_root,
    'edit_social_chain_drop_root'           : edit_social_chain_drop_root,
    'before_deploy_contract_to_project'     : before_deploy_contract_to_project,
    'did_deploy_contract_to_project'        : did_deploy_contract_to_project,
    'did_finish_deploy_contract_to_project' : did_finish_deploy_contract_to_project,

    // mint
    'can_mint_nft'   : can_mint_nft,
    'did_minted_nft' : did_mint_nft,
}


// serve API
Object.keys(api_endpoints).map( key => {
    let fn = api_endpoints[key];
    API.post(`/${key}`, async (req,res) => {
        with_api_response({
            req: req,
            res: res,
            params: [],
            data_format: {},
            fn: fn,
        });
    });
})




/******************************************************
    @export
******************************************************/


exports.app_social_chain = API;

