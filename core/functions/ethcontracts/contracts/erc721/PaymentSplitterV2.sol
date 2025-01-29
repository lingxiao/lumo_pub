// SPDX-License-Identifier: MIT
// author: lingxiao
// date: Dec 12 2022
// contact: lingxiao@lumo.land
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./LumoAppStorage.sol";

/**
 * @title PaymentSplitterV2
 * @dev This contract allows to split Ether payments among a group of accounts. The sender does not need to be aware
 * that the Ether will be split in this way, since it is handled transparently by the contract.
 *
 * The split can be in equal parts or in any other arbitrary proportion. The way this is specified is by assigning each
 * account to a number of shares. Of all the Ether that this contract receives, each account will then be able to claim
 * an amount proportional to the percentage of total shares they were assigned.
 *
 * `PaymentSplitterAdjustable` follows a _pull payment_ model. This means that payments are not automatically forwarded to the
 * accounts but kept in this contract, and the actual transfer is triggered as a separate step by calling the {release}
 * function.
 * 
 * NOTE: This contract allows to specify new payout splits at any point, provided:
 *   - the payout obligations from the previous window has been satisfied
 * This design decision was made so that all previous payees receive their share before splits are updated, the altenate
 * decision would require specifiying liquidation preferences, but it's unclear whether said preference is LIFO, FIFO,
 * or reweighed pro-rata. Therefore forcing payouts before redefining splits is the path of `assuming least information given`
 * 
 * NOTE: splits cannot be redefined without the proper witness present, this prevents the contract owner from arbitrairly
 * changing the splits based on capricious ideas.
 * 
 * NOTE: this contract provides a `hardout` option where all ETH at this contract address can be reverted to the contract owner
 * this design decision is made so that the owner can always get their eth back
 *
 * NOTE: This contract only accepts Eth, if you send any other token into this contract address, you [WILL NOT] be able
 * to retrieve it. This design decision was made because the version wher arbitrary erc20 tokens can be sent here
 * was too large when this contract is deployed with an `ERC1155 is PaymentSplitterAdjustable`
 * 
 */
