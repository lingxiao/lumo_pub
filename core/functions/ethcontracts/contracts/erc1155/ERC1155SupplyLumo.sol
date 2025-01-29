// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";


contract ERC1155SupplyLumo is ERC1155, ERC1155Supply {

    event MintCanceled(address pk, uint256 tokid, string msg);

    address admin_;    
    address lumo_witness;
    string public name;
    string public symbol;
    bool   private _paused;
    bool   private _whiteListOnly;

    /**
     * @dev if _whiteListOnly, then only 
     *  addresses in this list can mint
     **/
    mapping (address => uint8) private _whitelist;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory uri,
        address witness_
    ) ERC1155(uri) {
        name    = _name;
        symbol  = _symbol;
        admin_  = msg.sender;        
        lumo_witness= witness_;
        _paused = true;
        _whiteListOnly = true;
        _setURI(uri);
    }


    function isInWhiteListMode () public view returns (bool) {
        return _whiteListOnly;
    }

    function setIsWhiteListOnly () public virtual {
        require( msg.sender == admin_, "Only admin can change whitelist settings" );
        _whiteListOnly = true;
    }

    function removeIsWhiteListOnly () public virtual {
        require( msg.sender == admin_, "Only admin can change whitelist settings" );
        _whiteListOnly = false;
    }

    function isWhiteListed( address to ) public view returns (bool){
        if (_whiteListOnly) {
            return _whitelist[to] > 0 || to == admin_;
        } else {
            return true;
        }
    }

    function whiteListAddress( address to ) public virtual {
        require( msg.sender == admin_, "Only admin can whitelist addresses" );
        _whitelist[to] = 1;
    }

    
    function whiteListAddresses( address[] memory pks ) public virtual {
        require( msg.sender == admin_, "Only admin can whitelist addresses" );
        for (uint256 i = 0; i < pks.length; ++i) {
            _whitelist[pks[i]] = 1;
        }        
    }    

    function removeWhiteListedAddress( address to ) public virtual {
        require( msg.sender == admin_, "Only admin can remove whitelisted addresses" );
        _whitelist[to] = 0;
    }

    /**
     * @dev Creates `amount` new tokens for `to`, of token type `id`.t 6
     *
     * See {ERC1155-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        address witness,
        bytes memory data
    ) public virtual {
        require( _paused == false, "Mint is paused at this moment" );
        require( isWhiteListed(to) == true, "This address is not whitelisted" );
        if ( id == 0 ){
            require( witness == lumo_witness, "The id 0 is reserved unless the correct witness is passed" );
            _mint(to, 0, amount, data);
        } else {
            if ( amount == 1 ){
                _mint(to, id, 1, data);
            } else {
                require(msg.sender == admin_, "Only the contract owner can issue tokens with more than one edition");
                _mint(to, id, amount, data);            
            }
        }
    }


    /**
     * @dev xref:ROOT:erc1155.adoc#batch-operations[Batched] variant of {mint}.
     *      token id 0 is reserved for minting lumo tokens     
     * 
     */
    function mintBatch(
        address[] memory pks, 
        uint256[] memory ids,
        bytes memory data
    ) public virtual {
        require( _paused == false, "Mint is paused at this moment" );
        require( pks.length == ids.length, "Mismatched input lengths" );
        for (uint256 i = 0; i < pks.length; ++i) {
            if ( isWhiteListed(pks[i]) && ids[i] != 0 ) {
                _mint(pks[i], ids[i], 1, data );                    
            } else {
                emit MintCanceled( pks[i], ids[i], "this address is not whitelisted or you're trying to batch mint tokens with id 0" );
            }
        }    
    }


    /*
     * @dev pause minting 
    */
    function pauseMint() public virtual {
        require( msg.sender == admin_, 'Only admin can pause mint' );
        _paused = true;
    }

    /**
     * @dev unpause mint 
     **/
    function resumeMint() public virtual {
        require( msg.sender == admin_, 'Only admin can unpause mint' );
        _paused = false;
    }

    /**
     * @dev read pause state 
     **/
    function isPaused() public view returns (bool){
        return _paused;
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}







