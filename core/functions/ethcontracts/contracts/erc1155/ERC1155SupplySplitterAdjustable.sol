// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.5.0) (token/ERC1155/presets/ERC1155PresetMinterPauser.sol)

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/Strings.sol";
import './ERC1155SupplyLumo.sol';
import './PaymentSplitterAdjustableSmall.sol';


/**
 * @dev {ERC1155} token, including:
 *
 *  - ability for holders to burn (destroy) their tokens
 *  - a minter role that allows for token minting (creation)
 *  - a pauser role that allows to stop all token transfers
 *
 * This contract uses {AccessControl} to lock permissioned functions using the
 * different roles - head to its documentation for details.
 *
 * The account that deploys the contract will be granted the minter and pauser
 * roles, as well as the default admin role, which will let it grant both minter
 * and pauser roles to other accounts.
 *
 * _Deprecated in favor of https://wizard.openzeppelin.com/[Contracts Wizard]._
 * 
 */
contract ERC1155SupplySplitterAdjustable is ERC1155SupplyLumo, PaymentSplitterAdjustableSmall {

    /**
     * @dev Grants `DEFAULT_ADMIN_ROLE`, `MINTER_ROLE`, and `PAUSER_ROLE` to the account that
     * deploys the contract.
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory uri,  
        address witness_,
        address[] memory _payees, 
        uint256[] memory _shares
    ) ERC1155SupplyLumo(_name, _symbol, uri, witness_) 
      PaymentSplitterAdjustableSmall( witness_, _payees, _shares ) payable 
    {}

    /**
     * @dev opensea compliant token uri fn
     * 
     **/
    function uri(uint256 _optionId) public view override(ERC1155) returns (string memory){
        return string(abi.encodePacked(super.uri(0), Strings.toString(_optionId)));
    }


}