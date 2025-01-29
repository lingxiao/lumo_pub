// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./ERC721LumoV2.sol";

library StorageSlot {
    function getAddressAt(bytes32 slot) internal view returns (address a) {
        assembly {
            a := sload(slot)
        }
    }

    function setAddressAt(bytes32 slot, address address_) internal {
        assembly {
            sstore(slot, address_)
        }
    }
}

contract ERC721SplitterProxy is Initializable {

    event PaymentReceived(address from, uint256 amount);    

    bytes32 private constant _SLOT_WITNESS =
        bytes32(uint256(keccak256("com.lumo.witness")) - 1);                

    bytes32 private constant _IMPL_SLOT_ =
        bytes32(uint256(keccak256("com.lumo.erc721SplitterLumo")) - 1);

    receive() external payable virtual {
        emit PaymentReceived(msg.sender, msg.value);
    }     

    function initializeERC721SplitterProxy( 
        address witness_,
        address feeTargetAddress_,
        address erc721SplitterAddress_,
        address splitterAddress_,
        address[] memory payees_, 
        uint256[] memory shares_,
        string memory _name,
        string memory _symbol,
        string memory uri_, 
        uint256 price_        
    ) public {
        address current_witness = StorageSlot.getAddressAt(_SLOT_WITNESS);
        address current_impl = StorageSlot.getAddressAt(_IMPL_SLOT_);
        require(erc721SplitterAddress_ != address(0) && witness_ != address(0), "neither impl nor witness can be the zero address");
        require( current_witness == address(0) && current_impl == address(0), "contract already initialized");
        StorageSlot.setAddressAt(_IMPL_SLOT_, erc721SplitterAddress_);
        StorageSlot.setAddressAt(_SLOT_WITNESS, witness_);
        erc721SplitterAddress_.delegatecall(abi.encodeWithSelector(ERC721LumoV2.initializeERC721LumoV2.selector, witness_, feeTargetAddress_, splitterAddress_, payees_, shares_, _name, _symbol, uri_, price_));
    }
    
    //@dev set impl address and contract owner/witness
    function setImplementation(address impl) public {
        address current_witness = StorageSlot.getAddressAt(_SLOT_WITNESS);
        require( msg.sender == current_witness, "Only witness can set implementation");
        StorageSlot.setAddressAt(_IMPL_SLOT_, impl);
    }

    function getImplementation() public view returns (address) {
        return StorageSlot.getAddressAt(_IMPL_SLOT_);
    }

    fallback() external payable {
        _delegate(StorageSlot.getAddressAt(_IMPL_SLOT_));
    }

    //@dev call erc721 first, if no fn found then call splitter contract
    function _delegate(address impl) internal virtual {
        assembly {

            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize())

            let result := delegatecall(gas(), impl, ptr, calldatasize(), 0, 0)

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
}









