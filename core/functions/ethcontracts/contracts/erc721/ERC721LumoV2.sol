// SPDX-License-Identifier: MIT
// author: lingxiao
// date: Dec 12 2022
// contact: lingxiao@lumo.land
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "operator-filter-registry/src/upgradeable/DefaultOperatorFiltererUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./LumoAppStorage.sol";
import "./PaymentSplitterV2.sol";

/**
 * 
 * @dev ERC721LumoV2 is conceptually a contract that inherits
 *      PaymentSplitterV1 and ERC721LumoV2, but because each contract
 *      is close the maximal size allowd by ethereum, dispatching is
 *      used to recreate inhertance pattern. see `fallback` function for 
 *      how dispatch is done. The ERC721LumoV2 contract serve as the
 *      logic layer for the token standard, while contract `PaymentSplitterV2` 
 *      serve as the payment splitter logic layer. 
 *      Note both PaymentSplitterV2 and ERC721LumoV2 useses `LumoAppStorage` layout
 *      So the impl. logic of ERC721 can be upgraded w/o changing the state of
 *      this contract. Moreover `ERC721SplitterV2` can be upgraded by deploying
 *      a new version of this contract, and pointing the deployed instance of
 *      `ERC721SplitterProxy.sol` to the new version's address; 
 * 
 **/
 contract ERC721LumoV2 is 
    Initializable, 
    ERC721Upgradeable, 
    DefaultOperatorFiltererUpgradeable
{

    LumoAppStorage internal store;

    event PaymentReceived(address from, uint256 amount);    
    event MintSucceed(address pk, uint256 tokid, string msg);
    event MintCanceled(address pk, uint256 tokid, string msg);
    event RewardCreated(uint256 id);
    // event RewardCompletedTokenAirdropped(uint256 id, address receiver, uint256 tok_id);


    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev initialize erc721 as well as the payment splitter
     **/
    function initializeERC721LumoV2(
        address witness_,
        address feeTargetAddress_,
        address splitterAddress_,
        address[] memory payees_, 
        uint256[] memory shares_,
        string memory _name,
        string memory _symbol,
        string memory uri_, 
        uint256 price_
    ) initializer public {
        __ERC721_init(_name,_symbol);
        store.baseURIV1 = uri_;
        store.tokIdIncr = 0;
        store.rewardId = 0;
        store.ownerAppContract  = msg.sender;
        store.witnessAppLumo = witness_;
        store.priceItem = price_;
        store.isPaused = false;
        store.splitterImpl = splitterAddress_;
        if (getSplitterImplementation() != address(0)){
            getSplitterImplementation().delegatecall(abi.encodeWithSelector(PaymentSplitterV2.setPaymentSplitterInitialValues.selector, witness_, feeTargetAddress_, payees_, shares_));
        }
    }    

    /**
     ****************************************************************************
    * API proxy;
    */

    // @dev set impl address and contract owner/witness
    //      only witness can update impl address to prevent attacks
    function setImplementation(address impl) public {
        require( store.witnessAppLumo == msg.sender, "Only witness can set implementation");
        store.splitterImpl = impl;
    }    
    
    function getSplitterImplementation() public view returns (address) {
        return store.splitterImpl;
    }

    fallback() external payable {
        _delegate(store.splitterImpl);
    }

    //@dev call erc721 first, if no fn found then call splitter contract
    function _delegate(address impl721) internal virtual {
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize())
            let result := delegatecall(gas(), impl721, ptr, calldatasize(), 0, 0)
            let size := returndatasize()
            returndatacopy(ptr, 0, size)
            switch result
            case 0 {
                revert(ptr, size)
            }
            default {
                return(ptr, size)
            }
        }
    }       

    /**
     ****************************************************************************
    * API ERC721 read
    */

    function uri(uint256 tokid) public view returns (string memory){
        require(_ownerOf(tokid) != address(0), "This token does not exist");
        return string(abi.encodePacked(store.baseURIV1, Strings.toString(tokid)));
    }

    function getTokenIdsList() public view returns (uint256[] memory){
        return store._tokenIdsList;
    }

    // @dev get highest tok-id
    function getLatestTokId() public view returns (uint256){
        return store.tokIdIncr;
    }

    /**
     * @dev Returns the owner of the `tokenId`. Does NOT revert if token doesn't exist
     */
    function ownerOfToken(uint256 tokenId) public view returns (address) {
        return _ownerOf(tokenId);
    }    

    function isPaused() public view returns (bool){
        return store.isPaused;
    }

    function getPrice() public view returns (uint256){
        return store.priceItem;
    }


    function getERC721Owner() public view returns (address) {
        return store.ownerAppContract;
    }

    /**
     ****************************************************************************
    * API ERC721 write
    */
 
    function setIsMinting(bool isMinting) public virtual {
        require( msg.sender == store.ownerAppContract, "Only contract owner can pause mint" );
        store.isPaused = !isMinting;
    }

    function setPrice(uint256 price_) public virtual {
        require( msg.sender == store.ownerAppContract, "Only contract owner can set price" );
        store.priceItem = price_;
    }

    /**
     * @dev mint fn that is open to all, if witness not provided, then cannot mint for cost less than price
     *      if tok-id already exists, then skip mint and send paid price back to function caller
     **/
    function mint( address[] memory pks, uint256[] memory ids, address witness_ ) public payable {
        require( !store.isPaused && pks.length > 0 && (pks.length == ids.length || ids.length == 0), "Mint is paused or mismatched input lengths" );
        require( msg.value >= store.priceItem * pks.length || witness_ == store.witnessAppLumo, "Payment must be > price" );
        uint256 price_per_item = pks.length <= 1 ? msg.value : msg.value/pks.length;
        for (uint256 i = 0; i < pks.length; ++i) {
            uint256 tok_id = ids.length == 0 ? getNextAvailableTokId(10) : ids[i];
            if ( _ownerOf(tok_id) == address(0) && pks[i] != address(0) ){
                _safeMint(pks[i],tok_id, "");
                store._tokenIdsList.push(tok_id);
                emit MintSucceed(pks[i], tok_id, "");
            } else {
                AddressUpgradeable.sendValue(payable(msg.sender), price_per_item);
                emit MintCanceled( pks[i], tok_id, "This token already exists or target address == 0");
            }
        }           
    }

    // @dev get next toke that has not been used, try `max_iter` times to find unused id
    function getNextAvailableTokId(uint256 max_itr) private returns (uint256){
        if (max_itr == 0){
            return 0;
        } else {
            store.tokIdIncr += 1;
            if ( _ownerOf(store.tokIdIncr) == address(0) ){
                return store.tokIdIncr;
            } else {
                return getNextAvailableTokId(max_itr - 1);
            }
        }
    }    

    /**
    ****************************************************************************
    * API ERC721 reward
    */

    /**
     * @dev create reward where by winners receive erc721 token in airdrop
     **/
    function createReward(bytes32 _merkleRoot, uint256 pricePerItem) public {
        require(msg.sender == store.ownerAppContract, "Only owner can create reward");
        store.rewardId += 1;
        uint256 _id = store.rewardId;
        store.rewards[_id] = Reward(_id, _merkleRoot, pricePerItem);
        emit RewardCreated(_id);
    }

    /**
     * @dev get reward, do not output the merkle root
    **/
    function getReward(uint256 _id) public view returns (uint256, uint256){
        require (_id <= store.rewardId, "This reward dne");
        Reward memory rwrd = store.rewards[_id];
        return (rwrd.id, rwrd.pricePerItem);
    }

    // @dev get most recently created reward id
    function getRecentRewardId() public view returns (uint256){
        return store.rewardId;
    }

    /**
     * @dev claim reward using `merkleProof` at specified `_rewardId`, 
     *      send token `tok_id` upon proof if payment >= `pricePerItem`
     **/
    function claimReward( uint256 _rewardId, bytes32[] calldata merkleProof, uint256 preset_tok_id ) public payable {

        require(_rewardId <= store.rewardId, "This reward does not exist");

        Reward memory rwrd = store.rewards[_rewardId];        
        string memory merkleProofInStr = bytes32sToString(merkleProof);

        require( 
              rwrd.pricePerItem <= msg.value
            && store.rewardWinners[_rewardId][msg.sender] == 0
            && store.rewardWinningProofs[_rewardId][merkleProofInStr] == 0,
            "Insufficient payment to claim reward, or you have already claimed reward, or this proof has already been submitted once" 
        );

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        bool isValidProof = MerkleProof.verify(merkleProof, rwrd.merkleRoot, leaf);
        require(isValidProof, "Invalid proof");

        // mint
        uint256 tok_id = preset_tok_id > 0 ? preset_tok_id : getNextAvailableTokId(10);
        require(_ownerOf(tok_id) == address(0), "Failed to create token to give as reward");
        _safeMint(msg.sender, tok_id);
        store._tokenIdsList.push(tok_id);
        store.rewardWinners[_rewardId][msg.sender] = 1;
        store.rewardWinningProofs[_rewardId][merkleProofInStr] = 1;
        emit MintSucceed(msg.sender, tok_id, "");
    }    

    // @dev build string-key from raw `merkleProof`
    function bytes32sToString(bytes32[] calldata merkleProof) private returns (string memory) {
        string memory str = "";
        for (uint256 i = 0; i < merkleProof.length; ++i ){            
            str = string(abi.encodePacked(str, bytes32ToString(merkleProof[i])));
        }
        return str;
    }

    function bytes32ToString(bytes32 _bytes32) private returns (string memory) {
        uint8 i = 0;
        while(i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }    


    /**
    * ***************************************************************************
    * @dev Opensea compliant override
    */

    function setApprovalForAll(address operator, bool approved) public override onlyAllowedOperatorApproval(operator) {
        super.setApprovalForAll(operator, approved);
    }

    function approve(address operator, uint256 tokenId) public override onlyAllowedOperatorApproval(operator) {
        super.approve(operator, tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) public override onlyAllowedOperator(from) {
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public override onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data)
        public
        override
        onlyAllowedOperator(from)
    {
        super.safeTransferFrom(from, to, tokenId, data);
    }

}







