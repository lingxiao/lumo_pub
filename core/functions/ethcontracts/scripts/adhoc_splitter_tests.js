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
    await ad_hoc_openzeppelin_split();
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
async function ad_hoc_openzeppelin_split(){

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
    const Splitter = await ethers.getContractFactory("Splitter");
    const splitter = await Splitter.deploy();
    await splitter.deployed();

    const ContractABI = await ethers.getContractFactory("ERC721_0x04_v1");
    const erc721p = await ContractABI.deploy(seller.address,[admin.address, seller.address],[5,95]);
    console.log("ERC721_0x04_v1 address:", erc721p.address, 'deployed from seller address: ', seller.address);  


    // #balance before
    const buyer_1_balance_0 = await waffle.provider.getBalance( buyer_1.address );                        
    const seller_balance_0  = await waffle.provider.getBalance( seller.address );                        
    const admin_balance_0   = await waffle.provider.getBalance( admin.address );                        

    // #send eth to erc721p, and release funds
    async function buy_and_send(amt, release_collaber){
        let buy_tx_1 = await buyer_1.sendTransaction({
            to: erc721p.address,
            value: ethers.utils.parseEther(`${amt}`)
        });

        // console.log('\nbuy-tx:', buy_tx_1)
        // line();

        // #mint 
        let tokid =  Date.now();
        await erc721p.mintTo(buyer_1.address, tokid)
        let supply_1 = await erc721p.totalSupply();

        // let res_trans_1 = await erc721p.transferFrom(buyer_1.address, buyer_2.address, tokid)

        console.log('\n',supply_1)

        // balance after paid, before contract release funds
        const buyer_1_balance_1 = await waffle.provider.getBalance( buyer_1.address );                        
        const seller_balance_1  = await waffle.provider.getBalance( seller.address );                        
        const admin_balance_1   = await waffle.provider.getBalance( admin.address );                        

        await read_shares_in_erc721();
        // await go_release_funds(release_collaber);
    }

    async function go_release_funds(release_collaber){

        line();
        // await read_shares();
        await read_shares_in_erc721();

        // release funds
        await erc721p.maybeReleaseFunds([admin.address, not_seller.address, seller.address ]);

        if ( release_collaber ){
            await erc721p.maybeReleaseFunds([collaber.address]);
        }

        const admin_balance_2     = await waffle.provider.getBalance( admin.address );
        const seller_balance_2    = await waffle.provider.getBalance( seller.address );                        
        const collaber_balance_2  = await waffle.provider.getBalance( collaber.address );
        const not_seller_balance_2  = await waffle.provider.getBalance( not_seller.address );

        console.log('balance-after_release admin:' , admin_balance_2)
        console.log('balance-after_release seller:' , seller_balance_2)
        console.log('balance-after_release collaber:' , collaber_balance_2);
        console.log('balance-after_release not-seller:' , not_seller_balance_2);
        await read_shares();
        await read_shares_in_erc721();
        line(true);

    }

    async function read_shares(){
        let total_shares = await erc721p.totalShares();
        let share_admin = await erc721p.shares(admin.address)
        let share_seller = await erc721p.shares(seller.address)
        let share_collaber = await erc721p.shares(collaber.address)
        console.log('share-admin', share_admin, '/', total_shares)
        console.log('share-seller', share_seller, '/', total_shares)
        console.log('share-collaber', share_collaber,'/', total_shares)        
    }

    async function read_shares_in_erc721(){
        // line();
        let share_admin    = await erc721p.fundsOwed(admin.address);
        let share_seller   = await erc721p.fundsOwed(seller.address);
        let share_collaber = await erc721p.fundsOwed(collaber.address);
        console.log('share-admin-in-contract'   , share_admin)
        console.log('share-seller-in-contract'  , share_seller)
        console.log('share-collaber-in-contract', share_collaber)        
        // line();
    }


    // test batch mint
    let _id = Date.now()
    let ids = [ _id, _id + 1, _id + 2, _id + 3, _id+4 ];
    let tgts = [ buyer_1.address, buyer_1.address, buyer_2.address, buyer_2.address, admin.address ];
    await erc721p.batchMintTo(tgts, ids);
    // let supply_after_batch_mint = await erc721p.totalSupply()
    // line()
    // console.log('supply_after_batch_mint', supply_after_batch_mint)
    // line()


    // mint and split
    await buy_and_send(10, false)
    // await buy_and_send(10, false)

    await read_shares_in_erc721();

    // adjust shares, then buy
    await erc721p.adjustShares([ admin.address, seller.address, collaber.address ], [10, 40, 40]);
    // await buy_and_send(100, true);

    // release funds after multiple buys
    await go_release_funds(true)

}

/******************************************************
    @tests - mirror
******************************************************/

