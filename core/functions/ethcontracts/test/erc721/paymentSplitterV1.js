/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: PaymentSplitterV1.sol test
 * @Date   : 12/3/2022
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
 *                    : https://forum.openzeppelin.com/t/creating-a-contract-with-PaymentSplitterV1upgradeable/30103/5
 *                    : https://forum.openzeppelin.com/t/creating-a-contract-with-paymentsplitterupgradeable/30103/5
 * 
*/


const { expect, assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, waffle } = require("hardhat");
const {
    constants,
} = require('@openzeppelin/test-helpers');

/******************************************************
    @run test
******************************************************/

// runSplitterTest({ run_v1_test: true });
// runSplitterTest({ run_v1_test: false });

/******************************************************
    @utils and constants
******************************************************/


async function sendEth({ source, target, value }){
    await source.sendTransaction({ to: target.address, value: ethers.utils.parseEther(`${value}`) });                
}

function errorString({ isProxy, str }){
    if (isProxy){
        return `VM Exception while processing transaction: reverted with reason string '${str}'`
    } else {
        return str;
    }
}

const eth_to_wei = 1000000000000000000;
const eth_sent = 10;
const wei_sent = eth_sent * eth_to_wei;
const _shares = [5,45,50];   

/******************************************************
    @test fns
******************************************************/

const SPLITTER_ABI = [
    "function initializePaymentSplitterV1(address witness, address[] memory payees, uint256[] memory shares_) public",
    "function setPaymentSplitterInitValue(address witness, address[] memory payees, uint256[] memory shares_) public",
    "function windowIndex() public view returns (uint256)",
    "function splitterBalance() public view returns (uint256)",
    "function getPaymentOwner() public view returns (address)",
    "function getSplitterOwner() public view returns (address)",

    "function setCarry( uint new_carry ) public",
    "function getCarry() public view returns (uint)",

    "function updatePayoutWindow(address[] memory payees, uint256[] memory shares_ ) public",
    "function releaseCurrentWindow() external",
    "function hardWithdrawlEth( address witness_ ) public",
    "function totalSharesAtWindow( uint256 idx_ ) public view returns (uint256)",
    "function totalReleasedAtWindow( uint256 idx_ ) public view returns (uint256)",
    "function sharesAtWindow( uint256 idx_, address account ) public view returns (uint256)",
    "function releasedAtWindow( uint256 idx_, address account) public view returns (uint256)",
    "function payeeAt(uint256 idx_, uint256 index) public view returns (address)",
    "function releasableAt( uint256 idx_, address account) public view returns (uint256)",
    "function maybeReleaseAt( uint256 idx_, address payable account) public",
    "function getAuctionIdx() public view returns (uint256)",
    "function getPastOwners() public view returns (address[] memory)",

    "function startContractAuction( uint256 _price,  bool is_short) public",
    "function bidForContract() public payable",
    "function cancelBidForContract() public",    
    "function endContractAuction() public",
    "function getHighestBid() public view returns (address, uint256, uint, bool)",
    "function getBidAtRoundFor(uint256 idx, address bidder) public view returns (address, uint256, uint, bool)",
    "function getAuctionState() public view returns (bool,uint)",
    "function getWinningAuction( uint256 idx_ ) public view returns (address, uint256, uint, uint, uint256, uint256)",
]


async function splitter_test_shall_have_correct_initial_values({ splitter, seller }){
    expect( await splitter.windowIndex() ).to.equal(1);
    expect( await splitter.totalSharesAtWindow(1) ).to.equal(100);
    expect( await splitter.getPaymentOwner() ).to.equal(seller.address);
}

async function splitter_test_shall_have_correct_initial_shares({ splitter, mktPlace, seller, nobody }){
    expect( await splitter.sharesAtWindow(1, mktPlace.address) ).to.equal(5);
    expect( await splitter.sharesAtWindow(1, seller.address) ).to.equal(95);
    expect( await splitter.sharesAtWindow(1, nobody.address) ).to.equal(0);
    expect( await splitter.payeeAt(1, 0) ).to.equal(mktPlace.address);
    expect( await splitter.payeeAt(1, 1) ).to.equal(seller.address);
}

