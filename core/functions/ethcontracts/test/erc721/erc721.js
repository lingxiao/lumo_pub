/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: ERC721LumoV1.sol test
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
 * contract size: `cat ERC721LumoV1.json | jq -r '.deployedBytecode' | wc -c`
 *
 * openzeppelin doc: https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable
 * 
*/


const { expect, assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, waffle } = require("hardhat");
const {
    constants,
} = require('@openzeppelin/test-helpers');

const {
    errorString,
} = require('./PaymentSplitterV1');

const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");


/******************************************************
    @run
******************************************************/

// runERC721Test();

/******************************************************
    @test functions
******************************************************/

const cost = 10;


const ERC721_ABI = [
    "function initializeERC721LumoV2(address witness_, address feeTargetAddress_,address splitterAddress_,address[] memory payees_,uint256[] memory shares_,string memory _name,string memory _symbol,string memory uri_, uint256 price_) public",
    "function delegateInit( string memory _name, string memory _symbol, string memory uri_, uint256 price_, address witness_ ) public",

    "function uri(uint256 tokid) public view returns (string memory)",
    "function getPrice() public view returns (uint256)",
    "function getTokenIdsList() public view returns (uint256[] memory)",
    "function ownerOfToken(uint256 tokenId) public view returns (address)",
    "function balanceOf(address owner) public view returns (uint256)",                        
    "function getERC721Owner() public view returns (address)",

    "function setIsMinting(bool isPaused) public",
    "function isPaused() public view returns (bool)",

    "function setPrice(uint256 price_) public",
    "function mint( address[] memory pks, uint256[] memory ids, address witness_ ) public payable",

    "function createReward(bytes32 _merkleRoot, uint256 pricePerItem) public" ,
    "function getReward(uint256 _id) public view returns (uint256, uint256)",
    "function claimReward( uint256 _rewardId, bytes32[] calldata merkleProof, uint256 preset_tok_id ) public payable",
    "function getRecentRewardId() public view returns (uint256)",

    "function name() public view returns (string memory)",
    "function symbol() public view returns (string memory)",
    "function transferFrom(address from, address to, uint256 tokenId) public",
]



async function erc721_test_on_deploy({ erc721, cost, seller, buyer_1 }){
    expect( await erc721.getPrice() ).to.equal(cost);
    expect( await erc721.isPaused() ).to.equal(false)
    expect( await erc721.balanceOf(buyer_1.address) ).to.equal(0);
    expect( await erc721.getERC721Owner() ).to.equal(seller.address);
    expect( await erc721.name() ).to.equal("lumo");
    expect( await erc721.symbol() ).to.equal("LMO");
}

async function erc721_test_can_mint({ erc721, buyer_1,buyer_2, nobody, cost }){

    await erc721.setIsMinting(true);

    // can mint w/o ids
    let res = await erc721.mint([buyer_1.address], [], constants.ZERO_ADDRESS, {value:cost});
    await erc721.mint([buyer_2.address], [], constants.ZERO_ADDRESS, {value:cost});
    expect( await erc721.ownerOfToken(1) ).to.equal(buyer_1.address);
    expect( await erc721.ownerOfToken(2) ).to.equal(buyer_2.address);

    let tokids = await erc721.getTokenIdsList();
    expect( tokids.length ).to.equal(2);    

    // can fail when trying to mint w/ existing id
    await erc721.mint([buyer_1.address], [2], constants.ZERO_ADDRESS, {value:cost});

    let tokids_after_failed_mint_op = await erc721.getTokenIdsList();
    expect( tokids_after_failed_mint_op.length ).to.equal(2);    

    // can mint w/ input ids
    await erc721.mint([buyer_1.address], [10], nobody.address, {value:cost});
    expect( await erc721.balanceOf(buyer_1.address) ).to.equal(2);

    await erc721.mint([buyer_1.address], [20], nobody.address, {value:cost});
    expect( await erc721.balanceOf(buyer_1.address) ).to.equal(3);

    expect( await erc721.ownerOfToken(10) ).to.equal(buyer_1.address);
    expect( await erc721.ownerOfToken(20) ).to.equal(buyer_1.address);
    expect( await erc721.ownerOfToken(30) ).to.equal(constants.ZERO_ADDRESS);

    let tokids_after_more_mints = await erc721.getTokenIdsList();
    expect( tokids_after_more_mints.length ).to.equal(4);    

}
 

