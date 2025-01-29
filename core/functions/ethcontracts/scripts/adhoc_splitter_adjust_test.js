/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: splitterAdjustable.sol test
 * @Date   : 8/6/2022
 * @Run    : `npx hardhat run scripts/adhoc_splitter_adjust_test.js
 * @Doc    :
 *  - https://github.com/mirror-xyz/splits
 *  - https://github.com/mirror-xyz/splits/blob/main/test/main.test.ts#L141
 *  - also ref: https://www.youtube.com/watch?v=b5sQt4F8voA
 * 
 * 
*/


const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, waffle } = require("hardhat");
const AllocationTree = require("./../merkleTree/balanceTree");


/******************************************************
    @run
******************************************************/


async function main() {
    await adhoc_splitter_adjust_test();
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
  console.error(error);
    process.exit(1);
  });




/******************************************************
    @tests
******************************************************/

/**
 * 
 * @Use: ad-hoc tests
 *   `npx hardhat run scripts/adhoc_splitter_test` 
 * 
 * The conclusion here is that you can deploy once, and
 * do splits across multiple people
 * 
 **/
async function adhoc_splitter_adjust_test(){

    let take_rate = 5000000;
    let pass_rate = 95000000;

    // get accts
    const [ 
        admin, 
        seller,
        collaber,
        buyer_1,
        buyer_2 ,
        not_seller,
    ] = await ethers.getSigners();

    line();

    // deploy contracts
    const Splitter = await ethers.getContractFactory("PaymentSplitterAdjustable");
    const splitter = await Splitter.deploy( admin.address, [ admin.address, seller.address ], [5,95] );  
    await splitter.deployed();

    // #balance before
    // const buyer_1_balance_0 = await waffle.provider.getBalance( buyer_1.address );                        
    // const seller_balance_0  = await waffle.provider.getBalance( seller.address );                        
    // const admin_balance_0   = await waffle.provider.getBalance( admin.address );                        
    
    // @reads    

    let widx = 0;
    let context_str = `after deployment, index = ${widx}`;

    let wind = await splitter.windowIndex();
    console.log('window after deployment:', wind)

    try {
        let shares = await splitter.totalSharesAtWindow(widx);
        console.log(`shares ${context_str}`,shares)
    } catch (e) {
        console.log("#totalSharesAtWindow error:", e.error.message)
    }

    try {
        let released = await splitter.totalReleasedAtWindow(widx);
        console.log(`released ${context_str}:`,released)
    } catch (e){
        console.log("#totalReleasedAtWindow error:", e.error.message)
    }

    let captable = { 
        'admin-address' : admin.address, 
        'seller-address': seller.address,
        'non-address'   : buyer_1.address,
    };

    for ( let [k,v] of Object.entries(captable) ){
        br();
        let shares0_for = await splitter.sharesAtWindow(widx, v)
        console.log(`shares ${context_str} #${k}:`,shares0_for)
    }
    br();


    for ( let idx in [0,1,2] ){
        try {
            console.log('idx: ', idx)
            let addr = await splitter.payeeAt(widx, idx);
            console.log(`address at ${widx}-${idx}: ${addr}`)
            br();
        } catch (e) {
            console.log("#payeeAt error:", e.error.message)
            br();
        }
    }


 
}



/******************************************************
    @utils and constants
******************************************************/

function br(){
    console.log('============')
}

function line(_newline){
    console.log(`${_newline ? "" : '\n\n'}--------------------------------------------------------------------------${_newline ? '\n' : ''}`)
}































 
