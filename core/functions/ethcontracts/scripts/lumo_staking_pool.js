/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: LumoStakingPool middleware fns.
 * @Date   : 8/24/2022
 * @Doc    : https://docs.aave.com/developers/v/1.0/developing-on-aave/the-protocol/lendingpool
 * @Faucet : https://faucet.polygon.technology/
 * 
*/


const { 
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
    make_contract,
} = require('./utils');


/******************************************************
    @read 
******************************************************/


async function readRiskFreeRate({ web3, contract_address, contract_source }){    

    var res = default_fn_response({ riskFreeRate: 0 });    
    let contract = await make_contract({ web3, contract_address, contract_source });

    if ( trivialProps(contract.methods,'readRiskFreeRate')){
        res['message'] = 'invalid contract'
        return res;
    }    

    const amt = await contract.methods.readRiskFreeRate().call();     
    res['riskFreeRate'] = amt;
    res['success'] = true;
    res['message'] = 'read'
    return res;

}

async function readTotalStakedVolume({ web3, contract_address, contract_source }){        

    var res = default_fn_response({ totalStakedVolume: 0 });    
    let contract = await make_contract({ web3, contract_address, contract_source });

    if ( trivialProps(contract.methods,'readTotalStakedVolume')){
        res['message'] = 'invalid contract'
        return res;
    }    

    const amt = await contract.methods.readTotalStakedVolume().call();     
    res['totalStakedVolume'] = amt;
    res['success'] = true;
    res['message'] = 'read'
    return res;

}

async function readTotalInterestVolume({ web3, contract_address, contract_source }){        

    var res = default_fn_response({ totalInterestVolume: 0 });    
    let contract = await make_contract({ web3, contract_address, contract_source });

    if ( trivialProps(contract.methods,'readTotalInterestVolume')){
        res['message'] = 'invalid contract'
        return res;
    }    

    const amt = await contract.methods.readTotalInterestVolume().call();     
    res['totalInterestVolume'] = amt;
    res['success'] = true;
    res['message'] = 'read'
    return res;

}

async function readRiskFreeRateAt({  web3, contract_address, contract_source, poolAddress }){        

    var res = default_fn_response({ riskFreeRateAt: 0 });    
    let contract = await make_contract({ web3, contract_address, contract_source });

    if ( trivialProps(contract.methods,'readRiskFreeRateAt') || trivialString(poolAddress) ){
        res['message'] = 'invalid contract or poolAddress'
        return res;
    }    

    const amt = await contract.methods.readRiskFreeRateAt( poolAddress ).call();     
    res['riskFreeRateAt'] = amt;
    res['success'] = true;
    res['message'] = 'read'
    return res;    
}


async function readLockupPeriod({ web3, contract_address, contract_source, poolAddress }){        

    var res = default_fn_response({ stakingTimeStamp: 0 });    
    let contract = await make_contract({ web3, contract_address, contract_source });

    if ( trivialProps(contract.methods,'readLockupPeriod') || trivialString(poolAddress) ){
        res['message'] = 'invalid contract or poolAddress'
        return res;
    }    

    const amt = await contract.methods.readLockupPeriod( poolAddress ).call();     
    res['stakingTimeStamp'] = amt;
    res['success'] = true;
    res['message'] = 'read'
    return res;   

}


async function readFloatRate({ web3, contract_address, contract_source, poolAddress, staker }){        

    var res = default_fn_response({ floatRate: 0 });    
    let contract = await make_contract({ web3, contract_address, contract_source });

    if ( trivialProps(contract.methods,'readFloatRate') || trivialString(poolAddress) || trivialString(staker) ){
        res['message'] = 'invalid contract or poolAddress'
        return res;
    }    

    const amt = await contract.methods.readFloatRate( poolAddress, staker ).call();     
    res['floatRate'] = amt;
    res['success'] = true;
    res['message'] = 'read'
    return res;    

}

async function readStakingAmount({web3, contract_address, contract_source, poolAddress, staker }){        

    var res = default_fn_response({ stakingAmount: 0 });    
    let contract = await make_contract({ web3, contract_address, contract_source });

    if ( trivialProps(contract.methods,'readStakingAmount') || trivialString(poolAddress) || trivialString(staker) ){
        res['message'] = 'invalid contract or poolAddress'
        return res;
    }    

    const amt = await contract.methods.readStakingAmount( poolAddress, staker ).call();     
    res['stakingAmount'] = amt;
    res['success'] = true;
    res['message'] = 'read'
    return res;   

}

async function readStakingTimeStamp({ web3, contract_address, contract_source, poolAddress, staker }){        

    var res = default_fn_response({ stakingTimeStamp: 0 });    
    let contract = await make_contract({ web3, contract_address, contract_source });

    if ( trivialProps(contract.methods,'readStakingTimeStamp') || trivialString(poolAddress) || trivialString(staker) ){
        res['message'] = 'invalid contract or poolAddress'
        return res;
    }    

    const amt = await contract.methods.readStakingTimeStamp( poolAddress, staker ).call();     
    res['stakingTimeStamp'] = amt;
    res['success'] = true;
    res['message'] = 'read'
    return res;   

}



async function readInterestDue({ web3, contract_address, contract_source, poolAddress, staker }){        

    var res = default_fn_response({ interestDue: 0 });    
    let contract = await make_contract({ web3, contract_address, contract_source });

    if ( trivialProps(contract.methods,'readInterestDue') || trivialString(poolAddress) || trivialString(staker) ){
        res['message'] = 'invalid contract or poolAddress'
        return res;
    }    

    const amt = await contract.methods.readInterestDue( poolAddress, staker ).call();     
    res['interestDue'] = amt;
    res['success'] = true;
    res['message'] = 'read'
    return res;   

}

