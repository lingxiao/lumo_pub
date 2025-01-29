/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: Social token fn logic
 * @Date   : Aug 25th
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
    fetch_one,
} = require('./../fire');

const { 
    trivialProps, 
} = require('./../utils');

const {
    default_fn_response,
    alchemySideChainInstance,
    LumoStakingPoolContractAddress,
} = require('./../core');


const {
	  readRiskFreeRate
	, readTotalStakedVolume
	, readTotalInterestVolume
	, readRiskFreeRateAt
	, readFloatRate
	, readStakingAmount
	, readStakingTimeStamp
	, readLockupPeriod
	, readInterestDue
	, readBalanceDue	

	, addPool
	, setLockupPeriod
	, setFloatRate

	, stake
	, unStake
	, batchUnstakeWithRates
	, addCustodian

} = require("./../../ethcontracts/scripts/lumo_staking_pool");


/**
 * 
 * @use: init chain middleware. note this
 *       uses the correct chain based on staging
 *       or production env.
 * 
 **/
const pweb3 = alchemySideChainInstance();


/******************************************************
    @read
******************************************************/

exports.readRiskFreeRate = async () => {
	return await go_run({
		res:default_fn_response({ riskFreeRate: 0 }),
		fn: readRiskFreeRate,
		params: {}
	})
}

exports.readTotalStakedVolume = async () => {
	return await go_run({
		res:default_fn_response({ totalStakedVolume: 0 }),
		fn: readTotalStakedVolume,
		params: {}
	})
}

exports.readTotalInterestVolume = async () => {
	return await go_run({
		res:default_fn_response({ totalInterestVolume: 0 }),
		fn: readTotalInterestVolume,
		params: {}
	})
}

exports.readRiskFreeRateAt = async ({ poolAddress }) => {
	
	var res = default_fn_response({});

	return await go_run({
		res: res,
		fn: readRiskFreeRateAt,
		params: { poolAddress }
	})
}

exports.readLockupPeriod = async ({ poolAddress }) => {	
	var res = default_fn_response({});
	return await go_run({
		res: res,
		fn: readLockupPeriod,
		params: { poolAddress }
	})
}


exports.readFloatRate = async ({ poolAddress, staker }) => {	
	var res = default_fn_response({});
	return await go_run({
		res: res,
		fn: readFloatRate,
		params: { poolAddress, staker }
	})
}

exports.readStakingAmount = async ({ poolAddress, staker }) => {	
	var res = default_fn_response({});
	return await go_run({
		res: res,
		fn: readStakingAmount,
		params: { poolAddress, staker }
	})
}

exports.readStakingTimeStamp = async ({ poolAddress, staker }) => {	
	var res = default_fn_response({});
	return await go_run({
		res: res,
		fn: readStakingTimeStamp,
		params: { poolAddress, staker }
	})
}


exports.readInterestDue = async ({ poolAddress, staker }) => {	
	var res = default_fn_response({});
	return await go_run({
		res: res,
		fn: readInterestDue,
		params: { poolAddress, staker }
	})
}

exports.readBalanceDue = async ({ poolAddress, staker }) => {	
	var res = default_fn_response({});
	return await go_run({
		res: res,
		fn: readBalanceDue,
		params: { poolAddress, staker }
	})
}

/******************************************************
    @write
******************************************************/


exports.addPool = async ({ poolAddress, lockupPeriod, then, then_watching }) => {	
	return await go_execute({
		fn: addPool,
		res: default_fn_response({}),
		params: { poolAddress, lockupPeriod },
		then,
		then_watching,
	})
}

exports.setLockupPeriod = async ({ poolAddress, lockupPeriod, then, then_watching }) => {	
	return await go_execute({
		fn: setLockupPeriod,
		res: default_fn_response({}),
		params: { poolAddress, lockupPeriod },
		then,
		then_watching,
	})
}

exports.setFloatRate = async ({ poolAddress, rate, then, then_watching }) => {	
	return await go_execute({
		fn: setFloatRate,
		res: default_fn_response({}),
		params: { poolAddress, rate },
		then,
		then_watching,
	})
}


exports.stake = async ({ poolAddress, pk, amt, then, then_watching }) => {
	var res = default_fn_response({});
	return await go_execute({
		res: res,
		fn: stake,
		params: { poolAddress, pk, amt },
		then,
		then_watching,
	})
}


exports.unStake = async ({ poolAddress, pk, then, then_watching }) => {	
	var res = default_fn_response({});
	return await go_execute({
		res: res,
		fn: unStake,
		params: { poolAddress, pk },
		then,
		then_watching,
	})
}


exports.batchUnstakeWithRates = async ({ poolAddress, pks, rates, then, then_watching }) => {	
	var res = default_fn_response({});
	return await go_execute({
		res: res,
		fn: batchUnstakeWithRates,
		params: { poolAddress, pks, rates },
		then,
		then_watching,
	})
}


exports.addCustodian = async ({ pk, then, then_watching }) => {	
	var res = default_fn_response({});
	return await go_execute({
		res: res,
		fn: addCustodian,
		params: { pk: pk },
		then,
		then_watching,
	})
}


/******************************************************
    @utils
******************************************************/



async function go_run({ res, fn, params }){

    let contract_source = await _get_contract_abi()
    const { polygon } = LumoStakingPoolContractAddress();

    let _params = {
    	...params,
        web3: pweb3,
        contract_address: polygon, 
        contract_source: contract_source,
    }

    return await fn(_params);

}


async function go_execute({ res, fn, params, then, then_watching }){

    let contract_source = await _get_contract_abi()
    const { polygon } = LumoStakingPoolContractAddress();

    let _params = {
    	...params,
        web3: pweb3,
        contract_address: polygon, 
        contract_source: contract_source,
        then,
        then_watching,
    }

    return await fn(_params);

}



/**
 * @use: get parc contract abi 
 * 
 **/
async function _get_contract_abi(){

    const { abi_sourceName } = LumoStakingPoolContractAddress();

    let contract = await fetch_one({ 
        path: 'contract_abi', 
        field: 'sourceName', 
        value: abi_sourceName,
    })
    return trivialProps(contract, 'abi') ? {} : contract
}















