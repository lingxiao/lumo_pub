/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: storyboard web3-API
 * @Date   : June 4th, 2022
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
} = require('./accounts');

const {
    DbPaths, 
    default_fn_response,
    ItemMintState,
    alchemyWeb3Instance,
    valid_contract_kind,
    Networks,
    current_eth_network,
    ContractKind,
    CollectionKind,
} = require('./../core');


const {
    getProject,
    getStoryBoard,
    is_project_owner,
    getProjectContracts,
    getStoryboardItem,
} = require('./storyboardRead');

const {
    maybe_premint_ticket,
    removeStoryBoardItem,
} = require('./storyboardWrite')


const {
    get_contract_abi
} = require('./../eth/contracts');

/******************************************************
    @contract deploy lifecycle
******************************************************/


/**
 * 
 * @use: after project has been deployed, update contract here 
 * 
 **/
async function can_deploy_contract_to_project({ address, userID, }){

    var contract_kind = ''
    let current_network = current_eth_network();

    // select the right contract-kind given network
    if ( current_network === Networks.mainnet ){
        // contract_kind = ContractKind.ERC721_0x01_v1 
        contract_kind = ContractKind.ERC1155_0x01_v1;
    } else if ( current_network === Networks.rinkeby ){
        // contract_kind = ContractKind.ERC721_0x04_v1
        contract_kind = ContractKind.ERC1155_0x04_v1;
    } else {
        contract_kind = ''    
    }

    return await _can_deploy_this_contract_to_project({ address, contract_kind, userID });
}

/**
 * 
 * @Use: inner fn that work for arbirary contract-kind 
 * 
 **/
async function _can_deploy_this_contract_to_project({ address, contract_kind, userID, }){


    var res = default_fn_response({
        can_deloy: false,
        contract: {},
        contract_kind: contract_kind,
        witness_pk: "",
    });

    let { root } = await getProject({  address: address, full: false })
    let is_owner = await is_project_owner({ address: address, userID: userID });
    let contract_abi = await get_contract_abi({ contract_kind: contract_kind });

    if ( trivialProps(root, 'ID') || trivialProps(root,'ID') ){

        res['message'] = 'project not found'
        return res;

    } else if ( !is_owner ){

        res['message'] = 'only project owner can deploy contract'
        return res;

    } else if ( valid_contract_kind(contract_kind) === false ){

        res['message'] = `the contract you want to deploy is not valid, you specified ${contract_kind}`;
        return res;

    } else if ( trivialProps(contract_abi, 'data') || trivialProps(contract_abi.data, 'length') || contract_abi.data.length === 0 ){

        res['message'] = `you asked for ${contract_kind}, but we do not service this contract for now!`
        return res;

    } else {

        let proj_contracts      = await getProjectContracts({ project_address: address });
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
            res['success'] = true;
            res['message'] = 'can deploy contract'
            res['can_deploy'] = true;
            res['contract_kind'] = contract_kind
            res['contract'] = contract_data_item
            res['witness_pk'] = ContractKind.ERC1155_v1_witness;

            return res;

        }

    }
}


/**
 * 
 * @use: after project has been deployed, update contract here 
 * 
**/
async function did_deploy_contract_to_project({ address, contract_kind, userID, hash }){

    var res = default_fn_response();

    // update project deployment info
    let id = `${address ?? uuid.v4()}_${contract_kind ?? ""}`;

    let update = {
        ID: id,
        project_address: address ?? "",
        contract_kind: contract_kind ?? "",

        // every contract gets a unique abi because its
        // contractURI() method is different
        contract_abi_id: contract_kind,

        contract_address  : "",   
        contract_deployed: true,
        contract_deploy_timeStampStart: swiftNow(),
        contract_deploy_timeStampEnd  : 0,
        contract_deploy_tx_hash       : hash ?? "",            

        constract_deploy_gas_used     : 0,
        constract_deploy_gas_price    : 0,
        contract_deployer_address     : userID ?? "",

    }    

    let did = await fire.firestore
        .collection(DbPaths.project_contracts)
        .doc( id )
        .set( update )
        .then(_ => true)
        .catch(e => false)    

    res['success'] = did;
    res['message'] = did ? 'updated' : 'failed to log to db';
    res['data'] = update;
    return res;

}




