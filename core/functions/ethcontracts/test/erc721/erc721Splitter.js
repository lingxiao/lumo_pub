/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: ERC721Splitter.sol test
 * @Date   : 12/2/2022
 * @Run    : `npx hardhat test`
 * @Source : https://forum.openzeppelin.com/t/error-contract-is-not-upgrade-safe-use-of-delegatecall-is-not-allowed/16859/5
 * @Doc    : https://dev.to/abhikbanerjee99/testing-your-upgradeable-smart-contract-2fjd
 *         : https://dev.to/abhikbanerjee99/understanding-upgradeable-smart-contracts-hands-on-1c00
 *         : https://eips.ethereum.org/EIPS/eip-1822
 * @dev    : https://medium.com/deeblueangel/how-to-write-an-upgradeable-erc721-nft-contract-b0d51e74a89f
 *         : https://ethereum.stackexchange.com/questions/31515/how-to-check-the-size-of-a-contract-in-solidity
 * 
 * import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol"; * 
 * 
 * payment upgradeable: https://etherscan.io/address/B63238B016B99DC0C9C0B00907F358CB9205FB6B#code
 *                    : https://forum.openzeppelin.com/t/creating-a-contract-with-paymentsplitterupgradeable/30103/5
 * royalty : https://github.com/ProjectOpenSea/operator-filter-registry 
 *         : https://github.com/ProjectOpenSea/operator-filter-registry
 * 
 * contract size: `cat ERC721SplitterProxy.json | jq -r '.deployedBytecode' | wc -c`
 *
 * openzeppelin doc: https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable
 * >>> nested proxies: https://hiddentao.com/archives/2020/05/28/upgradeable-smart-contracts-using-diamond-standard
 * 
 * original fun: https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/3c53db11bf93167a918ad3172881938c60227cdd/contracts/token/ERC721/ERC721Upgradeable.sol
 * 
 * master ref: https://github.com/Jeiwan/upgradeable-proxy-from-scratch/blob/main/test/Proxy.test.js
 * https://jeiwan.net/posts/upgradeable-proxy-from-scratch/    
 * 
 * diamond: https://hiddentao.com/archives/2020/05/28/upgradeable-smart-contracts-using-diamond-standard
 *        : https://soliditydeveloper.com/eip-2535
 *        : https://github.com/mudgen/diamond-2-hardhat
 * 
 * nested delegate call: https://hiddentao.com/archives/2020/03/19/nested-delegate-call-in-solidity
 * how delegates work: https://eip2535diamonds.substack.com/p/understanding-delegatecall-and-how
 * https://consensys.github.io/smart-contract-best-practices/development-recommendations/precautions/upgradeability/
 * https://blog.openzeppelin.com/proxy-patterns/
 * 
 * reference: https://github.com/Jeiwan/upgradeable-proxy-from-scratch
 * 
*/


const { expect, assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, waffle } = require("hardhat");
const {
    constants,
} = require('@openzeppelin/test-helpers');


const {
      ERC721_ABI
    , erc721_test_on_deploy
    , erc721_test_can_mint
    , erc721_test_can_mint_batch
    , erc721_test_can_mint_with_higher_price
    , erc721_test_can_mint_with_zero_price_if_witness_provided
    , erc721_test_shall_fail_mint_if_wrong_price_with_wrong_witness
    , erc721_test_shall_fail_mint_on_repeate_ids
    , erc721_test_shall_fail_batch_mint_on_repeate_ids
    , erc721_test_shall_fail_mint_when_paused
    , erc721_test_shall_not_fail_mint_when_paused_and_resume_mint
    , erc721_test_can_whitelist_and_mint
    , erc721_test_shall_set_whitelist_to_false_and_mint
    , erc721_test_can_set_price    
    , erc721_test_can_read_paused
} = require("./erc721");

