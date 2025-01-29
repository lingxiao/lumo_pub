/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: Social chain mint
 * @Date   : 10/29
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


const {
    write_to_db,
    update_db,
    fetch_many,
    fetch_one,
    fetch_one_2,
} = require('./../fire');

const { 
    trivialProps, 
    trivialNum, 
    trivialString,
    cap,
    swiftNow,
    force_to_num,
    str_to_boolean,
    ppSwiftTime,    
    illValued,
} = require('./../utils');


const {
    DbPaths, 
    default_fn_response,
    alchemyWeb3Instance,
    valid_contract_kind,
    Networks,
    current_eth_network,
    ContractKind,
    CollectionKind,
    lumo_decimals,
    default_db_blob,
    lumo_dispensary,
    admin_eth_keys,    
    ItemMintState,
    MemberPermission,
    generate_tok_id,
} = require('./../core');

const {
    satisify_all_liquidity_provisions_for_NFT_sales
} = require("./SocialChain+provision")


const {
    charge_customer_and_confirm_charge,
} = require('./../stripe/userPayment');



const { 
    getUserByVendorID, 
} = require('./accounts');


const {
    fetch_chain,
    submit_block_item,    
} = require('./SocialChain');

const {
    get_contract_abi
} = require('./../eth/contracts');

const uuid = require('uuid');

/******************************************************/
// @get contract
/******************************************************/

/**
 * 
 * @use: get contract for burn
 * 
 **/
async function get_contract_for_burn({ collection_id }){
    var res = default_fn_response({ data: [] });
    if ( trivialString(collection_id) ){
        return res;
    }
    let contracts = await fetch_many({ 
        field: 'collection_id',
        value: collection_id ?? "",
        path: DbPaths.social_chain_drop_root,
    });
    return { data: contracts, success: true, message: 'fetched' }
}


// @use: get all contracts deployed for this burn
async function get_all_contracts_for_burn({ chain_id }){
    var res = default_fn_response({ data: [] });
    if ( trivialString(chain_id) ){
        return res;
    }
    let contracts = await fetch_many({ 
        field: 'chain_id',
        value: chain_id ?? "",
        path: DbPaths.social_chain_drop_root,
    });
    return { data: contracts, success: true, message: 'fetched' }
}


/**
 * @use: get erc721 base logic contract
 * 
 **/
async function get_erc721LumoV2(){
    var res = default_fn_response({ 
        data: {}, 
        address: current_eth_network() === Networks.mainnet 
            ? ContractKind.ERC721LumoV1_address_mainnet  
            : ContractKind.ERC721LumoV1_address_goerli  
    });
    let contracts = await fetch_many({ 
        field: 'ID',
        value: 'ERC721LumoV2',
        path: DbPaths.contract_abi,
    });
    res['data'] = contracts.length > 0 ? contracts[0] : {};
    res['success'] = true;
    res['message'] = 'fetched';
    return res;
}   



/**
 * @use: get erc721/Splitter base logic contract
 * 
 **/
async function get_PaymetSplitterV2(){
    var res = default_fn_response({ data: {} });
    let contracts = await fetch_many({ 
        field: 'ID',
        value: 'PaymentSplitterV2',
        path: DbPaths.contract_abi,
    });
    res['data'] = contracts.length > 0 ? contracts[0] : {};
    res['success'] = true;
    res['message'] = 'fetched';
    return res;
}   


/**
 * @use: get proxy contract
 * 
 **/
async function get_ERC721SplitterProxy(){
    var res = default_fn_response({ data: {} });
    let contracts = await fetch_many({ 
        field: 'ID',
        value: 'ERC721SplitterProxy',
        path: DbPaths.contract_abi,
    });
    res['data'] = contracts.length > 0 ? contracts[0] : {};
    res['success'] = true;
    res['message'] = 'fetched';
    return res;
}   



/******************************************************/
// @read/write off chain
/******************************************************/

/**
 * 
 * @Use: drop information
 * 
 **/