async function splitter_test_shall_have_correct_initial_releasable({ splitter, mktPlace, seller, nobody }){
    expect( await splitter.releasedAtWindow(1, mktPlace.address) ).to.equal(0);
    expect( await splitter.releasedAtWindow(1, seller.address) ).to.equal(0);
    expect( await splitter.releasedAtWindow(1, nobody.address) ).to.equal(0);

    expect( await splitter.releasableAt(1, mktPlace.address ) ).to.equal(0)
    expect( await splitter.releasableAt(1, seller.address) ).to.equal(0)    
}


async function splitter_test_shall_not_be_able_to_release_when_balance_zero({ splitter, isProxy }){
    try {
        if (isProxy){
            await splitter.releaseCurrentWindow();
        } else {
            splitter.releaseCurrentWindow();            
        }
    } catch (error) {
        assert(error.message === errorString({ isProxy, str: "The ETH balance at this address is zero" }) )
    }
}

async function splitter_test_shall_be_adjusting_shares_when_balance_zero({ splitter, mktPlace, seller, nobody, buyer_1 }){
    await splitter.updatePayoutWindow( [mktPlace.address, seller.address, buyer_1.address], [5,50,45])
    expect( await splitter.windowIndex() ).to.equal(2);
}


async function splitter_test_shall_have_correct_releasableAt_after_receiving_funds({ splitter, mktPlace, seller }){
    let r1 = await splitter.releasableAt(1, mktPlace.address);
    let r2 = await splitter.releasableAt(1, seller.address);
    let a1 = BigNumber.from(`${wei_sent*5/100}`);
    let a2 = BigNumber.from(`${wei_sent*95/100}`);
    expect( r1 ).to.equal(a1)
    expect( r2 ).to.equal(a2)
}

async function splitter_test_shall_fail_upatePayoutWindow_when_funds_outstanding({ splitter, isProxy, mktPlace }){
    try {
        if (isProxy){
            await splitter.updatePayoutWindow([mktPlace.address], [100] )
        } else {
            splitter.updatePayoutWindow([mktPlace.address], [100] )            
        }
    } catch (error){
        assert(error.message === errorString({ isProxy, str: "You must release last window of payables before adjusting the shares" }) );
    }
}


async function splitter_test_shall_hardWithdrawlEth_and_resume_ops({ splitter, buyer_1, buyer_2, mktPlace, seller }){

    // 0. send some eth
    await sendEth({ source: buyer_2, target: splitter, value: 45 });

    // 1. hard withdrawl all eth
    await splitter.hardWithdrawlEth(mktPlace.address);

    // 2. send more eth to address
    let eth_amt_after_hard_withdrawl = 15;
    await sendEth({ source: buyer_2, target: splitter, value: eth_amt_after_hard_withdrawl })

    // 3. correct obligations in new window
    let a1 = BigNumber.from(`${eth_amt_after_hard_withdrawl*5/100 *eth_to_wei}`)
    let a2 = BigNumber.from(`${eth_amt_after_hard_withdrawl*95/100*eth_to_wei}`)
    expect( await splitter.releasableAt(1, mktPlace.address)  ).to.equal(a1);
    expect( await splitter.releasableAt(1, seller.address) ).to.equal(a2);

    // 4. shall payout
    await splitter.releaseCurrentWindow();
    expect( await splitter.releasableAt(1, mktPlace.address)  ).to.equal(0);
    expect( await splitter.releasableAt(1, seller.address) ).to.equal(0);

    // 5. shall be able to update shares
    await splitter.updatePayoutWindow( [mktPlace.address, seller.address], [50,55] );
    expect( await splitter.totalSharesAtWindow(1) ).to.equal(100);
    expect( await splitter.totalSharesAtWindow(2) ).to.equal(105);
    expect( await splitter.sharesAtWindow(2, mktPlace.address ) ).to.equal( 50 );
    expect( await splitter.sharesAtWindow(2, seller.address) ).to.equal( 55 );

    // 6. again, send more eth to address
    let eth_amt_after_hard_withdrawl_1 = 100;
    await sendEth({ source: buyer_2, target: splitter, value: eth_amt_after_hard_withdrawl_1 })

    // expect the new payable to be correct
    let a11 = eth_amt_after_hard_withdrawl_1*50/105*eth_to_wei
    let a21 = eth_amt_after_hard_withdrawl_1*55/105*eth_to_wei
    let c11 = Number( await splitter.releasableAt(2, mktPlace.address)  )
    let c21 = Number( await splitter.releasableAt(2, seller.address) )

    expect( a11 - c11 ).to.equal(0);
    expect( a21 - c21 ).to.equal(0);

    // release window again shall succeed
    await splitter.releaseCurrentWindow();
    expect( await splitter.releasableAt(2, mktPlace.address)  ).to.equal(0);
    expect( await splitter.releasableAt(2, seller.address) ).to.equal(0);

}


