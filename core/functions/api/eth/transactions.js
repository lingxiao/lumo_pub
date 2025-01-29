/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: transactions on eth
 * @Date   : 3/15/2022
 * @test   : firebase emulators:start
*/


// import modules
const fire  = require('./../fire')
const functions = require('firebase-functions');

const uuid = require('uuid');

const { 
    print,
    swiftNow, 
    illValued, 
    trivialProps, 
    trivialNum, 
    trivialString,
} = require('./../utils');

const { 
    getUserByVendorID, 
} = require('./../client/accounts');



const {
    DbPaths, 
    Networks,
    production_web3,
    staging_web3,
    make_production_web3_account,
} = require('./../core');


const response = { success: false, message: 'ill valued inputs', data: {} }



/******************************************************
	@read transactions
******************************************************/

/**
 * 
 * @use: get eth transaction
 * 
 **/ 
async function getTransactionEth({ txHash, eth_network }){

    var res = response;

    if ( trivialString(txHash) ){
        res['message'] = 'please specify txHash'
        return response;        
    }

    var root_path = DbPaths.transactions_0x03;

    if ( eth_network  === Networks.mainnet ) {
        root_path = DbPaths.transactions_0x01
    } else {
        root_path = DbPaths.transactions_0x03
    }

    const matches = await fire.firestore
        .collection( root_path )
        .where('txHash', '==', txHash)
        .get();

    var hashes = [];    

    if ( matches.empty ){
        res['message'] = 'hash dne at txHash'
        return res;
    }

    matches.forEach(doc => {
        if ( !trivialProps(doc,'data') ){
            hashes.push(doc.data())
        }
    });

    if (hashes.length > 0){
        return { success: true, message: 'found hash', data: hashes[0] }
    } else {
        return { success: true, message: 'found 0 hash', data: {} }        
    }
    
}

/**
 * 
 * @Use: get all transactons sent or from `address``,
 *       originating from fn origin `fn_origin`
 * 
 **/
async function getTransactionEthOn({  address, fn_origin, eth_network }){

    var res = response;
    res['tx'] = []
    res['tx_from'] = []
    res['tx_to'] = []

    if ( trivialString(address) ){
        res['message'] = 'please specify address'
        return res;
    }


    var root_path = DbPaths.transactions_0x03;

    if ( eth_network  === Networks.mainnet ) {
        root_path = DbPaths.transactions_0x01
    } else if ( eth_network === Networks.rinkeby ){
        root_path = DbPaths.transactions_0x04
    } else if ( eth_network === Networks.ropsten ){
        root_path = DbPaths.transactions_0x03
    } else {
        res['message'] = `you specified newtork ${eth_network}, but we only accept 0x1 or 0x3`
        return res;
    }

    var matches_to = fire.firestore
        .collection( root_path )
        .where('to_address'  , '==', address)

    var matches_from = fire.firestore
        .collection( root_path )
        .where('from_address', '==', address)


    if ( !trivialString(fn_origin) ){
        matches_to = await matches_to.where("fn_origin", '==', fn_origin).get()
    } else {
        matches_to = await matches_to.get()
    }

    if ( !trivialString(fn_origin) ){
        matches_from = await matches_from.where("fn_origin", '==', fn_origin).get()
    } else {
        matches_from = await matches_from.get()
    }

    var hashes_to = [];    
    var hashes_from = [];

    if ( matches_to.empty && matches_from.empty ){
        res['success'] = true;
        res['message'] = 'no txs'
        return res;
    }

    matches_to.forEach(doc => {
        if ( !trivialProps(doc,'data') ){
            hashes_to.push(doc.data())
        }
    });

    matches_from.forEach(doc => {
        if ( !trivialProps(doc,'data') ){
            hashes_from.push(doc.data())
        }
    });  


    return { 
        success: true, 
        message: `found ${hashes_to.length} tx to, and ${hashes_from.length} tx from`, 
        tx_to  :  hashes_to,
        tx_from:  hashes_from,
        tx     :  hashes_to.concat(hashes_from) 
    }

}


/**
 * 
 * @Use: get balance by fetching tx logged to lumo only
 * 
 * 
 **/