const {
    errorString,
    SPLITTER_ABI,
    splitter_test_shall_have_correct_initial_values,
    splitter_test_shall_have_correct_initial_shares,
    splitter_test_shall_have_correct_initial_releasable,
    splitter_test_shall_not_be_able_to_release_when_balance_zero,
    splitter_test_shall_be_adjusting_shares_when_balance_zero,
    splitter_test_shall_have_correct_releasableAt_after_receiving_funds,
    splitter_test_shall_fail_upatePayoutWindow_when_funds_outstanding,
    splitter_test_shall_hardWithdrawlEth_and_resume_ops,
    splitter_test_shall_be_able_to_releaseWindow,
    splitter_test_shall_be_able_to_releaseWindow_and_update_shares,
    splitter_test_shall_have_correct_releasble_funds_after_release,
    splitter_test_shall_have_correct_released_funds_after_current_window_released_and_new_shares_defined,
    splitter_test_shall_fail_to_hardwithdrawl_given_wrong_witness,
    splitter_test_succ_reassign_owner_when_balance_0_but_fail_when_balance_gt_price,
    splitter_test_shall_reassignOwner_when_price_gt_balance,
    splitter_test_shall_fail_reassign_owner_when_wrong_witness_called,
    splitter_test_be_able_to_send_funds_to_new_owner_after_reassignOwner,
} = require('./PaymentSplitterV1');


/******************************************************
    @constants
******************************************************/

const cost = 10;
const eth_sent = 10;
const ABI = ERC721_ABI.concat(SPLITTER_ABI);


async function sendEth({ source, target, value }){
    await source.sendTransaction({ to: target.address, value: ethers.utils.parseEther(`${value}`) });
}


// runERC721Splitter_test();

/******************************************************
    @run tests
******************************************************/