async function splitter_test_shall_be_able_to_releaseWindow({ splitter, mktPlace, seller }){

    await splitter.releaseCurrentWindow();

    // correct balance
    let r1 = await splitter.releasableAt(1, mktPlace.address);
    let r2 = await splitter.releasableAt(1, seller.address);
    expect( r1 ).to.equal(0)
    expect( r2 ).to.equal(0)

    // let b1 = new BigNumber.from(await waffle.provider.getBalance(mktPlace.address));
    // let a1 = new BigNumber.from(`${wei_sent * 5/100}`).add(mktPlace_balance);
    // console.log( b1.minus(b1) );
    // expect(b1).to.equal(a1);
    // let b2 = await waffle.provider.getBalance(seller.address);
    // let a2 = BigNumber.from(`${wei_sent * 95/100}`).add(seller_balance);
    // expect(b2).to.equal(a2);
}

async function splitter_test_shall_be_able_to_releaseWindow_and_update_shares({ splitter, mktPlace, seller, buyer_1, _pks }){

    await splitter.releaseCurrentWindow();
    await splitter.updatePayoutWindow( _pks, _shares )
    expect( await splitter.windowIndex() ).to.equal(2);

    // prev share is unchanged
    expect( await splitter.sharesAtWindow(1, mktPlace.address) ).to.equal(5);
    expect( await splitter.sharesAtWindow(1, seller.address) ).to.equal(95);

    // new window share is correct
    expect( await splitter.sharesAtWindow(2, mktPlace.address) ).to.equal(_shares[0]);
    expect( await splitter.sharesAtWindow(2, seller.address) ).to.equal(_shares[1]);
    expect( await splitter.sharesAtWindow(2, buyer_1.address) ).to.equal(_shares[2]);

    // new window totalshare is correct
    expect( await splitter.totalSharesAtWindow(2) ).to.equal(100);

}


async function splitter_test_shall_have_correct_releasble_funds_after_release({splitter, mktPlace, seller, buyer_1, buyer_2, _pks}){

    let new_eth_amt = 13;

    await splitter.releaseCurrentWindow();
    await splitter.updatePayoutWindow( _pks, _shares )

    // // prev obligations are zero
    expect( await splitter.releasableAt(1, mktPlace.address) ).to.equal(0);
    expect( await splitter.releasableAt(1, seller.address) ).to.equal(0);

    // // send new funds
    await sendEth({ source: buyer_2, target: splitter, value: new_eth_amt })

    // correct obligations in ew window
    let a = BigNumber.from(`${new_eth_amt*_shares[0]/100 *eth_to_wei}`)
    let s = BigNumber.from(`${new_eth_amt*_shares[1]/100*eth_to_wei}`)
    let b = BigNumber.from(`${new_eth_amt*_shares[2]/100*eth_to_wei}`)
    expect( await splitter.releasableAt(2, mktPlace.address) ).to.equal(a);
    expect( await splitter.releasableAt(2, seller.address) ).to.equal(s);
    expect( await splitter.releasableAt(2, buyer_1.address) ).to.equal(b);
}