async function write_social_chain_drop_root({ 
    chain_id, 
    userID, 
    title,
    sym,
    about,
    num_frees,
    num_editions,
    num_editions_presale,
    price_in_eth,
    price_in_cents,
    presale_price_in_cents,
    exchange_rate,
    image_url,
    drop_timestamp,
    metamask_address,
}){

    var res = default_fn_response({ data: {} });

    if ( trivialString(chain_id) || trivialString(userID) ){
        res['message'] = 'ill valued inputs';
        return res;
    }

    let { root } = await fetch_chain({ chain_id: chain_id ?? "", full: false });

    if ( trivialProps(root, 'chain_id') ){

        res['message'] = 'burn not found'
        return res;

    } else if ( root.userID !== userID ){

        res['message'] = 'only burn owner can create drops'
        return res;

    } else {

        let blob = default_db_blob({

            userID: userID,
            chain_id: chain_id,
            deployed_metamask_address: metamask_address ?? "",

            // view data
            title  : title ?? "",
            about  : about ?? "",

            // socials
            discord: "",
            website: "",
            twitter: "",
            instagram: "",

            // mint data
            token_sym     : sym ?? "",
            num_editions  : force_to_num(num_editions,0)    ?? 0,
            num_editions_presale: force_to_num(num_editions_presale,0) ?? 0,
            price_in_eth  : force_to_num(price_in_eth, 0)   ?? 0,
            price_in_cents: force_to_num(price_in_cents,0)  ?? 0,    
            presale_price_in_cents: force_to_num(presale_price_in_cents,0) ?? (force_to_num(price_in_cents,0) ?? 0),
            image_url     : image_url ?? "",
            image_preview_url: image_url ?? "",

            // perks
            num_frees: force_to_num(num_frees,0) ?? 0,
            exchange_rate_tab: force_to_num(exchange_rate,0) ?? 0,

            // contract metadata
            isContractHome    : true,
            witness_pk        : chain_id,
            contract_abi_id   : "",
            contract_address  : "",   
            contract_deployed : false,
            contract_deploy_timeStampStart: 0,
            contract_deploy_timeStampEnd  : 0,
            contract_deploy_tx_hash       : "",
            contract_deploy_gas_used     : 0,
            constract_deploy_gas_price    : 0,
            contract_deployer_address     : userID ?? "",            

            is_paused: true,
            is_general_sale: false,            

            timeStampDropDate: force_to_num(drop_timestamp,0) ?? 0,
            timeStampDropDatePP: ppSwiftTime( force_to_num(drop_timestamp,0) ) ?? "",
        });

        blob['collection_id'] = blob.ID;

        let did = await write_to_db({
            ID  : blob.ID,
            path: DbPaths.social_chain_drop_root,
            blob: blob,
        });                

        res['success'] = did;
        res['message'] = did ? "saved!" : "failed to save";
        res['data']    = blob;
        return res;
    }

}



/**
 * 
 * @use: edit collection about
 * 
 **/
async function edit_social_chain_drop_root({ 
    collection_id, 
    userID, 
    about, 
    num_frees, 
    drop_timestamp, 
    is_paused,
    is_general_sale,
    num_editions,
    price_in_eth,
    price_in_cents,
    presale_price_in_cents,
    image_url 
}){

    var res = default_fn_response({ data: {} });

    let { data }  = await get_contract_for_burn({ collection_id: collection_id ?? "" });
    let contract  = trivialProps(data,'length') ? {} : data[0];

    if ( trivialProps(contract,'ID') ){
        res['message'] = 'contract not found'
        return res;
    }

    if ( contract.userID !== userID ){
        res['message'] = 'only contract owner can change the contract';
        return res;
    }

    var update = {};
    if ( !trivialString(about) ){
        update['about'] = about ?? ""
    } 
    if ( !trivialString(image_url) ){
        update["image_url"] = image_url;
    }
    if ( !trivialNum(num_frees) || num_frees === 0 ){
        update['num_frees'] = force_to_num(num_frees,0) ?? 0;
    }
    if ( !trivialNum(drop_timestamp) ){
        update["timeStampDropDate"] = force_to_num(drop_timestamp,0) ?? 0;
        update["timeStampDropDatePP"] = ppSwiftTime(force_to_num(drop_timestamp,0)) ?? ""
    }
    if ( !illValued(is_paused) && ((is_paused === 'true' || is_paused === 'false') || typeof is_paused === 'boolean') ){
        update['is_paused'] = str_to_boolean(is_paused)
    }
    if ( !illValued(is_general_sale) && ((is_general_sale === 'true' || is_general_sale === 'false') || typeof is_general_sale === 'boolean' ) ){
        update['is_general_sale'] = str_to_boolean(is_general_sale)
    }

    if ( !trivialNum(num_editions) && num_editions !== 0 ){
        update['num_editions'] = force_to_num(num_editions,1);
    }
    if ( !trivialNum(price_in_eth) && price_in_eth !== 0 ){
        update['price_in_eth'] = force_to_num(price_in_eth,0.01)
    }
    if ( !trivialNum(price_in_cents) && price_in_cents !== 0 ){
        update['price_in_cents'] = force_to_num(price_in_cents,1)
    }
    if ( !trivialNum(presale_price_in_cents) && presale_price_in_cents !== 0 ){
        update['presale_price_in_cents'] = force_to_num(presale_price_in_cents,75);
    }

    await update_db({
        ID  : contract.ID,
        path: DbPaths.social_chain_drop_root,
        blob: update,
    })

    res['success'] = true;
    res['data'] = update;
    res['message'] = 'updated';
    return res;
}


