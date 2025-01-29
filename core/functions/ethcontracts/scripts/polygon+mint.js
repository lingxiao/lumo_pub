/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: polygon+mint
 * @Date   : 8/24/2022
 * @Doc    : n/a
 * 
*/


const { 
    admin_eth_keys,
    default_fn_response,
	alchemySideChainInstance,
} = require("./../../api/core");

const {
	illValued, 
	trivialString, 
	trivialNum, 
	trivialProps 
} = require("./../../api/utils");


const {
    run_contract_fn,
} = require('./utils');


/**
 * 
 * @use: init chain middleware. note this
 *       uses the correct chain based on staging
 *       or production env.
 * 
 **/
const web3 = alchemySideChainInstance();

/******************************************************
    @deploy contract
******************************************************/

/**
 * 
 * @Use: deploy contract_source on correct network using `eth_admin_address()`
 *       this is deploying a custodial contract
 *       after deployment, monitor chain and wait for the contract to be 
 *       properly deplyed
 * @Doc: https://www.geeksforgeeks.org/how-to-deploy-contract-from-nodejs-using-web3/
 * @Doc: https://ethereum.stackexchange.com/questions/57964/how-to-sign-transaction-during-contract-deployment
 * 
 * 
 **/
async function deploy_custodial_contract_on_polygon({ 
	contract_source, 
	then_failed,
	then_deployed, 
	then_watching
}){

    var res = default_fn_response({ hash: "", balance_eth_before: 0, balance_eth_after:0 });    

    const { public, private } = await admin_eth_keys();
    let balance_wei_o = await web3.eth.getBalance(public);
    let balance_eth_o = Math.round(balance_wei_o/1000000000000000000*100)/100
    res['balance_eth_before'] = balance_eth_o

    // return then_failed(res);

    if ( trivialProps(contract_source,'abi') ){
    	res['message'] = 'ill valued contract source'
    	return then_failed(res);
    }

    if ( trivialString(public) || trivialString(private) ){
        res['message'] = 'cannot find user admin keys'
        return then_failed(res);
    }

    try {

    	const { abi, bytecode } = contract_source;

    	// 1. build contract factory
    	let contract = new web3.eth.Contract(abi);

    	if ( trivialProps(contract, 'deploy')  ){
    		res['message'] = 'malformed contract factory has no deploy function';
    		return then_failed(res)
    	}

    	try {

			let fn = contract.deploy({
			    data: bytecode,
			    arguments: ["lumo",'LMO',"lumo.xyz/api/web3/", public, [public], [100]]
			})

	        let gas   = await fn.estimateGas();
	        let nonce = await web3.eth.getTransactionCount(public, 'pending');
	        let tx = { 
	            'gas'   : gas * 2, // <- so theres' enough gas
	            'data'  : fn.encodeABI(), 
	        }

	        await web3.eth.accounts
	            .signTransaction(tx, private)
	            .then( (signedTx) => {

	            	try {
		                web3.eth.sendSignedTransaction( signedTx.rawTransaction, async (err,hash) => {

		                    if ( err ){

		                        res['message'] = err.message ?? "";
		                        return then_failed(res);

		                    } else {

							    let balance_wei_1 = await web3.eth.getBalance(public);
							    let balance_eth_1 = Math.round(balance_wei_1/1000000000000000000*100)/100

		                    	// output the hash
			                    res['success'] = true;
			                    res['message'] = `minted with hash: ${hash}`
			                    res['hash']    = hash;
			                    res['balance_eth_after'] = balance_eth_1
			                    then_deployed(res);

			                    // montior chain for deployment
								await monitor_custodial_contract_deployed({ 
									hash: hash, 
									then: (address) => {
										then_watching({ 
											success: !trivialString(address) ,
											message: `deployed contract at ${address}`,
											hash   : hash,
											address: address,
										})
								}});
			                }
		                });
		            } catch (err) {
		                res['message'] = ` failed to sign tx with: ${err.message ?? ""}`
		                return then_failed(res)		            	
		            }
	            })
	            .catch((err) => {
	                res['message'] = ` failed to sign tx with: ${err.message ?? ""}`
	                return then_failed(res)
	            })


	    } catch (e) {

	    	res['message'] = `failed to deploy contract ${e.message ?? ""}`
	    	return then_failed(res)
	    }

    } catch (e) {

    	res['message'] = `cannot create contract factory: ${e.message ?? ""}`
    	return then_failed(res);
    }

}


/**
 * 
 * @Use: monitor contract deployment, if iter = 0 or found contract address
 *       then return the contract address
**/
async function monitor_custodial_contract_deployed({ hash, iter, then }){

	if ( iter === 0 || trivialString(hash) ){
		return then("")
	} else {

		const receipt = await web3.eth.getTransactionReceipt(hash);
		if ( !trivialProps(receipt,'contractAddress') && !trivialString(receipt.contractAddress) ){
			return then(receipt.contractAddress);
		} else {
	  		setTimeout(async () => {
	  			return await monitor_custodial_contract_deployed({ hash: hash, iter: iter - 1, then: then });
	  		},5000);
		}
	}
}

/******************************************************
    @mint on  polygon or mubmai
******************************************************/

/**
 * 
 * @use: mint to `tgt_pk` for `contract_address/tok_id`
 * 
 **/
async function go_mint_on_polygon({ contract_address, contract_source, tok_id, tgt_pk, then, then_watching }){

    var res = default_fn_response({ hash: "" });    

    if ( trivialString(tok_id) ){
        res['message'] = 'please provide tokid'
        return then(res);
    }

    if ( trivialString(tgt_pk) ){
        res['message'] = 'please provide target pk'
        return then(res);
    }

    // note we use custodial keys here which is ok because
    // #mint is open on erc1155
    return await run_contract_fn({
        web3,
        contract_address,
        contract_source,
        res,
        fn_name: "mint",
        withFn: ({ contract }) => {
			let fn = contract.methods.mint(tgt_pk, tok_id, 1, '0x')
            return fn
        }, 
        before: async (_res) => {
            const { contract } = _res;
            var res = _res;
            return res;
        },
        then: async (_res) => {
            var res2 = _res;
            res2['contract'] = 'REDACTED'
            then(res2);
            return res;
        },
        then_watching: async (_res) => {
            var res2 = _res;
            res2['contract'] = 'REDACTED'
            then_watching(res2);
        }
    });
}


/******************************************************
    @export
******************************************************/

exports.go_mint_on_polygon = go_mint_on_polygon
exports.deploy_custodial_contract_on_polygon = deploy_custodial_contract_on_polygon

