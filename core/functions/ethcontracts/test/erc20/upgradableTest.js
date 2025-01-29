// /* eslint-disable no-await-in-loop */

// /** 
//  * 
//  * @Package: upgradableTest.js
//  * @Date   : 12/2/2022
//  * @Run    : `npx hardhat test`
//  * @Doc    : https://dev.to/abhikbanerjee99/testing-your-upgradeable-smart-contract-2fjd
//  *         : https://dev.to/abhikbanerjee99/understanding-upgradeable-smart-contracts-hands-on-1c00
//  *         : https://eips.ethereum.org/EIPS/eip-1822
//  * @dev    : https://medium.com/deeblueangel/how-to-write-an-upgradeable-erc721-nft-contract-b0d51e74a89f

// */


// const { BigNumber } = require("ethers");
// const { expect, assert } = require("chai");
// const { ethers, waffle, upgrades } = require("hardhat");

// const {
//   expectRevert, // Assertions for transactions that should fail
// } = require('@openzeppelin/test-helpers');


// /******************************************************
//     @test main
// ******************************************************/

// const URI = `http://lingxiaoling.us/`

// describe("UpgradableTest.sol basic test", function(){

//     // testing deployment for v1 only
//     describe("OurUpgradeableNFT1/2: contract basic test", function () {

//         it("v1 shall deploy", async function () {
//             const OurUpgradeableNFT1 = await ethers.getContractFactory("OurUpgradeableNFT1");
//             const contract = await upgrades.deployProxy(OurUpgradeableNFT1, ["helloworld"], { initializer: 'initialize', kind: 'uups'});
//             await contract.deployed();
//             expect(await contract.greeting()).to.equal("helloworld");
//         });

//         // v2 shall deploy
//         it("v2 shall deploy", async function () {
//             const OurUpgradeableNFT2 = await ethers.getContractFactory("OurUpgradeableNFT2");
//             const contract = await upgrades.deployProxy(OurUpgradeableNFT2, [], { initializer: 'reInitialize', kind: 'uups'});
//             await contract.deployed();
//             // expect(await contract.greeting()).to.equal("helloworld");
//             expect(await contract.greetingNew()).to.equal("New Upgradeable World!");
//         });
//         // testing deployment for v1 only
//         describe("NFTCollectible: contract Version 1 test", function () {
//             it("v1 shall deploy", async function () {
//                 const NFTCollectible = await ethers.getContractFactory("NFTCollectible");
//                 const contract = await upgrades.deployProxy(NFTCollectible, [URI], { initializer: 'initialize', kind: 'uups'});
//                 await contract.deployed();
//                 expect(await contract.MAX_SUPPLY()).to.equal(100);
//                 expect(await contract.MAX_PER_MINT()).to.equal(5);
//             });
//         });        
//     });

//     // testing deploying v1 and v2, test proxy can call v2 correctly
//     describe("OurUpgradeableNFT1/2: it shall upgrade", function () {

//         let oldContract, upgradedContract, owner, addr1;

//         // deploy and upgrade   
//         beforeEach(async function () {
//             [owner, addr1] = await ethers.getSigners(2);
//             const OurUpgradeableNFT1 = await ethers.getContractFactory("OurUpgradeableNFT1");
//             const OurUpgradeableNFT2 = await ethers.getContractFactory("OurUpgradeableNFT2");
//             // deploy old contract
//             oldContract = await upgrades.deployProxy(OurUpgradeableNFT1, ["Hello, upgradeable world!"], { initializer: 'initialize', kind: 'uups'});
//             await oldContract.deployed();
//             // upgrade contract
//             upgradedContract = await upgrades.upgradeProxy(oldContract, OurUpgradeableNFT2, {call: {fn: 'reInitialize'}});
//         });

//         // old contract still operates
//         it("Old contract should return old greeting", async function () {
//             expect(await oldContract.greeting()).to.equal("Hello, upgradeable world!");
//         });

//         // old contract cannot mint
//         it("Old contract cannnot mint NFTs", async function () {
//             try {
//               oldContract.safeMint(owner.address, "Test NFT")
//             } catch (error) {
//               assert(error.message === "oldContract.safeMint is not a function" )
//             }
//         })

//         // new contract has old and new methods
//         it("New Contract Should return the old & new greeting and token name after deployment", async function() {
//             expect(await upgradedContract.greeting()).to.equal("Hello, upgradeable world!");
//             expect(await upgradedContract.greetingNew()).to.equal("New Upgradeable World!");
//             expect(await upgradedContract.name()).to.equal("OurUpgradeableNFT")
//         });        

//         // new contract can mint
//         it("Owner can mint NFTs from the upgraded smart contract", async function () {
//             await expect(upgradedContract.safeMint(owner.address, "Test NFT"))
//                 .to.emit(upgradedContract, "Transfer")
//                 .withArgs(ethers.constants.AddressZero, owner.address, 0);
//             expect(await upgradedContract.balanceOf(owner.address)).to.equal(1);
//             expect(await upgradedContract.ownerOf(0)).to.equal(owner.address);
//         });

//         it("Only Owner can mint NFTs", async function () {
//             await expect(upgradedContract.connect(addr1).safeMint(addr1.address, "Test NFT 2"))
//             .to.be.revertedWith("Ownable: caller is not the owner");
//         })        


//     })        



// });