/***
 * 
 * @use: monitor contract deployment, update project root
 *       with correct status if contract has been deployed
 * 
 **/
async function monitor_project_contract_deployed({ address, contract_kind }){

    var res = default_fn_response({ hash: "" })

    let { root } = await getProject({  address: address, full: false })

    let proj_contracts = await getProjectContracts({ project_address: address });

    let deployed_contracts  = trivialProps(proj_contracts,'data') ? [] : proj_contracts.data;
    let did_deploy_contract = deployed_contracts.filter(c => c['contract_kind'] === contract_kind);
    let _deployed_contract  = did_deploy_contract.length > 0 ? did_deploy_contract[0] : {};
    let contract_deploy_tx_hash = _deployed_contract['contract_deploy_tx_hash'] ??  "";

    if ( trivialProps(root, 'ID') ){

        res['message'] = 'project not found'
        return res;

    } else if ( trivialString(contract_deploy_tx_hash) ){

        res['message'] = 'cannot find tx hash for this deployment'
        res['data'] = _deployed_contract;
        return res;

    } else {

        let hash = contract_deploy_tx_hash ?? "";
        let web3 = alchemyWeb3Instance();

        try {

            const receipt = await web3.eth.getTransactionReceipt(hash);

            let id = `${address}_${contract_kind ?? ""}`
            let update = {
                contract_deployed: true,
                contract_address: receipt['contractAddress'] ?? "",   
                contract_deploy_timeStampEnd: swiftNow(),
                constract_deploy_gas_used   : receipt['cumulativeGasUsed'] ?? 0,
                constract_deploy_gas_price  : receipt['effectiveGasPrice'] ?? 0,
            }

            // udpate project root
            let did = await fire.firestore
                .collection(DbPaths.project_contracts)
                .doc( id )
                .update( update )
                .then(_ => true)
                .catch(e => false)                

            // log receipt
            await fire.firestore
                .collection(DbPaths.stories_contract_deploy_tx)
                .doc(hash)
                .set(receipt)
                .then(x => true)
                .catch(e => false)

            return did 
                ? { success: true, message: 'contract deployed and recorded', data: update }
                : { success: false, message: 'contract deployed but dn not updated', data: update };


        } catch (e) {

            res['message'] = `failed to locate transaction at ${hash} due to ${e}`
            return res;
        }

    }

}



/******************************************************
    @mint by eth lifcycle write
******************************************************/

/**
 * 
 * @use: check this storyboard item can be minted 
 *       if yes return with contract abi + bytecode
 *       to mint the item from
 * 
 **/
