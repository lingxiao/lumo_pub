/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: parc token
 * @Date   : 8/24/2022
 * @Doc    : https://docs.openzeppelin.com/contracts/3.x/erc20
 * @Doc    : https://wizard.openzeppelin.com/
 * @Faucet : https://faucet.polygon.technology/
 * 
*/


const { 
    admin_eth_keys,
    default_fn_response,
} = require("./../../api/core");

const {
	illValued, 
	trivialString, 
	trivialNum, 
	trivialProps 
} = require("./../../api/utils");

const {
    run_contract_fn,
    go_monitor_tx,
    make_contract,
} = require('./utils');


/******************************************************
    @read balance
******************************************************/


/**
 * 
 * @Use: read parc balance given parc contract-source
 * 
 **/
async function lumo_balance({ web3, pk, contract_address, contract_source }){

    var res = default_fn_response({ total_supply: 0, balance: 0 });    

    if ( trivialString(pk) || trivialProps(contract_source,'abi') || trivialString(contract_address) ){
        res['message'] = 'invalid address/source or user pk'
        return res;
    }

    const { abi, bytecode } = contract_source;
    const { public, private } = await admin_eth_keys();

    let contract = await make_contract({ web3, contract_address, contract_source });

    if ( trivialProps(contract, 'methods') || trivialProps(contract.methods,'totalSupply') ){
        res['contract'] = contract;
        res['message'] = 'malformed contract';
        return res;
    }    

    const amt = await contract.methods.totalSupply().call();        
    const bal = await contract.methods.balanceOf(pk).call()

    res['total_supply'] = amt;
    res['balance'] = bal;
    res['success'] = true;
    res['message'] = `found balance`
    return res;


}


/******************************************************
    @mint
******************************************************/

/**
 * 
 * @use: send `amt` to tgt from src
 * 
 **/
async function lumo_mint_to({  
    web3,
    contract_address,
    contract_source,
    pk, 
    amt, 
    then,
    then_watching 
}){

    var res = default_fn_response({ 
        hash          : "",
        total_supply  : 0, 
        balance_before: 0, 
        balance_after : 0,
        contract      : {},
    });    

    if ( trivialString(pk) || trivialProps(contract_source,'abi') || trivialString(contract_address) ){
        res['message'] = 'invalid address/source or user pk'
        return then(res);
    }

    if ( illValued(amt) ){
        res['message'] = 'ill valued amt';
        return then(res);
    }

    try {
        return await run_contract_fn({
            web3,
            contract_address,
            contract_source,
            res,
            fn_name: "mint",
            withFn: ({ contract }) => {
                let fn = contract.methods.mint(pk,amt)
                return fn
            }, 
            before: async (_res) => {
                const { contract } = _res;
                var res = _res;
                res['total_supply']   = await contract.methods.totalSupply().call();
                res['balance_before'] = await contract.methods.balanceOf(pk).call();
                return res;
            },
            then: async (_res) => {
                const { contract } = _res;
                var res = _res;
                res['balance_after'] = await contract.methods.balanceOf(pk).call();
                var res2 = res;
                res2['contract'] = 'REDACTED'
                then(res2);
                return res;
            },
            then_watching: async (_res) => {
                const { contract } = _res;
                var res = _res;
                res['balance_after'] = await contract.methods.balanceOf(pk).call()
                res['total_supply'] = await contract.methods.totalSupply().call();
                var res2 = res;
                res2['contract'] = 'REDACTED'
                then_watching(res2);
            }
        })
    } catch (e) {
        res['message'] = e;
        return then(res);
    }

}




/******************************************************
    @send from custodial account
******************************************************/


/**
 * 
 * @Use: send parc from tgt to src for amt
 * 
 **/
