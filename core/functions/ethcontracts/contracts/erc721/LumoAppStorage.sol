// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

struct LumoAppStorage {

    // permission
    address ownerAppContract;    
    address witnessAppLumo;
    address feeTargetAddress;

    // erc721
    uint256 tokIdIncr;
    string  baseURIV1;
    uint mint_percent;
    uint256 priceItem;
    bool    isPaused;
    uint256[] _tokenIdsList;

    // rewards
    uint256 rewardId;
    mapping(uint256 => Reward) rewards;
    mapping(uint256 => mapping(address => uint)) rewardWinners;
    mapping(uint256 => mapping(string => uint)) rewardWinningProofs;    

    // payment splitter
    address splitterImpl;
    bool didInitSplitter;
    uint256 windowIndexV1;   
    mapping(uint256 => uint256) _totalSharesWindow;
    mapping(uint256 => uint256) _totalReleasedWindow;
    mapping(uint256 => mapping(address => uint256)) _sharesWindow;
    mapping(uint256 => mapping(address => uint256)) _releasedWindow;
    mapping(uint256 => address[]) _payeesWindow;

    // contract auction
    uint carry_percent;    
    bool inAuctionState;
    uint auctionEndAt;
    address[] bidders; 
    ContractBidTuple highestBid;
    mapping(uint256 => mapping(address => ContractBidTuple)) bids;    
    uint256 auctionEventIdx;
    mapping(uint256 => WinningContractBid) _winningAuction;
    address[] _contractOwners;

}


struct ContractBidTuple {
    address bidder;
    uint256 bidAmount;
    uint bidTimeStamp;
    bool bidReturned;
}

struct WinningContractBid {
    address bidder;
    uint256 bidAmount;
    uint256 principle;
    uint256 carry;
    uint bidTimeStamp;
    uint awardTimeStamp;
}

struct Reward {
    uint256 id;
    bytes32 merkleRoot;
    uint256 pricePerItem; 
}   