/**
 * 
 * @use: select contract kind for deployment
 * 
 **/
function select_contract_kind({ collection_id }){

    var contract_kind = ''
    let current_network = current_eth_network();

    if ( current_network === Networks.mainnet ){
        if (collection_id === "d29b807f-037f-481b-81b8-b8529afe3e0a"){
            contract_kind = ContractKind.ERC1155_0x01_v1;
        } else {
            contract_kind = ContractKind.ERC721SplitterProxy;
        }
    } else {
        contract_kind = ContractKind.ERC721SplitterProxy;
    }    

    return contract_kind;
}


/******************************************************/
// @deploy
/******************************************************/


/**
 * @Use: check if a contract is deployed for this burn
 **/
async function can_connect_to_deployed_contract({ chain_id, userID }){

    let contract_kind = select_contract_kind({ collection_id: "", });

    var res = default_fn_response({ has_contracts: false, collection: {} });

    if ( trivialString(chain_id) || trivialString(userID) ){
        res['message'] = 'no inputs';
        return res;
    }

    let { root } = await fetch_chain({ chain_id: chain_id ?? "", full: false });
    let contract_abi = await get_contract_abi({ contract_kind: contract_kind });

    if ( trivialProps(root, 'chain_id') ){

        res['message'] = 'burn not found';
        return res;

    } else if ( root.userID !== userID ){

        res['message'] = 'only burn owner can deploy contract';
        return res;

    } else if ( valid_contract_kind(contract_kind) === false ){ 

        res['message'] = `the contract you want to deploy is not valid, you specified ${contract_kind}`;
        return res;

    } else if ( trivialProps(contract_abi, 'data') || trivialProps(contract_abi.data, 'length') || contract_abi.data.length === 0 ){

        res['message'] = `you asked for ${contract_kind}, but we do not service this contract for now!`
        return res;

    } else {

        // let proj_contracts  = await get_contract_for_burn({ collection_id });
        let _collections = (await fetch_many({ 
            path: DbPaths.social_chain_drop_root, 
            field: "chain_id",
            value: chain_id ?? "",
        })) ?? [];

        let collections = _collections.filter(col => {
            return !trivialString(col.contract_address); 
        })

        res['success'] = true;
        if ( collections.length === 0 ){
            res['message'] = 'no contractfound'
            return res;
        } else {
            res['collection'] = collections[0];
            res['has_contracts'] = true;
            res['message'] = 'found contracts';
            return res;
        }
    }
}



/**
 * @use: connect new collection w/ old contract
 * 
 **/
async function connect_collection_with_contract({ chain_id, userID, collection_id, connect_collection_id }){

    let contract_kind = select_contract_kind({ collection_id: "" });
    var res = default_fn_response({ has_contracts: false, did_connect: false });

    if ( trivialString(chain_id) || trivialString(userID) ||trivialString(connect_collection_id) ){
        res['message'] = 'no inputs';
        return res;
    }

    let proj_contracts      = await get_contract_for_burn({ collection_id: connect_collection_id });
    let deployed_contracts  = trivialProps(proj_contracts,'data') ? [] : proj_contracts.data;
    let did_deploy_contract = deployed_contracts.filter(c => c['contract_kind'] === contract_kind);
    let _deployed_contract  = did_deploy_contract.length > 0 ? did_deploy_contract[0] : {};

    let contract_address        = _deployed_contract['contract_address'] ?? "";
    let contract_deploy_tx_hash = _deployed_contract['contract_deploy_tx_hash'] ??  "";

    let existing_col = await fetch_one({ path: DbPaths.social_chain_drop_root, field: "collection_id", value: collection_id })

    if ( trivialString(contract_address) ){

        res['success'] = false;
        res['message'] = `No contract has been deployed from connected collection`
        return res;

    } else if ( trivialString(existing_col.ID) ){

        res['message'] = `the collection you're trying to connect dne`;
        return res;

    } else if ( existing_col.userID !== _deployed_contract.userID || existing_col.chain_id !== _deployed_contract.chain_id ){

        res['message'] = `Only contracts deployed from the same host can be shared`;
        return res;

    } else {

        var contract_blob = {
            contract_kind: contract_kind ?? "",
            contract_abi_id: contract_kind,
            deployed_metamask_address: _deployed_contract.deployed_metamask_address ?? "",
            contract_address  : contract_address,   
            contract_deployed: true,
            contract_deploy_timeStampStart: _deployed_contract.contract_deploy_timeStampStart,
            contract_deploy_timeStampEnd  : _deployed_contract.contract_deploy_timeStampEnd,
            contract_deploy_tx_hash       : _deployed_contract.contract_deploy_tx_hash,
            witness_pk                    : _deployed_contract.witness_pk,
            contract_deployer_address     : userID ?? "",
        };

        let did = await update_db({
            ID  : collection_id,
            path: DbPaths.social_chain_drop_root, //social_chain_eth_contract,
            blob: contract_blob,
        });          

        res['success'] = did;
        res['message'] = 'connected';
        res['has_contracts'] = true;
        res['did_connect'] = did;
        return res;

    }


}

