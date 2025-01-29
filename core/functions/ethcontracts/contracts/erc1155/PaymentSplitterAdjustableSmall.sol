// SPDX-License-Identifier: MIT
// Inspired by: OpenZeppelin Contracts v4.4.1 (finance/PaymentSplitter.sol)

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PaymentSplitterAdjustableSmall
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
contract PaymentSplitterAdjustableSmall is Context, ReentrancyGuard {

    event PayeeAdded(address account, uint256 shares);
    event PayeeAddCanceled(address account);
    event PaymentReleased( uint256 idx_, address to, uint256 amount);
    event PaymentReceived(address from, uint256 amount);    

    // witness for hardOut where all eth at this contract address
    // is reverted to contract deployer
    address private _witness;
    address private _owner;

    // current captable `_windowIndex` 
    uint256 private _windowIndex;  

    mapping (uint256 => uint256) private _totalSharesWindow;
    mapping (uint256 => uint256) private _totalReleasedWindow;

    mapping(uint256 => mapping(address => uint256)) private _sharesWindow;
    mapping(uint256 => mapping(address => uint256)) private _releasedWindow;
    mapping(uint256 => address[]) private _payeesWindow;

    /**
     * @dev Creates an instance of `PaymentSplitter` where each account in `payees` is assigned the number of shares at
     * the matching position in the `shares` array.
     *
     * All addresses in `payees` must be non-zero. Both arrays must have the same non-zero length, and there must be no
     * duplicates in `payees`.
     */
    constructor( address witness_, address[] memory payees, uint256[] memory shares_) payable {
        require(payees.length == shares_.length, "PaymentSplitterAdjustable: payees and shares length mismatch");
        require(payees.length > 0, "PaymentSplitterAdjustable: no payees");
        _witness = witness_;
        _owner = msg.sender;
        _addPayoutWindow( payees, shares_);
    }

    /**
     ****************************************************************************
     * API
    */
    
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
        emit PaymentReceived(_msgSender(), msg.value);
    }     

    /**
     * @dev add new payment window, ensure the last payment window has been paid out
     *      note witness must be present to update payouts, this prevents the user
     *      from wiping out obligations from previous payout
     **/
    function updatePayoutWindow( address witness_, address[] memory payees, uint256[] memory shares_ ) public virtual {
        require( witness_ == _witness, 'Invalid witness provided for resetting payouts' );
        require( address(this).balance == 0, 'You must release last window of payables before adjusting the shares');
        _addPayoutWindow(payees, shares_);
    }

    /**
     * @dev payout all accounts at the current window. if address balance = 0 , then revert
     * 
     **/
    function releaseCurrentWindow() external nonReentrant() {
        require( address(this).balance > 0 , 'The ETH balance at this address is zero');
        for (uint256 i = 0; i < _payeesWindow[_windowIndex].length; i ++ ){            
            maybeReleaseAt(_windowIndex, payable(_payeesWindow[_windowIndex][i]));
        }
    }

    /**
     * @dev release all funds back to contract deployer, provided
     *      the witness is correct, note witness is set at contract
     *      deployment. this is a hard fail-safe and ethereum "anti-pattern."
     *      Also `hardWithdrawlEth` only apply for ETH, one cannot `hardWithdrawl`
     *      all the other erc20s on Ethereum.
     **/
    function hardWithdrawlEth( address witness_ ) public virtual {
        require( witness_ == _witness, 'Invalid witness provided for hard reset of payouts' );
        uint256 totalReceived = address(this).balance;
        Address.sendValue( payable(_owner), totalReceived);
    }   

    /**
     ****************************************************************************
     * read
    */

    /**
     * @dev get payout window
     */
    function windowIndex() public view returns (uint256) {
        return _windowIndex;
    }

    /**
     * @dev Getter for the total shares held by payees at window idx
     */
    function totalSharesAtWindow( uint256 idx_ ) public view returns (uint256) {
        require(idx_ <= _windowIndex, "index exceeds window length");
        return _totalSharesWindow[idx_];
    }


    /**
     * @dev Getter for the total amount of Ether already released at window `idx_`
     */
    function totalReleasedAtWindow( uint256 idx_ ) public view returns (uint256) {
        require(idx_ <= _windowIndex, "index exceeds window length");
        return _totalReleasedWindow[idx_];
    }    


    /**
     *
     * @dev get shares at window idx for user at address
     *  
     **/
    function sharesAtWindow( uint256 idx_, address account ) public view returns (uint256) {
        require(idx_ <= _windowIndex, "index exceeds window length");
        if ( idx_ <= _windowIndex ){
            return _sharesWindow[idx_][account];
        } else {
            return 0;
        }
    }    


    /**
     * @dev Getter for the amount of Ether already released to a payee at `idx_`
     */
    function releasedAtWindow( uint256 idx_, address account) public view returns (uint256) {
        require(idx_ <= _windowIndex, "index exceeds window length");
        return _releasedWindow[idx_][account];
    }


    /**
     * @dev Getter for the address of the payee number `index` at window `idx_`
     */
    function payeeAt(uint256 idx_, uint256 index) public view returns (address){
        require(idx_ <= _windowIndex, "index exceeds window length");
        return _payeesWindow[idx_][index];            
    }

    /**
     * @dev Getter for the amount of payee's releasable Ether at window `idx_`
     */
    function releasableAt( uint256 idx_, address account) public view returns (uint256) {
        require(idx_ <= _windowIndex, "index exceeds window length");
        uint256 totalReceived = address(this).balance + totalReleasedAtWindow(idx_);
        return _pendingPaymentAt( idx_, account, totalReceived, releasedAtWindow(idx_,account));
    }

    /**
     * @dev Triggers a transfer to `account` of the amount of Ether they are owed, according to their percentage of the
     *      total shares and their previous withdrawals for window `idx_`
     *      if nothing is owed, then emit trivial `PaymentReleased` event
     *      note the payment window is not respected so the payment value here you get is all the payment ever 
     *      sent to this address, but you're always releasing according to shares defined in the latest window
     */
    function maybeReleaseAt( uint256 idx_, address payable account) public virtual {
        require(idx_ <= _windowIndex, "index exceeds window length");
        if ( _sharesWindow[idx_][account] > 0 ){
            uint256 payment = releasableAt( idx_, account);
            if ( payment > 0 ){
                _releasedWindow[idx_][account] += payment;
                _totalReleasedWindow[idx_] += payment;
                Address.sendValue(account, payment);
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
        require(idx_ <= _windowIndex, "index exceeds window length");
        return (totalReceived * _sharesWindow[idx_][account]) / _totalSharesWindow[idx_] - alreadyReleased; 
    }

        
    /**
     * @dev increment payout window, then add new payout table
     **/
    function _addPayoutWindow(address [] memory payees, uint256[] memory shares_ ) private {

        require(payees.length == shares_.length, "PaymentSplitterAdjustable: payees and shares length mismatch");
        require(payees.length > 0  , "PaymentSplitterAdjustable: no payees");        
        require(payees.length < 101, "PaymentSplitterAdjustable: number of payees cannot exceed 100");

        _windowIndex = _windowIndex + 1;
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
            _payeesWindow[_windowIndex].push(account);
            _sharesWindow[_windowIndex][account] = shares_;
            _totalSharesWindow[_windowIndex] = _totalSharesWindow[_windowIndex] + shares_;
            emit PayeeAdded(account, shares_);
        }            
    }

}