async function runERC721Splitter_test(){

    describe("ERC721SplitterV1.sol => PaymentSplitterV1/ERC721LumoV1 basic API test", function(){

        it('ERC721SplitterV1: shall deploy correctly with initial share', async function(){

            var witness;
            var erc721Splitter, erc721, splitter, proxy;
            var mktPlace, seller, buyer_1, buyer_2, nobody;        
            var initial_split = [];
            var mktPlace_balance, seller_balance = 0;
            var test_params = {};

            beforeEach(async () => {
                [ 
                    seller,
                    mktPlace, 
                    owner_1,
                    owner_2,
                    buyer_1,
                    buyer_2 ,
                    buyer_3 ,
                    nobody,
                ] = await ethers.getSigners();

                witness = mktPlace;

                // #balance before
                mktPlace_balance  = await waffle.provider.getBalance( mktPlace.address  );
                seller_balance = await waffle.provider.getBalance( seller.address );

                initial_split = {
                    pks: [mktPlace.address,seller.address],
                    shares: [5,95],
                }            

                // deploy logic contract for 721
                const ERC721 = await ethers.getContractFactory(`ERC721LumoV1`);
                erc721 = await ERC721.deploy();

                // deploy splitter
                const ERC721Splitter = await ethers.getContractFactory(`ERC721Splitter`);
                erc721Splitter = await ERC721Splitter.deploy( 
                    witness.address, 
                    initial_split.pks, 
                    initial_split.shares, 
                    erc721.address,
                    'lumo',
                    'LMO',
                    'lumo.xyz/api/v1',
                    cost,
                );
                await erc721Splitter.deployed();    

                proxy = new ethers.Contract(erc721Splitter.address, ABI, seller);

                test_params = {
                    seller, 
                    mktPlace, 
                    owner_1,
                    owner_2,
                    buyer_1,
                    buyer_2 ,
                    buyer_3 ,
                    nobody,
                    cost,
                    witness,
                    erc721: proxy,
                    splitter: proxy,
                    isProxy:true,
                }
            });

            describe("ERC721Splitter => ERC721LumoV1/PaymentSplitter: contract deployed with correct initial value ", () => {

                it("ERC721LumoV1: deployed with correct initial values", async () => {
                    await erc721_test_on_deploy(test_params);
                });

                it("ERC721LumoV1 => PaymentSplitter deployed with correct initial values", async () => {
                    await splitter_test_shall_have_correct_initial_values(test_params);
                });

                it("ERC721LumoV1 => ERC721LumoV1 shall have admin privilidges", async () => {
                    expect( await proxy.getERC721Owner() ).to.equal(seller.address);
                    expect( await proxy.isWhitelistOnly() ).to.equal(true);
                    await proxy.setIsWhiteListOnly(false)
                    expect( await proxy.isWhitelistOnly() ).to.equal(false);
                    expect( await proxy.isPaused() ).to.equal(true);
                    await proxy.resumeMint();
                    expect( await proxy.isPaused() ).to.equal(false);
                    await proxy.pauseMint();
                    expect( await proxy.isPaused() ).to.equal(true);
                });

            });

            describe("ERC721Splitter => ERC721 #mint as intended", () => {

                // resume mint
                beforeEach( async () => {
                    await proxy.setIsWhiteListOnly(false)
                });                  

                it("ERC721LumoV1: can #mint", async () => {
                    await erc721_test_can_mint(test_params);
                });

                it("ERC721LumoV1: can #mintBatch", async () => {
                    await erc721_test_can_mint_batch(test_params);
                });

                it("ERC721LumoV1: shall fail to #mint if wrong price provided with bad witness", async () => {
                    await erc721_test_shall_fail_mint_if_wrong_price_with_wrong_witness(test_params);
                });

                it("ERC721LumoV1: shall [NOT] fail to #mint if higher price provided", async () => {
                    await erc721_test_can_mint_with_higher_price(test_params);
                });

                it("ERC721LumoV1: shall [NOT] fail to #mint if zero price provided with correct witness", async () => {
                    await erc721_test_can_mint_with_zero_price_if_witness_provided(test_params);
                });                

                it("ERC721LumoV1: shall fail #mint if repeate ids", async () => {
                    await erc721_test_shall_fail_mint_on_repeate_ids(test_params);
                });

                it("ERC721LumoV1: shall fail #mintBatch if repeate ids", async () => {
                    await erc721_test_shall_fail_batch_mint_on_repeate_ids(test_params);
                });

                it("ERC721LumoV1: can read #isPaused", async () => {
                    await erc721_test_can_read_paused(test_params);
                });

                it("ERC721LumoV1: should fail: can #pause, then cannot mint", async () => {
                    await erc721_test_shall_fail_mint_when_paused(test_params)
                });

                it("ERC721LumoV1: can #pause  then #resumeMint and #mint", async () => {
                    await erc721_test_shall_not_fail_mint_when_paused_and_resume_mint(test_params)
                });

            });             

            // test whtelisting is capable as intended
            describe("ERC721 #whitelist & #setPrice tests", () => {

                // resume mint
                beforeEach( async () => {
                    await proxy.resumeMint();
                });                  

                it("ERC721LumoV1: shall be able to set whitelist = true &&  fail #mint", async () => {
                    await erc721_test_can_whitelist_and_mint(test_params);
                });

                it("ERC721LumoV1: shall be able to set whitelist = false && #mint", async () => {
                    await erc721_test_shall_set_whitelist_to_false_and_mint(test_params)
                });

                it("ERC721 can #setPrice with correct value", async () => {
                    await erc721_test_can_set_price(test_params);
                });
            });

            // payment splitter tests
            describe(`PaymentSplitter: splits on deploy are correct`, () => {

                it(`PaymentSplitter: shall have correct initial #windowIndex and #totalSharesAtWindow`, async () => {
                    await splitter_test_shall_have_correct_initial_values(test_params)
                });


                it(`PaymentSplitter: shall have correct initial individual shares: #sharesAtWindow and #payeeAt`, async () => {
                    await splitter_test_shall_have_correct_initial_shares(test_params)
                });            

                it(`PaymentSplitter: shall have correct initial #releasedAtWindow shares and #releasableAt`, async () => {
                    await splitter_test_shall_have_correct_initial_releasable(test_params);
                })              

                // this reverts as expected
                it(`PaymentSplitter: shall [NOT] be able to release ether  when balance = 0`, async () => {
                    await splitter_test_shall_not_be_able_to_release_when_balance_zero(test_params);
                })    

                it(`PaymentSplitter: shall be able to adjust payout splits when balance = 0`, async () => {
                    await splitter_test_shall_be_adjusting_shares_when_balance_zero(test_params);
                })   


                it(`PaymentSplitter: should fail: shall [ not ] be able to #hardWithdrawlEth given wrong witness`, async () => {
                    await splitter_test_shall_fail_to_hardwithdrawl_given_wrong_witness(test_params);
                });                  

            });

            // test payouts
            describe(`PaymentSplitter: payouts are correct and can payout again after current window released`, async () => {

                var _pks = [];

                // send some eth to contract
                beforeEach(async () => {
                    await sendEth({ source: buyer_1, target: proxy, value: eth_sent });
                    _pks = [mktPlace.address, seller.address, buyer_1.address];

                })

                it(`PaymentSplitter: shall have same initial #windowIndex and #releaseIndex after receiving funds`, async () => {
                    await splitter_test_shall_have_correct_initial_values(test_params);
                });            

                it(`PaymentSplitter: shall have correct #releasableAt after receiving funds`, async () => {
                    await splitter_test_shall_have_correct_releasableAt_after_receiving_funds(test_params);
                });

                it(`PaymentSplitterV1: should fail: shall [ NOT ] be able to #updatePayoutWindow when there's funds due`, async () => {
                    await splitter_test_shall_fail_upatePayoutWindow_when_funds_outstanding(test_params);
                });

                it(`PaymentSplitter: fault recovery ==> shall be able to #hardWithdrawlEth given correct witness, and then shall be able to payout again`, async () => {
                    await splitter_test_shall_hardWithdrawlEth_and_resume_ops(test_params);
                });           

                it(`PaymentSplitter: shall have correct #releasableAt, #releaseIndex, and receiver shall have recieved after #releaseCurrentWindow`, async () => {
                    await splitter_test_shall_be_able_to_releaseWindow(test_params);
                });            

                it(`PaymentSplitter: shall be able to update window after payouts have completed`, async () => {
                    await splitter_test_shall_be_able_to_releaseWindow_and_update_shares({...test_params, _pks});
                });

                it(`PaymentSplitter: shall have correct releasable funds after prev payable released, and new splits defined`, async () => {
                    await splitter_test_shall_have_correct_releasble_funds_after_release({...test_params, _pks});
                });

                it(`PaymentSplitter: shall be able to #releaseCurrentWindow with correct amt, after last window has been released`, async () => {
                    await splitter_test_shall_have_correct_released_funds_after_current_window_released_and_new_shares_defined({...test_params, _pks});
                });

            })             

            // reassign owner
            describe(`PaymentSplitter: can reassign owner`, () => {

                it(`PaymentSplitter: shall be able to #reassignOwner when balance is zero but fail when balance > 0`, async () => {
                    await splitter_test_succ_reassign_owner_when_balance_0_but_fail_when_balance_gt_price(test_params);
                });

                it(`PaymentSplitter: shall be able to #reassignOwner when price > balance`, async () => {
                    await splitter_test_shall_reassignOwner_when_price_gt_balance(test_params);
                });

                it(`PaymentSplitter: shall not be able to #reassignOwner with wrong witness or caller`, async () => {
                    await splitter_test_shall_fail_reassign_owner_when_wrong_witness_called(test_params);
                });            

                it(`PaymentSplitter: shall be able to send funds new owner after #reassignOwner`, async () => { 
                    await splitter_test_be_able_to_send_funds_to_new_owner_after_reassignOwner(test_params);
                });
     
            });

        });

    });

}



