async function can_mint_storyboard_item({ itemID }){

    var res = default_fn_response({
        contract_deployed: false,
        minted  : false,
        contract: {},
        tok     : {},
        price   : 0,
    });

    // check if board item exists
    let { data } = await getStoryboardItem({ itemID: itemID });
    if (  trivialProps(data,'length') || data.length === 0 ){
        res['success'] = true;
        res['message'] = 'this item dne'
        return res;
    }


    const { address, mint_state, storyboardID } = data[0];
    let { tok } = await get_minted_tok({ tokID: "", itemID: itemID, transaction_hash: "" });

    // get storyboard to look up price
    let _board  = await getStoryBoard({ storyboardID: storyboardID, full: false });
    let board = trivialProps(_board,'data') ? {} : _board.data;

    if ( trivialProps(board, 'ID') ){
        res['success'] = false;
        res['message'] = 'we cannot locate a price for this item'
        return res;
    }

    let price = board.price_in_eth ?? 0;
    res['price'] = price;

    // check if there is a contract deployed for this project
    let proj_contracts = await getProjectContracts({ project_address: address });

    if ( trivialProps(proj_contracts,'data') || trivialProps(proj_contracts.data,'length') || proj_contracts.data.length === 0 ){
        res['price'] = price;
        res['success'] = true;
        res['contract_deployed'] = false;
        res['message'] = 'no contract deployed for this project'
        return res;
    }

    // get contract_abi
    let contract = proj_contracts.data[0];
    let contract_abi = await get_contract_abi({ contract_kind: contract['contract_kind'] ?? "" });

    if ( trivialProps(contract_abi,'data') || trivialProps(contract_abi.data,'length') || contract_abi.data.length === 0 ){
        res['price']   = price;
        res['success'] = true;
        res['contract_deployed'] = false;
        res['message'] = 'no contract deployed abi for this project'
        return res;
    }

    let abi = {
        ...contract,
        ...contract_abi.data[0],
    }

    // check if this token has been minted
    if ( !trivialProps(tok,'ID') ){
        res['price'] = price;
        res['success'] = true;
        res['minted']  = true;
        res['contract_deployed'] = true;
        res['contract'] = {};
        res['message'] = 'token has been minted'
        res['tok'] = tok;
        return res;
    } else {
        return { 
            success: true, 
            message: 'this item can be minted', 
            tok: {},
            contract: abi,
            minted: false, 
            price : price,
            contract_deployed: true, 
        }
    }
}

/**
 * 
 * @Use: before calling `mint` fn client side, call this first
 *       so the item is in the mint-queue
 * 
 **/
async function will_mint_item({ itemID, userID, contract_address, contract_kind, metadata }){

    var res = default_fn_response({ canMint: false, tok: {} });

    let { success, minted, contract_deployed, message } = await can_mint_storyboard_item({ itemID: itemID });

    if ( !success || minted || !contract_deployed ){
        res['canMint'] = false;
        res['message'] = message;
        return res;
    }

    let { tok } = await get_minted_tok({ itemID: itemID })

    if ( !trivialProps(tok,'ID')  ){
        res['canMint'] = false;
        res['message'] = `this token has already been minted or it is currently minting`;
        res['tok'] = tok
        return res;
    }

    let id = itemID;
    let premint_tok = {
        ...(metadata ?? {}),
        ID    : id,
        tok_id: '',
        txHash: '',
        itemID: itemID,
        userID: userID ?? "",
        state : ItemMintState.pre_flight,
        timeStampCreated: swiftNow(),
        timeStampLatest: swiftNow(),
        timeStampCreatedPP: ppSwiftTime(swiftNow()) ?? "",        
        contract_address: contract_address ?? "",
        contract_kind: contract_kind ?? "",
    }

    let did = await fire.firestore
        .collection(DbPaths.token_endpoints)
        .doc( id )
        .set( premint_tok )
        .then(_ => true)
        .catch(e => false)

    if ( !did ){
        res['canMint'] = true;
        res['message'] = `failed to push minting item into queue`
        return res;
    } else {
        res['canMint'] = true;
        res['success'] = true;
        res['message'] = 'can mint and did push mint item into queue';
        res['tok']     = premint_tok;
        return res;
    }
}


/**
 * 
 * @use: in the even twhere the user is charge but failed to mint, log 
 *       receipt for potential returns
 * 
 **/
async function did_charge_and_fail_to_mint({ project_address, storyboardID, itemID, userID, price, contract_address, charge_hash }){

    var res = default_fn_response({ data: {} });

    if ( trivialString(userID) || trivialString(project_address) ){
        res['message'] = 'please include userid and storyboardID';
        return res;
    }

    let id = uuid.v4();
    let blob = {
        ID              : id,
        userID          : userID ?? "",
        itemID          : itemID ?? "",
        storyboardID    : storyboardID ?? "",
        project_address : project_address ?? "",
        charge_hash     : charge_hash ?? "",
        contract_address: contract_address ?? "",
        price           : trivialNum(Number(price)) ? 0 : Number(price),
        timeStampLatest : swiftNow(),
        timeStampCreated: swiftNow(),
        timeStampCreatedPP: ppSwiftTime(swiftNow()) ?? "",        
    }

    let did = await fire.firestore
        .collection(DbPaths.charged_user_and_fail_mint)
        .doc( id )
        .set( blob )
        .then(_ => true)
        .catch(e => false)

    res['success'] = did;
    res['message'] = did ? "logged" : 'fail to log receipt';
    res['data'] = blob;
    return res;

}

