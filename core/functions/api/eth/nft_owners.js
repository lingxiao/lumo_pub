/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: lumo_nfts.js serving lumo nft fns and nfts
 * @Date   : April 2nd, 2022
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
} = require('./../utils');


const {
    DbPaths, 
    Networks,
    default_fn_response,
    moralisInstance,
    network_flow_to_eth,
} = require('./../core');


/******************************************************
    @Lookup nft ownership
******************************************************/

/**
 * 
 * @use: migrate all nft owned by user to 
 * @Doc: https://docs.moralis.io/moralis-dapp/web3-sdk/token
 * @Doc: https://admin.moralis.io/web3Api
 * 
 **/ 
async function get_all_nft_owned_by_user({ pk }){

    var res = default_fn_response({ data: [] })
    
    if ( trivialString(pk) ){
        res['message'] = 'please specify user pk'
        return res;
    }

    var owned_nfts = [];    

    const matches = await fire.firestore
        .collection(DbPaths.nft_owners)
        .where('owner_of', '==', pk)
        .get();

    matches.forEach(doc => {
        if ( !trivialProps(doc,'data') ){
            owned_nfts.push(doc.data())
        }
    });

    res['success'] = `found ${owned_nfts.length} nfts`;
    res['data'] = owned_nfts;
    return res;
}


/**
 * 
 * @Use: white list contract address for synicng 
 * 
**/
async function white_list_contract_address({ contract_address, network_name, pages, total }){

    if ( trivialString(contract_address) ){
        return {}
    }

    // convert between moralis network name standard and lumo network name standard
    var moralis_network_name = ''
    if ( network_name === 'eth' || network_name === 'rinkeby' ){
        moralis_network_name = network_name
    } else {
        let lumo_network_name = network_flow_to_eth(network_name);
        if ( lumo_network_name === Networks.ropsten || lumo_network_name === Networks.rinkeby ){
            moralis_network_name = 'rinkeby'
        } else if ( lumo_network_name === Networks.mainnet ){
            moralis_network_name = 'eth'
        } 
    }

    if ( trivialString(moralis_network_name) ){
        return {};
    }

    let id = contract_address
    let blob = {
        id: contract_address,
        address: contract_address,
        timeStamp : swiftNow(),            
        pages: pages ?? 0,
        total: total ?? 0,
        network: network_name ?? '',
    }
    await fire.firestore
        .collection(DbPaths.nft_addresses)
        .doc( id )
        .set( blob )
        .then(_ => true)
        .catch(e => false)        

    return blob;

}

/******************************************************
    @Moralis sync nft ownership
******************************************************/



/**
 * 
 * @use: sync all nft ownership
 * 
 **/ 
async function sync_all_nft_ownership(){

    var contract_address = [];
    const res = await fire.firestore
        .collection(DbPaths.nft_addresses)
        .get();

    if (res.empty){
        return false;
    }

    res.forEach(doc => {
        if ( !trivialProps(doc,'data') ){
            let data = doc.data();
            if ( !trivialProps(data,'address') ){
                contract_address.push(data) 
            }
        }
    })


    const did_sync = await contract_address.map( async ({ address, network }) => {
        if ( !trivialString(address) || !trivialString(network) ){
            return await sync_each_nft_contract_ownership({ contract_address: address, network_name: network });
        } else {
            return false;
        }
    })
    await Promise.all(did_sync); 

    return true;
}


/**
 * 
 * @use: migrate all nft owned by user to 
 * @Doc: https://docs.moralis.io/moralis-dapp/web3-sdk/token
 * @Doc: https://admin.moralis.io/web3Api
 * 
 **/ 
async function sync_each_nft_contract_ownership({ contract_address, network_name }){

    var res = default_fn_response({ data: {} })
    
    if ( trivialString(contract_address) ){
        res['message'] = 'please specify contract_address'
        return res;
    }

    const Moralis = await moralisInstance();

    console.log(`\n\n begin migrating contract ${contract_address}`)

    let { success, pages, total } = await _go_rec_migrate_owners({
        Moralis: Moralis,
        contract_address: contract_address,
        input_cursor: "",
        network_name: network_name,
    })

    console.log(`end migrating contract ${contract_address} \n\n`)

    if ( success ){
        await white_list_contract_address({
            pages: pages,
            total: total, 
            contract_address: contract_address,
            network_name: network_name,
        })
    }
    
    res['success'] = true;
    res['message'] = `found nfts`
    return res;
}


async function _go_rec_migrate_owners({ Moralis, network_name, contract_address, input_cursor }){

    var res = default_fn_response({ total: 0, pages: 0 })

    if ( trivialString(network_name) ){
        res['message'] = `please specify network_name, you specified ${network_name}`
        return res;
    }

    const options = trivialString(input_cursor)
        ? { address: contract_address, chain: network_name }
        : { address: contract_address, chain: network_name, cursor: input_cursor };

    const fetch_res = await Moralis.Web3API.token.getNFTOwners(options);

    if ( trivialProps(fetch_res,'result') ){
        res['message'] = 'no results on first fetch'
        return res;
    }

    const { result, cursor, page , total, page_size } = fetch_res;

    const log_all_owners = await result.map( async (blob) => {
        if ( !trivialProps(blob,'token_id') || !trivialString(blob.token_id)  ){
            let id = `${contract_address}_${blob.token_id ?? ""}`
            var updated_blob = {
                ...blob,
                id: id,
                timeStamp: swiftNow(),
                network: network_name ?? "",
            }
            let did = await fire.firestore
                .collection(DbPaths.nft_owners)
                .doc( id )
                .set( updated_blob )
                .then(t => { return true })
                .catch(e => {return false })
            return did;
        } else {
            return false;
        }
    })              
    await Promise.all(log_all_owners); 

    console.log(`fetched ${result.length}/${total} nfts on ${network_name}-${contract_address} from page ${page}, cursor ${cursor}\n`);

    if (  trivialString(cursor) || result.length === 0 ){
        res['success'] = true;
        res['total'] = total;
        res['pages'] = page
        return res;
    } else {
        return await _go_rec_migrate_owners({ 
            Moralis: Moralis, 
            network_name: network_name,
            contract_address: contract_address, 
            input_cursor: cursor 
        });
    }

}


/******************************************************
    @export
******************************************************/

exports.white_list_contract_address = white_list_contract_address;
exports.sync_all_nft_ownership      = sync_all_nft_ownership;
exports.get_all_nft_owned_by_user   = get_all_nft_owned_by_user;
exports.sync_each_nft_contract_ownership = sync_each_nft_contract_ownership;