/**
 * @use: call this fn before contract deployment,
 *       if cannot deploy, then fail
 **/
async function before_deploy_contract_to_project({ chain_id, collection_id, userID }){

    let contract_kind = select_contract_kind({ collection_id: "" });

    var res = default_fn_response({
        can_deloy: false,
        contract: {},
        contract_kind: contract_kind,
        witness_pk: "",
    });

    if ( trivialString(chain_id) || trivialString(collection_id) || trivialString(userID) ){
        res['message'] = 'ill valued inputs';
        return res;
    }

    let { root } = await fetch_chain({ chain_id: chain_id ?? "", full: false });
    let contract_abi = await get_contract_abi({ contract_kind: contract_kind });

    if ( trivialProps(root, 'chain_id') ){

        res['message'] = 'burn not found';
        return res;

    } else if ( root.userID !== userID ){

        res['message'] = 'only burn owner can deploy contract';
        return res;

    } else if ( valid_contract_kind(contract_kind) === false ){ 

        res['message'] = `the contract you want to deploy is not valid, you specified ${contract_kind}`;
        return res;

    } else if ( trivialProps(contract_abi, 'data') || trivialProps(contract_abi.data, 'length') || contract_abi.data.length === 0 ){

        res['message'] = `you asked for ${contract_kind}, but we do not service this contract for now!`
        return res;

    } else {

        let proj_contracts      = await get_contract_for_burn({ collection_id });
        let deployed_contracts  = trivialProps(proj_contracts,'data') ? [] : proj_contracts.data;
        let did_deploy_contract = deployed_contracts.filter(c => c['contract_kind'] === contract_kind);
        let _deployed_contract  = did_deploy_contract.length > 0 ? did_deploy_contract[0] : {};

        let contract_address        = _deployed_contract['contract_address'] ?? "";
        let contract_deploy_tx_hash = _deployed_contract['contract_deploy_tx_hash'] ??  "";

        if ( !trivialString(contract_address) || !trivialString(contract_deploy_tx_hash) ){

            res['success'] = false;
            res['message'] = `contract already deployed to ${contract_address}, with hash: ${contract_deploy_tx_hash}`
            return res;

        } else {

            let contract_data_item = contract_abi.data[0];
            res['success']       = true;
            res['message']       = 'can deploy contract'
            res['can_deploy']    = true;
            res['contract_kind'] = contract_kind;
            res['contract']      = contract_data_item;
            res['witness_pk']    = chain_id;
            res['erc721_address'] = current_eth_network() === Networks.mainnet 
                ? ContractKind.ERC721LumoV2_address_mainnet  
                : ContractKind.ERC721LumoV2_address_goerli;
            res['paymentSplitter_address'] = current_eth_network() === Networks.mainnet 
                ? ContractKind.paymentSplitterV2_address_mainnet  
                : ContractKind.paymentSplitterV2_address_goerli;

            return res;
        }

    }    
}



/**
 * 
 * @Use: when contract has been deployed client side, save on server
 * 
 **/