async function getBalanceEth({ address, resolvedOnly, eth_network }){

    var res = response;
    res['balance'] = 0;
    res['send_to'] = 0;
    res['send_from'] = 0;

    let { success, message, tx_to, tx_from, tx } = await getTransactionEthOn({ address, eth_network });

    if ( !success ){
        res['balance'] = message;
        return res;
    }

    const send_to_wei = tx_to
        .filter(m => !trivialProps(m,'amt_in_wei'))
        .map(m => m.amt_in_wei)  
        .reduce((a,b) => a + b, 0)

    const send_from_wei = tx_from
        .filter(m => !trivialProps(m,'amt_in_wei'))
        .map(m => m.amt_in_wei)  
        .reduce((a,b) => a + b, 0)

    return {
        success: true,
        message: `found ${tx_to.length} tx sent to address, ${tx_from.length} tx sent from address`,
        balance: send_to_wei - send_from_wei,
        send_to_wei  : send_to_wei,
        send_from_wei: send_from_wei,
        tx_to  : tx_to,
        tx_from: tx_from,
    }

}

/**
 * 
 * @use: read abalance of `address` on chain 
 * 
 * 
 **/ 
async function getBalanceEthOnChain({ address, eth_network }){

    var res = response;
    res['balance'] = 0;

    if ( trivialString(address) ){
        res['message'] = 'please specify address'
        return response;        
    }

    const eth_erc20_tok_address_0x1 = '';
    const eth_erc20_tok_address_0x3 = '';
    const eth_erc20_tok_address_0x4 = '';

    var web3 = null;
    var contract_address = '';

    if ( eth_network  === Networks.mainnet ) {
        web3 = production_web3
        contract_address = eth_erc20_tok_address_0x1
    } else if ( eth_network === Networks.ropsten ){
        web3 = staging_web3;
        contract_address = eth_erc20_tok_address_0x3
    } else if ( eth_network === Networks.rinkeby ){
        web3 = staging_web3;
        contract_address = eth_erc20_tok_address_0x4
    } else {
        res['message'] = `you specified newtork ${eth_network}, but we only accept 0x1 or 0x3`
        return res;
    }

    try {

        // let metadata = await web3.alchemy.getTokenBalances(address,["0x607f4c5bb672230e8672085532f7e901544a7375"])
        // res['success'] = true;
        // res['message'] = 'ok'
        // res['data'] = metadata;
        // console.log(metadata)  

        const balances = await web3.alchemy.getTokenBalances(address,[contract_address])


        return res;    

    } catch (e) {

        console.log("ERROR: ", e)

        res['message'] = e;
        return res;
    }

}


/******************************************************
	@write transactions
******************************************************/

/**
 * 
 * @use: when `userID` send `amt_in_wei` to storyboard,
 *       on client side via metamask, record `txHash` and monitor
 *       the `txHash` for completion
 * 
 **/ 
async function logSendTransactionInEth({ fn_origin, from_address, to_address, amt_in_wei, userID, txHash, eth_network }){

    var res = response;

    if ( trivialString(from_address) ){
        res['message'] = 'please specify from address'
        return response;
    }

    if ( trivialString(to_address) ){
        res['message'] = 'please specify to address'
        return response;
    }

    let num = Number(amt_in_wei);
    if ( illValued(num) ){
        res['message'] = 'please specify send amt'
        return response;
    }

    if ( trivialString(txHash) ){
        res['message'] = 'please specify txHash'
        return response;        
    }

    var root_path = DbPaths.transactions_0x03;

    if ( eth_network  === Networks.mainnet ) {
        root_path = DbPaths.transactions_0x01
    } else if ( eth_network === Networks.ropsten ){
        root_path = DbPaths.transactions_0x03
    } else if ( eth_network === Networks.rinkeby ){
        root_path = DbPaths.transactions_0x04
    } else {
        res['message'] = `you specified newtork ${eth_network}, but we only accept 0x1 or 0x3`
        return res;
    }

    const blob = {
        ID          : txHash,
        txHash      : txHash,
        userID      : userID ?? "",
        from_address: from_address,
        to_address  : to_address,
        amt_in_wei  : num,
        network     : eth_network,
        receipt     : false,
        fn_origin   : fn_origin,
        did_rake    : false,
        rake_amt    : 0,
        timeStampCreated: swiftNow(),
        timeStampLatest : swiftNow(),
    }

    let did = await fire.firestore
        .collection( root_path )
        .doc( txHash )
        .set( blob )
        .then(_ => true)
        .catch(e => false)

    res['success'] = did;
    res['message'] = did ? 'success' : 'failed to write to db';
    res['data'] = blob;

    return res;

}

