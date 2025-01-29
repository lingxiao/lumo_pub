/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: contracts module
 * @Date   : 6/16/2022
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
const fire  = require('./../fire')
const functions = require('firebase-functions');

const uuid = require('uuid');

const { 
    swiftNow, 
    illValued, 
    trivialProps, 
    trivialNum, 
    trivialString,
    ppSwiftTime,
} = require('./../utils');


const {
    DbPaths, 
    default_fn_response,
    alchemyWeb3Instance,
    Networks,
    current_eth_network,
    ContractKind,
    ContractAddress,
    default_db_blob,
    make_production_web3_account,    
} = require('./../core');




/******************************************************
    @pre-contract-deploy lifecycle + read
******************************************************/


// _admin_move_contract_abi_to_server();

/**
 * 
 * @use: ad-hoc admin fn to move contract-abi to server 
 *   1. go to `../../lumo721/scripts/compile` and run `npx hardhat run scripts/deploy.js`
 *       to compile the contract
 *   2. import the contract from ie: `../../lumo721/artifacts/contracts/ERC721_rinkeby_v1.sol/ERC721_rinkeby_v1.json`;
 *   3. writ to server at correct key value
 * 
 **/
async function _admin_move_contract_abi_to_server(){

    // await mv_lumo_tok();
    // await mv_lumo_staking_pool();
    // return { success: succ, message: succ ? `moved contract` : 'no contract specified', data: {} };

    // move parc token contract to server
    // async function mv_lumo_tok(){
    //     let id = 'LumoToken'
    //     let contract_path = `../../ethcontracts/artifacts/contracts/project/${id}.sol/${id}.json`;
    //     console.log(id,'<-------', current_eth_network())
    //     return await _mirror_contract_to_server({ id: id, path: contract_path })        
    // }

    // async function mv_lumo_staking_pool(){
    //     let id = 'LumoStakingPool'
    //     let contract_path = `../../ethcontracts/artifacts/contracts/project/${id}.sol/${id}.json`;
    //     console.log(id,'<-------', current_eth_network())
    //     return await _mirror_contract_to_server({ id: id, path: contract_path })        
    // }

    // move erc721splitter + proxy;
    // await move_erc721_and_splitter();
    async function move_erc721_and_splitter(){
        console.log('deploy:', current_eth_network(), Networks.mainnet)
        let idsplitter = 'PaymentSplitterV2'
        let iderc721   = "ERC721LumoV2"
        let id_proxy   = 'ERC721SplitterProxy'
        let res1 = await _mirror_contract_to_server({
            id: id_proxy,
            path: `../../ethcontracts/artifacts/contracts/erc721/${id_proxy}.sol/${id_proxy}.json` 
        })
        let res2 = await _mirror_contract_to_server({ 
            id: idsplitter, 
            path: `../../ethcontracts/artifacts/contracts/erc721/${idsplitter}.sol/${idsplitter}.json` 
        })
        let res3 = await _mirror_contract_to_server({ 
            id: iderc721, 
            path: `../../ethcontracts/artifacts/contracts/erc721/${iderc721}.sol/${iderc721}.json` 
        })
        console.log("=-------------------------")
        console.log(res1, res2, res3);
        console.log("=-------------------------\n\n")
    }

    /*async function move_erc1155(){
        let id = 'ERC1155SupplySplitterAdjustable'
        let contract_path = `../../ethcontracts/artifacts/contracts/project/${id}.sol/${id}.json`;
        console.log(id,'<-------', current_eth_network(), Networks.mainnet)
        return await _mirror_contract_to_server({ id: id, path: contract_path })
    }*/
}


async function _mirror_contract_to_server({ id,path }){
    const contract_json = require(path);
    let _time = swiftNow();
    let pptime = ppSwiftTime(_time);
    var contract_blob = default_db_blob({
        ...contract_json,
        contract_kind: id,
    })
    contract_blob['ID'] = id;
    return await fire.firestore
        .collection(DbPaths.contract_abi)
        .doc( id )
        .set( contract_blob )
        .then(_ => true)
        .catch(e => false)  
}

/******************************************************
    @read contract
******************************************************/

/**
 * 
 *  @use: get contract abi from server
 * 
 **/
async function get_contract_abi({ contract_kind }){

    var res = default_fn_response();
    res['data'] = [];

    if ( trivialString(contract_kind) ){
        res['message'] = 'contract_kind unspecified'
        return res
    }

    const matches = await fire.firestore
        .collection(DbPaths.contract_abi)
        .where('contract_kind', '==', contract_kind)
        .get();

    var data  = [];        

    if (!matches.empty){
        matches.forEach(doc => {
            if ( !trivialProps(doc,'data') ){
                data.push(doc.data());
            }
        })
    }

    return { success: true, message: `found ${data.length} contracts`, data: data };    

}


/**
 * 
 * @use: read spliter contract
 * 
 **/
async function get_splitter_contract(){

    let splitter_abi = await get_contract_abi({ contract_kind: ContractKind.Splitter });
    let split_factory_abi = await get_contract_abi({ contract_kind: ContractKind.SplitFactory });

    var splitter_addr = '';
    var split_factory_addr = ''

    if ( current_eth_network() === Networks.mainnet ){
        splitter_addr = ContractAddress['mainnet'][ContractKind.Splitter]
        split_factory_addr = ContractAddress['mainnet'][ContractKind.SplitFactory]
    } else {
        splitter_addr = ContractAddress['rinkeby'][ContractKind.Splitter]
        split_factory_addr = ContractAddress['rinkeby'][ContractKind.SplitFactory]
    }

    var splitter = splitter_abi['data'].length > 0 ? splitter_abi['data'][0] : {}
    splitter['address'] = splitter_addr

    var split_factory = split_factory_abi['data'].length > 0 ? split_factory_abi['data'][0] : {}
    split_factory['address'] = split_factory_addr

    return { success: true, message: 'found contracts', splitter: splitter, split_factory: split_factory }

}



/******************************************************
    @export
******************************************************/

exports.get_contract_abi      = get_contract_abi
exports.get_splitter_contract = get_splitter_contract
exports._admin_move_contract_abi_to_server = _admin_move_contract_abi_to_server