async function did_deploy_contract_to_project({ chain_id, collection_id, contract_kind, metamask_address, userID, hash }){

    var res = default_fn_response();

    if ( trivialString(contract_kind) || trivialString(chain_id) || trivialString(userID) || trivialString(collection_id) ){
        res['message'] = 'ill valued inputs';
        return res;
    }

    if ( trivialString(hash) ){
        res['message'] = 'no hash specified';
        return res;
    }

    var contract_blob = {
        contract_kind: contract_kind ?? "",

        // every contract gets a unique abi because its
        // contractURI() method is different
        contract_abi_id: contract_kind,
        deployed_metamask_address: metamask_address ?? "",

        contract_address  : "",   
        contract_deployed: true,
        contract_deploy_timeStampStart: swiftNow(),
        contract_deploy_timeStampEnd  : 0,
        contract_deploy_tx_hash       : hash ?? "",            
        witness_pk: chain_id,
        contract_deployer_address     : userID ?? "",

    };

    // contract_blob['ID'] = id;

    let did = await update_db({
        ID  : collection_id,
        path: DbPaths.social_chain_drop_root, //social_chain_eth_contract,
        blob: contract_blob,
    });                

    res['success'] = did;
    res['message'] = did ? 'updated' : 'failed to log to db';
    res['data'] = contract_blob;
    return res;    
}


/**
 * 
 * @Use: when contract has been deployed client side, save on server with contract address;
 * 
 **/
async function did_finish_deploy_contract_to_project({ collection_id, userID, contract_address }){

    var res = default_fn_response();

    if ( trivialString(contract_address) || trivialString(userID) || trivialString(collection_id) ){
        res['message'] = 'ill valued inputs';
        return res;
    }

    var contract_blob = {
        contract_address: contract_address,
        contract_deploy_timeStampEnd: swiftNow(),
    };

    let did = await update_db({
        ID  : collection_id,
        path: DbPaths.social_chain_drop_root, //social_chain_eth_contract,
        blob: contract_blob,
    });                

    res['success'] = did;
    res['message'] = did ? 'updated' : 'failed to log to db';
    res['data'] = contract_blob;
    return res;    
}




/******************************************************/
// @mint
/******************************************************/

/**
 * 
 * @use: fetch all toks for collection-id
 * 
 **/
async function fetch_all_tokens({  collection_id, chain_id }){

    var res = default_fn_response({ data: [], toks: [] });

    var minted = []
    if ( !trivialString(collection_id) ){
        minted = (await fetch_many({ 
            path: DbPaths.social_chain_eth_metadata, 
            field: "collection_id",
            value: collection_id ?? "" 
        })) ?? [];
    } else if ( !trivialString(chain_id) ){
        minted = (await fetch_many({ 
            path: DbPaths.social_chain_eth_metadata, 
            field: "chain_id",
            value: chain_id ?? "" 
        })) ?? [];        
    } else {
        minted = [];
    }
    res['success'] = true;
    res['message'] = `found ${minted.length} items;`    
    res['data'] = minted;
    res['toks'] = minted;
    return res;
}


async function fetch_all_tokens_by({ userID, chain_id }){

    var res = default_fn_response({ data: [], toks: [] });

    var minted = (await fetch_many({ 
        path: DbPaths.social_chain_eth_metadata, 
        field: "userID",
        value: userID ?? "" 
    })) ?? [];

    if ( !trivialString(chain_id) ){
        minted = minted
        .filter(m => {
            return m.chain_id === chain_id;
        })
    }

    res['success'] = true;
    res['message'] = `found ${minted.length} items;`
    res['data'] = minted;
    res['toks'] = minted;
    return res;    
}



/**
 * @use: check nft can be minted form this collection
 * 
 **/
async function can_mint_nft({ collection_id }){

    let contract_kind = select_contract_kind({ collection_id });
    let contract_abi = await get_contract_abi({ contract_kind: contract_kind });

    var res = default_fn_response({ 
        contract: {},
        contract_kind: contract_kind,
        can_mint: false,
        num_minted: 0,
        tok_id: '',
    });

    if ( trivialString(collection_id) ){
        res['message'] = 'ill valued inputs';
        return res;
    }

    if ( trivialProps(contract_abi.data,'length') || contract_abi.data.length === 0 ){
        res['message'] = 'no contract abi found';
        return res;
    }

    var proj_contracts = await get_contract_for_burn({ collection_id });
    proj_contracts = (proj_contracts.data ?? []).filter(x => {
        return !trivialProps(x,'contract_address') && !trivialString(x.contract_address);
    })

    if ( trivialProps(proj_contracts, 'length') || proj_contracts.length === 0 ){
        res['message'] = 'no contracts deployed for this collection';
        return res;
    }

    let _proj_contract = proj_contracts[0];

    if ( trivialProps(_proj_contract,'ID') || trivialString(_proj_contract.contract_address) ){
        res['message'] = 'contract has not been deployed yet.';
        return res;
    }

    // @todo: check the # of editions is < # of minted (pre-mint + minted)
    let minted = (await fetch_many({ 
        path: DbPaths.social_chain_eth_metadata, 
        field: "collection_id",
        value: collection_id ?? "" 
    })) ?? [];

    res['num_minted'] = minted.length;

    if ( minted.length >= _proj_contract.num_editions && _proj_contract.num_editions > 0 ){
        res['can_mint'] = false;
        res['message']  = 'all items in this collection has been sold!';
        return res;
    }

    var tok_id = `${minted.length + 1}`;

    if ( trivialString(tok_id) || tok_id === '0' ){
        tok_id = generate_tok_id();
    }


    res['success']       = true;
    res['can_mint']      = true;
    res['message']       = 'can mint'
    res['contract_kind'] = contract_kind;
    res['contract']      = contract_abi.data[0];
    res['collection']    = _proj_contract;
    res['num_minted']    = minted.length;
    res['tok_id']        = tok_id;

    return res;
}




