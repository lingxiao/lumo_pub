// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.13;

// import "@openzeppelin/contracts/utils/Strings.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
// import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
// import "operator-filter-registry/src/upgradeable/DefaultOperatorFiltererUpgradeable.sol";
// import "./LumoAppStorage.sol";

// contract ERC721LumoV1 is 
//     Initializable, 
//     ERC721Upgradeable, 
//     UUPSUpgradeable,
//     DefaultOperatorFiltererUpgradeable
// {

//     LumoAppStorage internal store;

//     event MintCanceled(address pk, uint256 tokid, string msg);

//     /// @custom:oz-upgrades-unsafe-allow constructor
//     constructor() {
//         _disableInitializers();
//     }

//     /**
//      * @dev init erc721 with basic erc721 contract params
//      **/
//     function initializeERC721LumoV1(
//         string memory _name,
//         string memory _symbol,
//         string memory uri_, 
//         uint256 price_,
//         address witness_        
//     ) initializer public {
//         __ERC721_init(_name,_symbol);
//         __UUPSUpgradeable_init();
//         store.baseURIV1 = uri_;
//         store.ownerAppContract  = msg.sender;
//         store.witnessAppLumo = witness_;
//         store.priceItem = price_;
//         store.isPaused = true;
//         store.isWhitelistOnly = true;
//         store._whitelist[msg.sender] = 1;
//     }

//     function _authorizeUpgrade(address newImplementation) internal override virtual {
//         require(msg.sender == store.witnessAppLumo);        
//     }
 

//     /**
//      ****************************************************************************
//     * API ERC721 read
//     */

//     function uri(uint256 tokid) public view returns (string memory){
//         return string(abi.encodePacked(store.baseURIV1, Strings.toString(tokid)));
//     }

//     function getTokenIdsList() public view returns (uint256[] memory){
//         return store._tokenIdsList;
//     }

//     function getERC721Owner() public view returns (address) {
//         return store.ownerAppContract;
//     }

//     function isPaused() public view returns (bool){
//         return store.isPaused;
//     }

//     function isWhitelistOnly() public view returns (bool){
//         return store.isWhitelistOnly;
//     }

//     /**
//      * @dev Returns the owner of the `tokenId`. Does NOT revert if token doesn't exist
//      */
//     function ownerOfToken(uint256 tokenId) public view returns (address) {
//         return _ownerOf(tokenId);
//     }

//     function isWhiteListed( address to ) public view returns (bool){
//         return store.isWhitelistOnly ? store._whitelist[to] > 0 : true;
//     }

//     function getPrice() public view returns (uint256){
//         return store.priceItem;
//     }

//     /**
//      ****************************************************************************
//     * API ERC721 write
//     */

//     function setIsWhiteListOnly (bool isWhitelistOnly_) public virtual {
//         require( msg.sender == store.ownerAppContract, "Only contract owner can change whitelist settings" );
//         store.isWhitelistOnly = isWhitelistOnly_;
//     }

//     function whiteListAddresses( address[] memory pks ) public virtual {
//         require( msg.sender == store.ownerAppContract, "Only contract owner can whitelist addresses" );
//         for (uint256 i = 0; i < pks.length; ++i) {
//             store._whitelist[pks[i]] = 1;
//         }        
//     }  

//     function removeWhiteListedAddress( address to ) public virtual {
//         require( msg.sender == store.ownerAppContract, "Only contract owner can remove whitelisted addresses" );
//         store._whitelist[to] = 0;
//     }    

//     function pauseMint() public virtual {
//         require( msg.sender == store.ownerAppContract, "Only contract owner can pause mint" );
//         store.isPaused = true;
//     }

//     function resumeMint() public virtual {
//         require( msg.sender == store.ownerAppContract, "Only contract owner can unpause mint" );
//         store.isPaused = false;
//     }

//     function setPrice(uint256 price_) public virtual {
//         require( msg.sender == store.ownerAppContract, "Only contract owner can set price" );
//         store.priceItem = price_;
//     }

//     /**
//      * @dev mint function that is open to all, if witness not provided, then cannot mint for cost less than price
//      **/
//     function mint( address[] memory pks, uint256[] memory ids, address witness_ ) public payable {
//         require( store.isPaused == false && pks.length == ids.length , "Mint is paused or mismatched input lengths" );
//         require( msg.value >= store.priceItem * pks.length || witness_ == store.witnessAppLumo, "Payment must be > price" );
//         if (pks.length == 1){
//             require(isWhiteListed(pks[0]) && _ownerOf(ids[0]) == address(0), "This address is not whitelisted or this token id already exists");
//             _safeMint(pks[0],ids[0], "");
//             store._tokenIdsList.push(ids[0]);
//         } else {
//             for (uint256 i = 0; i < pks.length; ++i) {
//                 if ( isWhiteListed(pks[i]) && _ownerOf(ids[i]) == address(0) ){
//                     _safeMint(pks[i],ids[i], "");
//                     store._tokenIdsList.push(ids[i]);
//                 } else {
//                     emit MintCanceled( pks[i], ids[i], "This address is not whitelisted or the token id already exists");
//                 }
//             }    
//         }
//     }

//     /**
//     * ***************************************************************************
//     * @dev Opensea compliant override
//     */

//     function setApprovalForAll(address operator, bool approved) public override onlyAllowedOperatorApproval(operator) {
//         super.setApprovalForAll(operator, approved);
//     }

//     function approve(address operator, uint256 tokenId) public override onlyAllowedOperatorApproval(operator) {
//         super.approve(operator, tokenId);
//     }

//     function transferFrom(address from, address to, uint256 tokenId) public override onlyAllowedOperator(from) {
//         super.transferFrom(from, to, tokenId);
//     }

//     function safeTransferFrom(address from, address to, uint256 tokenId) public override onlyAllowedOperator(from) {
//         super.safeTransferFrom(from, to, tokenId);
//     }

//     function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data)
//         public
//         override
//         onlyAllowedOperator(from)
//     {
//         super.safeTransferFrom(from, to, tokenId, data);
//     }
// }





