/******************************************************
	@resolve transactions
******************************************************/

/**
 * 
 * @Use: resolve all pending tx in eth ropsten
 *       network
 * 
 **/ 
async function resolveAllTransactionsEth0x3(){

    var res = { success: true, message: 'done' }

    const matches = await fire.firestore
        .collection( DbPaths.transactions_0x03 )
        .where('receipt', '==', false)
        .get();

    var hashes = [];    

    if ( matches.empty ){
        res['message'] = 'no pending txs'
        return;
    }

    matches.forEach(doc => {
        if ( !trivialProps(doc,'data') ){
            hashes.push(doc.data())
        }
    });

    var total = 0;
    for ( var k = 0; k < hashes.length; k ++ ){
        let hash = hashes[k];
        const { txHash, network } = hash;
        let { success } = await resolveTransactionInEth({ txHash: txHash, eth_network: network });
        if (success){
            total += 1;
        }
    }
    
    res['message'] = `resolved ${total}/${hashes.length} txs`;
    return res;

}

/**
 * 
 * @use: resolve a tx in eth
 * @Doc: https://github.com/lingxiao/lumo/blob/fea3ff0fbaf333eb95959f55e9d63165d490a9f1/core/functions/api/eth/croneJobs.js
 * 
 **/ 
async function resolveTransactionInEth({ txHash, eth_network }){

    var res = response;


    if ( trivialString(txHash) ){
        res['message'] = 'please specify txHash'
        return response;
    }

    var root_path = DbPaths.transactions_0x03;

    if ( eth_network  === Networks.mainnet ) {
        root_path = DbPaths.transactions_0x01
    } else if ( eth_network === Networks.ropsten ){
        root_path = DbPaths.transactions_0x03
    } else if ( eth_network === Networks.rinkeby ){
        root_path = DbPaths.transactions_0x04
    } else {
        res['message'] = `you specified newtork ${eth_network}, but we only accept 0x1 or 0x3`
        return res;
    }    

	const tx = await staging_web3.eth.getTransactionReceipt(txHash);

	if ( trivialProps(tx, 'transactionHash') ){
		res['message'] = 'no tx hash found'
		return res;
	}

    const { success, data } = await getTransactionEth({ txHash: txHash, eth_network: eth_network });

    if ( trivialProps(data,'ID')  ){

        const blob = {
            ID          : txHash,
            txHash      : txHash,
            userID      : "",
            from_address: "",
            to_address  : "",
            amt_in_wei  : 0,
            network     : eth_network,
            receipt     : false,
            fn_origin   : 'transactions.resolveTransactionInEth',
            timeStampCreated: swiftNow(),
            timeStampLatest : swiftNow(),
        }


        await fire.firestore
            .collection( root_path )
            .doc( txHash )
            .set( blob )
            .then(_ => true)
            .catch(e => false)        

        return { success: true, message: 'resolved', data: tx }

    }  else {

        let update = { ...data, ...tx, timeStampLatest: swiftNow(), receipt: tx };

        await fire.firestore
            .collection( root_path )
            .doc( txHash )
            .update(update)
            .then(_ => true)
            .catch(e => false)        

        return { success: true, message: 'resolved', data: tx }
    }

}





/******************************************************
    @export
******************************************************/

exports.getBalanceEth = getBalanceEth;
exports.getTransactionEthOn    = getTransactionEthOn;
exports.logSendTransactionInEth = logSendTransactionInEth;
exports.resolveTransactionInEth = resolveTransactionInEth;
exports.resolveAllTransactionsEth0x3 = resolveAllTransactionsEth0x3;