/**
 * 
 * @use: on mint fn ran, save here
 * 
 **/
async function did_mint_nft({ 
    tok_id,
    collection_id, 
    userID, 
    payment_hash,
    paymentId, 
    hash, 
    pk, 
    chain_id,
    chainId,
    mint_state 
}){

    var res = default_fn_response({ data: {} });

    if ( [tok_id, collection_id ].map(trivialString).includes(true) ){
        res['message'] = 'no collection_id specified'
        return res;
    }

    let { data }      = await get_contract_for_burn({ collection_id: collection_id ?? "" });
    let _deployed_contract  = trivialProps(data,'length') ? {} : data[0];

    var base_blob = {};

    if ( !trivialProps(_deployed_contract,'ID') ){
        base_blob["chain_id"] = _deployed_contract.chain_id ?? "";
        base_blob["contract_address"] = _deployed_contract.contract_address ?? "";
        base_blob["contract_deployer_address"] = _deployed_contract.contract_deployer_address ?? "";
        base_blob["image_url"] = _deployed_contract.image_url ?? "";
        base_blob["title"] = _deployed_contract.title ?? "";
        base_blob["token_sym"] = _deployed_contract.token_sym ?? "";
        base_blob["contract_deployer_userID"] = _deployed_contract.userID ?? "";

        base_blob["price_in_eth"] = _deployed_contract.price_in_eth ?? 0;
        base_blob["presale_price_in_cents"] = _deployed_contract.presale_price_in_cents ?? 0;
        base_blob["price_in_cents"] = _deployed_contract.price_in_cents ?? 0;

        let url = _deployed_contract["image_url"] ?? ""
        base_blob['name'] = _deployed_contract.title ?? "";
        base_blob["image_url"] = url;
        base_blob["description"] = _deployed_contract["about"] ?? ""

        base_blob["image"] = url
        base_blob["image_url"] = url
        base_blob["image_preview_url"] = url
        base_blob["image_original_url"] = url
        base_blob["image_thumbnail_url"] = url

    }

    let _id = `${collection_id ?? ""}_${tok_id}_${uuid.v4()}`;
    var blob = default_db_blob({

        ...(base_blob ?? {}),

        id: tok_id,
        tok_id         : tok_id,
        collection_id  : collection_id ?? "", 
        eth_chain_id   : chainId ?? "",
        social_chain_id: chain_id ?? "",

        userID                : userID ?? "",
        buyer_metamask_address: pk ?? "",

        mint_hash   : hash ?? "",
        payment_hash: payment_hash ?? "",
        paymentId   : paymentId ?? "",
        mint_state  : trivialString(mint_state) ? ItemMintState.in_flight : String(mint_state),

        qr_code_seed: "",
        num_qr_scans: 0,
    });
    blob['ID'] = _id;

    let did = await write_to_db({
        ID  : blob.ID,
        path: DbPaths.social_chain_eth_metadata,
        blob: blob,
    });             

    // add user as member;
    let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });
    if ( !trivialProps(user,'userID') ){
        await submit_block_item({
            userID, 
            chain_id: chain_id,
            nomination_id: "",
            title: user.name ?? ( user.twitterUserName ?? ""),
            about: user.about ?? "",
            image_url: user.profile_image ?? "",
            image_preview_url: user.profile_image ?? "",
            perm: MemberPermission.t2,
        });   
    }


    res['success'] = did;
    res['message'] = did ? "saved!" : "failed to save";
    res['data']    = blob;
    return res;
}



/***
 * 
 * @use: buy nft off chain using credit card, put item in pre-mint state
 * 
 **/
