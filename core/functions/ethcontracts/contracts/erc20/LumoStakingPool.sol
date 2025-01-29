// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Context.sol";

interface Token {
    function mint(address to, uint256 amount) external;
    function allocate(address from, address to, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}


contract LumoStakingPool is Pausable, Ownable, ReentrancyGuard {

    // @dev: staking token
    Token lumoToken;    
    
    // @dev: events
    event Staked( address indexed from, uint256 amount);
    event Claimed(address indexed from, uint256 amount, uint256 floatRate);

    // @dev aggregate information
    uint8   public totalStakers;
    uint256 public totalStakedVolume;
    uint256 public totalInterestVolume;

    // @dev: risk free rate is 2% returns
    uint256 public riskFreeRate = 200;
    uint256 public rateDecimals = 10000;

    // @dev: pools and lockup periods
    mapping (address => uint256) public minLockupPeriods;   
    mapping (address => mapping (address => uint256)) public pools;

    //@dev: pool states
    mapping (address => uint256) public riskFreeRates;
    mapping (address => mapping(address => uint256)) public floatRates;
    mapping (address => mapping(address => uint256)) public stakingTimeStamps;

    //@dev: approved contract custodians 
    address private _admin;    
    mapping (address => uint256) private custodians;

    constructor(Token _tokenAddress) {
        require(address(_tokenAddress) != address(0),"Token Address cannot be address 0");                
        lumoToken    = _tokenAddress;        
        totalStakers = 0;
        totalStakedVolume = 0;
        _admin = _msgSender();
        custodians[_msgSender()] = 1;
    }    

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }    

    /**
     ***************************************************************************
     * API read
    */

    // @dev: read address of staking token
    function readStakingTokenAddress() view external returns (address) {
        return address(lumoToken);
    }
        
    // @use: read risk free rate
    function readRiskFreeRate() view external returns (uint256) {
        return riskFreeRate;
    }
    
    // @dev: read total staked vol    
    function readTotalStakedVolume() view external returns (uint256){
        return totalStakedVolume;
    }
    
    // @dev: read total interest paid out
    function readTotalInterestVolume() view external returns (uint256){
        return totalInterestVolume;
    }

    // @dev: get risk free rate at `_poolAddress`
    function readRiskFreeRateAt( address _poolAddress ) view external returns (uint256) {
        require(address(_poolAddress) != address(0),"Pool address cannot be address 0");                
        return riskFreeRates[_poolAddress];
    }

    // @dev: read float rate for this staker at pool
    function readFloatRate( address _poolAddress, address staker ) view external returns (uint256) {
        require(address(staker)       != address(0)  , "Staker address cannot be address 0");                
        require(address(_poolAddress) != address(0)  ,  "Pool address cannot be address 0");                
        return floatRates[_poolAddress][staker];
    }

    // @dev: read how much has been staked in this pool by staker
    function readStakingAmount( address _poolAddress, address staker ) view external returns (uint256) {
        require(address(staker)       != address(0)  , "Staker address cannot be address 0");                
        require(address(_poolAddress) != address(0)  ,  "Pool address cannot be address 0");                
        return pools[_poolAddress][staker];
    }

    // @dev: read when the staker staked into the pool
    function readStakingTimeStamp( address _poolAddress, address staker ) view external returns (uint256) {
        require(address(staker)       != address(0)  , "Staker address cannot be address 0");                
        require(address(_poolAddress) != address(0)  ,  "Pool address cannot be address 0");                
        return stakingTimeStamps[_poolAddress][staker];        
    }

    // @dev: read lockup period for `_poolAddress`
    function readLockupPeriod( address _poolAddress ) view external returns (uint256) {
        require(address(_poolAddress) != address(0)  ,  "Pool address cannot be address 0");                
        return minLockupPeriods[_poolAddress];
    }

    // @dev: read accrued interest due
    function readInterestDue( address _poolAddress, address _staker ) view external returns (uint256) {
        require(address(_poolAddress) != address(0)  ,  "Pool address cannot be address 0");                
        require(address(_staker)      != address(0)  , "Staker address cannot be address 0");                
        uint256 rate_of_return = floatRates[_poolAddress][_staker];
        uint256 principle    = pools[_poolAddress][_staker];
        uint256 interest     = principle * rate_of_return/rateDecimals;
        return interest;
    }

    // @dev: read principle + accrued interest due
    function readBalanceDue( address _poolAddress, address _staker ) view external returns (uint256){
        require(address(_poolAddress) != address(0)  ,  "Pool address cannot be address 0");                
        require(address(_staker)      != address(0)  , "Staker address cannot be address 0");                
        uint256 rate_of_return = floatRates[_poolAddress][_staker];
        uint256 principle    = pools[_poolAddress][_staker];
        uint256 interest     = principle * rate_of_return / rateDecimals;
        uint256 total_due    = principle + interest;
        return total_due;
    }

    /**
     ***************************************************************************
     * API contract custodians
    */