async function splitter_test_shall_have_correct_released_funds_after_current_window_released_and_new_shares_defined({ splitter, mktPlace, seller, buyer_1, buyer_2, _pks}){

    let new_eth_amt = 10;

    await splitter.releaseCurrentWindow();
    await splitter.updatePayoutWindow( _pks, _shares )

    // prev obligations are zero
    expect( await splitter.releasableAt(1, mktPlace.address) ).to.equal(0);
    expect( await splitter.releasableAt(1, seller.address) ).to.equal(0);

    // send new funds
    await sendEth({ source: buyer_2, target: splitter, value: new_eth_amt })

    await splitter.releaseCurrentWindow();

    // windows are correct
    expect( await splitter.windowIndex() ).to.equal(2);

    // correct obligations in ew window
    // let a = BigNumber.from(`${new_eth_amt*5/100 *eth_to_wei}`)
    // let s = BigNumber.from(`${new_eth_amt*45/100*eth_to_wei}`)
    // let b = BigNumber.from(`${new_eth_amt*50/100*eth_to_wei}`)

    // obligations have been released
    expect( await splitter.releasableAt(2, mktPlace.address) ).to.equal(0);
    expect( await splitter.releasableAt(2, seller.address) ).to.equal(0);
    expect( await splitter.releasableAt(2, buyer_1.address) ).to.equal(0);

}


async function splitter_test_shall_fail_to_hardwithdrawl_given_wrong_witness({ splitter, isProxy, seller }){
    try {
        if (isProxy){
            await splitter.hardWithdrawlEth(seller.address)                        
        } else {
            splitter.hardWithdrawlEth(seller.address)                        
        }
    } catch (error){
        assert(error.message === errorString({ isProxy, str: 'Invalid witness provided for hard reset of payouts' }))
    }
}

/******************************************************
    @test bid/sale of contractn
******************************************************/


// @note: make sure you call pauseMint before this
async function splitter_test_shall_fail_sell_when_not_in_auction_mode({ splitter, seller, owner_1, nobody, isProxy }){
    try {
        if (isProxy){
            await splitter.connect(nobody).bidForContract({value:1000});
        } else {
            splitter.connect(nobody).bidForContract({value:1000});
        }
    } catch (error) {
        assert(error.message === errorString({ isProxy, str: "Auction has not started yet" }) );
    }

}