async function readBalanceDue({ web3, contract_address, contract_source, poolAddress, staker }){        

    var res = default_fn_response({ balanceDue: 0 });    
    let contract = await make_contract({ web3, contract_address, contract_source });

    if ( trivialProps(contract.methods,'readBalanceDue') || trivialString(poolAddress) || trivialString(staker) ){
        res['message'] = 'invalid contract or poolAddress'
        return res;
    }    

    const amt = await contract.methods.readBalanceDue( poolAddress, staker ).call();     
    res['balanceDue'] = amt;
    res['success'] = true;
    res['message'] = 'read'
    return res;   
}

/******************************************************
    @only owner fns
******************************************************/

async function addPool({
    web3,
    contract_address,
    contract_source,
    poolAddress,
    lockupPeriod,
    then, 
    then_watching 
}){        

    var res = default_fn_response({});    

    if ( trivialString(poolAddress) || trivialNum(lockupPeriod) ){
        res['message'] = 'invalid inputs'
        return res;
    }    

    return await run_contract_fn({
        web3,
        contract_address,
        contract_source,
        res,
        fn_name: "addPool",
        withFn: ({ contract }) => {
            let fn = contract.methods.addPool(poolAddress, lockupPeriod)
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


async function setLockupPeriod({
    web3,
    contract_address,
    contract_source,
    poolAddress,
    lockupPeriod,
    then, 
    then_watching 
}){        

    var res = default_fn_response({});    


    if ( trivialString(poolAddress) || trivialNum(lockupPeriod) ){
        res['message'] = 'invalid inputs'
        return res;
    }    

    return await run_contract_fn({
        web3,
        contract_address,
        contract_source,
        res,
        fn_name: "setLockupPeriod",
        withFn: ({ contract }) => {
            let fn = contract.methods.setLockupPeriod(poolAddress, lockupPeriod)
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



async function setFloatRate({
    web3,
    contract_address,
    contract_source,
    poolAddress,
    rate,
    then, 
    then_watching 
}){        

    var res = default_fn_response({});    

    if ( trivialString(poolAddress) || trivialNum(rate) ){
        res['message'] = 'invalid inputs'
        return res;
    }    

    return await run_contract_fn({
        web3,
        contract_address,
        contract_source,
        res,
        fn_name: "setFloatRate",
        withFn: ({ contract }) => {
            let fn = contract.methods.setFloatRate(poolAddress, rate)
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


async function addCustodian({
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
    @stake
******************************************************/



async function stake({
    web3,
    contract_address,
    contract_source,
    poolAddress,
    pk,
    amt,
    then, 
    then_watching 
}){        

    var res = default_fn_response({});    

    if ( trivialString(poolAddress) || trivialNum(amt) || trivialString(pk) ){
        res['message'] = 'invalid inputs'
        return then(res);
    }    

    return await run_contract_fn({
        web3,
        contract_address,
        contract_source,
        res,
        fn_name: "_stake",
        withFn: ({ contract }) => {
            let fn = contract.methods._stake(poolAddress, pk, amt)
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


async function unStake({
    web3,
    contract_address,
    contract_source,
    poolAddress,
    pk,
    then, 
    then_watching 
}){        

    var res = default_fn_response({});    

    if ( trivialString(poolAddress) || trivialString(pk) ){
        res['message'] = 'invalid inputs'
        return res;
    }    

    return await run_contract_fn({
        web3,
        contract_address,
        contract_source,
        res,
        fn_name: "_unstake",
        withFn: ({ contract }) => {
            let fn = contract.methods._unstake(poolAddress, pk)
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


// @use: batch usntake all pks w/ defined rate of return \in rates
async function batchUnstakeWithRates({
    web3,
    contract_address,
    contract_source,
    poolAddress,
    pks,
    rates,
    then, 
    then_watching 
}){        

    var res = default_fn_response({});    

    if ( trivialString(poolAddress) || trivialProps(pks,'length') || trivialProps(rates,'length') ){
        res['message'] = 'invalid inputs'
        return then(res);
    }    

    return await run_contract_fn({
        web3,
        contract_address,
        contract_source,
        res,
        fn_name: "batchUnstakeWithRates",
        withFn: ({ contract }) => {
            let fn = contract.methods.batchUnstakeWithRates(poolAddress, pks,rates)
            return fn
        }, 
        before: async (_res) => {
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

exports.readRiskFreeRate = readRiskFreeRate
exports.readTotalStakedVolume = readTotalStakedVolume
exports.readTotalInterestVolume = readTotalInterestVolume
exports.readRiskFreeRateAt = readRiskFreeRateAt
exports.readFloatRate = readFloatRate
exports.readStakingAmount = readStakingAmount
exports.readStakingTimeStamp = readStakingTimeStamp
exports.readLockupPeriod = readLockupPeriod
exports.readInterestDue = readInterestDue
exports.readBalanceDue = readBalanceDue

exports.addPool         = addPool
exports.setLockupPeriod = setLockupPeriod
exports.setFloatRate    = setFloatRate
exports.addCustodian    = addCustodian;

exports.stake           = stake
exports.unStake         = unStake
exports.batchUnstakeWithRates = batchUnstakeWithRates;












