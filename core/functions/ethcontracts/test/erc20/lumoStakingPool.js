/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: LumoStakingPool.sol
 * @Date   : 8/26/2022
 * @Run    : `npx hardhat test`
 * @Doc    : https://etherscan.io/address/0x8b4d8443a0229349a9892d4f7cbe89ef5f843f72#code
 * @Doc    : https://betterprogramming.pub/how-to-write-a-smart-contract-for-stake-the-token-a46fdb9221b6
 * @Ref    : https://etherscan.io/address/0x8b4d8443a0229349a9892d4f7cbe89ef5f843f72#code
 * 
*/


const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, waffle } = require("hardhat");

const {
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');



/******************************************************
    @test main
******************************************************/

/**
describe("LumoStakingPool.sol basic test", function(){

    it('LumoStakingPool: shall deploy correctly', async function(){

        var witness;
        var admin, pool1, pool2, staker1, staker2;
        var contract;
        var token;
        
        var admin_balance, pool1_balance, pool2_balance, staker1_balance, staker2_balance;

        beforeEach(async () => {

            [ 
                admin, 
                pool1, 
                pool2,
                staker1,
                staker2,
            ] = await ethers.getSigners();

            // deploy pprcToken
            const LumoToken = await ethers.getContractFactory(`LumoToken`);
            token = await LumoToken.deploy();
            await token.deployed();
            // console.log(token)

            // deploy contracts
            const LumoStakingPool = await ethers.getContractFactory(`LumoStakingPool`);
            contract = await LumoStakingPool.deploy(token.address)
            await contract.deployed();

            // #balance before
            admin_balance    = await token.balanceOf( admin.address   );
            pool1_balance    = await token.balanceOf( pool1.address   );
            pool2_balance    = await token.balanceOf( pool2.address   );
            staker1_balance  = await token.balanceOf( staker1.address );
            staker2_balance  = await token.balanceOf( staker2.address );
        })

        describe("LumoERC20 basic functions are correct", () => {
            // shall be able to set float rate for user
            it(`LumoERC20: shall be able to #addCustodian`, async () => {
                await token.addCustodian( staker1.address )
                expect( await token.isCustodian(staker1.address) ).to.equal(true);
                expect( await token.isCustodian(staker2.address) ).to.equal(false);
                await token.removeCustodian(staker1.address)
                expect( await token.isCustodian(staker1.address) ).to.equal(false);
                expect( await token.isCustodian(staker2.address) ).to.equal(false);
            });      
        });


        describe("LumoStakingPool basic functions are correct", () => {

            it("LumoStakingPool: shall have correct initial #riskFreeRate & aggregate statistics", async () => {
                expect( await contract.readRiskFreeRate() ).to.equal(200);
                expect( await contract.readTotalStakedVolume() ).to.equal(0);
                expect( await contract.readTotalInterestVolume() ).to.equal(0);
                expect( await contract.readStakingTokenAddress() ).to.equal(token.address)
            });

            // Token can add StakingContract to whitelist
            it("LumoToken + LumoStakingPool: shall be able to add staking pool to whitelist", async () => {
                await token.whiteListStakingContract(contract.address);
                expect( await token.readIsWhiteListed(contract.address) ).to.equal(true);
            });

            // shall be able to add pool
            it(`LumoStakingPool: shall be able to add/remove pool with risk free rate`, async () => {
                expect( await contract.readRiskFreeRateAt(pool1.address) ).to.equal(0);
                await contract.addPool(pool1.address, 10);
                expect( await contract.readRiskFreeRateAt(pool1.address) ).to.equal(200);
                expect( await contract.readLockupPeriod  (pool1.address) ).to.equal(10);
                expect( await contract.readRiskFreeRateAt(pool2.address) ).to.equal(0);
                await contract.removePool(pool1.address);
                expect( await contract.readRiskFreeRateAt(pool1.address) ).to.equal(0);
                expect( await contract.readLockupPeriod  (pool1.address) ).to.equal(0);
            })

            // shall be able to update loockup perod
            it(`LumoStakingPool: shall be able to change lockup period`, async () => {
                await contract.addPool(pool1.address, 10);
                expect( await contract.readRiskFreeRateAt(pool1.address) ).to.equal(200);
                expect( await contract.readLockupPeriod  (pool1.address) ).to.equal(10);
                await contract.setLockupPeriod(pool1.address, 20);
                expect( await contract.readLockupPeriod  (pool1.address) ).to.equal(20);
            });

            // shall not be able to update loockup perod for pool that dne
            it(`LumoStakingPool: [Should Fail] shall not be able to change lockup period`, async () => {
                try {
                    await contract.addPool(pool1.address, 10);
                    expect( await contract.readRiskFreeRateAt(pool1.address) ).to.equal(200);
                    expect( await contract.readLockupPeriod  (pool1.address) ).to.equal(10);
                    await contract.setLockupPeriod(pool2.address, 20);
                } catch (e){
                    console.log(`\t: test failed as expected ${e.message}`)
                }
            });

            // shall be able to set float rate for user
            it(`LumoStakingPool: shall be able to change float rate for pool`, async () => {
                await contract.addPool(pool1.address, 10);
                expect( await contract.readRiskFreeRateAt(pool1.address) ).to.equal(200);
                expect( await contract.readFloatRate(pool1.address, staker1.address) ).to.equal(0);
                await contract.setFloatRate(pool1.address, staker1.address, 15);
                expect( await contract.readFloatRate(pool1.address, staker1.address) ).to.equal(15);
            });


            // shall be able to set float rate for user
            it(`LumoStakingPool: shall be able to #addCustodian`, async () => {
                await contract.addCustodian( staker1.address )
                expect( await contract.isCustodian(staker1.address) ).to.equal(true);
                expect( await contract.isCustodian(staker2.address) ).to.equal(false);
                await contract.removeCustodian(staker1.address)
                expect( await contract.isCustodian(staker1.address) ).to.equal(false);
                expect( await contract.isCustodian(staker2.address) ).to.equal(false);
            });            

        });


        describe(`LumoStakingPool: staking is correct`, () => {

            // white list staking contractand add pool w/ 2second lockup period
            beforeEach( async () => {
                await token.whiteListStakingContract(contract.address);
                await contract.addPool(pool1.address,3);
            });

            const stake_amt1 = 200;
            const stake_amt2 = 150;

            // stake w/ correct values
            it(`LumoStakingPool: it shall be able to stake`, async () => {
                await contract.stake( stake_amt1, pool1.address );
                expect ( await token.balanceOf(contract.address) ).to.equal( stake_amt1 );
                expect ( await contract.readStakingAmount(pool1.address, admin.address) ).to.equal(stake_amt1)
                expect ( await contract.readFloatRate(pool1.address, admin.address) ).to.equal( await contract.readRiskFreeRate() )
                expect ( await contract.readTotalStakedVolume() ).to.equal(stake_amt1);

                await contract.stake( stake_amt2, pool1.address );
                expect ( await token.balanceOf(contract.address) ).to.equal( stake_amt1 + stake_amt2 );
                expect ( await contract.readStakingAmount(pool1.address, admin.address) ).to.equal(stake_amt1 + stake_amt2)
                expect ( await contract.readTotalStakedVolume() ).to.equal(stake_amt1 + stake_amt2);
                // console.log(  await contract.readStakingTimeStamp(pool1.address, admin.address) )
            })

        });

        describe(`LumoStakingPool: #unstaking is correct`, () => {

            var admin_balance_1;

            const stake_amt1 = 1000;
            const float_1 = 1600;
            var init_supply = 0;

            // white list staking contractand add pool w/ 2second lockup period
            beforeEach( async () => {

                await token.whiteListStakingContract(contract.address);
                await contract.addPool(pool1.address,3);
                admin_balance_1 = await token.balanceOf(admin.address);
                await contract.stake( stake_amt1, pool1.address );
                init_supply = await token.totalSupply();
            });            

            // stake/unstake fail w/i lockup period
            it(`LumoStakingPool: [Should Fail] it not shall be able to stake and immediately unstake`, async () => {
                try {
                    expect ( await token.balanceOf(contract.address) ).to.equal( stake_amt1 );
                    expect ( await contract.readStakingAmount(pool1.address, admin.address) ).to.equal(stake_amt1)
                    expect ( await contract.readFloatRate(pool1.address, admin.address) ).to.equal( await contract.readRiskFreeRate() )
                    expect ( await contract.readTotalStakedVolume() ).to.equal(stake_amt1);
                    await contract.unstake( pool1.address );
                } catch (e) {
                    console.log(`\t: unstaking failed as expected ${e.message}`)
                }
            })      

            it(`LumoStakingPool: it shall be able to stake and unstake after lockup period ends`, function(done){

                // done() is provided by it() to indicate asynchronous completion
                // call done() with no parameter to indicate that it() is done() and successful
                // or with an error to indicate that it() failed
                setTimeout( async function () {
                    // Called from the event loop, not it()
                    // So only the event loop could capture uncaught exceptions from here

                    try {

                        let rfr = await contract.readFloatRate(pool1.address, admin.address);
                        let interest_accrued = stake_amt1 * rfr/10000;
                        let computed_balance_2 = admin_balance_1 + interest_accrued;

                        let actual_interest_accured = await contract.readInterestDue(pool1.address, admin.address);
                        let actual_balance_due      = await contract.readBalanceDue(pool1.address, admin.address);

                        expect( interest_accrued ).to.equal(actual_interest_accured)

                        await contract.unstake( pool1.address );

                        // contract state correct
                        expect( await token.balanceOf(contract.address) ).to.equal(0);
                        expect( await contract.readStakingAmount(pool1.address, admin.address) ).to.equal(0);
                        expect( await contract.readFloatRate(pool1.address, admin.address) ).to.equal(0);
                        expect( await contract.readStakingTimeStamp(pool1.address, admin.address) ).to.equal(0);
                        expect( await contract.readTotalInterestVolume() ).to.equal(interest_accrued);

                        // token total supply has increasted by inters
                        let actual_admin_balance = await token.balanceOf(admin.address);
                        // expect( computed_balance_2 - actual_admin_balance ).to.equal( 0 )

                        // success: call done with no parameter to indicate that it() is done()
                        done(); 
                    } catch( e ) {
                        // failure: call done with an error Object to indicate that it() failed
                        done( e ); 
                    }
                }, 3000 );
                // returns immediately after setting timeout
                // so it() can no longer catch exception happening asynchronously
            })

            it(`LumoStakingPool: it shall be able to stake, change interest rate and unstake after lockup period ends`, function(done){

                // done() is provided by it() to indicate asynchronous completion
                // call done() with no parameter to indicate that it() is done() and successful
                // or with an error to indicate that it() failed
                setTimeout( async function () {

                    // Called from the event loop, not it()
                    // So only the event loop could capture uncaught exceptions from here

                    await contract.setFloatRate( pool1.address, admin.address, float_1 );
                    expect( await contract.readFloatRate(pool1.address, admin.address) ).to.equal(float_1);

                    try {

                        let rfr = await contract.readFloatRate(pool1.address, admin.address);
                        let interest_accrued = stake_amt1 * rfr/10000;
                        let computed_balance_2 = admin_balance_1 + interest_accrued;

                        let actual_interest_accured = await contract.readInterestDue(pool1.address, admin.address);
                        let actual_balance_due      = await contract.readBalanceDue(pool1.address, admin.address);

                        console.log( actual_balance_due, actual_interest_accured )

                        expect( interest_accrued ).to.equal(actual_interest_accured)

                        await contract.unstake( pool1.address );

                        // contract state correct
                        expect( await token.balanceOf(contract.address) ).to.equal(0);
                        expect( await contract.readStakingAmount(pool1.address, admin.address) ).to.equal(0);
                        expect( await contract.readFloatRate(pool1.address, admin.address) ).to.equal(0);
                        expect( await contract.readStakingTimeStamp(pool1.address, admin.address) ).to.equal(0);
                        expect( await contract.readTotalInterestVolume() ).to.equal(interest_accrued);

                        // token total supply has increasted by inters
                        let actual_admin_balance = await token.balanceOf(admin.address);
                        // expect( computed_balance_2 - actual_admin_balance ).to.equal( 0 )

                        // success: call done with no parameter to indicate that it() is done()
                        done(); 
                    } catch( e ) {
                        // failure: call done with an error Object to indicate that it() failed
                        done( e ); 
                    }
                }, 3000 );
                // returns immediately after setting timeout
                // so it() can no longer catch exception happening asynchronously
            })
        });


        describe(`LumoStakingPool: admin #_staking is correct`, () => {

            const stake_amt1 = 200;
            const stake_amt2 = 150;

            // white list staking contractand add pool w/ 2second lockup period
            beforeEach( async () => {
                await token.whiteListStakingContract(contract.address);
                await token.mint(staker1.address, stake_amt1 + stake_amt2 * 2)
                await contract.addPool(pool1.address,3);
            });

            // stake w/ correct values
            it(`LumoStakingPool: it shall be able to _stake`, async () => {
                await contract._stake( pool1.address, staker1.address, stake_amt1, );
                expect ( await token.balanceOf(contract.address) ).to.equal( stake_amt1 );
                expect ( await contract.readStakingAmount(pool1.address, staker1.address) ).to.equal(stake_amt1)
                expect ( await contract.readFloatRate(pool1.address, staker1.address) ).to.equal( await contract.readRiskFreeRate() )
                expect ( await contract.readTotalStakedVolume() ).to.equal(stake_amt1);

                await contract._stake( pool1.address, staker1.address, stake_amt2, );
                expect ( await token.balanceOf(contract.address) ).to.equal( stake_amt1 + stake_amt2 );
                expect ( await contract.readStakingAmount(pool1.address, staker1.address) ).to.equal(stake_amt1 + stake_amt2)
                expect ( await contract.readTotalStakedVolume() ).to.equal(stake_amt1 + stake_amt2);
                // console.log(  await contract.readStakingTimeStamp(pool1.address, admin.address) )
            })

        });

        describe(`LumoStakingPool: #_unstaking is correct`, () => {

            var staker_balance_1;

            const stake_amt1 = 1000;
            const float_1 = 1600;
            var init_supply = 0;

            // white list staking contractand add pool w/ 2second lockup period
            beforeEach( async () => {

                await token.mint(staker1.address, stake_amt1 * 2)
                await token.whiteListStakingContract(contract.address);

                await contract.addPool(pool1.address,3);
                staker_balance_1 = await token.balanceOf(staker1.address);
                await contract._stake( pool1.address, staker1.address, stake_amt1 );
                init_supply = await token.totalSupply();
            });            

            // stake/unstake fail w/i lockup period
            it(`LumoStakingPool: [Should Fail] it not shall be able to _stake and immediately _unstake`, async () => {
                try {
                    expect ( await token.balanceOf(contract.address) ).to.equal( stake_amt1 );
                    expect ( await contract.readStakingAmount(pool1.address, staker1.address) ).to.equal(stake_amt1)
                    expect ( await contract.readFloatRate(pool1.address, staker1.address) ).to.equal( await contract.readRiskFreeRate() )
                    expect ( await contract.readTotalStakedVolume() ).to.equal(stake_amt1);
                    await contract._unstake( pool1.address,staker1.address );
                } catch (e) {
                    console.log(`\t: #_unstaking failed as expected ${e.message}`)
                }
            })      

            it(`LumoStakingPool: it shall be able to _stake and _unstake after lockup period ends`, function(done){

                // done() is provided by it() to indicate asynchronous completion
                // call done() with no parameter to indicate that it() is done() and successful
                // or with an error to indicate that it() failed
                setTimeout( async function () {
                    // Called from the event loop, not it()
                    // So only the event loop could capture uncaught exceptions from here

                    try {

                        let rfr = await contract.readFloatRate(pool1.address, staker1.address);
                        let interest_accrued = stake_amt1 * rfr/10000;
                        let computed_balance_2 = staker1_balance + interest_accrued;

                        let actual_interest_accured = await contract.readInterestDue(pool1.address, staker1.address);
                        let actual_balance_due      = await contract.readBalanceDue(pool1.address, staker1.address);

                        expect( interest_accrued ).to.equal(actual_interest_accured)

                        await contract._unstake( pool1.address, staker1.address );

                        // contract state correct
                        expect( await token.balanceOf(contract.address) ).to.equal(0);
                        expect( await contract.readStakingAmount(pool1.address, staker1.address) ).to.equal(0);
                        expect( await contract.readFloatRate(pool1.address, staker1.address) ).to.equal(0);
                        expect( await contract.readStakingTimeStamp(pool1.address, staker1.address) ).to.equal(0);
                        expect( await contract.readTotalInterestVolume() ).to.equal(interest_accrued);

                        // token total supply has increasted by inters
                        let actual_staker1_balance = await token.balanceOf(staker1.address);
                        console.log(actual_staker1_balance)
                        // expect( computed_balance_2 - actual_admin_balance ).to.equal( 0 )

                        // success: call done with no parameter to indicate that it() is done()
                        done(); 
                    } catch( e ) {
                        // failure: call done with an error Object to indicate that it() failed
                        done( e ); 
                    }
                }, 3000 );
                // returns immediately after setting timeout
                // so it() can no longer catch exception happening asynchronously
            })
        });

        describe(`LumoStakingPool: admin #batchSetFloatRates is correct`, () => {

            let ir1 = 2200;
            let ir2 = 1600;

            // white list staking contractand add pool w/ 2second lockup period
            beforeEach( async () => {
                await token.whiteListStakingContract(contract.address);
                await contract.addPool(pool1.address,3);
            });

            // stake w/ correct values
            it(`LumoStakingPool: it shall be able to batch set interest rates`, async () => {
                await contract.batchSetFloatRates( pool1.address, [staker1.address, staker2.address], [ir1,ir2] );
                expect( await contract.readFloatRate(pool1.address, staker1.address) ).to.equal(ir1);
                expect( await contract.readFloatRate(pool1.address, staker2.address) ).to.equal(ir2);
            })

        });


        describe(`LumoStakingPool: admin #batchUnstake is correct`, () => {

            var staker_balance_1;

            const stake_amt1 = 1000;
            const stake_amt2 = 1000;

            let ir1 = 2200;
            let ir2 = 1600;

            var init_supply = 0;

            // white list staking contractand add pool w/ 2second lockup period
            beforeEach( async () => {

                await token.mint(staker1.address, stake_amt1 * 2);
                await token.mint(staker2.address, stake_amt2 * 2);
                await token.whiteListStakingContract(contract.address);

                await contract.addPool(pool1.address,3);
                staker_balance_1 = await token.balanceOf(staker1.address);

                await contract._stake( pool1.address, staker1.address, stake_amt1 );
                await contract._stake( pool1.address, staker2.address, stake_amt2 )

            });            

            it(`LumoStakingPool: it shall be able to #batchUnstake after lockup period ends`, function(done){

                // done() is provided by it() to indicate asynchronous completion
                // call done() with no parameter to indicate that it() is done() and successful
                // or with an error to indicate that it() failed
                setTimeout( async function () {
                    // Called from the event loop, not it()
                    // So only the event loop could capture uncaught exceptions from here

                    try {

                        await contract.batchUnstake( pool1.address, [staker1.address, staker2.address] );
                        expect( await token.balanceOf(contract.address) ).to.equal(0);
                        expect( await contract.readStakingAmount(pool1.address, staker1.address) ).to.equal(0);
                        expect( await contract.readStakingAmount(pool1.address, staker2.address) ).to.equal(0);
                        expect( await contract.readFloatRate(pool1.address, staker1.address) ).to.equal(0);
                        expect( await contract.readFloatRate(pool1.address, staker2.address) ).to.equal(0);

                        // success: call done with no parameter to indicate that it() is done()
                        done(); 
                    } catch( e ) {
                        // failure: call done with an error Object to indicate that it() failed
                        done( e ); 
                    }
                }, 3000 );
                // returns immediately after setting timeout
                // so it() can no longer catch exception happening asynchronously
            })


            it(`LumoStakingPool: it shall be able to #batchUnstakeWithRates with defined rates after lockup period ends`, function(done){

                // done() is provided by it() to indicate asynchronous completion
                // call done() with no parameter to indicate that it() is done() and successful
                // or with an error to indicate that it() failed
                setTimeout( async function () {
                    // Called from the event loop, not it()
                    // So only the event loop could capture uncaught exceptions from here

                    try {

                        await contract.batchUnstakeWithRates( pool1.address, [staker1.address, staker2.address], [ir1,ir2] );
                        expect( await token.balanceOf(contract.address) ).to.equal(0);
                        expect( await contract.readStakingAmount(pool1.address, staker1.address) ).to.equal(0);
                        expect( await contract.readStakingAmount(pool1.address, staker2.address) ).to.equal(0);
                        expect( await contract.readFloatRate(pool1.address, staker1.address) ).to.equal(0);
                        expect( await contract.readFloatRate(pool1.address, staker2.address) ).to.equal(0);

                        console.log(await token.balanceOf(staker1.address))
                        console.log(await token.balanceOf(staker2.address))

                        // success: call done with no parameter to indicate that it() is done()
                        done(); 
                    } catch( e ) {
                        // failure: call done with an error Object to indicate that it() failed
                        done( e ); 
                    }
                }, 3000 );
                // returns immediately after setting timeout
                // so it() can no longer catch exception happening asynchronously
            })


        });




    })
});

*/