async function splitter_test_shall_auction_to_highest_bidder({ splitter, buyer_1, buyer_2, owner_2, nobody, seller, witness, isProxy }){

    let val = 45;
    let balance_seller_0  = await waffle.provider.getBalance( seller.address );
    let balance_buyer_1_0 = await waffle.provider.getBalance( buyer_1.address );
    let balance_buyer_2_0 = await waffle.provider.getBalance( buyer_2.address );

    // check predoncition is correct
    expect( await splitter.getAuctionIdx() ).to.equal(0);
    await sendEth({ source: nobody, target: splitter, value: val });
    expect( await splitter.splitterBalance() ).to.equal(ethers.utils.parseEther(`${val}`));

    // begin auction
    await splitter.startContractAuction(ethers.utils.parseEther(`${2*val}`), true);
    let bid_0 = await splitter.getHighestBid();
    expect(bid_0[0]).to.equal(seller.address);
    expect(bid_0[1]).to.equal(ethers.utils.parseEther(`${2*val}`));
    expect( await splitter.getAuctionIdx() ).to.equal(1);

    // seller1 bid && bid is correct;
    await splitter.connect(buyer_1).bidForContract({value: ethers.utils.parseEther(`${3*val}`)});    
    let bid_1 = await splitter.getHighestBid();
    expect(bid_1[0]).to.equal(buyer_1.address);
    expect(bid_1[1]).to.equal(ethers.utils.parseEther(`${3*val}`));

    // balance updates
    expect( balance_seller_0 ).to.gt( await waffle.provider.getBalance( seller.address ) );  
    expect( balance_buyer_1_0 ).to.gt( await waffle.provider.getBalance( buyer_1.address ) );
    expect( await splitter.splitterBalance() ).to.equal( ethers.utils.parseEther(`${3*val + val}`) ); 

    // seller2 bid  and bid is correct
    await splitter.connect(buyer_2).bidForContract({value: ethers.utils.parseEther(`${4*val}`)});
    let bid_2 = await splitter.getHighestBid();
    expect(bid_2[0]).to.equal(buyer_2.address);
    expect(bid_2[1]).to.equal(ethers.utils.parseEther(`${4*val}`));

    // balance change appropriately;
    expect( balance_buyer_2_0 ).to.gt( await waffle.provider.getBalance( buyer_2.address ) );
    expect( await splitter.splitterBalance() ).to.equal( ethers.utils.parseEther(`${4*val + val}`) ); 

    // bid history is stored;
    let bid_1a = await splitter.getBidAtRoundFor(1, buyer_1.address);
    expect(bid_1a[0]).to.equal(buyer_1.address);
    expect(bid_1a[1]).to.equal(ethers.utils.parseEther(`${3*val}`));

    // cannot withdrawl before auction ends;
    try {
        await splitter.hardWithdrawlEth(witness.address);
    } catch (error) {
        assert(error.message === errorString({ isProxy, str: 'Cannot withdrawl while auction is in progress' }));        
    }

    try {
        await splitter.releaseCurrentWindow();
    } catch (error) {
        assert(error.message === errorString({ isProxy, str: 'Cannot withdrawl while auction is in progress' }));        
    }


    console.log('\n------------------ auction ends -------------------')

    // anyone can end auction
    await splitter.connect(nobody).endContractAuction();

    // balance change appropriately;
    let balance_seller_after = await waffle.provider.getBalance(seller.address);
    let balance_buyer_2_after = await waffle.provider.getBalance(buyer_2.address);
    expect( balance_seller_0 ).to.lt( balance_seller_after) ;  // seller receive funds
    expect( balance_buyer_2_0 ).to.gt( balance_buyer_2_after);
    expect( await splitter.splitterBalance() ).to.equal( ethers.utils.parseEther(`${val}`) ); 
    let st = await splitter.getAuctionState();
    expect( st.length ).to.equal(2);
    expect(st[0]).to.equal(false);
    expect(st[1]).to.equal(0);
    expect( await splitter.getSplitterOwner() == buyer_2.address );

    let buyers = await splitter.getPastOwners();
    let contains_buyer_2 = buyers.includes(buyer_2.address);
    let contains_seller = buyers.includes(seller.address);
    let dn_contains_buyer_1 = buyers.includes(buyer_1.address) == false;

    expect(contains_seller).to.equal(true);
    expect(contains_buyer_2).to.equal(true);
    expect(dn_contains_buyer_1).to.equal(true);

    console.log("seller", balance_seller_0, balance_seller_after);
    console.log("buyer",  balance_buyer_2_0, balance_buyer_2_after);

    // highest bid zeroed out
    let hbid = await splitter.connect(buyer_2).getHighestBid();
    expect(hbid[0]).to.equal(constants.ZERO_ADDRESS);
    expect(hbid[1]).to.equal(0);
    expect(hbid[2]).to.equal(0);
    expect(hbid[3]).to.equal(true);

    // winning bid saved;
    let winning_auction = await splitter.getWinningAuction(1);
    expect(winning_auction[0]).to.equal(buyer_2.address);
    expect(winning_auction[1]).to.equal(ethers.utils.parseEther(`${4*val}`));
    expect(winning_auction[4]).to.lt(ethers.utils.parseEther(`${4*val}`));
    expect(winning_auction[5]).to.lt(ethers.utils.parseEther(`${4*val}`));

    // princple + carry = bid;
    let computed_highest_bid = winning_auction[4].add(winning_auction[5]);
    expect( computed_highest_bid  ).to.equal(winning_auction[1])

    console.log(winning_auction);

    // owner has changed;
    expect( await splitter.getPaymentOwner() ).to.equal(buyer_2.address);
    try {   
        if (isProxy){
            await splitter.connect(seller).startContractAuction(100,true);
        } else {
            splitter.connect(seller).startContractAuction(100,true);
        }
    } catch (error) {
        assert(error.message === errorString({ isProxy, str:  "Only contract owner can start auction"}));
    }        


    return val;
}

