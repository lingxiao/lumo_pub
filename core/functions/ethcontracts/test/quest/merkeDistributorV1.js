/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: MerkleDistributorV1.sol test
 * @Date   : 12/14/2022
 * @Run    : `npx hardhat test`
 * @Reference: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/cryptography/MerkleProof.sol
 * 
*/


const { expect, assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, waffle } = require("hardhat");
const { constants } = require('@openzeppelin/test-helpers');

const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");



/******************************************************
    @constants
******************************************************/

const eth_sent = 10;
const eth_to_wei = 1000000000000000000;

function errorString({ isProxy, str }){
    if (isProxy){
        return `VM Exception while processing transaction: reverted with reason string '${str}'`
    } else {
        return str;
    }
}

// runMerkleDistributorV1_tests();

/******************************************************
    @run tests
******************************************************/


async function runMerkleDistributorV1_tests(){

    describe("MerkleDistributorV1.sol test", function(){

        it('...running all tests', async function(){

            var merkleDistributor, erc721;
            var seller, mktPlace, user_1, user_2, user_3, nobody;
            var leafes, tree, root, raw_set;

            var test_params = {};

            beforeEach(async () => {
                [ 
                    seller,
                    mktPlace, 
                    user_1,
                    user_2,
                    user_3,
                    nobody,
                ] = await ethers.getSigners();

                // create tree;
                raw_set = [
                    seller,
                    mktPlace, 
                    user_1,
                    user_2,
                    user_3,
                ]

                leafs = raw_set.map(a => keccak256(a.address));
                tree  = new MerkleTree(leafs, keccak256, {sortPairs:true}); 
                const root  = tree.getRoot().toString('hex');
                const leaf  = keccak256(seller.address);
                const proof = tree.getProof(leaf);

                // uncomment these to visually inspect;
                // console.log(tree.verify(proof, leaf, root)) // true
                // console.log(tree.verify(proof, keccak256(nobody.address), root)) // false;
                // console.log('tree: ', tree.toString()); // pp-tree

                // deploy quest 
                const MerkleDistributor = await ethers.getContractFactory(`MerkleDistributorV1`);
                merkleDistributor = await MerkleDistributor.deploy();
                await merkleDistributor.deployed();

                // deploy nft;
                const TestNFT = await ethers.getContractFactory(`TestNFT`);
                erc721 = await TestNFT.deploy();                

            });

            // deployed correctly
            describe("MerkleDistributorV1 => contract deployed with correct basic functionality", () => {

                it("MerkleDistributorV1 => shall be able to add quest", async () => {
                    leafs = raw_set.map(a => keccak256(a.address));
                    tree  = new MerkleTree(leafs, keccak256, {sortPairs:true}); 
                    await merkleDistributor.connect(user_1).createERC721Quest(1, 100, tree.getRoot(), erc721.address, "");
                    let quest = await merkleDistributor.getQuest(1);
                    expect( quest[0] ).to.equal(1)
                    expect( quest[1] ).to.equal(user_1.address);
                    expect( quest[2] ).to.equal(100);
                    expect( quest[3] ).to.equal(erc721.address);
                });

                it("MerkleDistributorV1 => shall be able to remove quest", async () => {
                    leafs = raw_set.map(a => keccak256(a.address));
                    tree  = new MerkleTree(leafs, keccak256, {sortPairs:true}); 
                    await merkleDistributor.connect(user_1).createERC721Quest(1, 100, tree.getRoot(), erc721.address, "");
                    let quest = await merkleDistributor.getQuest(1);
                    expect( quest[1] ).to.equal(user_1.address);
                    await merkleDistributor.connect(user_1).removeQuest(1);
                });

                it("MerkleDistributorV1 => shall [NOT] be able to remove quest if user didn't create it", async () => {
                    leafs = raw_set.map(a => keccak256(a.address));
                    tree  = new MerkleTree(leafs, keccak256, {sortPairs:true}); 
                    await merkleDistributor.connect(user_1).createERC721Quest(1, 100, tree.getRoot(), erc721.address, "");
                    let quest = await merkleDistributor.getQuest(1);
                    expect( quest[1] ).to.equal(user_1.address);
                    try {
                        await merkleDistributor.connect(nobody).removeQuest(1);
                    } catch( error ) {
                        assert(error.message == errorString({ str: 'Only quest owner can remove quest', isProxy: true }));                        
                    }
                });
            });

            describe("MerkleDistributorV1 => can prove set containment and not containment ", () => {

                // create quest and whitelist quest contract w/ erc721 contract;
                beforeEach(async () => {
                    leafs = raw_set.map(a => keccak256(a.address));
                    tree  = new MerkleTree(leafs, keccak256, {sortPairs:true}); 
                    await merkleDistributor.connect(user_1).createERC721Quest(1, 100, tree.getRoot(), erc721.address, "");                    
                    await erc721.whitelistQuestContract(merkleDistributor.address);
                })

                it("MerkleDistributorV1 => shall prove set containment", async () => {

                    expect(await erc721.questContractIsWhitelisted(merkleDistributor.address)).to.equal(true);

                    let quest = await merkleDistributor.getQuest(1);
                    expect( quest[3] ).to.equal(erc721.address);

                    let rproof = tree.getHexProof(keccak256(seller.address))
                    let tok_id = await merkleDistributor.connect(seller).claimQuest(1, rproof);
                    let did_claim = await merkleDistributor.didClaimQuest(1, seller.address);
                    expect( did_claim ).to.equal(true);
                    expect( await erc721.balanceOf(seller.address) ).to.equal(1);

                    setTimeout(async () => {
                        let sproof = tree.getHexProof(keccak256(user_2.address))    
                        await merkleDistributor.connect(user_2).claimQuest(1, sproof);
                        let did_claim_user_2 = await merkleDistributor.didClaimQuest(1, user_2.address);
                        expect( did_claim_user_2 ).to.equal(true);
                        expect( await erc721.balanceOf(user_2.address) ).to.equal(1);
                    },3000);

                });

                it("MerkleDistributorV1 => shall prove set containment only once", async () => {

                    expect(await erc721.questContractIsWhitelisted(merkleDistributor.address)).to.equal(true);

                    let rproof = tree.getHexProof(keccak256(user_1.address))
                    await merkleDistributor.connect(user_1).claimQuest(1, rproof);
                    let did_claim = await merkleDistributor.didClaimQuest(1, user_1.address);
                    expect( did_claim ).to.equal(true);
                    expect( await erc721.balanceOf(user_1.address) ).to.equal(1);

                    setTimeout(async () => {
                        try {
                            await merkleDistributor.connect(user_1).claimQuest(1, rproof);
                        } catch(error){
                            assert(error.message == errorString({ str: 'You have already claimed quest', isProxy: true }));                        
                        }
                    },3000);
                });
                

                it("MerkleDistributorV1 => shall [NOT] use same proof more than once", async () => {

                    expect(await erc721.questContractIsWhitelisted(merkleDistributor.address)).to.equal(true);

                    let rproof = tree.getHexProof(keccak256(user_1.address))
                    await merkleDistributor.connect(user_1).claimQuest(1, rproof);
                    let did_claim = await merkleDistributor.didClaimQuest(1, user_1.address);
                    expect( did_claim ).to.equal(true);
                    expect( await erc721.balanceOf(user_1.address) ).to.equal(1);

                    try {
                        await merkleDistributor.connect(user_2).claimQuest(1, rproof);
                    } catch(error){
                        assert(error.message == errorString({ str: 'This proof has already been submitted once', isProxy: true }));                        
                    }
                });

                it("MerkleDistributorV1 => shall prove [NOT] set containment", async () => {
                    let rproof = tree.getHexProof(keccak256(nobody.address));
                    try {
                        await merkleDistributor.connect(nobody).claimQuest(1, rproof);
                    } catch (error) {
                        assert(error.message == errorString({ str: 'Invalid proof for quest', isProxy: true }));
                    }
                    let did_claim = await merkleDistributor.didClaimQuest(1,nobody.address);
                    expect( did_claim ).to.equal(false);
                    expect( await erc721.balanceOf(nobody.address) ).to.equal(0);
                });

            });

            // test faucet
            describe("MerkleDistributorV1 => faucet working as intended", () => {

                it("MerkleDistributorV1 => shall be able to fund faucet", async () => {                    
                    let bal_after = eth_sent * eth_to_wei - 1000000000000000;
                    let balance_user_2_0  = await waffle.provider.getBalance( user_2.address );

                    await merkleDistributor.fundFaucet({value: ethers.utils.parseEther(`${eth_sent}`)})
                    expect( await merkleDistributor.readFaucet() ).to.equal(ethers.utils.parseEther(`${eth_sent}`));

                    await merkleDistributor.connect(user_2).dripFaucet();
                    expect( await merkleDistributor.readFaucet() ).to.equal(BigNumber.from(`${bal_after}`));

                    let balance_user_2_1  = await waffle.provider.getBalance( user_2.address );
                    let expected_bal_user_2_1 = balance_user_2_0.add(BigNumber.from(`${1000000000000000}`));
                    expect( balance_user_2_1 ).to.gt(balance_user_2_0);
                    expect( balance_user_2_1 ).to.lt(expected_bal_user_2_1);
                });

            });
        });
    });
}



