async function erc721_test_can_mint_batch({ erc721, buyer_1, buyer_2, nobody, cost }){

    await erc721.setIsMinting(true);
    await erc721.mint( [buyer_1.address, buyer_2.address], [1,2], nobody.address, {value:2*cost});

    expect( await erc721.balanceOf(buyer_1.address) ).to.equal(1);
    expect( await erc721.balanceOf(buyer_2.address) ).to.equal(1);

    expect( await erc721.ownerOfToken(1) ).to.equal(buyer_1.address);
    expect( await erc721.ownerOfToken(2) ).to.equal(buyer_2.address);
    expect( await erc721.ownerOfToken(3) ).to.equal(constants.ZERO_ADDRESS);

    let tokids = await erc721.getTokenIdsList();
    expect( tokids.length ).to.equal(2);                

    // cannot mint w/ mismatched input lengths
    try {
        await erc721.mint( [buyer_1.address, buyer_2.address], [11], nobody.address, {value:2*cost});
    } catch (error) {
        assert(error.message === errorString({ isProxy: true, str: "Mint is paused or mismatched input lengths" }) );
    }
    expect( await erc721.ownerOfToken(11) ).to.equal(constants.ZERO_ADDRESS);

    try {
        await erc721.mint( [buyer_1.address], [21,22], nobody.address, {value:2*cost});
    } catch (error) {
        assert(error.message === errorString({ isProxy: true, str: "Mint is paused or mismatched input lengths" }) );
    }
    expect( await erc721.ownerOfToken(21) ).to.equal(constants.ZERO_ADDRESS);
    expect( await erc721.ownerOfToken(22) ).to.equal(constants.ZERO_ADDRESS);

    // cannot mint w/ pay < price
    try {
        await erc721.mint( [buyer_1.address, buyer_2.address], [12, 13], nobody.address, {value:1.8*cost});
    } catch (error) {
        console.log(error.message)
        assert(error.message === errorString({ isProxy: true, str: "Payment must be > price" }) );
    }
    expect( await erc721.ownerOfToken(12) ).to.equal(constants.ZERO_ADDRESS);
    expect( await erc721.ownerOfToken(13) ).to.equal(constants.ZERO_ADDRESS);
}

async function erc721_test_can_mint_with_higher_price({  erc721, buyer_1, buyer_2, nobody, cost }){
    await erc721.setIsMinting(true);
    await erc721.mint( [buyer_1.address, buyer_2.address], [1,2], nobody.address, {value:3*cost});
    expect( await erc721.balanceOf(buyer_1.address) ).to.equal(1);
    expect( await erc721.balanceOf(buyer_2.address) ).to.equal(1);
    expect( await erc721.ownerOfToken(1) ).to.equal(buyer_1.address);
    expect( await erc721.ownerOfToken(2) ).to.equal(buyer_2.address);
    let tokids = await erc721.getTokenIdsList();
    expect( tokids.length ).to.equal(2);           
}

async function erc721_test_can_mint_with_zero_price_if_witness_provided({ erc721, buyer_1, buyer_2, witness, nobody, cost }){
    await erc721.setIsMinting(true);
    await erc721.mint( [buyer_1.address, buyer_2.address], [1,2], witness.address, {value:0});
    expect( await erc721.balanceOf(buyer_1.address) ).to.equal(1);
    expect( await erc721.balanceOf(buyer_2.address) ).to.equal(1);
    expect( await erc721.ownerOfToken(1) ).to.equal(buyer_1.address);
    expect( await erc721.ownerOfToken(2) ).to.equal(buyer_2.address);
    let tokids = await erc721.getTokenIdsList();
    expect( tokids.length ).to.equal(2);     
};