async function splitter_test_be_able_to_cancelBid({ splitter, buyer_1, seller, isProxy, nobody }){

    let val = 45;
    let balance_seller_0  = await waffle.provider.getBalance( seller.address );
    let balance_buyer_1_0 = await waffle.provider.getBalance( buyer_1.address );

    // check predoncition is correct
    await sendEth({ source: nobody, target: splitter, value: val });
    expect( await splitter.splitterBalance() ).to.equal(ethers.utils.parseEther(`${val}`));

    // begin auction
    await splitter.startContractAuction(ethers.utils.parseEther(`${2*val}`), true);
    let bid_0 = await splitter.getHighestBid();
    expect(bid_0[0]).to.equal(seller.address);
    expect(bid_0[1]).to.equal(ethers.utils.parseEther(`${2*val}`));
    expect( await splitter.getAuctionIdx() ).to.equal(1);

    // seller1 bid && bid is correct;
    await splitter.connect(buyer_1).bidForContract({value: ethers.utils.parseEther(`${3*val}`)});    
    let bid_1 = await splitter.getHighestBid();
    expect(bid_1[0]).to.equal(buyer_1.address);
    expect(bid_1[1]).to.equal(ethers.utils.parseEther(`${3*val}`));

    let balance_buyer_1_1 = await waffle.provider.getBalance( buyer_1.address );

    // balance updates
    expect( balance_seller_0 ).to.gt( await waffle.provider.getBalance( seller.address ) );  
    expect( balance_buyer_1_0 ).to.gt( await waffle.provider.getBalance( buyer_1.address ) );
    expect( await splitter.splitterBalance() ).to.equal( ethers.utils.parseEther(`${3*val + val}`) ); 

    // seller1 cancel bid
    await splitter.connect(buyer_1).cancelBidForContract();

    // balance updates correctly
    expect( await splitter.splitterBalance() ).to.equal( ethers.utils.parseEther(`${val}`) ); 
    expect( balance_buyer_1_1 ).to.lt( await waffle.provider.getBalance( buyer_1.address ) );

    // bids have been updated
    let high_bid = await splitter.getHighestBid();
    let prev_bid = await splitter.getBidAtRoundFor(1,buyer_1.address)

    expect(high_bid[0] ).to.equal(seller.address);
    expect(high_bid[1] ).to.equal(ethers.utils.parseEther(`${val}`));
    expect(high_bid[3]).to.equal(false);

    expect(prev_bid[0] ).to.equal(buyer_1.address);
    expect(prev_bid[1] ).to.equal(ethers.utils.parseEther(`${3*val}`));
    expect(prev_bid[3]).to.equal(true);

    // auction ends w/o sale. no changes;
    await splitter.connect(seller).endContractAuction();
    expect( await splitter.getPaymentOwner() ).to.equal(seller.address);
    expect( await splitter.splitterBalance() ).to.equal( ethers.utils.parseEther(`${val}`) ); 
    let end_st = await splitter.getAuctionState();
    expect( end_st[0] ).to.equal(false);
    expect( end_st[1] ).to.equal(0);

    // can withdrawl
    await splitter.releaseCurrentWindow();
    expect( await splitter.splitterBalance() ).to.equal( ethers.utils.parseEther(`${0}`) );     

}

