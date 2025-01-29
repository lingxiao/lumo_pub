/* eslint-disable no-await-in-loop */

/** 
 * 
 * @Package: MerkleDistributorv2.sol test
 * @Date   : 12/14/2022
 * @Run    : `npx hardhat test`
 * @Doc: 
 *   - https://medium.com/@ItsCuzzo/using-merkle-trees-for-nft-whitelists-523b58ada3f9
 *   - https://soliditydeveloper.com/merkle-tree
 *   - https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/cryptography/MerkleProof.sol
 * 
*/


const { expect, assert } = require("chai");
const { BigNumber } = require("ethers");
const { ethers, waffle } = require("hardhat");
const {
    constants,
} = require('@openzeppelin/test-helpers');

const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");

const {
    errorString,
    SPLITTER_ABI,
} = require('./../erc721/PaymentSplitterV1');

const {
    ERC721_ABI
} = require("./../erc721/erc721");


/******************************************************
    @constants
******************************************************/

const cost = 10;
const eth_sent = 10;
const eth_to_wei = 1000000000000000000;
const ABI = (ERC721_ABI).concat(SPLITTER_ABI);


async function sendEth({ source, target, value }){
    await source.sendTransaction({ to: target.address, value: ethers.utils.parseEther(`${value}`) });
}


// runMerkleDistributorV2_tests();

/******************************************************
    @run tests
******************************************************/