/**
 * 
 * @use: if mint failed, then stop
 * 
 **/
async function did_fail_to_mint({ itemID }){

    var res = default_fn_response({ canMint: false, tok: {} });
    let { tok } = await get_minted_tok({ tokID: "", itemID: itemID, transaction_hash: "" });

    if ( tok.state === ItemMintState.pre_flight || tok.state === ItemMintState.not_minted  ){
        await fire.firestore.collection(DbPaths.token_endpoints).doc(itemID).delete();
        return { success: true, message: 'item deleted', data: {} }
    } else {
        res['canMint'] = false;
        res['message'] = `this token is currently in state: ${tok.state}`;
        res['tok'] = tok
        return res;        
    }

}


/**
 * 
 * @use: on did mint storybaord item, update storybaord item
 *       root data so its mint status can be fetched
 *       also update opensea compliant database item
 * 
 **/
async function did_mint_storyboard_item({ itemID, userID, transaction_hash, payment_tx_hash, contract_address, contract_kind }){

    var res = default_fn_response({ data: {} });

    let _item_meta_res = await _storyboardItem_to_opensea_metadata({ itemID: itemID });
    const { data } = _item_meta_res;

    // create opensea API endpoint 
    // data for minted token

    // @TODO: add extra field for .mp4
    
    let id = itemID;
    var updated = {
        ... data ?? {},
        txHash: transaction_hash,   // mint
        payment_tx_hash: payment_tx_hash ?? "", // accept payment
        state : ItemMintState.in_flight,
        timeStampLatest: swiftNow(),
    }

    if ( !trivialString(contract_address) ){
        updated['contract_address'] = contract_address;
    }

    if ( !trivialString(contract_kind) ){
        updated['contract_kind'] = contract_kind;
    }

    let did = await fire.firestore
        .collection(DbPaths.token_endpoints)
        .doc( id )
        .update( updated )
        .then(_ => true)
        .catch(e => false)

    // update original storyboard item
    let update_board_item  = {
        timeStampLatest  : swiftNow(),
        mint_timeStampEnd: swiftNow(),
        mint_state       : ItemMintState.minted,
        mint_tx_hash     : transaction_hash ?? "",
        mint_payment_hash: payment_tx_hash ?? "",
        minter_address   : userID ?? "",
    }
    await fire.firestore
        .collection(DbPaths.stories_board_items)
        .doc( itemID )
        .update(update_board_item )
        .then(_ => true)
        .catch(e => false)

    // add user as crew if the item's kind is membership;
    // note this is not needed as you can always get the token 
    // data

    return { success: true, message: 'updated token', data: updated }

}



/**
 * 
 * @use: monitor chain for minted storyboard item
 * 
 * 
 **/
