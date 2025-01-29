// pragma solidity ^0.8.13;

// import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
// import "@openzeppelin/contracts/utils/math/SafeMath.sol";
// import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

// abstract contract QuestReward {

//     // Validates the parameters for a new quest
//     function validateQuest(address _tavern, 
//         address _creator, 
//         string memory _name, 
//         string memory _hint,
//         uint _maxWinners, 
//         bytes32 _merkleRoot, 
//         string memory _merkleBody,
//         string memory _metadata,
//         uint _prize
//     ) public virtual returns (bool);

//     // Mint reward
//     function rewardCompletion(address _tavern, address _winner, uint _questIndex) public virtual returns (bool);
// }


// contract QuestV1 is Initializable {

//     using SafeMath for uint;

//     // Quest model
//     struct Quest {
//         address creator;
//         uint index;
//         string name;
//         string hint;
//         bytes32 merkleRoot;
//         string merkleBody;
//         uint maxWinners;
//         string metadata;
//         bool valid;
//         uint prize;
//         mapping (address => bool) winners;
//         address[] winnersIndex;
//         mapping (address => bool) claimers;
//         address[] claimersIndex;
//     }

//     // State
//     address owner;
//     mapping (address => Quest[]) public quests;
//     mapping (address => mapping (address => uint[])) public questsPerCreator;
//     uint public currentOwnerBalance;

//     // Events
//     event QuestCreated(address _tokenAddress, uint _questIndex);
//     event QuestValidated(address _tokenAddress, uint _questIndex);
//     event QuestCompleted(address _tokenAddress, uint _questIndex, address _winner);
//     event QuestRewardClaimed(address _tokenAddress, uint _questIndex, address _claimer);
//     event OwnerBalanceWithdrawn(address _owner, uint _balanceWithdrawn);


//     constructor(){
//         _disableInitializers();        
//     }

//     function initialize(address _owner) initializer public {
//         owner = _owner;
//     }

//     // Creates a new quest
//     function createQuest(
//         address _tokenAddress, 
//         string memory _name, 
//         string memory _hint, 
//         uint _maxWinners, 
//         bytes32 _merkleRoot, 
//         string memory _merkleBody, 
//         string memory _metadata
//     ) public payable {

//         // If the quest is valid, create it
//         Quest storage newQuest;
//         uint questIndex  = quests[_tokenAddress].length;
//         newQuest.creator = msg.sender;
//         newQuest.index   = questIndex;
//         newQuest.name    = _name;
//         newQuest.hint    = _hint;
//         newQuest.merkleRoot = _merkleRoot;
//         newQuest.merkleBody = _merkleBody;
//         newQuest.maxWinners = _maxWinners;
//         newQuest.metadata   = _metadata;
//         if (msg.value > 0) {
//             // If the quest has an eth prize require the amount of winners to be > 0
//             require(newQuest.maxWinners > 0);
//             currentOwnerBalance = SafeMath.div(msg.value, 10);
//             newQuest.prize = SafeMath.sub(msg.value, currentOwnerBalance);
//         }

//         // Save quest
//         quests[_tokenAddress].push(newQuest);
//         questsPerCreator[_tokenAddress][msg.sender].push(questIndex);

//         // Emit event
//         emit QuestCreated(_tokenAddress, questIndex);

//         // Validate quest
//         validateQuest(_tokenAddress, questIndex);
//     }

//     // Alters the valid property of the given quest
//     function validateQuest(address _tokenAddress, uint _questIndex) public {

//         // Check the quest is invalid before trying to validate it
//         require(quests[_tokenAddress][_questIndex].valid == false);