async function erc721_test_shall_fail_mint_if_wrong_price_with_wrong_witness({ erc721, buyer_1, buyer_2, nobody, cost, isProxy }){
    await erc721.setIsMinting(true);
    try {
        if (isProxy){
            await erc721.mint( [buyer_1.address, buyer_2.address], [1,2], nobody.address, {value:cost});
        } else {
            erc721.mint( [buyer_1.address, buyer_2.address], [1,2], nobody.address, {value:cost});
        }
    } catch (error) {
        assert(error.message === errorString({ isProxy: true, str: "Payment must be > price" }) );
    }
    expect( await erc721.ownerOfToken(1) ).to.equal(constants.ZERO_ADDRESS);
    expect( await erc721.ownerOfToken(2) ).to.equal(constants.ZERO_ADDRESS);
    let tokids = await erc721.getTokenIdsList();
    expect( tokids.length ).to.equal(0);     
}


async function erc721_test_can_set_price({ erc721, buyer_1, buyer_2, nobody, cost, isProxy }){

    await erc721.setIsMinting(true);

    expect( await erc721.getPrice() ).to.equal(cost);
    await erc721.setPrice(2*cost);
    expect( await erc721.getPrice() ).to.equal(2*cost);

    try {
        if (isProxy){
            await erc721.connect(nobody).setPrice(3*cost);
        } else {
            erc721.connect(nobody).setPrice(3*cost);

        }
    } catch (error) {
        assert(error.message === errorString({ isProxy: true, str: "Only contract owner can set price" }) );
    }

    // cannot mint mint w/ new price
    try {
        if (isProxy){
            await erc721.mint([buyer_1.address], [1], nobody.address, {value:cost});
        } else {
            erc721.mint([buyer_1.address], [1], nobody.address, {value:cost});
        }
    } catch (error) {
        assert( error.message === errorString({ isProxy, str: "Payment must be > price" }));
    }

    await erc721.mint([buyer_1.address], [1], nobody.address, {value:2*cost});
    expect( await erc721.ownerOfToken(1) ).to.equal(buyer_1.address);

}


async function erc721_test_shall_fail_mint_on_repeate_ids({erc721, buyer_1, buyer_2, nobody, cost, isProxy  }){
    await erc721.setIsMinting(true);
    await erc721.mint( [buyer_1.address, buyer_2.address], [1,2], nobody.address, {value:2*cost});
    try {
        if (isProxy){
            erc721.mint( [buyer_3.address], [1], nobody.address, {value:cost});
        } else {
            erc721.mint( [buyer_3.address], [1], nobody.address, {value:cost});
        }
    } catch (error) {
        assert(error.message === errorString({ isProxy, str: "This token id already exists" }) );
    }
    expect( await erc721.balanceOf(buyer_1.address) ).to.equal(1);
    expect( await erc721.balanceOf(buyer_2.address) ).to.equal(1);
    expect( await erc721.ownerOfToken(1) ).to.equal(buyer_1.address);
    expect( await erc721.ownerOfToken(2) ).to.equal(buyer_2.address);
    let tokids = await erc721.getTokenIdsList();
    expect( tokids.length ).to.equal(2);    
};

async function erc721_test_shall_fail_batch_mint_on_repeate_ids({erc721, buyer_1, buyer_2, nobody, cost, isProxy}){
    await erc721.setIsMinting(true);
    try {
        if (isProxy){
            await erc721.mint( [buyer_1.address, buyer_2.address], [1,1], nobody.address, {value:2*cost});
        } else {
            erc721.mint( [buyer_1.address, buyer_2.address], [1,1], nobody.address, {value:2*cost});
        }
    } catch (error) {
        assert(error.message === errorString({ isProxy, str: 'ERC721LumoV1: This address is not whitelisted or the token id already exists' }));
    }
    expect( await erc721.balanceOf(buyer_1.address) ).to.equal(1);
    expect( await erc721.balanceOf(buyer_2.address) ).to.equal(0);
    expect( await erc721.ownerOfToken(1) ).to.equal(buyer_1.address);
    let tokids = await erc721.getTokenIdsList();
    expect( tokids.length ).to.equal(1);    
}