async function monitor_minted_storyboard_item({ tok_id, transaction_hash }){

    var res = default_fn_response({ tokID: "", tok: {} })
    let web3 = alchemyWeb3Instance();

    try {

        const tx = await web3.eth.getTransactionReceipt(transaction_hash);

        if ( trivialProps(tx,'logs') || trivialProps(tx.logs,'length') || tx.logs.length === 0 ){
            res['message'] = `failed to locate transaction ${transaction_hash} on chain`
            return res;
        }

        // for 721 case
        if (  trivialString(tok_id) ){

            let logs = tx.logs;

            if ( trivialProps(logs[0],'topics') || logs[0].topics.length === 0 ){
                res['message'] = `failed to locate transaction ${transaction_hash} on chain`
                return res;
            }

            // should be: 1657870088
            // note for 721:   emit Transfer(address(0), to, tokenId);
            // note for 1155:  emit TransferSingle(operator, address(0), to, id, amount);
            try {

                let raw_id = logs[0].topics[3];
                let _tok_id = web3.utils.hexToNumber(raw_id)

                if ( typeof _tok_id !== 'number' ){
                    res['message'] = `we cannot convert tok id ${raw_id} to number`
                    return res;
                } else {
                    return await go_log(`${_tok_id}`, transaction_hash);
                }

            } catch (e){
                res['message'] = `failed to locate read emitted token id due to ${e}`
                return res;
            }

        // erc1155 case
        } else {

            return await go_log(tok_id, transaction_hash);

        }

        async function go_log(_token_id, transaction_hash){

            let { tok } = await get_minted_tok({ transaction_hash })

            var update_tok_item = {
                tok_id: `${_token_id}`,
                txHash: transaction_hash,
                state : ItemMintState.minted,
                timeStampLatest: swiftNow(),
                tx: tx ?? {},
            }

            // update token endpoint data
            let did = await fire.firestore
                .collection(DbPaths.token_endpoints)
                .doc( tok.ID )
                .update( update_tok_item )
                .then(_ => true)
                .catch(e => false)

            // log receipt
            await fire.firestore
                .collection(DbPaths.stories_mint_tx)
                .doc(transaction_hash)
                .set(tx)
                .then(_ => true)
                .catch(_ => false)


            if ( !did ){
                res['message'] = `failed to write update mint state to mint db`
                res['tokID'] = `${_token_id}`
                return res;
            } else {
                res['success'] = true;
                res['message'] = 'did update minting tok';
                res['tok']     = { ...tok, ...update_tok_item }
                res['tokID'] = `${_token_id}`
                return res;
            }

        }

    } catch (e) {

        res['message'] = `failed to locate transaction ${transaction_hash} due to ${e}`
        return res;
    }    

}
/**
 * 
 * @use: get all active mints and monitor them
 * 
 **/ 
async function monitor_all_minting_storyboard_item(){

    var toks = [];

    const query_root = fire.firestore
        .collection(DbPaths.token_endpoints)

    const matching_toks = await query_root
        .where('state', '==', ItemMintState.pre_flight)
        .get();

    const matching_toks_1 = await query_root    
        .where('state', '==', ItemMintState.in_flight)
        .get();

    if (!matching_toks.empty){
        matching_toks.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                toks.push(doc.data())
            }
        })
    }        
    if (!matching_toks_1.empty){
        matching_toks_1.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                toks.push(doc.data())
            }
        })
    }     

    let unresolved_toks = toks
        .filter(tok => ( trivialProps(tok,'tok_id') || trivialString(tok.tok_id)) && !trivialString(tok.txHash))    
        .map(tok => tok.txHash)

    const resolve_all_txs = await unresolved_toks
        .map( async (tx) => {
            await monitor_minted_storyboard_item({ transaction_hash: tx })
        })              
    await Promise.all(resolve_all_txs); 

    return { success: true, message: `monitored ${toks.length} items` }           

}

/******************************************************
    @mint token read
******************************************************/

/**
 * 
 * @use: get all minted tok owned by userID 
 * @Note: get user first from userID, if it's from 
 *        linked acct, then get all toks owned by 
 *        any of the linked uuids
 * 
 **/