//         QuestReward tokenInterface = QuestReward(_tokenAddress);
//         bool isValid = tokenInterface.validateQuest(
//             this,
//             quests[_tokenAddress][_questIndex].creator,
//             quests[_tokenAddress][_questIndex].name,
//             quests[_tokenAddress][_questIndex].hint,
//             quests[_tokenAddress][_questIndex].maxWinners,
//             quests[_tokenAddress][_questIndex].merkleRoot,
//             quests[_tokenAddress][_questIndex].merkleBody,
//             quests[_tokenAddress][_questIndex].metadata,
//             quests[_tokenAddress][_questIndex].prize
//         );
//         if (isValid == true) {
//             // Update state
//             quests[_tokenAddress][_questIndex].valid = isValid;
//             // Emit event
//             emit QuestValidated(_tokenAddress, _questIndex);
//         }
//     }

//     // Submits proof of quest completion and mints reward
//     function submitProof(address _tokenAddress, uint _questIndex, bytes32[] memory _proof, bytes32 _answer) public {

//         Quest storage quest = quests[_tokenAddress][_questIndex];

//         // Check quest is valid
//         require(quest.valid == true);

//         // Avoid creating more winners after the max amount of tokens are minted
//         require(quest.winnersIndex.length < quest.maxWinners || quest.maxWinners == 0);

//         // Avoid the same winner spamming the contract
//         require(!isWinner(_tokenAddress, _questIndex, msg.sender));

//         // Avoid the creator winning their own quest
//         require(msg.sender != quest.creator);

//         // Verify merkle proof
//         require(MerkleProof.verifyProof(_proof, quest.merkleRoot, _answer));

//         // Add to winners list
//         quests[_tokenAddress][_questIndex].winners[msg.sender] = true;
//         quests[_tokenAddress][_questIndex].winnersIndex.push(msg.sender);

//         // Dispense Eth Prize
//         if (getQuestPrize(_tokenAddress, _questIndex) > 0 && getQuestMaxWinners(_tokenAddress, _questIndex) > 0) {
//             msg.sender.transfer(getQuestUnitPrize(_tokenAddress, _questIndex));
//         }

//         // Emit event
//         emit QuestCompleted(_tokenAddress, _questIndex, msg.sender);

//         // Mint reward
//         claimReward(_tokenAddress, _questIndex);
//     }

//     // Claims the quest reward, if not already claimed
//     function claimReward(address _tokenAddress, uint _questIndex) public {
//         // Check if quest is valid
//         require(quests[_tokenAddress][_questIndex].valid == true);
//         // Check if the alledged winner is actually a winner
//         require(isWinner(_tokenAddress, _questIndex, msg.sender));
//         // Check if the winner is not in the in the claimers list yet
//         require(isClaimer(_tokenAddress, _questIndex, msg.sender) == false);

//         // NOTE: We used if instead of require in case manual validation of rewards want to be added
//         // in the future, or if there's a bug in the token contract
//         QuestReward tokenInterface = QuestReward(_tokenAddress);
//         if(tokenInterface.rewardCompletion(this, msg.sender, _questIndex)) {
//             // Add to claimers lists
//             quests[_tokenAddress][_questIndex].claimers[msg.sender] = true;
//             quests[_tokenAddress][_questIndex].claimersIndex.push(msg.sender);

//             // Emit event
//             emit QuestRewardClaimed(_tokenAddress, _questIndex, msg.sender);
//         }
//     }

//     // Let's the owner of the contract withdraw the current balance earned
//     // for quests with eth prizes
//     function withdrawOwnerBalance() public {//onlyOwner {
//         uint oldBalance = currentOwnerBalance;
//         // Check if there's any balance to withdraw
//         require(currentOwnerBalance > 0);

//         // Transfer balance
//         owner.transfer(currentOwnerBalance);

//         // Zero out the current owner balance
//         currentOwnerBalance = 0;

//         // Emit event
//         emit OwnerBalanceWithdrawn(owner, oldBalance);
//     }

//     // Returns wheter or not the _allegedWinner is an actual winner
//     function isWinner(address _tokenAddress, uint _questIndex, address _allegedWinner) public view returns (bool) {
//         return quests[_tokenAddress][_questIndex].winners[_allegedWinner];
//     }

