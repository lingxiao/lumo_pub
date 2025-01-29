/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: ERC721SplitterV2.sol test
 * @Date   : 12/10/2022
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
 * english auction: https://solidity-by-example.org/app/english-auction/
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
    , erc721_test_can_set_price    
    , erc721_test_can_read_paused
    , erc721_test_can_create_reward
    , erc721_test_shall_be_able_to_claim_reward
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
    splitter_test_shall_auction_to_highest_bidder,
    splitter_test_shall_fail_sell_when_not_in_auction_mode,
    splitter_test_be_able_to_cancelBid,
    splitter_test_be_able_to_send_funds_to_new_owner_after_buyContract,
} = require('./PaymentSplitterV1');


/******************************************************
    @constants
******************************************************/

const cost = 10;
const eth_sent = 10;
const ABI = (ERC721_ABI).concat(SPLITTER_ABI);


async function sendEth({ source, target, value }){
    await source.sendTransaction({ to: target.address, value: ethers.utils.parseEther(`${value}`) });
}


runERC721SplitterV2_test();

/******************************************************
    @run tests
******************************************************/


async function runERC721SplitterV2_test(){

    describe("ERC721SplitterV2.sol => PaymentSplitterV2/ERC721LumoV1 basic API test", function(){

        it('...running all tests', async function(){

            var witness;
            var paymentSplitter, erc721, proxy, _proxy;
            var mktPlace, seller, buyer_1, buyer_2, nobody;        
            var initial_split = [];
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

                initial_split = {
                    pks: [mktPlace.address,seller.address],
                    shares: [5,95],
                }            

                // deploy logic contract for 721
                const ERC721LumoV2 = await ethers.getContractFactory(`ERC721LumoV2`);
                erc721 = await ERC721LumoV2.deploy();

                // deploy logic contract for splitter
                const PaymentSplitterV2 = await ethers.getContractFactory(`PaymentSplitterV2`);
                paymentSplitter = await PaymentSplitterV2.deploy();

                // deploy proxy and set impl.
                const ERC721SplitterProxy = await ethers.getContractFactory('ERC721SplitterProxy');
                _proxy = await ERC721SplitterProxy.deploy();
                await _proxy.deployed();
                await _proxy.initializeERC721SplitterProxy(
                    witness.address,
                    mktPlace.address, 
                    erc721.address,
                    paymentSplitter.address,
                    initial_split.pks, 
                    initial_split.shares, 
                    'lumo',
                    'LMO',
                    'lumo.xyz/api/v1',
                    cost
                );

                // create proxy instance;
                proxy = new ethers.Contract(_proxy.address, ABI, seller);
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
                    isProxy:true, // set how exceptions are handled
                }

            });

            // deployed correctly
            describe("ERC721SplitterV2 => ERC721LumoV2/PaymentSplitter: contract deployed with correct initial value ", () => {

                it("ERC721LumoV1: deployed with correct initial values", async () => {
                    await erc721_test_on_deploy(test_params);
                });

                it("ERC721LumoV1 => PaymentSplitter deployed with correct initial values", async () => {
                    await splitter_test_shall_have_correct_initial_values(test_params);
                });

                it("ERC721SplitterV2: can deploy another contract w/ new states", async () => {
                    await proxy.setIsMinting(true);
                    const ERC721SplitterProxy = await ethers.getContractFactory('ERC721SplitterProxy');
                    let _proxy2 = await ERC721SplitterProxy.deploy();
                    await _proxy2.deployed();
                    await _proxy2.initializeERC721SplitterProxy(
                        witness.address,
                        mktPlace.address, 
                        erc721.address,
                        paymentSplitter.address,
                        initial_split.pks, 
                        initial_split.shares, 
                        '2ndcontract',
                        'CON',
                        'lumoapp.xyz/api/v1',
                        22,
                    );
                    const proxy2 = new ethers.Contract(_proxy2.address, ABI, seller);
                    expect( await proxy2.getPrice() ).to.equal(22);
                    expect( await proxy2.isPaused() ).to.equal(false);
                    expect( await proxy2.balanceOf(buyer_1.address) ).to.equal(0);
                    expect( await proxy2.getERC721Owner() ).to.equal(seller.address);
                    expect( await proxy2.name() ).to.equal("2ndcontract");
                    expect( await proxy2.symbol() ).to.equal("CON");
                })

                it("ERC721SplitterV2: cannot re-init", async () => {
                    try {
                        await _proxy.initializeERC721SplitterProxy(
                            witness.address,
                            mktPlace.address, 
                            erc721.address,
                            paymentSplitter.address,
                            initial_split.pks, 
                            initial_split.shares, 
                            'lumo',
                            'LMO',
                            'lumo.xyz/api/v1',
                            cost
                        )
                    } catch (error) {
                        assert(error.message === errorString({ isProxy:true, str: "contract already initialized" }) )
                    }
                });

                it("ERC721LumoV1 => ERC721LumoV1 shall have admin roles", async () => {
                    expect( await proxy.getERC721Owner() ).to.equal(seller.address);
                    await proxy.setIsMinting(false);
                    expect( await proxy.isPaused() ).to.equal(true);
                    await proxy.setIsMinting(true);
                    expect( await proxy.isPaused() ).to.equal(false);
                });

            });

            // can mint
            describe("ERC721SplitterV2 => ERC721 #mint as intended", () => {

                // resume mint
                beforeEach( async () => {
                    await proxy.setIsMinting(true)
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

            // set price
            describe("ERC721 #setPrice tests", () => {

                // resume mint
                beforeEach( async () => {
                    await proxy.setIsMinting(true);
                });                  

                it("ERC721 can #setPrice with correct value", async () => {
                    await erc721_test_can_set_price(test_params);
                });
            });

            // test claimReward
            describe("ERC721 #createReward #claimReward tests", () => {

                // resume mint
                beforeEach( async () => {
                    await proxy.setIsMinting(true);
                });                  

                it("ERC721 can #createReward and #getReward", async () => {
                    await erc721_test_can_create_reward(test_params);
                });

                it("ERC721 can #claimReward", async () => {
                    await erc721_test_shall_be_able_to_claim_reward(test_params);
                });

            });

            // payment splitter can split payments on deployed
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

            // payout values are correct
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
            });             

            // contract sales work as intended
            describe(`PaymentSplitter: can reassign owner`, () => {

                it(`PaymentSplitter: shall not be able to #auction when not in auction state or bid value too low`, async () => {
                    await splitter_test_shall_fail_sell_when_not_in_auction_mode(test_params);
                    // start bid but bid lower than antipciated
                    await proxy.connect(seller).startContractAuction(100, true);
                    expect( await proxy.getAuctionIdx() ).to.equal(1);
                    try {
                        await proxy.connect(seller).setIsMinting(true);
                    } catch (error) {
                        console.log(error.message, "<-- should have error");
                        // assert(error.message === errorString({ isProxy: true, str: "Cannot resume mint when auction in progress" }) );
                    }                                        
                    try {
                        await proxy.connect(nobody).bidForContract({value:99});
                    } catch (error) {
                        assert(error.message === errorString({ isProxy: true, str: "Please bid an amt higher than current bid" }) );
                    }        

                    // shall succ
                    await proxy.connect(nobody).bidForContract({value:101});
                    let bid = await proxy.getHighestBid();
                    let bid2 = await proxy.getBidAtRoundFor(1, nobody.address);
                    // console.log('>>', bid, bid2);
                    expect(bid.length).to.equal(4);
                    expect(bid[0]).to.equal(nobody.address);
                    expect(bid[1]).to.equal(101);
                    expect(bid[0]).to.equal(bid2[0])
                    expect(bid[1]).to.equal(bid2[1])
                    expect(bid[2]).to.equal(bid2[2])
                    // shall fail
                    try {
                        await proxy.connect(nobody).bidForContract({value:100});
                    } catch (error) {
                        assert(error.message === errorString({ isProxy: true, str: "Please bid an amt higher than current bid" }) );
                    }        
                });            

                it(`PaymentSplitter: shall be able to #auction when price > balance`, async () => {
                    await splitter_test_shall_auction_to_highest_bidder(test_params);
                });

                it(`PaymentSplitter: shall be able to #cancelBid`, async () => { 
                    await splitter_test_be_able_to_cancelBid(test_params);
                });
            
                it(`PaymentSplitter: shall be able to send funds new owner after #auction`, async () => { 
                    await splitter_test_be_able_to_send_funds_to_new_owner_after_buyContract(test_params);
                });             

            });
        });
    });
}



















