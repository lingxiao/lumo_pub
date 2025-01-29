// SPDX-License-Identifier: MIT
// author: lingxiao
// date: Dec 14 2022
// contact: lingxiao@lumo.land
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./../erc721/ERC721LumoV2.sol";

contract MerkleDistributorV2 is ReentrancyGuard {

    enum InterfaceKind{ 
        ERC721LUMO, 
        ERC20, 
        NONE 
    }
    struct Quest {
        uint256 id;
        address creator;
        uint256 maxWinners;
        bytes32 merkleRoot;
        address tokenAddress;
        uint256 etherReward;
        uint256 totalReward;
        string metadataURI;
        InterfaceKind face;
    }   
    event QuestCreated(uint256 id, address creator, address tokenAddress);
    event QuestVerified(uint256 id, address party, address tokenAddress);
    event QuestCompletedTokenAirdropped(uint256 id, address party, uint256 tokId, uint256 loot, address tokenAddress);
    event QuestCompletedAirdropFAILED(uint256 id, address party, address tokenAddress, string reason);
    event PaymentReceived(address from, uint256 amount);    

    address contractOwner;

    // quests
    uint256[] questIds;
    mapping(uint256 => Quest) private quests;
    mapping(uint256 => uint) private claimedQuestIds;
    mapping(uint256 => mapping(address => uint)) private questWinners;
    mapping(uint256 => mapping(string => uint)) private questWinningProofs;

    // faucet
    mapping(address => uint256) faucetTargets;
    mapping(uint256 => uint256) questRewardBalance;
    uint256 faucetLimitTotal;
    uint256 faucetAmtPerDrip;
    uint256 faucetBalance;

    constructor(){
        contractOwner = msg.sender;
        faucetLimitTotal = 50000000000000000;
        faucetAmtPerDrip = 1000000000000000;
    }

    /**
     ****************************************************************************
    * API faucet
    */

    // @dev disable receving ether. use `fundFaucet` instead;
    receive() external payable virtual {
        emit PaymentReceived(msg.sender, msg.value);
    }         


    /**
     ****************************************************************************
    * API proofs
    */

    /**
     * @dev create quest where by winners receive erc721LumoV2 
     **/
    function createERC721LumoQuest(
        uint256 _id,
        uint _maxWinners,
        bytes32 _merkleRoot,
        address _tokenAddress,
        string memory _metadataURI
    ) public payable {
        require(_maxWinners > 0, "Max winners must be > 0");
        require(claimedQuestIds[_id] == 0, "This quest id has already been claimed");        
        require(_tokenAddress != address(0) || msg.value > 0, "Token address and quest rewards cannot both be 0");
        questIds.push(_id);
        claimedQuestIds[_id] = 1;
        uint256 loot = msg.value/_maxWinners;
        quests[_id] = Quest(_id, msg.sender, _maxWinners, _merkleRoot, _tokenAddress, loot, msg.value, _metadataURI,InterfaceKind.ERC721LUMO);
        questRewardBalance[_id] = msg.value;
        emit QuestCreated(_id, msg.sender, _tokenAddress);
    }

    /**
     * @dev get quest, do not output the merkle root
    **/
    function getQuest(uint256 _id) public view returns (uint256, address, uint, address, string memory){
        require(claimedQuestIds[_id] > 0, "This quest does not exist");
        Quest memory q = quests[_id];
        require(q.tokenAddress != address(0) && q.face != InterfaceKind.NONE , "Trivial token address provided in quest");
        return (q.id, q.creator, q.maxWinners, q.tokenAddress, q.metadataURI);
    }
    
    /**
     * @dev remove quest `_id` by freeing up the `_id` and nullifying the exising quest
     *      return any leftover-balance for quest to quest creator;
    **/
    function removeQuest(uint256 _id) public {
        require(claimedQuestIds[_id] == 1, "This quest does not exist");
        Quest memory q = quests[_id];
        require(q.creator == msg.sender, "Only quest owner can remove quest");
        address creator = q.creator;
        claimedQuestIds[_id] = 0;
        quests[_id] = Quest(0,address(0),0,"", address(0), 0, 0, "", InterfaceKind.NONE);        
        if ( questRewardBalance[_id] < address(this).balance ){
            Address.sendValue(payable(msg.sender), questRewardBalance[_id]);
        }
        questRewardBalance[_id] = 0;
    }

    /**
     * @dev claim quest using `merkleProof` at specified `_questId`, airdrop token `tok_id` upon quest completion
     *      if the quest reward is `loot`, then airdrop loot from this contract address, use `tok_id=0` in this case;
     **/
    function claimQuest( uint256 _questId, bytes32[] calldata merkleProof, uint256 tok_id ) public {

        require(claimedQuestIds[_questId] == 1, "This quest does not exist");
        require(questWinners[_questId][msg.sender] == 0, "You have already claimed quest");

        Quest memory q = quests[_questId];        
        require(q.tokenAddress != address(0) && q.face != InterfaceKind.NONE, "Trivial token address provided in quest");

        string memory merkleProofInStr = bytes32sToString(merkleProof);
        require(questWinningProofs[_questId][merkleProofInStr] == 0, "This proof has already been submitted once");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        bool isValidProof = MerkleProof.verify(merkleProof, q.merkleRoot, leaf);
        require(isValidProof, 'Invalid proof for quest');

        emit QuestVerified(_questId, msg.sender, q.tokenAddress);

        if (q.face == InterfaceKind.ERC20){

            uint256 loot = q.etherReward;
            if ( loot < address(this).balance && loot < questRewardBalance[_questId] ){
                questRewardBalance[_questId] -= loot;
                questWinners[_questId][msg.sender] = 1;
                questWinningProofs[_questId][merkleProofInStr]  = 1;
                Address.sendValue(payable(msg.sender), loot);
                emit QuestCompletedTokenAirdropped(_questId, msg.sender, 0, loot, q.tokenAddress);
            } else {
                emit QuestCompletedAirdropFAILED(_questId, msg.sender, q.tokenAddress, "No more rewards are available");
            }

        } else if (q.face == InterfaceKind.ERC721LUMO) {

            // ERC721LumoV2(q.tokenAddress).mint([msg.sender], [tok_id], address(this));
            questWinners[_questId][msg.sender] = 1;
            questWinningProofs[_questId][merkleProofInStr] = 1;
            emit QuestCompletedTokenAirdropped(_questId, msg.sender, tok_id, 0, q.tokenAddress);

        } else {

            emit QuestCompletedAirdropFAILED(_questId, msg.sender, q.tokenAddress, "No token interface specified for this quest");

        }
    }


    // @dev check `_questId` has been `claimer`ed
    function didClaimQuest( uint256 _questId, address claimer ) public view returns (bool){
        require (claimer != address(0), "Cannot query the zero address");
        return questWinners[_questId][claimer] > 0;
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


}


