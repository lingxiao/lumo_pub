/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: splitter.sol test
 * @Date   : 6/16/2022
 * @Run    : `npx hardhat run scripts/adhoc_splitter_test.js
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
    await ad_hoc_1155_split();
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
 * @Ref: https://wizard.openzeppelin.com/#erc1155
 * @Ref: https://github.com/ProjectOpenSea/opensea-erc1155/blob/master/contracts/ERC1155Tradable.sol
 * @Ref: https://stackoverflow.com/questions/69302320/erc721-transfer-caller-is-not-owner-nor-approved
 * 
 **/
async function ad_hoc_1155_split(){

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


    const ContractABI = await ethers.getContractFactory(`ERC1155BurnableSupplySplitter`)
    const erc1155p    = await ContractABI.deploy(
        'spt-test',
        'SPT',
        "helloworld.com/", 
        [admin.address, seller.address], 
        [5,95]
    )
    // await erc1155p.setApprovalForAll(buyer_1,true);
    console.log("ERC1155Payable address:", erc1155p.address,
        '\n with name: ',
        await erc1155p.name(), await erc1155p.symbol(),
        '\ndeployed from seller address: ', seller.address,        
    );  

    // #balance before
    const buyer_1_balance_0 = await waffle.provider.getBalance( buyer_1.address );                        
    const seller_balance_0  = await waffle.provider.getBalance( seller.address );                        
    const admin_balance_0   = await waffle.provider.getBalance( admin.address );                        

    /*******************************************************/
    // test basic mint 721

    line()
    // let uri = await erc1155p.uri('20');
    // console.log("uri:", uri)

    let bal_of_0 = await erc1155p.balanceOf(buyer_1.address, 1);
    console.log('balance of 0: ', bal_of_0);

    let res_mint_1 = await erc1155p.mint(buyer_1.address, 1, 1, '0x');
    let bal_of_1b = await erc1155p.balanceOf(buyer_1.address, 1);
    let uri_1 = await erc1155p.uri('1');
    console.log('balance of 1: ', bal_of_1b, 'uri:', uri_1);

    let res_mint_2  = await erc1155p.mintBatch(buyer_1.address, [2,3],[1,1], '0x');
    let bal_of_2a   = await erc1155p.balanceOf(buyer_1.address, 1);
    let bal_of_2b   = await erc1155p.balanceOf(buyer_1.address, 2);
    let bal_of_2c   = await erc1155p.balanceOf(buyer_1.address, 3);
    console.log('balance of 2: ', bal_of_2a, bal_of_2b, bal_of_2c);

    /*******************************************************/
    // test basic mint erc20

    let res_mint_3 = await erc1155p.mint(buyer_1.address, 10, 10000, '0x');
    let bal_of_3   = await erc1155p.balanceOf(buyer_1.address, 10);
    console.log('balance of 3: ', bal_of_3);
    // console.log('totalsupply of 3', await erc1155p.totalSupply())

    let res_mint_4  = await erc1155p.mintBatch(buyer_1.address, [11,12],[10,20], '0x');
    let bal_of_4a   = await erc1155p.balanceOf(buyer_1.address, 11);
    let bal_of_4b   = await erc1155p.balanceOf(buyer_1.address, 12);
    let supply_4b   = await erc1155p.totalSupply(12);
    console.log('balance of 4: ', bal_of_4a, bal_of_4b, supply_4b);


    return;
    /*******************************************************/
    // test transfer: make sure you test transfer on client side

    // const tx_send = erc1155p. safeTransferFrom(buyer_1.address, buyer_2.address, 1, 1, '0x');
    // const tx_send_res = await buyer_1.sendTransaction({
        // to   : erc1155p.address,
        // data :
         // tx_send, //.encodeABI()
    // });    
    // console.log('tx_snd:', tx_send, tx_send_res)


    // await buyer_1.sendTransaction({
    //     to: erc1155p.address,
    //     data: 
    //     value: JSON.stringify([buyer_1.address, buyer_2.address, 1,1,'0x']),
    // })
    // let res_trans_1 = await erc1155p.safeTransferFrom(buyer_1.address, buyer_2.address, 1, 1, '0x');
    // let bal_of_4a = await erc1155p.balanceOf(buyer_1.address, 1);
    // let bal_of_4b = await erc1155p.balanceOf(buyer_2.address, 1);
    // console.log('balance-of-trans', bal_of_4a, bal_of_4b)

    // balance after paid, before contract release funds
    // const buyer_1_balance_1 = await waffle.provider.getBalance( buyer_1.address );                        
    // test basic mint erc20



    /*******************************************************/
    // test splitter


    line();

    // sent funds to contract address
    let buy_tx_1 = await buyer_1.sendTransaction({
        to: erc1155p.address,
        value: ethers.utils.parseEther(`10`)
    });
    await read_shares();
    await read_accounts_payable();

    // adjust shares
    await erc1155p.adjustShares([ admin.address, seller.address, collaber.address ], [5, 50, 45]);
    await read_shares();
    await read_accounts_payable();

    // release funds
    line(true);

    console.log(`/=================================\n after release`)
    await erc1155p.maybeReleaseFunds([admin.address, not_seller.address, seller.address, collaber.address ]);
    await read_shares();
    await read_accounts_payable();
    await read_user_balance();


    line()


    // #send eth to erc721p, and release funds
    async function buy_and_send(amt, release_collaber){
        let buy_tx_1 = await buyer_1.sendTransaction({
            to: erc1155p.address,
            value: ethers.utils.parseEther(`${amt}`)
        });

        // console.log('\nbuy-tx:', buy_tx_1)
        // line();

        // balance after paid, before contract release funds
        const buyer_1_balance_1 = await waffle.provider.getBalance( buyer_1.address );                        
        const seller_balance_1  = await waffle.provider.getBalance( seller.address );                        
        const admin_balance_1   = await waffle.provider.getBalance( admin.address );                        

        await read_accounts_payable();
        // await go_release_funds(release_collaber);
    }


    async function read_shares(){
        let total_shares = await erc1155p.totalShares();
        let share_admin = await erc1155p.shares(admin.address)
        let share_seller = await erc1155p.shares(seller.address)
        let share_collaber = await erc1155p.shares(collaber.address)
        console.log(`split-shares\n----------------------------`)
        console.log('share-admin', share_admin, '/', total_shares)
        console.log('share-seller', share_seller, '/', total_shares)
        console.log('share-collaber', share_collaber,'/', total_shares)        
    }

    async function read_accounts_payable(){
        // line();
        let share_admin    = await erc1155p.fundsOwed(admin.address);
        let share_seller   = await erc1155p.fundsOwed(seller.address);
        let share_collaber = await erc1155p.fundsOwed(collaber.address);
        console.log(`accounts payable\n----------------------------`)
        console.log('share-admin-in-contract'   , share_admin)
        console.log('share-seller-in-contract'  , share_seller)
        console.log('share-collaber-in-contract', share_collaber)        
        // line();
    }

    async function read_user_balance(){

        const admin_balance_2     = await waffle.provider.getBalance( admin.address );
        const seller_balance_2    = await waffle.provider.getBalance( seller.address );                        
        const collaber_balance_2  = await waffle.provider.getBalance( collaber.address );
        const not_seller_balance_2  = await waffle.provider.getBalance( not_seller.address );

        console.log(`user balance\n----------------------------`)
        console.log('balance admin:' , admin_balance_2)
        console.log('balance seller:' , seller_balance_2)
        console.log('balance collaber:' , collaber_balance_2);
        console.log('balance not-seller:' , not_seller_balance_2);
        // line();
    }



}

/******************************************************
    @utils and constants
******************************************************/



function line(_newline){
    console.log(`${_newline ? "" : '\n\n'}--------------------------------------------------------------------------${_newline ? '\n' : ''}`)
}































 
