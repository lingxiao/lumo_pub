/**
 * @Package:  endpoints staking pool
 * @Date   : 8/26/2022
 * @Author : Xiao Ling   
 * @Read: https://firebase.google.com/docs/hosting/functions
 *        https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
 *        https://firebase.google.com/docs/functions/write-firebase-functions
 * Stripe payment: adnw-esrg-swqh-nixz-vhmh
 * 
 * @Test:   `firebase serve`
 * 
*/

const functions = require('firebase-functions');
const express   = require('express');

const { with_api_response } = require('./endpoint_utils');

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
} = require('./../api/eth/lumoStakingPool');



// API 
const API = express();

// @use: *read* parc staking pool states
let api_endpoints = {
    'read_risk_free_rate'       : readRiskFreeRate,
    'read_total_staked_volume'  : readTotalStakedVolume,
    'read_total_interest_volume': readTotalInterestVolume,
    'read_risk_free_rate_at'    : readRiskFreeRateAt,
    'read_float_rate'           : readFloatRate,
    'read_staking_amount'       : readStakingAmount,
    'read_staking_timestamp'    : readStakingTimeStamp,
    'read_lockup_period'        : readLockupPeriod,
    'read_interest_due'         : readInterestDue,
    'read_balance_due'          : readBalanceDue,
}

// serve API
Object.keys(api_endpoints).map( key => {
    let fn = api_endpoints[key];
    API.post(`/${key}`, async (req,res) => {
        with_api_response({
            req: req,
            res: res,
            params: [],
            data_format: {},
            fn: fn,
        });
    });
})


exports.app_staking_pool = API;