    // @dev: add contract custodian 
    function addCustodian( address pk ) external onlyOwner {
        require(address(pk) != address(0),"custodian address cannot be address 0");                
        custodians[pk] = 1;
    }

    // @dev: det. if pk is custodian
    function isCustodian( address pk ) view  external returns (bool) {
        require(address(pk) != address(0),"custodian address cannot be address 0");                
        return custodians[pk] == 1;
    }

    // @use: remove custodian
    function removeCustodian( address pk ) external onlyOwner {
        require(address(pk) != address(0),"custodian address cannot be address 0");                
        custodians[pk] = 0;
    }

    /**
     ***************************************************************************
     * API owner pool allocations
    */

    // @dev; change risk free rate
    function setRiskFreeRate( uint256 rate ) external onlyOwner {
        require(rate > 0, "Risk free rate should be greater than zero");
        riskFreeRate = rate;
    }

    // @dev: add staking pool at risk free rate
    function addPool( address _poolAddress, uint8 _lockupPeriod ) external {        
        require(address(_poolAddress) != address(0),"Pool address cannot be address 0");                
        require(_lockupPeriod > 0, "This lockupPeriod must be greater than zero");
        require( _admin == _msgSender() || custodians[_msgSender()] == 1, "Only approved custodians can call call addPool");
        riskFreeRates[_poolAddress] = riskFreeRate;
        minLockupPeriods[_poolAddress] = _lockupPeriod;
    }

    // @dev: remove pool
    function removePool( address _poolAddress ) external onlyOwner {        
        require(address(_poolAddress) != address(0),"Pool address cannot be address 0");                
        riskFreeRates[_poolAddress] = 0;
        minLockupPeriods[_poolAddress] = 0;
    }    

    // @dev: define lockup period
    function setLockupPeriod( address _poolAddress, uint8 _lockupPeriod ) external onlyOwner {
        require(address(_poolAddress) != address(0), "Pool address cannot be address 0");                
        require(riskFreeRates[_poolAddress] > 0    , "This pool does not exist" );
        minLockupPeriods[_poolAddress] = _lockupPeriod;
    }    

    // @dev: set float `rate` of return for `staker` at `_poolAddress`
    function setFloatRate( address _poolAddress, address staker, uint256 rate ) external onlyOwner {        
        _setFloatRate(_poolAddress, staker, rate); 
    }    

    /**
     ***************************************************************************
     * API stake/unstake public
    */

    //@dev: stake `amt` into `_poolAddress`
    function stake( uint256 amt, address _poolAddress ) external payable whenNotPaused {
        _goStake(_poolAddress, _msgSender(), amt);        
    }


    //@dev: unstake `amt` into `_poolAddress` and claim staking reward
    //     note staking reward does not compound in time.
    function unstake ( address _poolAddress ) external nonReentrant() {
        _goUnstake(_poolAddress, _msgSender(), 0);
    }

    // @dev: admin/custodian only _stake fn
    function _stake( address _poolAddress, address staker, uint256 amt ) external whenNotPaused {
        require( _admin == _msgSender() || custodians[_msgSender()] == 1, "Only approved custodians can call call _unstake");
        _goStake(_poolAddress, staker, amt);
    }

    // @dev: admin/custodian only _unStake fn
    function _unstake( address _poolAddress, address staker ) external nonReentrant() {
        require( _admin == _msgSender() || custodians[_msgSender()] == 1, "Only approved custodians can call call _unstake");
        _goUnstake(_poolAddress, staker, 0);
    }


    // @dev: set float rates for stakers
    function batchSetFloatRates( address _poolAddress, address[] memory stakers, uint256[] memory rates ) external {
        require( _admin == _msgSender() || custodians[_msgSender()] == 1, "Only approved custodians can call call batchSetFloatRates");
        require(stakers.length == rates.length, "LumoStakingPool: stakers and rates must have same length");
        for (uint256 i = 0; i < stakers.length; i ++ ){            
            _setFloatRate(_poolAddress, stakers[i], rates[i]);
        }        
    }

    // @dev: unstake stakers from the _poolAddress
    function batchUnstake( address _poolAddress, address[] memory stakers ) external nonReentrant() {
        require( _admin == _msgSender() || custodians[_msgSender()] == 1, "Only approved custodians can call call batchUnstake");
        require(stakers.length > 0, "LumoStakingPool: Please provide at least one staker");
        for (uint256 i = 0; i < stakers.length; i ++ ){            
            _goUnstake( _poolAddress, stakers[i], 0 );
        }                
    }

    // @dev: batch stake amount into pool address
    function batchStakeWithAmts( address _poolAddress, address[] memory stakers, uint256[] memory amounts ) external {
        require( _admin == _msgSender() || custodians[_msgSender()] == 1, "Only approved custodians can call call batchStakeWithAmts");
        require(stakers.length > 0, "LumoStakingPool: Please provide at least one staker");
        require(stakers.length == amounts.length, "LumoStakingPool: stakers and amounts must have same length");
        for (uint256 i = 0; i < stakers.length; i ++ ){            
            _goStakeFailGracefully(_poolAddress, stakers[i], amounts[i]);
        }          
    }