async function buy_nft_offchain({ collection_id, tokenId, userID, is_presale, then }){

    let _is_presale = str_to_boolean(is_presale);

    let contract_kind = select_contract_kind({ collection_id });
    let contract_abi = await get_contract_abi({ contract_kind: contract_kind });

    var res = default_fn_response({ 
        contract: {},
        contract_kind: contract_kind,
        paymentId: "",
        tok_id: "",        
        no_payment: false,
        num_minted: 0,
    });

    if ( trivialString(collection_id) || trivialString(userID) ){
        res['message'] = 'ill valued inputs';
        return then(res);
    }

    if ( (trivialProps(contract_abi.data,'length') || contract_abi.data.length === 0) && !_is_presale ){
        res['message'] = 'no contract abi found';
        return then(res);
    }

    var proj_contracts = await get_contract_for_burn({ collection_id });
    proj_contracts = (proj_contracts.data ?? [])
        .filter(x => {
            if ( _is_presale ){
                return true;
            } else {
                return !trivialProps(x,'contract_address') && !trivialString(x.contract_address);
            }
    })

    let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });


    if ( trivialProps(user,'userID') ){
        res['message'] = 'user dne';
        return then(res);
    }

    if ( trivialProps(proj_contracts, 'length') || proj_contracts.length === 0 ){
        res['message'] = 'no contracts deployed for this collection';
        return then(res);
    }

    let contract = proj_contracts[0];

    if ( trivialProps(contract,'ID') || (trivialString(contract.contract_address) && !_is_presale) ){
        res['message'] = 'contract has not been deployed yet.';
        return then(res);
    }

    if (contract.is_paused && !_is_presale){
        res['message'] = 'minting is paused right now';
        return then(res);
    }

    if ( contract.is_general_sale === false && !_is_presale ){
        res['message'] = 'general sale is not open yet';
        return then(res);
    }

    if ( trivialProps(contract,'price_in_cents') || trivialNum(contract.price_in_cents) ){
        res['message'] = 'the seller did not specify a price';
        return then(res);
    }

    let minted = (await fetch_many({ 
        path: DbPaths.social_chain_eth_metadata, 
        field: "collection_id",
        value: collection_id ?? "" 
    })) ?? [];

    if ( minted.length >= contract.num_editions && contract.num_editions > 0 ){
        res['message']  = 'all items in this collection has been sold!';
        return then(res);
    }


    if ( _is_presale && (minted.length > contract.num_editions_presale) ){
        res['message']  = 'all presale allocation has been filled!'
        return then(res);
    }


    let tok_id = generate_tok_id();
    // if ( (!trivialString(tokenId) && tokenId !== "" ) || (!trivialNum(tokenId) && tokenId !== 0 ) ){
    //     tok_id = `${tokenId}`
    // } else if ( _is_presale ){
    //     tok_id = `${minted.length + 1}`;
    // }

    // if ( trivialString(tok_id) || tok_id === '0' ){
    //     tok_id = generate_tok_id();
    // }


    let charge_in_cents_pre = force_to_num(contract.presale_price_in_cents,1);
    let charge_in_cents_gen = force_to_num(contract.price_in_cents,1);
    let charge_in_cents = charge_in_cents_pre ?? (charge_in_cents_gen ?? 1);

    // charge user
    await charge_customer_and_confirm_charge({ 
        userID, 
        vendorID: "", 
        chargeID: tok_id,
        amt: charge_in_cents,
        then: async ({ success, message, no_payment, paymentId }) => {

            res['no_payment'] = no_payment;

            if ( !success || trivialString(paymentId) ){
                res['no_payment'] = no_payment;
                res['message'] = message;
                return then(res)
            }

            // create token.
            await did_mint_nft({ 
                tok_id,
                collection_id, 
                userID, 
                paymentId: paymentId, 
                hash: "",
                payment_hash: "",
                pk: user.custodial_ethereum_address ?? "", 
                chain_id: contract.chain_id ?? "" , 
                chainId: current_eth_network() ?? "", 
                mint_state: ItemMintState.fiat_purchased_await_mint ?? "",
            })

            // create payout split
            await satisify_all_liquidity_provisions_for_NFT_sales({
                chain_id: contract.chain_id ?? "" , 
                collection_id,
                tok_id,
                buyer_userID: userID,
                seller_userID: contract.userID,
                paymentId,
                userID,
                charge_in_cents,
            });

            // add user as member;
            if ( !trivialProps(user,'userID') ){
                await submit_block_item({
                    userID, 
                    chain_id: contract.chain_id ?? "" , 
                    nomination_id: "",
                    title: user.name ?? ( user.twitterUserName ?? ""),
                    about: user.about ?? "",
                    image_url: user.profile_image ?? "",
                    image_preview_url: user.profile_image ?? "",
                    perm: MemberPermission.t2,
                });   
            }            

            // exit mint/
            res['tok_id'] = tok_id;
            res['no_payment'] = no_payment;
            res['paymentId'] = paymentId;
            res['success'] = success ? true : false;
            res['message'] = success ? message : "charged but failed to mint";
            return then(res);                                                

        }});    
}

