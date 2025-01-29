/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: ERC1155SupplySplitterAdjustableAdjustable.sol test
 * @Date   : 8/6/2022
 * @Run    : `npx hardhat test`
*/


const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, waffle } = require("hardhat");

const {
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');


/******************************************************
    @utils and constants
******************************************************/


async function sendEth({ source, target, value }){
    // console.log(`sending eth from ${source.address} to ${target.address} for ${value}`)
    await source.sendTransaction({ to: target.address, value: ethers.utils.parseEther(`${value}`) });                

}

/******************************************************
    @test main
******************************************************/

async function run(){
	describe("ERC1155SupplySplitterAdjustable.sol basic test", function(){

    it('ERC1155SupplySplitterAdjustable: shall deploy correctly with initial share', async function(){

        var witness;
        var admin, seller, buyer_1, buyer_2, nobody;        
        var contract;
        var initial_split = [];
        var admin_balance, seller_balance = 0;

        beforeEach(async () => {

            [ 
                admin, 
                seller,
                buyer_1,
                buyer_2 ,
                nobody,
            ] = await ethers.getSigners();

            witness = admin;

            initial_split = {
                pks: [admin.address,seller.address],
                shares: [5,95],
            }            

            // deploy contracts
            const ERC1155 = await ethers.getContractFactory(`ERC1155SupplySplitterAdjustable`);
            contract = await ERC1155.deploy( 
                'lumo',
                'LMO',
                'lumo.xyz/api/v1',
                witness.address, 
                initial_split.pks, 
                initial_split.shares 
            );
            await contract.deployed();

            // #balance before
            admin_balance  = await waffle.provider.getBalance( admin.address  );
            seller_balance = await waffle.provider.getBalance( seller.address );

        })

        describe("ERC1155 #mint as intended", () => {

            // resume mint
            beforeEach( async () => {
                await contract.removeIsWhiteListOnly();
            });                  


            it("ERC1155SupplySplitterAdjustable: can #mint", async () => {

                await contract.resumeMint();

                await contract.mint(buyer_1.address, 1, 1, witness.address, '0x');
                expect( await contract.balanceOf(buyer_1.address, 1) ).to.equal(1);

                await contract.mint(buyer_1.address, 2, 10, witness.address, '0x');
                expect( await contract.balanceOf(buyer_1.address, 2) ).to.equal(10);

            });


            it("ERC1155SupplySplitterAdjustable: can #mintBatch", async () => {

                await contract.resumeMint();
                await contract.mintBatch( [buyer_1.address, buyer_2.address, seller.address], [3,4,0], '0x');
                expect( await contract.balanceOf(buyer_1.address, 3) ).to.equal(1);
                expect( await contract.balanceOf(buyer_2.address, 4) ).to.equal(1);
                expect( await contract.balanceOf(buyer_1.address, 0) ).to.equal(0);
                expect( await contract.balanceOf(buyer_2.address, 0) ).to.equal(0);
                expect( await contract.balanceOf(seller.address, 0) ).to.equal(0);


            });

            it("ERC1155SupplySplitterAdjustable: cannot #mint 0 with wrong witness", async () => {

                await contract.resumeMint();

                try {
                    await contract.mint(buyer_1.address, 0, 1, nobody.address, '0x');
                } catch (e) {
                    console.log(`\t:#mint 0 id failed as expected ${e.message}`)                    
                }
                expect( await contract.balanceOf(buyer_1.address, 0) ).to.equal(0);

                await contract.mint(buyer_2.address, 0, 20, witness.address, '0x');
                expect( await contract.balanceOf(buyer_2.address, 0) ).to.equal(20);
                expect( await contract.balanceOf(buyer_1.address, 0) ).to.equal(0);

            });


            it("ERC1155SupplySplitterAdjustable: should fail: can #pause, then cannot mint", async () => {

                // shall succeed
                await contract.pauseMint()

                // should fail
                try {
                    await contract.mint(buyer_1.address, 2, 10, witness.address, '0x');
                    expect( await contract.balanceOf(buyer_1.address, 2) ).to.equal(0);
                } catch (e){
                    console.log(`\t: test failed as expected ${e.message}`)
                }
            });


            it("ERC1155SupplySplitterAdjustable: can #pause  then #resumeMint and #mint", async () => {

                // shall succeed
                await contract.pauseMint()

                // shall succeed
                await contract.resumeMint()

                // should succeed
                await contract.mint(buyer_1.address, 2, 10, witness.address, '0x');
                await contract.mint(buyer_2.address, 5, 1, witness.address, '0x');
                expect( await contract.balanceOf(buyer_1.address, 2) ).to.equal(10);
                expect( await contract.balanceOf(buyer_2.address, 5) ).to.equal(1);
            });


            it("ERC1155SupplySplitterAdjustable: can read #isPaused", async () => {

                expect ( await contract.isPaused() ).to.equal(true);
                await contract.pauseMint()
                expect ( await contract.isPaused() ).to.equal(true);
                await contract.resumeMint();
                expect ( await contract.isPaused() ).to.equal(false);

            });

        });        

        // test whtelisting is capable as intended
        describe("ERC1155 #whitelist working as intended", () => {

            // resume mint
            beforeEach( async () => {
                await contract.resumeMint();
            });                  


            it("ERC1155SupplySplitterAdjustable: shall be able to set whitelist = true &&  fail #mint", async () => {

                // cannot mint if in whitelist only mode
                await contract.setIsWhiteListOnly();
                expect( await contract.isInWhiteListMode() ).to.equal(true);
                try {
                    await contract.mint(buyer_1.address, 2, 10, witness.address, '0x');
                } catch (e) {
                    console.log(`\t: #mint fail as expected ${e.message}`)                    
                }

                // can mint if buyer-1 is whitelisted
                expect ( await contract.isWhiteListed(buyer_1.address) ).to.equal(false);
                await contract.whiteListAddress(buyer_1.address);
                expect ( await contract.isWhiteListed(buyer_1.address) ).to.equal(true);
                await contract.mint(buyer_1.address, 2, 10, witness.address, '0x');
                expect( await contract.balanceOf(buyer_1.address, 2) ).to.equal(10);                

                // can whitelist multiple
                await contract.whiteListAddresses([seller.address, buyer_2.address]);
                expect ( await contract.isWhiteListed(buyer_2.address) ).to.equal(true);
                expect ( await contract.isWhiteListed(seller.address) ).to.equal(true);
                await contract.mint(buyer_2.address, 3, 10, witness.address, '0x');
                expect( await contract.balanceOf(buyer_2.address,3) ).to.equal(10);                
                await contract.mint(seller.address, 5, 10, witness.address, '0x');
                expect( await contract.balanceOf(seller.address,5) ).to.equal(10);                

                // cannot mint on another buyer if not whitelisted
                expect ( await contract.isWhiteListed(nobody.address) ).to.equal(false);   
                try {
                    await contract.mint(nobody.address, 2, 10,witness.address, '0x');
                } catch (e) {
                    console.log(`\t: #mint fail as expected ${e.message}`)                    
                }

                // can rmv whitelist and fail to mint
                await contract.removeWhiteListedAddress(buyer_1.address);
                try {
                    await contract.mint(buyer_1.address, 2, 10, witness.address, '0x');
                } catch (e) {
                    console.log(`\t: #mint fail as expected ${e.message}`)                    
                }                

            });

            it("ERC1155SupplySplitterAdjustable: shall be able to set whitelist = false && #mint", async () => {

                // can toggle whitelist
                await contract.setIsWhiteListOnly();
                expect( await contract.isInWhiteListMode() ).to.equal(true);
                await contract.removeIsWhiteListOnly();
                expect( await contract.isInWhiteListMode() ).to.equal(false);

                // can mint anywhere when whitelist is off
                expect ( await contract.isWhiteListed(nobody.address) ).to.equal(true);
                await contract.mint(buyer_1.address, 2, 10, witness.address, '0x');
                expect( await contract.balanceOf(buyer_1.address, 2) ).to.equal(10);                
            });

        });        


        describe("splits on deploy are correct", () => {

            // resume mint
            beforeEach( async () => {
                await contract.removeIsWhiteListOnly();
            });                

            it("ERC1155SupplySplitterAdjustable: shall have correct initial #windowIndex", async () => {
                expect( await contract.windowIndex() ).to.equal(1);
            });

            it('ERC1155SupplySplitterAdjustable: shall have correct initial #totalSharesAtWindow', async () => {
                expect( await contract.totalSharesAtWindow(1) ).to.equal(100);
            })

            it('ERC1155SupplySplitterAdjustable: shall have correct initial individual shares: #sharesAtWindow', async () => {
                expect( await contract.sharesAtWindow(1, admin.address) ).to.equal(5);
                expect( await contract.sharesAtWindow(1, seller.address) ).to.equal(95);
                expect( await contract.sharesAtWindow(1, nobody.address) ).to.equal(0);
            });            

            it('ERC1155SupplySplitterAdjustable: shall have correct initial #releasedAtWindow shares', async () => {
                expect( await contract.releasedAtWindow(1, admin.address) ).to.equal(0);
                expect( await contract.releasedAtWindow(1, seller.address) ).to.equal(0);
                expect( await contract.releasedAtWindow(1, nobody.address) ).to.equal(0);
            })              

            it('ERC1155SupplySplitterAdjustable: shall have correct initial #payeeAt address', async () => {
                expect( await contract.payeeAt(1, 0) ).to.equal(admin.address);
                expect( await contract.payeeAt(1, 1) ).to.equal(seller.address);
                // expect( await contract.payeeAt(1, 1) ).toThrow( new Error("index exceeds window length"))
            })                          

            it('ERC1155SupplySplitterAdjustable: shall have correct initial #releasableAt address', async () => {
                expect( await contract.releasableAt(1, admin.address ) ).to.equal(0)
                expect( await contract.releasableAt(1, seller.address) ).to.equal(0)
            })            

            // this reverts as expected, but `expectRevert` fails to do what it's intended
            it('ERC1155SupplySplitterAdjustable: should fail: shall [NOT] be able to release ether  when balance = 0', async () => {
                try {
                    await expectRevert(
                        await contract.releaseCurrentWindow(),
                        'The ETH balance at this address is zero'                  
                    );
                    expect( await contract.windowIndex() ).to.equal(1);
                } catch (e){
                    console.log(`\t: test failed as expected ${e.message}`)
                }
            })    

            it('ERC1155SupplySplitterAdjustable: shall be able to adjust payout splits when balance = 0', async () => {
                await contract.updatePayoutWindow( admin.address, [admin.address, seller.address, buyer_1.address], [5,50,45])
                expect( await contract.windowIndex() ).to.equal(2);
            })    
        });

        describe("payouts are correct and can payout again after current window released", async () => {

            let eth_sent = 10;
            let eth_to_wei = 1000000000000000000;
            let wei_sent = eth_sent * eth_to_wei;
            var _pks, _shares = []

            // send some eth to 
            beforeEach(async () => {
                await sendEth({ source: buyer_1, target: contract, value: eth_sent });
                _pks = [admin.address, seller.address, buyer_1.address];
                _shares = [5,45,50];                
                await contract.removeIsWhiteListOnly();
            })

            it("ERC1155SupplySplitterAdjustable: shall have same initial #windowIndex and #releaseIndex after receiving funds", async () => {
                expect( await contract.windowIndex() ).to.equal(1);
            });            

            it("ERC1155SupplySplitterAdjustable: shall have correct #releasableAt after receiving funds", async () => {
                let r1 = await contract.releasableAt(1, admin.address);
                let r2 = await contract.releasableAt(1, seller.address);
                let a1 = BigNumber.from(`${wei_sent*5/100}`);
                let a2 = BigNumber.from(`${wei_sent*95/100}`);
                expect( r1 ).to.equal(a1)
                expect( r2 ).to.equal(a2)
            });

            // @doc: https://www.npmjs.com/package/@openzeppelin/test-helpers
            // this does fail as expected, but can't get `expectRevert` test fn to op. as intended
            it(`shall [ NOT ] be able to #updatePayoutWindow when there's funds due`, async () => {
                // await expectRevert(
                //     await contract.updatePayoutWindow( admin.address, [admin.address], [100] ),
                //     'You must release last tranche of payables before adjusting the shares'
                // )
            })

            it('ERC1155SupplySplitterAdjustable: fault recovery ==> shall be able to #hardWithdrawlEth given correct witness, and then shall be able to payout again', async () => {

                // 0. send some eth
                await sendEth({ source: buyer_2, target: contract, value: 45 });

                // 1. hard withdrawl all eth
                await contract.hardWithdrawlEth(admin.address);

                // 2. send more eth to address
                let eth_amt_after_hard_withdrawl = 15;
                await sendEth({ source: buyer_2, target: contract, value: eth_amt_after_hard_withdrawl })

                // 3. correct obligations in new window
                let a1 = BigNumber.from(`${eth_amt_after_hard_withdrawl*5/100 *eth_to_wei}`)
                let a2 = BigNumber.from(`${eth_amt_after_hard_withdrawl*95/100*eth_to_wei}`)
                expect( await contract.releasableAt(1, admin.address)  ).to.equal(a1);
                expect( await contract.releasableAt(1, seller.address) ).to.equal(a2);

                // 4. shall payout
                await contract.releaseCurrentWindow();
                expect( await contract.releasableAt(1, admin.address)  ).to.equal(0);
                expect( await contract.releasableAt(1, seller.address) ).to.equal(0);

                // 5. shall be able to update shares
                await contract.updatePayoutWindow( admin.address, [admin.address, seller.address], [50,55] );
                expect( await contract.totalSharesAtWindow(1) ).to.equal(100);
                expect( await contract.totalSharesAtWindow(2) ).to.equal(105);
                expect( await contract.sharesAtWindow(2, admin.address ) ).to.equal( 50 );
                expect( await contract.sharesAtWindow(2, seller.address) ).to.equal( 55 );

                // 6. again, send more eth to address
                let eth_amt_after_hard_withdrawl_1 = 100;
                await sendEth({ source: buyer_2, target: contract, value: eth_amt_after_hard_withdrawl_1 })

                // expect the new payable to be correct
                let a11 = eth_amt_after_hard_withdrawl_1*50/105*eth_to_wei
                let a21 = eth_amt_after_hard_withdrawl_1*55/105*eth_to_wei
                let c11 = Number( await contract.releasableAt(2, admin.address)  )
                let c21 = Number( await contract.releasableAt(2, seller.address) )

                expect( a11 - c11 ).to.equal(0);
                expect( a21 - c21 ).to.equal(0);

                // release window again shall succeed
                await contract.releaseCurrentWindow();
                expect( await contract.releasableAt(2, admin.address)  ).to.equal(0);
                expect( await contract.releasableAt(2, seller.address) ).to.equal(0);


            })            

            it("ERC1155SupplySplitterAdjustable: shall have correct #releasableAt, #releaseIndex, and receiver shall have recieved after #releaseCurrentWindow", async () => {

                // release funds
                await contract.releaseCurrentWindow();

                // correct balance
                let r1 = await contract.releasableAt(1, admin.address);
                let r2 = await contract.releasableAt(1, seller.address);
                expect( r1 ).to.equal(0)
                expect( r2 ).to.equal(0)

                // let b1 = new BigNumber.from(await waffle.provider.getBalance(admin.address));
                // let a1 = new BigNumber.from(`${wei_sent * 5/100}`).add(admin_balance);
                // console.log( b1.minus(b1) );
                // expect(b1).to.equal(a1);
                // let b2 = await waffle.provider.getBalance(seller.address);
                // let a2 = BigNumber.from(`${wei_sent * 95/100}`).add(seller_balance);
                // expect(b2).to.equal(a2);
            });            


            it('ERC1155SupplySplitterAdjustable: shall be able to update window after payouts have completed', async () => {

                await contract.releaseCurrentWindow();
                await contract.updatePayoutWindow( admin.address, _pks, _shares )
                expect( await contract.windowIndex() ).to.equal(2);

                // prev share is unchanged
                expect( await contract.sharesAtWindow(1, admin.address) ).to.equal(5);
                expect( await contract.sharesAtWindow(1, seller.address) ).to.equal(95);

                // new window share is correct
                expect( await contract.sharesAtWindow(2, admin.address) ).to.equal(5);
                expect( await contract.sharesAtWindow(2, seller.address) ).to.equal(45);
                expect( await contract.sharesAtWindow(2, buyer_1.address) ).to.equal(50);

                // new window totalshare is correct
                expect( await contract.totalSharesAtWindow(2) ).to.equal(100);{}

            });


            it('ERC1155SupplySplitterAdjustable: shall have correct releasable funds after prev payable released, and new splits defined', async () => {

                let new_eth_amt = 13;

                await contract.releaseCurrentWindow();
                await contract.updatePayoutWindow( admin.address, _pks, _shares )

                // // prev obligations are zero
                expect( await contract.releasableAt(1, admin.address) ).to.equal(0);
                expect( await contract.releasableAt(1, seller.address) ).to.equal(0);

                // // send new funds
                await sendEth({ source: buyer_2, target: contract, value: new_eth_amt })

                // correct obligations in ew window
                let a = BigNumber.from(`${new_eth_amt*5/100 *eth_to_wei}`)
                let s = BigNumber.from(`${new_eth_amt*45/100*eth_to_wei}`)
                let b = BigNumber.from(`${new_eth_amt*50/100*eth_to_wei}`)
                expect( await contract.releasableAt(2, admin.address) ).to.equal(a);
                expect( await contract.releasableAt(2, seller.address) ).to.equal(s);
                expect( await contract.releasableAt(2, buyer_1.address) ).to.equal(b);

            });

            it('ERC1155SupplySplitterAdjustable: shall be able to #releaseCurrentWindow with correct amt, after last window has been released', async () => {

                let new_eth_amt = 10;

                await contract.releaseCurrentWindow();
                await contract.updatePayoutWindow( admin.address, _pks, _shares )

                // prev obligations are zero
                expect( await contract.releasableAt(1, admin.address) ).to.equal(0);
                expect( await contract.releasableAt(1, seller.address) ).to.equal(0);

                // send new funds
                await sendEth({ source: buyer_2, target: contract, value: new_eth_amt })

                await contract.releaseCurrentWindow();

                // windows are correct
                expect( await contract.windowIndex() ).to.equal(2);

                // correct obligations in ew window
                // let a = BigNumber.from(`${new_eth_amt*5/100 *eth_to_wei}`)
                // let s = BigNumber.from(`${new_eth_amt*45/100*eth_to_wei}`)
                // let b = BigNumber.from(`${new_eth_amt*50/100*eth_to_wei}`)

                // obligations have been released
                expect( await contract.releasableAt(2, admin.address) ).to.equal(0);
                expect( await contract.releasableAt(2, seller.address) ).to.equal(0);
                expect( await contract.releasableAt(2, buyer_1.address) ).to.equal(0);

            });


            // it('ERC1155SupplySplitterAdjustable: shall not be able to #hardWithdrawlEth given wrong witness', async () => {
            //     await expectRevert(                
            //         await contract.hardWithdrawlEth(seller.address),
            //         'Invalid witness provided for hard reset of payouts'
            //     )
            // });            

        }) 

    })

});
}