/**
 * 
 * @Use: ad-hoc tests
 *   `npx hardhat run scripts/adhoc_splitter_test` 
 * 
 * The conclusion here is that you can deploy once, and
 * do splits across multiple people
 * 
async function ad_hoc_mirror_split_test(){

    let take_rate = 5000000;
    let pass_rate = 95000000;

    // get accts
    const [ 
        admin, 
        buyer_1 , 
        seller_1, 
        buyer_2 ,
        seller_2, 
        fakeWETH,
    ] = await ethers.getSigners();


    // deploy contracts
    const Splitter = await ethers.getContractFactory("Splitter");
    const splitter = await Splitter.deploy();
    await splitter.deployed();

    const SplitFactory = await ethers.getContractFactory("SplitFactory");
    const proxyFactory = await SplitFactory.deploy( splitter.address, fakeWETH.address );
    await proxyFactory.deployed();

    // get proxy bytecode
    const proxyBytecode = (await ethers.getContractFactory("SplitProxy")).bytecode;
    const proxyByteCodeHash = ethers.utils.keccak256(proxyBytecode);

    // main buy and claim fns.
    async function buy_and_claim({ _window, buyer, seller, admin, splits, sales_price }){

        // build proxies to call the fns
        const proxyAddress = await ethers.utils.getCreate2Address(
            proxyFactory.address,
            ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(['bytes32'], [splits.getHexRoot()])),
            proxyByteCodeHash
        );

        // get callable proxys
        const proxy = await ( await ethers.getContractAt("SplitProxy", proxyAddress) ).deployed();
        const callable_proxy = await (await ethers.getContractAt("Splitter", proxy.address)).deployed();    

        // buyer_1 buys from seller_1 for 1eth
        let buy_tx_1 = await buyer.sendTransaction({
            to: proxy.address,
            value: ethers.utils.parseEther(sales_price)
        });
        let incr_tx_1 = await callable_proxy.incrementWindow();    

        const acct_seller = seller.address;
        const acct_admin  = admin.address;
        const acct_buyer  = buyer.address;

        const allocation_seller = BigNumber.from(`${pass_rate}`)
        const allocation_admin  = BigNumber.from(`${take_rate}`);

        const proof_seller = splits.getProof(acct_seller, allocation_seller);
        const proof_admin  = splits.getProof(acct_admin, allocation_admin);

        // get balance before
        const accountBalanceBefore_seller = await waffle.provider.getBalance( acct_seller );
        const accountBalanceBefore_admin  = await waffle.provider.getBalance( acct_admin  );

        // another account `transactionHandler` (probs an admin) claim the percentage on 
        // behalf of the `acct`
        claim_tx_seller = await callable_proxy
            .connect(admin)
            .claim(_window, acct_seller, allocation_seller, proof_seller);

        claim_tx_admin = await callable_proxy
            .connect(admin)
            .claim(_window, acct_admin, allocation_admin, proof_admin);


        // seller balance delta
        const accountBalanceAfter_seller = await waffle.provider.getBalance( acct_seller );                        
        amt_claimed_by_seller = accountBalanceAfter_seller.sub(accountBalanceBefore_seller);                        

        // admin balance delta
        const accountBalanceAfter_admin = await waffle.provider.getBalance( acct_admin );                        
        amt_claimed_by_admin = accountBalanceAfter_admin.sub(accountBalanceBefore_admin);                        

        let pp_amt_claimed_by_seller = ethers.utils.formatEther(amt_claimed_by_seller)
        let pp_amt_claimed_by_admin  = ethers.utils.formatEther(amt_claimed_by_admin)   

        let pp_amt_balance_after_seller = ethers.utils.formatEther(accountBalanceAfter_seller)
        let pp_amt_balance_after_admin  = ethers.utils.formatEther(accountBalanceAfter_admin)

        let pp_amt_balance_after_buyer = ethers.utils.formatEther( await waffle.provider.getBalance(acct_buyer)  )

        console.log("tx-k-claims: ", pp_amt_claimed_by_seller, pp_amt_claimed_by_admin) 
        console.log('post-tx-balance: ', pp_amt_balance_after_seller, pp_amt_balance_after_admin)
        console.log('post-tx-buyer-balance', pp_amt_balance_after_buyer)
        console.log("====================================\n")
    }

    // define splits
    // define 1st split
    const splits_1 = new AllocationTree.default([
        {account: seller_1.address, allocation: BigNumber.from(pass_rate) },
        {account: admin.address , allocation: BigNumber.from(take_rate) },
    ])

    // define 2nd split
    const splits_2 = new AllocationTree.default([
        {account: seller_2.address, allocation: BigNumber.from(pass_rate) },
        {account: admin.address , allocation: BigNumber.from(take_rate) },
    ])

    // connect splits
    // note thise must be run once, not twice
    await proxyFactory.connect(seller_1).createSplit(splits_1.getHexRoot());                        
    await proxyFactory.connect(seller_2).createSplit(splits_2.getHexRoot());                        


    await buy_and_claim({ 
        admin: admin, 
        buyer: buyer_1,        
        seller: seller_1, 
        splits: splits_1,
        sales_price: "1",
        _window: 0,
    });

    await buy_and_claim({
        admin: admin,
        buyer: buyer_1,        
        seller: seller_2,
        splits: splits_2,
        sales_price: '2',
        _window: 0,
    })


    await buy_and_claim({
        admin: admin,
        buyer: buyer_1,        
        seller: seller_1,
        splits: splits_1,
        sales_price: '10',
        _window: 1,
    })

    await buy_and_claim({
        admin: admin,
        buyer: buyer_1,        
        seller: seller_2,
        splits: splits_2,
        sales_price: '20',
        _window: 1,
    })
}
**/

/******************************************************
    @utils and constants
******************************************************/


let proxyFactory;

const deploySplitter = async () => {
  const Splitter = await ethers.getContractFactory("Splitter");
  const splitter = await Splitter.deploy();
  return await splitter.deployed();
};

const deployProxyFactory = async (splitterAddress, fakeWETHAddress ) => {
  const SplitFactory = await ethers.getContractFactory("SplitFactory");
  const proxyFactory = await SplitFactory.deploy(
    splitterAddress,
    fakeWETHAddress
  );
  return await proxyFactory.deployed();
};


function line(_newline){
    console.log(`${_newline ? "" : '\n\n'}--------------------------------------------------------------------------${_newline ? '\n' : ''}`)
}































 