/******************************************************/
// @read tok + qr code
/******************************************************/



/**
 * @Use: craete token qr code
 * 
 **/
async function gen_token_qr_code_seed({ userID, tok_id, collection_id }){

    var res = default_fn_response({ seed: "" });

    if ( [userID,tok_id,collection_id].map(trivialString).includes(true) ){
        res['message'] = 'ill valued inputs';
        return res;
    }

    let user = await getUserByVendorID({ userID: userID, vendorID: "", withPrivateKey: false });
    let tok  = await fetch_one_2({
        field1: 'tok_id',
        value1: tok_id ?? "",
        field2: 'collection_id',
        value2:  collection_id ??"",
        path: DbPaths.social_chain_eth_metadata,
    });

    if ( trivialProps(user,'userID') ){
        res['message'] = 'cannot submit item: user does not exist'
        return res;
    }   

    if ( trivialProps(tok,'ID') ){
        res['message'] = 'token dne';
        return res;
    }

    const { ID, buyer_metamask_address } = tok;
    const { custodial_ethereum_address } = user;
    let seed = `${tok_id}_${collection_id}_${ buyer_metamask_address ?? (custodial_ethereum_address ?? "") }_${swiftNow()}`
    await update_db({
        ID: ID,
        path: DbPaths.social_chain_eth_metadata,
        blob: { qr_code_seed: seed }
    });

    res['success'] = true;
    res['message'] = 'created seed';
    res['seed']    = seed;
    return res;
}


// @use: read token based on qr code
async function read_token_qr_code({ seed }){

    var res = default_fn_response({ exists: false, tok: {} });

    if ( trivialString(seed) ){
        return res;
    }

    let tok = await fetch_one({ path: DbPaths.social_chain_eth_metadata, field: "qr_code_seed", value: seed })

    if ( !trivialProps(tok,'ID') ){
        await update_db({
            ID: tok.ID,
            path: DbPaths.social_chain_eth_metadata,
            blob: { qr_code_seed: "_", num_qr_scans: force_to_num(tok.num_qr_scans,0) + 1 }
        });

        res['message'] = 'confirmed!'
        res['tok']     = tok;
        res['exists']  = true
        res['success'] = true;
        return res;

    } else {
        res['message'] = 'this code has expired'
        return res;
    }
}



/** 
 * 
 * @Use: fetch token based onsymbold and tokid
 *
 **/
async function token_uri({ symbol, tokenId }){
    let item  = await fetch_one({ path: DbPaths.social_chain_eth_metadata, field: 'tok_id' , value: `${tokenId}` });
    return item ?? {};
}


/******************************************************/
// @export
/******************************************************/

// get contract
exports.get_erc721LumoV2 = get_erc721LumoV2;
exports.get_PaymetSplitterV2 = get_PaymetSplitterV2;
exports.get_ERC721SplitterProxy = get_ERC721SplitterProxy;

// deploy lifecycle
exports.get_contract_for_burn = get_contract_for_burn;
exports.get_all_contracts_for_burn = get_all_contracts_for_burn;

exports.write_social_chain_drop_root  = write_social_chain_drop_root
exports.edit_social_chain_drop_root   = edit_social_chain_drop_root;

exports.can_connect_to_deployed_contract  = can_connect_to_deployed_contract;
exports.connect_collection_with_contract  = connect_collection_with_contract;
exports.before_deploy_contract_to_project = before_deploy_contract_to_project
exports.did_deploy_contract_to_project    = did_deploy_contract_to_project;
exports.did_finish_deploy_contract_to_project  = did_finish_deploy_contract_to_project;

// mint lifecycle
exports.can_mint_nft = can_mint_nft;
exports.did_mint_nft = did_mint_nft;
exports.buy_nft_offchain = buy_nft_offchain;
exports.fetch_all_tokens = fetch_all_tokens;
exports.fetch_all_tokens_by = fetch_all_tokens_by

// scan
exports.gen_token_qr_code_seed = gen_token_qr_code_seed;
exports.read_token_qr_code     = read_token_qr_code;

// api
exports.token_uri = token_uri;



































