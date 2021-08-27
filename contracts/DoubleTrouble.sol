pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

// SPDX-License-Identifier: MIT

// TODO: look into the difference between external vs. public
// TODO: check what our protocol thinks of the throw requirements of EIP 721 for transferFrom
// TODO: implement throw requirement of transferFrom that checks whether they are an
// "authorized operator" or "approved address" whatever those mean.
// TODO: design wise, if someone "putsupforsale" an NFT that is not in our records, do we throw
// an error or do we add it to the db? doing the latter for now but can change

// CONCEPTUAL QUESTION: why do we need collection address? will it even be EIP 721 compliant with that param?

// COMMENT: I changed _new_owner to _newOwner to match syntax of the EIP 721 doc


contract DoubleTrouble {
  struct NftState {
    address owner;
    uint256 currentForSalePrice;
    uint256 lastPurchasePrice;
  }

  // nested mapping that keeps track of who owns the NFTs
  mapping (address => mapping (uint256 => NftState)) public _NFTs;

  // Returns the current owner of the NFT
  function ownerOf(address collection, uint256 tokenId) external view returns (address) {
    require(collection != address(0), "collection address cannot be zero");
    return _NFTs[collection][tokenId].owner;
  }

  function makeDTable(address collection, uint256 tokenId) external {
    require(_NFTs[collection][tokenId].owner == address(0), "This NFT is already DTable");
    require(IERC721(collection).supportsInterface(0x80ac58cd),  "collection must refer to an ERC721 address");
    require(IERC721(collection).getApproved(tokenId) == address(this), "DoubleTrouble contract must be approved to operate this token");

    // In the original collection, the owner forever becomes the DoubleTrouble contract
    address owner = IERC721(collection).ownerOf(tokenId);
    IERC721(collection).transferFrom(owner, address(this), tokenId);

    // Moving forward, we record the true owner in the DoubleTrouble contract
    _NFTs[collection][tokenId] = NftState({
      owner: owner,
      currentForSalePrice: 0,
      lastPurchasePrice: 0
    });
  }

  // Changes ownership of the NFT
  function transferFrom(address from, address to, address collection, uint256 tokenId) external {
    address currentOwner = _NFTs[collection][tokenId].owner;
    require(currentOwner != address(0), "collection and tokenId combination is not present in DT");
    require(msg.sender == currentOwner, "msg.sender should be current owner of NFT");
    require(from == currentOwner, "from address should be current owner of NFT");
    require(to != address(0), "to address cannot be zero");
    _NFTs[collection][tokenId].owner = to;
  }

  // FIXME: Delete
  function debug(address collection) external view returns (bool) {
    return IERC721(collection).supportsInterface(0x80ac58cd);
  }

  function forSalePrice(address collection, uint256 tokenId) external view returns (uint256) {
    return _NFTs[collection][tokenId].currentForSalePrice;
  }

  function lastPurchasePrice(address collection, uint256 tokenId) external view returns (uint256) {
    return _NFTs[collection][tokenId].lastPurchasePrice;
  }


  /*

  // sets currentForSalePrice to price
  function putUpForSale(address _from, address _collection, uint256 _tokenId, uint256 _price) external {
    address currentOwner = _NFTs[_collection][_tokenId].owner;
    require(msg.sender == currentOwner, "msg.sender should be current owner of NFT");
    require(_from == currentOwner, "from address should be current owner of NFT");
    _NFTs[_collection][_tokenId].currentForSalePrice = _price;
  }

  // Transfers ownership of the NFT to the _newOwner
  // as long as _price >= currentForSalePrice or _price >= lastPurchasePrice * 2
  // Moves _price ether from _newOwner to the current owner
  // sets lastPurchasePrice = price
  function buy(address _newOwner, address _collection, uint256 _tokenId, uint256 _price) external {
    // TODO: is this the right way to transfer? what about collections?
    address currentOwner = _NFTs[_collection][_tokenId].owner;
    require(msg.sender == currentOwner, "msg.sender should be current owner of NFT");
    require(_newOwner != 0, "newOwner address can't be zero");
    require((_price >= currentForSalePrice) || (_price >= lastPurchasePrice * 2)), "price should be greater than or equal to currentForSalePrice OR double the lastPurchasePrice");
    _NFTs[_collection][_tokenId].owner = _newOwner;
    _NFTs[_collection][_tokenId].lastPurchasePrice = _price;
  }
  */
}