async function runMerkleDistributorV2_tests(){

    describe("MerkleDistributorV2.sol test", function(){

        it('...running all tests', async function(){

            var witness;
            var merkleDistributor;
            var erc721Splitter, erc721, proxy, _proxy;
            var seller, witness, mktPlace, user_1, user_2, user_3, nobody;
            var leafes, tree, root, raw_set;

            var test_params = {};

            beforeEach(async () => {
                [ 
                    seller,
                    mktPlace, 
                    user_1,
                    user_2,
                    user_3,
                    witness,
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

                // console.log(tree.verify(proof, leaf, root)) // true
                // console.log(tree.verify(proof, keccak256(nobody.address), root)) // false;
                // console.log('tree: ', tree.toString()); // pp-tree
                // console.log('root:f', root)

                // deploy quest 
                const MerkleDistributor = await ethers.getContractFactory(`MerkleDistributorV2`);
                merkleDistributor = await MerkleDistributor.deploy();
                await merkleDistributor.deployed();

                // deploy logic contract for 721
                const ERC721LumoV2 = await ethers.getContractFactory(`ERC721LumoV2`);
                erc721 = await ERC721LumoV2.deploy();

                // deploy logic contract for splitter
                const ERC721SplitterV2 = await ethers.getContractFactory(`ERC721SplitterV2`);
                erc721Splitter = await ERC721SplitterV2.deploy();

                // deploy proxy and set impl.
                const ERC721SplitterProxy = await ethers.getContractFactory('ERC721SplitterProxy');
                _proxy = await ERC721SplitterProxy.deploy();
                await _proxy.deployed();
                await _proxy.initializeERC721SplitterProxy(
                    erc721Splitter.address,
                    witness.address, 
                    mktPlace.address, 
                    [seller.address],
                    [100],
                    erc721.address,
                    'lumo',
                    'LMO',
                    'lumo.xyz/api/v1',
                    cost
                )

                // instantiate proxyand whitelist quest contract;
                proxy = new ethers.Contract(_proxy.address, ABI, seller);

            });

            // deployed correctly
            describe("MerkleDistributorV2 => contract deployed with correct basic functionality", () => {

                it("MerkleDistributorV2 => shall be able to add quest", async () => {
                    leafs = raw_set.map(a => keccak256(a.address));
                    tree  = new MerkleTree(leafs, keccak256, {sortPairs:true}); 
                    await merkleDistributor.connect(user_1).createERC721LumoQuest(1, 100, tree.getRoot(), _proxy.address, "");
                    let quest = await merkleDistributor.getQuest(1);
                    expect( quest[0] ).to.equal(1)
                    expect( quest[1] ).to.equal(user_1.address);
                    expect( quest[2] ).to.equal(100);
                    expect( quest[3] ).to.equal(proxy.address);
                });

                it("MerkleDistributorV2 => shall be able to remove quest", async () => {
                    leafs = raw_set.map(a => keccak256(a.address));
                    tree  = new MerkleTree(leafs, keccak256, {sortPairs:true}); 
                    await merkleDistributor.connect(user_1).createERC721LumoQuest(1, 100, tree.getRoot(), _proxy.address, "");
                    let quest = await merkleDistributor.getQuest(1);
                    expect( quest[1] ).to.equal(user_1.address);
                    await merkleDistributor.connect(user_1).removeQuest(1);
                });

                it("MerkleDistributorV2 => shall [NOT] be able to remove quest if user didn't create it", async () => {
                    leafs = raw_set.map(a => keccak256(a.address));
                    tree  = new MerkleTree(leafs, keccak256, {sortPairs:true}); 
                    await merkleDistributor.connect(user_1).createERC721LumoQuest(1, 100, tree.getRoot(), _proxy.address, "");
                    let quest = await merkleDistributor.getQuest(1);
                    expect( quest[1] ).to.equal(user_1.address);
                    try {
                        await merkleDistributor.connect(nobody).removeQuest(1);
                    } catch( error ) {
                        assert(error.message == errorString({ str: 'Only quest owner can remove quest', isProxy: true }));                        
                    }
                });
            });

            describe("MerkleDistributorV2 => can prove set containment and not containment ", () => {

                // create quest and whitelist quest contract w/ erc721 contract;
                // https://app.palm.io/configure
                beforeEach(async () => {
                    leafs = raw_set.map(a => keccak256(a.address));
                    tree  = new MerkleTree(leafs, keccak256, {sortPairs:true}); 
                    await merkleDistributor.connect(user_1).createERC721LumoQuest(1, 100, tree.getRoot(), _proxy.address, "");                    
                    await proxy.whitelistQuestContract(witness.address, merkleDistributor.address);
                })

                it("MerkleDistributorV2 => shall prove set containment", async () => {

                    expect(await proxy.questContractIsWhitelisted(merkleDistributor.address)).to.equal(true);

                    let tok_id = 22;
                    let quest = await merkleDistributor.getQuest(1);
                    expect( quest[3] ).to.equal(proxy.address);

                    let rproof = tree.getHexProof(keccak256(seller.address))
                    await merkleDistributor.connect(seller).claimQuest(1, rproof, tok_id);
                    let did_claim = await merkleDistributor.didClaimQuest(1, seller.address);
                    expect( did_claim ).to.equal(true);
                    expect( await proxy.balanceOf(seller.address) ).to.equal(1);
                    expect( await proxy.ownerOfToken(tok_id) ).to.equal(seller.address);

                    let sproof = tree.getHexProof(keccak256(user_2.address))
                    await merkleDistributor.connect(user_2).claimQuest(1, sproof, tok_id+1);
                    let did_claim_user_2 = await merkleDistributor.didClaimQuest(1, user_2.address);
                    expect( did_claim_user_2 ).to.equal(true);
                    expect( await proxy.balanceOf(user_2.address) ).to.equal(1);
                    expect( await proxy.ownerOfToken(tok_id+1) ).to.equal(user_2.address);

                });

                it("MerkleDistributorV2 => shall prove set containment only once", async () => {

                    expect(await proxy.questContractIsWhitelisted(merkleDistributor.address)).to.equal(true);

                    let tok_id = 25;
                    let rproof = tree.getHexProof(keccak256(user_1.address))
                    await merkleDistributor.connect(user_1).claimQuest(1, rproof, tok_id);
                    let did_claim = await merkleDistributor.didClaimQuest(1, user_1.address);
                    expect( did_claim ).to.equal(true);
                    expect( await proxy.balanceOf(user_1.address) ).to.equal(1);
                    expect( await proxy.ownerOfToken(tok_id) ).to.equal(user_1.address);

                    try {
                        await merkleDistributor.connect(user_1).claimQuest(1, rproof, tok_id+1);
                    } catch(error){
                        assert(error.message == errorString({ str: 'You have already claimed quest', isProxy: true }));                        
                    }
                });

                it("MerkleDistributorV2 => shall [NOT] use same proof more than once", async () => {

                    expect(await proxy.questContractIsWhitelisted(merkleDistributor.address)).to.equal(true);

                    let tok_id = 25;
                    let rproof = tree.getHexProof(keccak256(user_1.address))
                    await merkleDistributor.connect(user_1).claimQuest(1, rproof, tok_id);
                    let did_claim = await merkleDistributor.didClaimQuest(1, user_1.address);
                    expect( did_claim ).to.equal(true);
                    expect( await proxy.balanceOf(user_1.address) ).to.equal(1);
                    expect( await proxy.ownerOfToken(tok_id) ).to.equal(user_1.address);

                    try {
                        await merkleDistributor.connect(user_2).claimQuest(1, rproof, tok_id+1);
                    } catch(error){
                        assert(error.message == errorString({ str: 'This proof has already been submitted once', isProxy: true }));                        
                    }
                });

                it("MerkleDistributorV2 => shall prove [NOT] set containment", async () => {
                    let rproof = tree.getHexProof(keccak256(nobody.address));
                    try {
                        await merkleDistributor.connect(nobody).claimQuest(1, rproof, 22);
                    } catch (error) {
                        assert(error.message == errorString({ str: 'Invalid proof for quest', isProxy: true }));
                    }
                    let did_claim = await merkleDistributor.didClaimQuest(1,nobody.address);
                    expect( did_claim ).to.equal(false);
                    expect( await proxy.balanceOf(nobody.address) ).to.equal(0);
                    expect( await proxy.ownerOfToken(22) ).to.equal(constants.ZERO_ADDRESS);
                });

            });


        });
    });
}



