async function get_all_minted_tok_owned_by({ userID }){

    var res = default_fn_response({ data: [] });
    if ( trivialString(userID) ){
        res['message'] = 'please specify userID'
        return res;
    }

    let user = await getUserByVendorID({ userID });

    if ( trivialProps( user, 'userID') ){
        res['message'] = 'no user found'
        return res;
    }

    const { metamask_ethereum_address, custodial_ethereum_address, firebase_user_token } = user;
    let uid = user.userID ?? "";
       
    // fetch for each possible user-id
    let toks_1 = await fetch(userID);
    let toks_2 = await fetch(uid);
    let toks_3 = await fetch(metamask_ethereum_address);
    let toks_4 = await fetch(custodial_ethereum_address);
    let toks_5 = await fetch(firebase_user_token);

    var _tokens = {};

    [toks_1,toks_2,toks_3,toks_4,toks_5].forEach(toks => {
        toks.forEach((tok) => {
            if ( !trivialProps(tok,'itemID') ){
                _tokens[tok.itemID] = tok;
            }
        })        
    })

    let tokens = Object.values(_tokens)


    // fetch at `userID` matching `val`
    async function fetch(val){
        if ( trivialString(val) ){
            return []
        } else {
            var toks = [];
            const _mtoks = await fire.firestore
                .collection(DbPaths.token_endpoints)
                .where('userID', '==', val)
                .get();
            if (!_mtoks.empty){
                _mtoks.forEach(doc => {
                    if ( !trivialProps(doc,'data') ){
                        toks.push(doc.data())
                    }
                })            
            }
            return toks;             
        }
    }



    res['success'] = true;
    res['message'] = `found ${tokens.length} toks`;
    res['data'] = tokens;
    return res;

}


/**
 * 
 * @use: get all minted tok from contract 
 * 
 **/