async function erc721_test_can_read_paused({erc721}){
    await erc721.setIsMinting(false)
    expect ( await erc721.isPaused() ).to.equal(true);
    await erc721.setIsMinting(true);
    expect ( await erc721.isPaused() ).to.equal(false);
}


async function erc721_test_shall_fail_mint_when_paused({ erc721, buyer_3, nobody, cost, isProxy }){
    await erc721.setIsMinting(false)
    try {
        if (isProxy){
            await erc721.mint( [buyer_3.address], [1], nobody.address, {value:cost});
        } else {
            erc721.mint( [buyer_3.address], [1], nobody.address, {value:cost});
        }
    } catch (error){
        assert(error.message === errorString({ isProxy, str: "Mint is paused or mismatched input lengths" }));
    }
}

async function erc721_test_shall_not_fail_mint_when_paused_and_resume_mint({ erc721, buyer_1, buyer_2, nobody, cost  }){
    await erc721.setIsMinting(false)
    await erc721.setIsMinting(true)
    await erc721.mint( [buyer_1.address, buyer_2.address], [1,2], nobody.address, {value:2*cost});
    expect( await erc721.balanceOf(buyer_1.address) ).to.equal(1);
    expect( await erc721.balanceOf(buyer_2.address) ).to.equal(1);
}



// can create reward w/ correct value and get
async function erc721_test_can_create_reward({ erc721, buyer_1, buyer_2, nobody, seller, isProxy, cost }){

    const raw_set = [ buyer_1.address, buyer_2.address, seller.address ];
    leafs = raw_set.map(a => keccak256(a));
    tree  = new MerkleTree(leafs, keccak256, {sortPairs:true}); 
    const root  = tree.getRoot().toString('hex');
    const leaf  = keccak256(seller.address);
    const proof = tree.getProof(leaf);

    // shall fail
    try {
        await erc721.connect(nobody).createReward(tree.getRoot(), cost);
    } catch (error) {
        assert(error.message === errorString({ isProxy, str: "Only owner can create reward" }));        
    }

    // create two rewards
    await erc721.connect(seller).createReward(tree.getRoot(), 100)
    await erc721.connect(seller).createReward(tree.getRoot(), 0);

    let rwd_1 = await erc721.getReward(1);
    let rwd_2 = await erc721.getReward(2);

    expect(rwd_1[0]).to.equal(1);
    expect(rwd_1[1]).to.equal(100);
    expect(rwd_2[0]).to.equal(2);
    expect(rwd_2[1]).to.equal(0);
    expect( await erc721.getRecentRewardId() ).to.equal(2);
}



