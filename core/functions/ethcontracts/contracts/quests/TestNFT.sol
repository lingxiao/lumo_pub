// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TestNFT is ERC721, ERC721Burnable, Ownable {

    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    mapping (address => bool) _questContractWhiteList;

    constructor() ERC721("TestNFT", "TFT") {}

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    /**
     * @notice  Mints only 1 token to recipient. 
     * @dev     Reverts if receipient owns already 1 token
     * @param   recipient  token holder
     * @return  uint256  tokenId assigned to holder
     */
    function mintNFT(address recipient) public returns (uint256){
        require(_questContractWhiteList[msg.sender] == true, "Quest contract has not been whitelisted");
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(recipient, tokenId);
        return tokenId;
    }

    /**
     * @dev Returns the owner of the `tokenId`. Does NOT revert if token doesn't exist
     */
    // function ownerOfToken(uint256 tokenId) public view returns (address) {
    //     return _ownerOf(tokenId);
    // }

    /**
     * @dev whitelist quest contract so it can airdrop values;
    **/
    function whitelistQuestContract( address _questContract) public onlyOwner {
        require(_questContract != address(0), "Quest contract cannot be the zero address");
        _questContractWhiteList[_questContract] = true;
    }

    // @dev check contract is whitelised
    function questContractIsWhitelisted(address _questContract) public view returns (bool){
        return _questContractWhiteList[_questContract];
    }

    function removeWhitelistedQuestContract( address _questContract) public onlyOwner {
        _questContractWhiteList[_questContract] = false;
    }


}