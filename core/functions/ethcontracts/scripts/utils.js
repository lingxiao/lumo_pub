/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: web3 utils
 * @Date   : 8/24/2022
 * @Doc    : https://docs.openzeppelin.com/contracts/3.x/erc20
 * @Doc    : https://wizard.openzeppelin.com/
 * @Faucet : https://faucet.polygon.technology/
 * 
*/


const { 
    admin_eth_keys,
    with_custodial_eth_keys,
} = require("./../../api/core");

const {
	trivialString, 
	trivialProps 
} = require("./../../api/utils");


/******************************************************
    @admin send funds
******************************************************/


/***
 *
 * @use: read admin's eth balance 
 * 
 **/
async function read_admin_eth_balance({ web3, then }){
    let { public } = await admin_eth_keys();
    return await read_eth_balance({ web3, pk: public, then })
}


async function read_eth_balance({ web3, pk, then }){
    await web3.eth.getBalance(pk, function(err, result) {
        if ( err ){
            return then({ pk: pk, eth: 0, wei: 0, success: false })
        } else {
            let ethBal = web3.utils.fromWei(result,'ether');
            return then({ pk: pk, eth: ethBal, wei: result, success: true });
        }
    })    
}


async function send_admin_eth_to({ web3, tgt, amt_in_eth, then, then_watching }){

    let { public, private } = await admin_eth_keys();
    await send_eth_to({
        web3,
        src: public, 
        srcPrivate: private,
        tgt,
        amt_in_eth,
        then,
        then_watching
    })

}


// @use: send eth from admin act to 
async function send_eth_to({ web3, src, srcPrivate, tgt, amt_in_eth, then, then_watching }){

    var res = { success: false, message: "invalid tgt", hash: "", data: {} };

    if ( trivialString(tgt) ){
        return then(res);
    }

    await read_eth_balance({  web3, pk: src, then: async ({ success, eth }) => {

        if ( !success || eth <= amt_in_eth ){
            res['message'] = `your balance ${eth} < ${amt_in_eth}`;
            return then(res);
        }


        let nonce = await web3.eth.getTransactionCount(src);
        // let gasPrices = await getCurrentGasPrices();
        let tx = {
            "to": tgt,
            "value": web3.utils.toHex(web3.utils.toWei(amt_in_eth.toString(), 'ether')),
            "gas": 21000,
            "nonce": nonce,
            // "gasPrice": gasPrices.low * 1000000000,
        };

        await web3.eth.accounts
            .signTransaction(tx, srcPrivate)
            .then( (signedTx) => {

                try {
                    web3.eth.sendSignedTransaction( signedTx.rawTransaction, async (err,hash) => {

                        if ( err ){

                            res['message'] = err.message ?? "";
                            return then(res);

                        } else {

                            res['success'] = true;
                            res['hash']    = hash;
                            res['message'] = `sent ${amt_in_eth} with hash: ${hash}`;
                            then(res);

                            await go_monitor_tx({ web3, hash: hash, iter: 10, then: async (logs) => {
                                res['success'] = true;
                                res['hash']    = hash;
                                res['message'] = `watched ${logs.length} logs,sent ${amt_in_eth} with hash: ${hash}`;
                                return await then_watching(res);
                            }})                            
                        }
                    });

                } catch (e) {

                    res['message'] = `failed to sign fn: ${e ?? ""}`;
                    return then(res);
                }

            })
            .catch((err) => {
                res['message'] = ` failed to sign tx with: ${err.message ?? ""}`;
                return then(res);
            })

    }});    
}


/******************************************************
    @run contract
******************************************************/


