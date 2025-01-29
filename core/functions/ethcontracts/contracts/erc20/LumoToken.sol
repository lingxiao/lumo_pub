// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";


contract LumoToken is ERC20, ERC20Burnable, Pausable, Ownable, ERC20Permit, ERC20Votes {

    // @dev: custodians
    address private _admin;
    mapping (address => uint256) private custodians;

    // @dev: white listed staking contracts
    mapping (address => uint8) private stakingContractWhitelist;


    constructor() ERC20("LumoToken", "LMO") ERC20Permit("LumoToken") {
        _mint(msg.sender, 10 * 10 ** decimals());
        _admin = msg.sender;
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
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

    // @dev: white list staking contract so it can call `mint` fn here
    function whiteListStakingContract( address addr ) external onlyOwner {
        stakingContractWhitelist[addr] = 1;
    }

    // @dev: remove staking contract from white list 
    function removeWhiteListedStakingContract( address addr ) external onlyOwner {
        stakingContractWhitelist[addr] = 0;
    }

    // @dev: read if address is whitelisted
    function readIsWhiteListed( address addr ) view external returns (bool) {
        require(address(addr) != address(0),"Stakikng address cannot be address 0");                
        return stakingContractWhitelist[addr] == 1;
    }

    /**
     ***************************************************************************
     * API contract mint and sends
    */

    // @dev: if contract owner or whitelisted token contract, mint `to` address
    function mint(address to, uint256 amount) external {
        require( _msgSender() == _admin || stakingContractWhitelist[_msgSender()] == 1 || custodians[_msgSender()] == 1, 
            "only contract owner or whitelisted staking contract can call mint function" 
            );
        _mint(to, amount);
    }

    // @dev: burn tokens in acct
    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }

    //@dev: send token `from` owner `to` target, either the owner, admin, or the
    //      whitelisted staking contract can do this
    function allocate(address from, address to, uint256 amount) external {
        require(balanceOf(from) >= amount, "transfer amount exceed source balance");
        require( _msgSender() == _admin 
            || custodians[_msgSender()] == 1
            || stakingContractWhitelist[_msgSender()] == 1
            || _msgSender() == from
            , 
            "only contract custodians or whitelisted staking contract can call allocate function" 
            );
        _transfer(from, to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }

    // The following functions are overrides required by Solidity.

    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
}