async function lumo_send_to({  
    web3,
    contract_address, 
    contract_source,
    srcPk,
    srcPrivate,
    tgtPk,
    amt,
    then,
    then_watching
}){

    var res = default_fn_response({ 
        hash          : "",
        total_supply  : 0, 
        balance_before_src: 0, 
        balance_after_src : 0,
        balance_before_tgt: 0, 
        balance_after_tgt : 0,
    });    

    if ( trivialString(srcPk) || trivialString(tgtPk) || trivialProps(contract_source,'abi') || trivialString(contract_address) ){
        res['message'] = 'invalid address/source or user pk'
        return then(res);
    }

    if ( trivialString(srcPrivate) ){
        res['message'] = 'please provide src private key'
        return then(res);
    }

    if ( illValued(amt) ){
        res['message'] = 'ill valued amt';
        return then(res);
    }

    try {
        return await run_contract_fn({
            web3,
            contract_address,
            contract_source,
            res,
            fn_name: "allocate",
            withFn: ({ contract }) => {
                let fn = contract.methods.allocate( srcPk, tgtPk, amt );
                return fn
            }, 
            before: async (_res) => {
                const { contract } = _res;
                var res = _res;

                res['total_supply'] = Number(await contract.methods.totalSupply().call());
                res['balance_before_src'] = Number(await contract.methods.balanceOf(srcPk).call() ?? 0);    
                res['balance_before_tgt'] = Number(await contract.methods.balanceOf(tgtPk).call() ?? 0);    

                return res;
            },
            then: async (_res) => {
                const { contract } = _res;
                var res = _res;

                res['total_supply'] = Number(await contract.methods.totalSupply().call());
                res['balance_after_src'] = Number(await contract.methods.balanceOf(srcPk).call() ?? 0);    
                res['balance_after_tgt'] = Number(await contract.methods.balanceOf(tgtPk).call() ?? 0);    

                var res2 = res;
                res2['contract'] = 'REDACTED'
                then(res2);
                return res;
            },
            then_watching: async (_res) => {
                const { contract } = _res;
                var res = _res;

                res['total_supply'] = Number(await contract.methods.totalSupply().call());
                res['balance_after_src'] = Number(await contract.methods.balanceOf(srcPk).call() ?? 0);    
                res['balance_after_tgt'] = Number(await contract.methods.balanceOf(tgtPk).call() ?? 0);    

                var res2 = res;
                res2['contract'] = 'REDACTED'
                then_watching(res2);
            }
        })
    } catch (e) {
        res['message'] = e;
        return then(res);
    }

}


/******************************************************
    @whitelist
******************************************************/


/**
 * 
 * @use: send `amt` to tgt from src
 * 
 **/
async function lumo_whitelist_staking_contract({  
    web3,
    contract_address,
    contract_source,
    staking_address,
    then,
    then_watching 
}){

    var res = default_fn_response({  hash: "" });

    if ( trivialProps(contract_source,'abi') || trivialString(contract_address) ){
        res['message'] = 'invalid address/source'
        return then(res);
    }

    if ( trivialString(staking_address) ){
        res['message'] = 'ill valued staking_address';
        return then(res);
    }


    return await run_contract_fn({
        web3,
        contract_address,
        contract_source,
        res,
        fn_name: "whiteListStakingContract",
        withFn: ({ contract }) => {
            let fn = contract.methods.whiteListStakingContract(staking_address)
            return fn
        }, 
        before: async (_res) => {
            return _res;
        },
        then: async (_res) => {
            var res2 = _res;
            res2['contract'] = 'REDACTED'
            then(res2);
            return res;
        },
        then_watching: async (_res) => {
            const { contract } = _res;
            var res2 = res;
            res2['contract'] = 'REDACTED'
            then_watching(res2);
        }
    });
}


async function whiteListCustodian({
    web3,
    contract_address,
    contract_source,
    pk,
    then, 
    then_watching 
}){        

    var res = default_fn_response({});    

    if ( trivialString(pk) ){
        res['message'] = 'invalid inputs'
        return res;
    }    

    return await run_contract_fn({
        web3,
        contract_address,
        contract_source,
        res,
        fn_name: "addCustodian",
        withFn: ({ contract }) => {
            let fn = contract.methods.addCustodian(pk)
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
    })


}



/******************************************************
    @export
******************************************************/


exports.lumo_balance = lumo_balance;
exports.lumo_mint_to = lumo_mint_to;
exports.lumo_send_to = lumo_send_to;

exports.whiteListCustodian = whiteListCustodian;
exports.lumo_whitelist_staking_contract = lumo_whitelist_staking_contract;