async function run_contract_fn({
    web3,
    contract_address,
    contract_source,
    fn_name,
    withFn,
    res,
    before,
    then, 
    then_watching,
    then_monitor_fn,
}){

    try {

        let contract = await make_contract({ web3, contract_address, contract_source });

        if ( trivialProps(contract, 'methods') || trivialProps(contract.methods,fn_name) ){
            res['contract'] = contract;
            res['message'] = 'malformed contract';
            return then(res)
        }

        // sign tx with any of n custodial keys with eth preloaded into the address
        // note you need to reload the addresses with eth or this fn will fail        
        await with_custodial_eth_keys({ then: async ({ idx, public, private, success }) => {

            // console.log('\n\nusing custodial key:', idx, public, '\n\n');
            if ( !success || trivialString(public) || trivialString(private) ){
                res['message'] = 'no keys specified';
                return then(res)
            }

            res['contract'] = contract;
            res['logs'] = [];
            var res1 = await before(res);

            try {

                let fn = withFn({ contract });
                let nonce = await web3.eth.getTransactionCount(public, 'pending');

                let tx = {
                    'from'  : public,
                    'to'    : contract_address,
                    'gas'   : 43144*10, // gas,
                    'data'  : fn.encodeABI(), 
                    'nonce': nonce,
                }

                await web3.eth.accounts
                    .signTransaction(tx, private)
                    .then( (signedTx) => {

                        try {
                            web3.eth.sendSignedTransaction( signedTx.rawTransaction, async (err,hash) => {

                                if ( err ){

                                    res1['message'] = err.message ?? "";
                                    return then(res1);

                                } else {

                                    res1['success'] = true;
                                    res1['hash']    = hash;
                                    res1['message'] = `ran ${fn_name} with hash: ${hash}`;
                                    res1['contract']  = contract;
                                    var res2 = await then(res1);

                                    let watch_tx_fn = typeof then_monitor_fn === 'function'
                                        ? then_monitor_fn
                                        : go_monitor_tx;

                                    await watch_tx_fn({ web3, hash: hash, iter: 10, then: async (logs) => {
                                        res2['success'] = true;
                                        res2['hash']    = hash;
                                        res2['contract'] = contract;
                                        res2['message'] = `watched ${fn_name} execution with logs: ${logs.length}`;
                                        res2['logs'] = logs;
                                        return await then_watching(res2);
                                    }})
                                }
                            });

                        } catch (e) {

                            res1['message'] = `failed to sign fn: ${e ?? ""}`;
                            return then(res1);
                        }

                    })
                    .catch((err) => {
                        res1['message'] = ` failed to sign tx with: ${err.message ?? ""}`;
                        return then(res1);
                    })

            } catch (e) {

                res1['message'] = `failed to estimate gas: ${e ?? ""}`;
                return then(res1);
            }

        }})

    } catch (e) {

        res['message'] = `failed to create contract: ${e ?? ""}`;
        return then(res1);
    }        

}




async function make_contract({ web3, contract_address, contract_source }){

    if ( trivialProps(contract_source,'abi') || trivialString(contract_address) ){
        return {}
    }

    try {
        let contract = new web3.eth.Contract(contract_source.abi, contract_address)
        return contract;
    } catch (e) {
        return {};
    }

}


async function go_monitor_tx({ web3, hash, iter, then }){

    if ( iter === 0 || trivialString(hash) ){

        return then([])

    } else {

        try {

            const receipt = await web3.eth.getTransactionReceipt(hash);

            if ( !trivialProps(receipt,'logs') ){
                return then(receipt.logs)
            } else {
                setTimeout(async () => {
                    return await go_monitor_tx({ web3, hash: hash, iter: iter - 1, then: then });
                },5000);
            }
        } catch (e) {            
            setTimeout(async () => {
                return await go_monitor_tx({ web3, hash: hash, iter: iter - 1, then: then });
            },5000);
        }
    }
}


async function getCurrentGasPrices() {
    let response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json');
    let prices = {
      low: response.data.safeLow / 10,
      medium: response.data.average / 10,
      high: response.data.fast / 10
    };
    return prices;
}


/******************************************************
    @export
******************************************************/

exports.run_contract_fn = run_contract_fn;
exports.go_monitor_tx = go_monitor_tx;
exports.make_contract = make_contract;

exports.read_eth_balance = read_eth_balance;
exports.read_admin_eth_balance = read_admin_eth_balance;
exports.send_eth_to = send_eth_to
exports.send_admin_eth_to = send_admin_eth_to;