// can claim reward w/ correct params
async function erc721_test_shall_be_able_to_claim_reward({  erc721, buyer_1, buyer_2, nobody, seller, isProxy, cost }){

    const raw_set = [ buyer_1.address, buyer_2.address, seller.address ];
    leafs = raw_set.map(a => keccak256(a));
    tree  = new MerkleTree(leafs, keccak256, {sortPairs:true}); 
    const root  = tree.getRoot().toString('hex');

    await erc721.connect(seller).createReward(tree.getRoot(), cost);

    // buyer 1 claim reward once shall w/ price shall succ
    let proof_buyer_1 = tree.getHexProof(keccak256(buyer_1.address))
    await erc721.connect(buyer_1).claimReward(1, proof_buyer_1, 0, {value:cost});
    expect( await erc721.balanceOf(buyer_1.address) ).to.equal(1);
    expect( await erc721.ownerOfToken(1) ).to.equal(buyer_1.address);

    // buyer 1 claim reward twice shall fail
    try {
        await erc721.connect(buyer_1).claimReward(1, proof_buyer_1, 0);
    } catch (error) {
        console.log(error.message)
        assert(error.message === errorString({ isProxy, str: "Insufficient payment to claim reward, or you have already claimed reward, or this proof has already been submitted once" }));        
    }
    expect( await erc721.balanceOf(buyer_1.address) ).to.equal(1);
    expect( await erc721.ownerOfToken(1) ).to.equal(buyer_1.address);
    expect( await erc721.ownerOfToken(2) ).to.equal(constants.ZERO_ADDRESS);

    // buyer 2 claim reward once shall w/ price shall fail w/ no payment
    let proof_buyer_2 = tree.getHexProof(keccak256(buyer_2.address))
    try {
        await erc721.connect(buyer_2).claimReward(1, proof_buyer_2, 0, {value:cost/2});
    } catch (error) {
        assert(error.message === errorString({ isProxy, str: "Insufficient payment to claim reward, or you have already claimed reward, or this proof has already been submitted once" }));        
    }
    expect( await erc721.balanceOf(buyer_2.address) ).to.equal(0);

    // claim w/ price shall succ
    await erc721.connect(buyer_2).claimReward(1, proof_buyer_2, 0, {value:cost});
    expect( await erc721.balanceOf(buyer_2.address) ).to.equal(1);
    expect( await erc721.ownerOfToken(2) ).to.equal(buyer_2.address);

    // // shall fail when looking for none-prooved address
    let proof_nobody = tree.getHexProof(keccak256(nobody.address))
    try {
        await erc721.connect(nobody).claimReward(1, proof_nobody, 0, {value:cost});
    } catch (error) {
        assert(error.message === errorString({ isProxy, str: "Invalid proof"}))
    }
    expect( await erc721.balanceOf(nobody.address) ).to.equal(0);


    // create free airdrop;
    await erc721.connect(seller).createReward(tree.getRoot(), 0);
    await erc721.connect(buyer_1).claimReward(2, proof_buyer_1, 0, {value:0});
    expect( await erc721.balanceOf(buyer_1.address) ).to.equal(2);
    expect( await erc721.ownerOfToken(3) ).to.equal(buyer_1.address);

    // shall fail to mint w/ id 3
    await erc721.mint([nobody.address], [3], constants.ZERO_ADDRESS, {value:cost});
    expect( await erc721.ownerOfToken(3) ).to.equal(buyer_1.address);
    expect( await erc721.balanceOf(nobody.address) ).to.equal(0);
}


/******************************************************
    @export
******************************************************/

exports.ERC721_ABI = ERC721_ABI;
exports.erc721_test_on_deploy = erc721_test_on_deploy;
exports.erc721_test_can_mint = erc721_test_can_mint;
exports.erc721_test_can_read_paused = erc721_test_can_read_paused;
exports.erc721_test_can_mint_batch = erc721_test_can_mint_batch;
exports.erc721_test_can_mint_with_higher_price = erc721_test_can_mint_with_higher_price;
exports.erc721_test_can_mint_with_zero_price_if_witness_provided = erc721_test_can_mint_with_zero_price_if_witness_provided;
exports.erc721_test_shall_fail_mint_if_wrong_price_with_wrong_witness = erc721_test_shall_fail_mint_if_wrong_price_with_wrong_witness;
exports.erc721_test_shall_fail_mint_on_repeate_ids = erc721_test_shall_fail_mint_on_repeate_ids;
exports.erc721_test_shall_fail_batch_mint_on_repeate_ids = erc721_test_shall_fail_batch_mint_on_repeate_ids;
exports.erc721_test_shall_fail_mint_when_paused = erc721_test_shall_fail_mint_when_paused;
exports.erc721_test_shall_not_fail_mint_when_paused_and_resume_mint = erc721_test_shall_not_fail_mint_when_paused_and_resume_mint;
exports.erc721_test_can_set_price = erc721_test_can_set_price;

exports.erc721_test_can_create_reward = erc721_test_can_create_reward
exports.erc721_test_shall_be_able_to_claim_reward = erc721_test_shall_be_able_to_claim_reward