async function get_all_minted_tok({ contractAddress }){

    var res = default_fn_response({ data: [] });
    if ( trivialString(contractAddress) ){
        res['message'] = 'please specify contractAddress'
        return res;
    }

    var toks = [];

    const matching_toks = await fire.firestore
        .collection(DbPaths.token_endpoints)
        .where('contract_address', '==', contractAddress)
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




/**
 * 
 * @Use: get minted tok by either its on chain `contract-address`-tokID`
 *       or lumo specifice inventory `itemID`
 *       This is also used to serve opensea API
 * 
 * 
 **/ 
async function get_minted_tok({ contractAddress, tokID, itemID, transaction_hash }){

    var res = default_fn_response({ tok: {} })
    res['tok'] = {};

    let search_by_web3_id = !trivialString(tokID)
    let search_by_tx_hash = !trivialString(transaction_hash)

    if ( trivialString(itemID) && !search_by_tx_hash && !search_by_web3_id ){
        res['tok'] = {}
        res['message'] = `please specify tokID, transaction_hash, or itemID`
        return res;
    }

    try {

        var toks = [];
        var query = fire.firestore.collection(DbPaths.token_endpoints)

        if ( !trivialString(itemID) ){
            query = query.where('itemID', '==', itemID)
        } else if ( search_by_web3_id ){
            query = query
                .where('tok_id', '==', `${tokID}`)
        } else if ( search_by_tx_hash ){
            query = query.where("txHash", '==', transaction_hash)
        }

        const matching_toks = await query.get();

        if (!matching_toks.empty){
            matching_toks.forEach(doc => {
                if ( !trivialProps(doc,'data') ){
                    toks.push(doc.data())
                }
            })
        }        

        if ( toks.length === 0 ){
            res['tok'] = {}        
            res['success'] = true;
            res['message'] = 'no token found'
            return res;
        } else {
            res['success'] = true;
            res['message'] = 'found token'
            res['tok'] = toks[0];
            return res;             
        }

    } catch (e) {

        res['success'] = false;
        res['message'] = `Error: ${e.message}`
        res['tok'] = {}
        return res;            
    }

}



/**
 * 
 * @use: build opensea compliant item metadata from `itemID`
 * 
 **/ 
async function _storyboardItem_to_opensea_metadata({ itemID }){

    var res = default_fn_response({ data: {} });

    if ( trivialString(itemID) ){
        res['message'] = 'please specify userID or itemID'
        return res;
    }    

    let { data } = await getStoryboardItem({ itemID: itemID })

    if (  trivialProps(data,'length') || data.length === 0 ){
        res['message'] = 'item dne'
        return res;
    }

    let { image_url, text, projectID, address, } = data[0];

    let { root, story } = await getProject({  address: address, full: true });

    var name = `${root.name ?? ""} 1/1`

    const attributes = [];

    const meta = {
        name : name,
        image: image_url,
        image_url: image_url,
        image_preview_url: image_url,
        image_original_url: image_url,
        image_thumbnail_url: image_url,
        description: text ?? "", 
        attributes: attributes,
        itemID: itemID,
    }

    res['success'] = true;
    res['message'] = 'built metadata'
    res['data'] = meta;

    return res;

}


/******************************************************
    @payout splits
******************************************************/

/**
 * 
 * @Use: check there is a contract here that can payout splits 
 * 
 **/
async function can_payout_splits({ address }){

    var res = default_fn_response({ contract_deployed: false, contract: {}, witness_pk: "" });;

    let proj_contracts = await getProjectContracts({ project_address: address });
    if ( trivialProps(proj_contracts,'data') || trivialProps(proj_contracts.data,'length') || proj_contracts.data.length === 0 ){
        res['success'] = true;
        res['contract_deployed'] = false;
        res['message'] = 'no contract deployed for this project'
        return res;
    }

    // get contract_abi
    let contract = proj_contracts.data[0];
    let contract_abi = await get_contract_abi({ contract_kind: contract['contract_kind'] ?? "" });

    if ( trivialProps(contract_abi,'data') || trivialProps(contract_abi.data,'length') || contract_abi.data.length === 0 ){
        res['success'] = true;
        res['contract_deployed'] = false;
        res['message'] = 'no contract deployed abi for this project'
        return res;
    }

    let abi = {
        ...contract,
        ...contract_abi.data[0],        
    }

    res = { success: true, message: 'can payout', contract: abi, contract_deployed: true, witness_pk: ContractKind.ERC1155_v1_witness  };

    return res;
}

/**
 * 
 * @Use: after payout, record 
 * 
 **/
async function did_payout_splits({ address, userID, hash }){

    var res = default_fn_response();
    if ( trivialString(address) ){
        res['message'] = 'please specify project address'
        return res
    }

    if ( trivialString(hash) ){
        res['message'] = 'please specify hash'
        return res
    }

    let id = hash;
    let tx_data = {
        ID    : id,
        hash  : hash ?? "",
        userID: userID ?? "",
        timeStampCreated: swiftNow(),
        timeStampLatest : swiftNow(),
        timeStampCreatedPP: ppSwiftTime(swiftNow()) ?? "",        
        contract_address: address ?? "",
    }

    let did = await fire.firestore
        .collection(DbPaths.contract_payout_tx)
        .doc( id )
        .set( tx_data )
        .then(_ => true)
        .catch(e => false);

    return { success: true, message: 'logged', data: tx_data }
}


/******************************************************
    @export
******************************************************/

// read tok
exports.get_minted_tok = get_minted_tok;
exports.get_all_minted_tok = get_all_minted_tok;
exports.get_all_minted_tok_owned_by = get_all_minted_tok_owned_by;
    
// deploy
exports.can_deploy_contract_to_project = can_deploy_contract_to_project
exports.did_deploy_contract_to_project = did_deploy_contract_to_project
exports.monitor_project_contract_deployed = monitor_project_contract_deployed
    
// mint
exports.will_mint_item = will_mint_item;
exports.did_fail_to_mint = did_fail_to_mint;
exports.can_mint_storyboard_item = can_mint_storyboard_item
exports.did_mint_storyboard_item = did_mint_storyboard_item
exports.monitor_minted_storyboard_item = monitor_minted_storyboard_item;
exports.monitor_all_minting_storyboard_item  = monitor_all_minting_storyboard_item;

exports.did_charge_and_fail_to_mint = did_charge_and_fail_to_mint;

// payout
exports.did_payout_splits = did_payout_splits;
exports.can_payout_splits = can_payout_splits;


