pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

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
  mapping (address => mapping (uint256 => NftState)) internal _NFTs;

  // Returns the current owner of the NFT
  function ownerOf(address collection, uint256 tokenId) external view returns (address) {
    require(collection != address(0), "collection address cannot be zero");
    return _NFTs[collection][tokenId].owner;
  }

  function makeDTable(address collection, uint256 tokenId) external {
    require(_NFTs[collection][tokenId].owner == address(0), "This NFT is already DTable");
    require(ERC721(collection).supportsInterface(0x80ac58cd),  "collection must refer to an ERC721 address");
    // TODO: check whether ERC721(collection) throws if collection doesnt implement the ERC721 interface
    ERC721(collection).transferFrom(msg.sender, address(this), tokenId);
    _NFTs[collection][tokenId] = NftState({
      owner: msg.sender,
      currentForSalePrice: 9999, //FIXME
      lastPurchasePrice: 99999 //FIXME
    });
  }

  /*
  // Changes ownership of the NFT
  function transferFrom(address _from, address _to, address _collection, uint256 _tokenId) external {
    address currentOwner = _NFTs[_collection][_tokenId].owner;
    require(msg.sender == currentOwner, "msg.sender should be current owner of NFT");
    require(_from == currentOwner, "from address should be current owner of NFT");
    require(_to != 0, "to address cannot be zero");
    // There is no way of checking whether something already exists in a mapping in solidity.
    // The canonical way is to check whether the key is the "default value", in the case of an address,
    // it would be 0.
    require(currentOwner != 0, "collection and tokenId combination is not a valid NFT");
    _NFTs[_collection][_tokenId].owner = _to;
  }

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