async function splitter_test_be_able_to_send_funds_to_new_owner_after_buyContract(props){                               

    const { splitter, buyer_2, seller, mktPlace, nobody, witness } = props;

    // run prev. test w/ change of hands;
    let  _eth_sent =  await splitter_test_shall_auction_to_highest_bidder(props);
    let _wei_sent = _eth_sent * eth_to_wei;

    // correct ownership of funds after sales
    let releasableAt_mtkplace = await splitter.releasableAt(1, mktPlace.address);
    let releasableAt_seller   = await splitter.releasableAt(1, seller.address);
    let releasableAt_new_owner = await splitter.releasableAt(1, buyer_2.address);

    let five_percent = BigNumber.from(`${_wei_sent*5/100}`);
    let ninety_five_percent = BigNumber.from(`${_wei_sent*95/100}`);
    let zero_percent = BigNumber.from(`${0*95/100}`);

    expect( releasableAt_seller ).to.equal(zero_percent);
    expect( releasableAt_mtkplace ).to.equal(five_percent);
    expect( releasableAt_new_owner ).to.equal(ninety_five_percent);

    let bal_owner_0  = await waffle.provider.getBalance( buyer_2.address  );
    let bal_mktplace_0  = await waffle.provider.getBalance( mktPlace.address  );
    let bal_old_owner_0  = await waffle.provider.getBalance( seller.address  );

    // release funds
    await splitter.releaseCurrentWindow();
    let bal_buyer_2  = await waffle.provider.getBalance( buyer_2.address  );
    let bal_mktplace_1  = await waffle.provider.getBalance( mktPlace.address  );
    let bal_old_buyer_2  = await waffle.provider.getBalance( seller.address  );

    // funds should have been released;
    expect(bal_old_buyer_2).to.lt(bal_old_owner_0);
    expect(bal_mktplace_0).to.lt(bal_mktplace_1);
    expect(bal_owner_0).to.lt(bal_buyer_2);

    // can update payout 
    expect( await splitter.windowIndex() ).to.equal(1);
    await splitter.updatePayoutWindow([witness.address, seller.address], [500,500]);    
    expect( await splitter.windowIndex() ).to.equal(2);
    expect( await splitter.sharesAtWindow(2,witness.address) ).to.equal(500);
    expect( await splitter.sharesAtWindow(2,seller.address) ).to.equal(500);

}

/******************************************************
    @export test
******************************************************/

exports.errorString = errorString;
exports.SPLITTER_ABI = SPLITTER_ABI;
exports.splitter_test_shall_have_correct_initial_values = splitter_test_shall_have_correct_initial_values;
exports.splitter_test_shall_have_correct_initial_shares = splitter_test_shall_have_correct_initial_shares;
exports.splitter_test_shall_have_correct_initial_releasable = splitter_test_shall_have_correct_initial_releasable;
exports.splitter_test_shall_not_be_able_to_release_when_balance_zero = splitter_test_shall_not_be_able_to_release_when_balance_zero;
exports.splitter_test_shall_be_adjusting_shares_when_balance_zero = splitter_test_shall_be_adjusting_shares_when_balance_zero;
exports.splitter_test_shall_have_correct_releasableAt_after_receiving_funds = splitter_test_shall_have_correct_releasableAt_after_receiving_funds;
exports.splitter_test_shall_fail_upatePayoutWindow_when_funds_outstanding = splitter_test_shall_fail_upatePayoutWindow_when_funds_outstanding;
exports.splitter_test_shall_hardWithdrawlEth_and_resume_ops = splitter_test_shall_hardWithdrawlEth_and_resume_ops;
exports.splitter_test_shall_be_able_to_releaseWindow = splitter_test_shall_be_able_to_releaseWindow;
exports.splitter_test_shall_be_able_to_releaseWindow_and_update_shares = splitter_test_shall_be_able_to_releaseWindow_and_update_shares;
exports.splitter_test_shall_have_correct_releasble_funds_after_release = splitter_test_shall_have_correct_releasble_funds_after_release;
exports.splitter_test_shall_have_correct_released_funds_after_current_window_released_and_new_shares_defined = splitter_test_shall_have_correct_released_funds_after_current_window_released_and_new_shares_defined;
exports.splitter_test_shall_fail_to_hardwithdrawl_given_wrong_witness = splitter_test_shall_fail_to_hardwithdrawl_given_wrong_witness;
exports.splitter_test_shall_auction_to_highest_bidder = splitter_test_shall_auction_to_highest_bidder;
exports.splitter_test_shall_fail_sell_when_not_in_auction_mode = splitter_test_shall_fail_sell_when_not_in_auction_mode;
exports.splitter_test_be_able_to_send_funds_to_new_owner_after_buyContract = splitter_test_be_able_to_send_funds_to_new_owner_after_buyContract;
exports.splitter_test_be_able_to_cancelBid = splitter_test_be_able_to_cancelBid;