//     // Returns wheter or not the _allegedClaimer is an actual claimer
//     function isClaimer(address _tokenAddress, uint _questIndex, address _allegedClaimer) public view returns (bool) {
//         return quests[_tokenAddress][_questIndex].claimers[_allegedClaimer];
//     }

//     function getQuestAmount(address _tokenAddress) public view returns (uint) {
//         return quests[_tokenAddress].length;
//     }

//     function getQuestAmountPerCreator(address _tokenAddress, address _creator) public view returns (uint) {
//         return questsPerCreator[_tokenAddress][_creator].length;
//     }

//     function getQuestIndexPerCreator(address _tokenAddress, address _creator, uint _creatorIndex) public view returns (uint) {
//         return questsPerCreator[_tokenAddress][_creator][_creatorIndex];
//     }

//     // function getQuest(address _tokenAddress, uint _questIndex) public view returns (address,
//     //     uint, string, string, bytes32, string, uint, string, bool, uint, uint) {
//     //     Quest memory quest = quests[_tokenAddress][_questIndex];

//     //     return (quest.creator, quest.index, quest.name, quest.hint, quest.merkleRoot, quest.merkleBody, quest.maxWinners,
//     //         quest.metadata, quest.valid, quest.winnersIndex.length, quest.claimersIndex.length);
//     // }

//     function getQuestCreator(address _tokenAddress, uint _questIndex) public view returns(address) {
//         return quests[_tokenAddress][_questIndex].creator;
//     }

//     function getQuestIndex(address _tokenAddress, uint _questIndex) public view returns(uint) {
//         return quests[_tokenAddress][_questIndex].index;
//     }

//     function getQuestName(address _tokenAddress, uint _questIndex) public view returns(string memory) {
//         return quests[_tokenAddress][_questIndex].name;
//     }

//     function getQuestHint(address _tokenAddress, uint _questIndex) public view returns(string memory) {
//         return quests[_tokenAddress][_questIndex].hint;
//     }

//     function getQuestMerkleRoot(address _tokenAddress, uint _questIndex) public view returns(bytes32) {
//         return quests[_tokenAddress][_questIndex].merkleRoot;
//     }

//     function getQuestMerkleBody(address _tokenAddress, uint _questIndex) public view returns(string memory) {
//         return quests[_tokenAddress][_questIndex].merkleBody;
//     }

//     function getQuestMaxWinners(address _tokenAddress, uint _questIndex) public view returns(uint) {
//         return quests[_tokenAddress][_questIndex].maxWinners;
//     }

//     function getQuestMetadata(address _tokenAddress, uint _questIndex) public view returns(string memory) {
//         return quests[_tokenAddress][_questIndex].metadata;
//     }

//     function getQuestValid(address _tokenAddress, uint _questIndex) public view returns(bool) {
//         return quests[_tokenAddress][_questIndex].valid;
//     }

//     function getQuestPrize(address _tokenAddress, uint _questIndex) public view returns(uint) {
//         return quests[_tokenAddress][_questIndex].prize;
//     }

//     function getQuestUnitPrize(address _tokenAddress, uint _questIndex) public view returns(uint) {
//         return SafeMath.div(quests[_tokenAddress][_questIndex].prize, quests[_tokenAddress][_questIndex].maxWinners);
//     }

//     function getQuestWinnersAmount(address _tokenAddress, uint _questIndex) public view returns(uint) {
//         return quests[_tokenAddress][_questIndex].winnersIndex.length;
//     }

//     function getQuestClaimersAmount(address _tokenAddress, uint _questIndex) public view returns(uint) {
//         return quests[_tokenAddress][_questIndex].claimersIndex.length;
//     }

//     function getQuestWinner(address _tokenAddress, uint _questIndex, uint _winnerIndex) public view returns(address) {
//         return quests[_tokenAddress][_questIndex].winnersIndex[_winnerIndex];
//     }

//     function getQuestClaimer(address _tokenAddress, uint _questIndex, uint _claimerIndex) public view returns(address) {
//         return quests[_tokenAddress][_questIndex].claimersIndex[_claimerIndex];
//     }
// }