    // @dev: unstake stakers from the `_poolAddress`, with externally defined rates of return
    function batchUnstakeWithRates( address _poolAddress, address[] memory stakers, uint256[] memory rates ) external nonReentrant() {
        require( _admin == _msgSender() || custodians[_msgSender()] == 1, "Only approved custodians can call call batchUnstakeWithRates");
        require(stakers.length > 0, "LumoStakingPool: Please provide at least one staker");
        require(stakers.length == rates.length, "LumoStakingPool: stakers and rates must have same length");
        for (uint256 i = 0; i < stakers.length; i ++ ){            
            _goUnstake( _poolAddress, stakers[i], rates[i] );
        }                
    }

    /**
     ***************************************************************************
     * utils
    */

    // @dev: set float `rate` of return for `staker` at `_poolAddress`
    function _setFloatRate( address _poolAddress, address staker, uint256 rate ) internal onlyOwner {        
        require(address(_poolAddress) != address(0), "Pool address cannot be address 0");                
        require(address(staker)       != address(0)   , "Staker address cannot be address 0");                
        require(riskFreeRates[_poolAddress] > 0    , "This pool does not exist" );
        floatRates[_poolAddress][staker] = rate;
    }    

    // @dev: internals staking fn that fails if amt < balance or amt == 0
    function _goStake( address _poolAddress, address staker, uint256 amt ) internal {

        require(address(staker) != address(0)    , "Staker address cannot be address 0");                
        require(address(_poolAddress) != address(0)    ,  "Pool address cannot be address 0");                
        require(riskFreeRates[_poolAddress] > 0        , "This pool does not exist" );
        require(lumoToken.balanceOf(staker) > amt      , "Insufficient Balance");
        require(amt > 0, "Stake amount must be greater than zero");

        // run internal staking fn.
        _goStakeFailGracefully(_poolAddress, staker, amt);
    }

    // @dev: internal stake fn that *does not* fail if balance is zero or amt is zero
    //       instead it exit early and emit trivial staking event.
    function _goStakeFailGracefully( address _poolAddress, address staker, uint256 amt ) internal {

        require(address(staker) != address(0)        , "Staker address cannot be address 0");                
        require(address(_poolAddress) != address(0)  ,  "Pool address cannot be address 0");                
        require(riskFreeRates[_poolAddress] > 0      , "This pool does not exist");

        if ( lumoToken.balanceOf(staker) <= amt ){

            emit Staked(staker,0);                        

        } else if (amt == 0){            

            emit Staked(staker,0);                        

        } else {

            // transfer token from sender to this contract
            lumoToken.allocate(staker, address(this), amt );
            pools[_poolAddress][staker] = amt + pools[_poolAddress][staker];

            // set rate of return
            uint256 current_rate = floatRates[_poolAddress][staker];
            floatRates[_poolAddress][staker] =  _max( current_rate, riskFreeRate );

            // update aggregate data;
            totalStakers += 1;
            totalStakedVolume += amt;

            // set staking timestamp
            if ( stakingTimeStamps[_poolAddress][staker] == 0 ){
                stakingTimeStamps[_poolAddress][staker] = block.timestamp;
                emit Staked(staker, amt);
            } else {
                emit Staked(staker, amt);            
            }            
        }
    }

    // @dev: unstake staker w/ predefined rates. pick the higher of predefined `rate`
    //       or the staker's rate at the point of staking as staking reward
    function _goUnstake( address _poolAddress, address staker, uint256 rate ) internal {

        require(address(staker) != address(0)        , "Staker cannot be address 0");
        require(address(_poolAddress) != address(0)  , "Pool address cannot be address 0");                
        require(riskFreeRates[_poolAddress] > 0      , "This pool does not exist" );        

        // determine if lockup period has ended
        uint256 deposit_timeStamp = stakingTimeStamps[_poolAddress][staker];
        uint256 end_timestamp     = deposit_timeStamp + minLockupPeriods[_poolAddress];

        require( block.timestamp >= end_timestamp, "You cannot withdrawl item from the pool before the lockup period ends" );

        // if principle = 0, fail gracefully
        uint256 principle = pools[_poolAddress][staker];

        if ( principle == 0 ){

            emit Claimed( staker, 0, 0 );

        } else {

            uint256 rate_of_return = _max(floatRates[_poolAddress][staker], rate);
            uint256 interest       = principle * rate_of_return / rateDecimals;
            uint256 total_due      = principle + interest;

            // return principle to staker and mint interest from lumoToken
            lumoToken.allocate(address(this), staker, principle );
            lumoToken.mint( staker, interest );

            // update stores
            totalInterestVolume += interest;
            pools[_poolAddress][staker] = 0;
            floatRates[_poolAddress][staker] = 0;
            stakingTimeStamps[_poolAddress][staker] = 0;

            emit Claimed( staker, total_due, rate_of_return );

        }
    }



    function _max(uint256 a, uint256 b) private pure returns (uint256) {
        return a >= b ? a : b;
    }    

}