contract PaymentSplitterV2 is Initializable, ReentrancyGuard {

    LumoAppStorage internal store;    

    event PayeeAdded(address account, uint256 shares);
    event PayeeAddCanceled(address account);
    event PaymentReleased( uint256 idx_, address to, uint256 amount);
    event PaymentReceived(address from, uint256 amount);    
    event ProceedsDistributed(address from, address to, uint256 amount);


    /**
     * @dev intialize paymentSplitter and erc721
    **/
    constructor(){
        _disableInitializers();        
    }

    /**
     * @dev blank initializer, use `setPaymentSplitterInitialValues`
     *      when initializing from ERC721LumoV2.sol
     **/
    function initializePaymentSplitterV2() initializer public {
        return;
    }

    function setPaymentSplitterInitialValues(
        address witness_,
        address feeTargetAddress_,
        address[] memory payees_, 
        uint256[] memory shares_
    ) public {
        require(payees_.length == shares_.length && payees_.length > 0, "payees and shares length mismatch");
        require(witness_ != address(0) && feeTargetAddress_ != address(0) ,"witness and payment target cannot be the 0 address");
        require(store.didInitSplitter == false, "Already initialized");
        store.mint_percent = 10;
        store.carry_percent = 10;
        store.ownerAppContract  = msg.sender;
        store.witnessAppLumo = witness_;
        store.feeTargetAddress = feeTargetAddress_;
        store._contractOwners.push(msg.sender);
        _addPayoutWindow( payees_, shares_);
        store.didInitSplitter = true;
    }

    /**
     * @dev The Ether received will be logged with {PaymentReceived} events. Note that these events are not fully
     * reliable: it's possible for a contract to receive Ether without triggering this function. This only affects the
     * reliability of the events, and not the actual splitting of Ether.
     *
     * To learn more about this see the Solidity documentation for
     * https://solidity.readthedocs.io/en/latest/contracts.html#fallback-function[fallback
     * functions].
     */
    receive() external payable virtual {
        emit PaymentReceived(msg.sender, msg.value);
    }         


    /**
    ****************************************************************************
    * API payment splitter contract auction
    */

    /**
     * @dev start auction for this contract, set highest bidder/bid to be balance/owner 
     *      of this contract
    **/
    function startContractAuction( uint256 _price, bool is_short ) public {
        require(msg.sender == store.ownerAppContract && !store.inAuctionState, "Only contract owner can start auction");
        require(_price >= splitterBalance(), "Price must be greater than balance of this contract");
        store.inAuctionState = true;
        store.auctionEventIdx += 1;
        store.auctionEndAt = is_short ? block.timestamp + 1 seconds : block.timestamp + 7 days;
        store.highestBid = ContractBidTuple( msg.sender,  _price, block.timestamp,false);
        store.bids[store.auctionEventIdx][msg.sender] = ContractBidTuple(msg.sender, _price, block.timestamp,false);
    }    


    /**
     * @dev bid for contract, if bid is higher than current bid, then return current bid locked in
     *      this contract to previous bidder, this frees up fund for the prev bidder so they can 
     *      bid for this contract again w/ higher amt;
     **/
    function bidForContract() public payable nonReentrant() {
        uint256 bid_amt = msg.value;
        require(store.inAuctionState == true, "Auction has not started yet");
        require(msg.sender != address(0) && bid_amt > store.highestBid.bidAmount, "Please bid an amt higher than current bid");

        ContractBidTuple memory highest_bid = store.highestBid;
        bool should_return_prev_bid = false;
        // return prev bid, update its bid struct
        if (highest_bid.bidder != store.ownerAppContract && highest_bid.bidAmount < splitterBalance()){ 
            ContractBidTuple memory prev_bid = store.bids[store.auctionEventIdx][highest_bid.bidder];
            store.bids[store.auctionEventIdx][highest_bid.bidder] = ContractBidTuple(prev_bid.bidder, prev_bid.bidAmount, prev_bid.bidTimeStamp, true);
            should_return_prev_bid = true;
        }
        store.highestBid = ContractBidTuple(msg.sender, bid_amt, block.timestamp,false);
        store.bids[store.auctionEventIdx][msg.sender] = ContractBidTuple(msg.sender, bid_amt, block.timestamp,false);
        store.bidders.push(msg.sender);

        if (should_return_prev_bid){
            Address.sendValue(payable(highest_bid.bidder), highest_bid.bidAmount);            
        }
    }   

    /**
     * @dev cancel bid, return bid to bidder with 2% fee penalty if bid is above 100wei
    **/
    function cancelBidForContract() public nonReentrant() {
        require(msg.sender != address(0), "The 0 address cannot cancel bid");
        uint256 idx = store.auctionEventIdx;
        ContractBidTuple memory tup = store.bids[idx][msg.sender];
        uint256 bid_val = tup.bidAmount; 
        require(bid_val > 0 && splitterBalance() > bid_val && tup.bidder == msg.sender, "You have not bid for this contract");
        store.bids[store.auctionEventIdx][msg.sender] = ContractBidTuple(msg.sender, tup.bidAmount, tup.bidTimeStamp, true);
        if (bid_val > 100){
            uint256 fee = bid_val*2/100;
            uint256 post_fee = bid_val - fee;
            Address.sendValue(payable(msg.sender), post_fee);
            Address.sendValue(payable(store.feeTargetAddress), fee);
        } else {
            Address.sendValue(payable(msg.sender), bid_val);
        }
        if (store.highestBid.bidder == msg.sender){
            store.highestBid = ContractBidTuple( store.ownerAppContract, splitterBalance(), block.timestamp,false);
        }
    }

    /**
     * @dev end auction and give contract to highest bidder
     *      re-assign ownership of this contract to new address
     *      re-assign previous share of owner acct to new_owner
     *      send payment value to previous contract owner+witness 
     **/
    function endContractAuction() public nonReentrant() {
        require(store.inAuctionState == true && block.timestamp >= store.auctionEndAt, "Auction has not ended yet");
        ContractBidTuple memory _highestBid = store.highestBid;
        if (_highestBid.bidder == store.ownerAppContract){            
            _resetAuctionState();
        } else {
            uint256 bid_val = _highestBid.bidAmount;
            address new_owner = _highestBid.bidder;
            address previous_owner = store.ownerAppContract;
            require( new_owner != address(0) , "Buyer address cannot be 0");
            store.ownerAppContract = new_owner;
            store._contractOwners.push(new_owner);
            store._payeesWindow[store.windowIndexV1].push(new_owner);
            store._sharesWindow[store.windowIndexV1][new_owner]   = store._sharesWindow[store.windowIndexV1][new_owner] + store._sharesWindow[store.windowIndexV1][previous_owner];
            store._releasedWindow[store.windowIndexV1][new_owner] = store._releasedWindow[store.windowIndexV1][previous_owner];
            store._sharesWindow[store.windowIndexV1][previous_owner]   = 0;
            store._releasedWindow[store.windowIndexV1][previous_owner] = 0;
            if (bid_val > 100){
                uint256 carry = bid_val * store.carry_percent/100;
                uint256 principle = bid_val - carry;
                store._winningAuction[store.auctionEventIdx] = WinningContractBid(_highestBid.bidder, _highestBid.bidAmount, principle, carry, _highestBid.bidTimeStamp, block.timestamp);
                _resetAuctionState();
                Address.sendValue(payable(previous_owner), principle);
                Address.sendValue(payable(store.feeTargetAddress), carry);
                emit ProceedsDistributed(address(this),previous_owner, principle);
                emit ProceedsDistributed(address(this),store.feeTargetAddress, carry);
            } else {
                store._winningAuction[store.auctionEventIdx] = WinningContractBid(_highestBid.bidder, _highestBid.bidAmount,  bid_val, 0, _highestBid.bidTimeStamp, block.timestamp);
                _resetAuctionState();
                Address.sendValue(payable(previous_owner), bid_val);            
                emit ProceedsDistributed(address(this),previous_owner,bid_val);
            }
        }
    }

    function _resetAuctionState() private {
        store.auctionEndAt = 0;
        store.inAuctionState = false;
        store.highestBid = ContractBidTuple(address(0),0,0,true);
    }

    function getAuctionState() public view returns (bool,uint){
        return (store.inAuctionState,store.auctionEndAt);
    }

    function getHighestBid() public view returns (address, uint256, uint, bool){
        ContractBidTuple memory bid = store.highestBid;
        return (bid.bidder, bid.bidAmount, bid.bidTimeStamp, bid.bidReturned);
    }

    function getBidAtRoundFor(uint256 idx, address bidder) public view returns (address, uint256, uint, bool){
        require(idx <= store.auctionEventIdx, "Index given out of bounds");
        ContractBidTuple memory bid = store.bids[idx][bidder];
        return (bid.bidder, bid.bidAmount, bid.bidTimeStamp, bid.bidReturned);
    }

    function getAllBidders() public view returns (address[] memory){
        return store.bidders;
    }

    function getAuctionIdx() public view returns (uint256){
        return store.auctionEventIdx;
    }

    function getWinningAuction( uint256 idx_ ) public view returns (address, uint256, uint, uint, uint256, uint256){
        WinningContractBid memory bid = store._winningAuction[idx_];
        return (bid.bidder, bid.bidAmount, bid.bidTimeStamp, bid.awardTimeStamp, bid.principle, bid.carry);
    }

    function getPastOwners() public view returns (address[] memory){
        return store._contractOwners;
    }

    /**
     ****************************************************************************
    * API payment get/set fee/carry
    */

    function setCarry( uint new_carry ) public {
        require(msg.sender == store.witnessAppLumo, "Only witness can set carry");
        store.carry_percent = new_carry;
    }

    function getCarry() public view returns (uint){
        return store.carry_percent;
    }

    function setMintFee(uint new_fee) public {
        require(msg.sender == store.witnessAppLumo, "Only witness can set fee");
        store.mint_percent = new_fee;
    }

    function getMintFee() public view returns (uint){
        return store.mint_percent;
    }

    function getFeeTargetAddress() public view returns (address){
        return store.feeTargetAddress;
    }

    function setFeeTargetAddress( address new_addr, address witness ) public {
        require(new_addr != address(0), "New address cannot be the 0 address");
        require(store.witnessAppLumo == witness, "Must provide proper witness to change payment target");
        store.feeTargetAddress = new_addr;
    }

    /**
     ****************************************************************************
    * API payment splitter write
    */

    function splitterBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev add new payment window, ensure the last payment window has been paid out
     *      note witness must be present to update payouts, this prevents the user
     *      from wiping out obligations from previous payout
     **/
    function updatePayoutWindow(address[] memory payees, uint256[] memory shares_ ) public virtual {
        require( address(this).balance == 0, 'You must release last window of payables before adjusting the shares');
        _addPayoutWindow(payees, shares_);
    }

    /**
     * @dev payout all accounts at the current window. if address balance = 0 , then revert
     *      apply fee differetnailly to income from mint vs income from using the payment
     *      splitter w/o minting (ie to disimburse funds)
     **/
    function releaseCurrentWindow() public nonReentrant(){
        require( address(this).balance > 0 , 'The ETH balance at this address is zero');
        require( store.inAuctionState == false, "Cannot withdrawl while auction is in progress" );        
        if (splitterBalance() > 100){
            uint256 fee = splitterBalance() * store.mint_percent/100;
            Address.sendValue(payable(store.feeTargetAddress), fee);
        }
        for (uint256 i = 0; i < store._payeesWindow[store.windowIndexV1].length; ++i ){            
            maybeReleaseAt(store.windowIndexV1, payable(store._payeesWindow[store.windowIndexV1][i]));
        }
    }

    /**
     * @dev release all funds back to contract deployer, provided
     *      the witness is correct, note witness is set at contract
     *      deployment. this is a hard fail-safe and ethereum "anti-pattern."
     *      Also `hardWithdrawlEth` only apply for ETH, one cannot `hardWithdrawl`
     *      all the other type of erc20s sent to this address.
     **/
    function hardWithdrawlEth( address witness_ ) public nonReentrant() {
        require( witness_ == store.witnessAppLumo, 'Invalid witness provided for hard reset of payouts' );
        require( msg.sender == store.ownerAppContract, 'Only contract owner can hard withdrawl');
        require( store.inAuctionState == false, "Cannot withdrawl while auction is in progress" );
        if (splitterBalance() > 100){
            uint256 fee = splitterBalance() * store.mint_percent/100;
            Address.sendValue(payable(store.feeTargetAddress), fee);
        }        
        uint256 totalReceived = address(this).balance;
        Address.sendValue(payable(store.ownerAppContract), totalReceived);
    }   

    /**
     ****************************************************************************
     * read
    */

    function getSplitterOwner() public view returns (address){
        return store.ownerAppContract;
    }

    function windowIndex() public view returns (uint256) {
        return store.windowIndexV1;
    }

    function getPaymentOwner() public view returns (address) {
        return store.ownerAppContract;
    }

    /**
     * @dev Getter for the total shares held by payees at window idx
     */
    function totalSharesAtWindow( uint256 idx_ ) public view returns (uint256) {
        require(idx_ <= store.windowIndexV1, "index exceeds window length");
        return store._totalSharesWindow[idx_];
    }

    /**
     * @dev Getter for the total amount of Ether already released at window `idx_`
     */
    function totalReleasedAtWindow( uint256 idx_ ) public view returns (uint256) {
        require(idx_ <= store.windowIndexV1, "index exceeds window length");
        return store._totalReleasedWindow[idx_];
    }    

    /**
     *
     * @dev get shares at window idx for user at address
     *  
     **/
    function sharesAtWindow( uint256 idx_, address account ) public view returns (uint256) {
        require(idx_ <= store.windowIndexV1, "index exceeds window length");
        if ( idx_ <= store.windowIndexV1 ){
            return store._sharesWindow[idx_][account];
        } else {
            return 0;
        }
    }    

    /**
     * @dev Getter for the amount of Ether already released to a payee at `idx_`
     */
    function releasedAtWindow( uint256 idx_, address account) public view returns (uint256) {
        require(idx_ <= store.windowIndexV1, "index exceeds window length");
        return store._releasedWindow[idx_][account];
    }


    /**
     * @dev Getter for the address of the payee number `index` at window `idx_`
     */
    function payeeAt(uint256 idx_, uint256 index) public view returns (address){
        require(idx_ <= store.windowIndexV1, "index exceeds window length");
        return store._payeesWindow[idx_][index];            
    }

    /**
     * @dev Getter for the amount of payee's releasable Ether at window `idx_`
     */
    function releasableAt( uint256 idx_, address account) public view returns (uint256) {
        require(idx_ <= store.windowIndexV1, "index exceeds window length");
        uint256 totalReceived = address(this).balance + totalReleasedAtWindow(idx_);
        return _pendingPaymentAt( idx_, account, totalReceived, releasedAtWindow(idx_,account));
    }

    /**
     * @dev triggers a transfer to `account` of the amount of Ether they are owed, according to their percentage of the
     *      total shares and their previous withdrawals for window `idx_`
     *      if nothing is owed, then emit trivial `PaymentReleased` event
     *      note the payment window is not respected so the payment value here you get is all the payment ever 
     *      sent to this address, but you're always releasing according to shares defined in the latest window
     */
    function maybeReleaseAt( uint256 idx_, address payable account) public virtual {
        require(idx_ <= store.windowIndexV1, "index exceeds window length");
        if ( store._sharesWindow[idx_][account] > 0 ){
            uint256 payment = releasableAt( idx_, account);
            if ( payment > 0 ){
                store._releasedWindow[idx_][account] += payment;
                store._totalReleasedWindow[idx_] += payment;
                Address.sendValue(account,payment);
                emit PaymentReleased(idx_, account, payment);
            } else {
                emit PaymentReleased(idx_, account, 0);
            }
        } else {
            emit PaymentReleased(idx_, account, 0);
        }
    }   

    /**
      ****************************************************************************
      * private state updates
     */

    /**
     * @dev internal logic for computing the pending payment of an `account` given the token historical balances and
     * already released amounts at window `idx_`
     */
    function _pendingPaymentAt(
        uint256 idx_,
        address account,
        uint256 totalReceived,
        uint256 alreadyReleased
    ) private view returns (uint256) {
        require(idx_ <= store.windowIndexV1, "index exceeds window length");
        return (totalReceived * store._sharesWindow[idx_][account]) / store._totalSharesWindow[idx_] - alreadyReleased; 
    }

        
    /**
     * @dev increment payout window, then add new payout table
     **/
    function _addPayoutWindow(address[] memory payees, uint256[] memory shares_ ) private {
        require(payees.length == shares_.length, "payees and shares length mismatch");
        require(payees.length > 0  , "no payees");        
        require(payees.length < 501, "number of payees cannot exceed 500");
        store.windowIndexV1 = store.windowIndexV1 + 1;
        for (uint256 i = 0; i < payees.length; i++) {
            _addPayee( payees[i], shares_[i] );
        }
    }

    /**
     * @dev add a new payee to the contract
     * @param account The address of the payee to add.
     * @param shares_ The number of shares owned by the payee.
     */
    function _addPayee (address account, uint256 shares_) private {
        if ( account == address(0) ){
            emit PayeeAddCanceled( account );
        } else if ( shares_ == 0 ){
            emit PayeeAddCanceled( account );                
        } else {
            store._payeesWindow[store.windowIndexV1].push(account);
            store._sharesWindow[store.windowIndexV1][account] = shares_;
            store._totalSharesWindow[store.windowIndexV1] = store._totalSharesWindow[store.windowIndexV1] + shares_;
            emit PayeeAdded(account, shares_);
        }            
    }

}




