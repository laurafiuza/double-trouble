pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
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

contract DoubleTrouble is ERC721URIStorage {
  // nested mapping that keeps track of who owns the NFTs
  mapping (uint256 => uint256) public _forSalePrices;
  mapping (uint256 => uint256) public _lastPurchasePrices;
  address _originalCollection;

  constructor(string memory name, string memory symbol, address nftCollection) ERC721(name, symbol) {
    require(nftCollection != address(0), "collection address cannot be zero");
    require(IERC721(nftCollection).supportsInterface(0x80ac58cd),  "collection must refer to an ERC721 address");
    _originalCollection = nftCollection;
  }

  function makeDTable(uint256 tokenId) external {
    require(IERC721(_originalCollection).getApproved(tokenId) == address(this), "DoubleTrouble contract must be approved to operate this token");

    // In the original collection, the owner forever becomes the DoubleTrouble contract
    address owner = IERC721(_originalCollection).ownerOf(tokenId);
    IERC721(_originalCollection).transferFrom(owner, address(this), tokenId);

    // Mint an NFT in the DT contract so we start recording the true owner here
    _mint(owner, tokenId);
  }

  function forSalePrice(uint256 tokenId) external view returns (uint256) {
    require(ownerOf(tokenId) != address(0), "collection and tokenId combination is not present in DT");
    return _forSalePrices[tokenId];
  }

  function lastPurchasePrice(uint256 tokenId) external view returns (uint256) {
    require(ownerOf(tokenId) != address(0), "collection and tokenId combination is not present in DT");
    return _lastPurchasePrices[tokenId];
  }

  // sets currentForSalePrice to price
  function putUpForSale(uint256 tokenId, uint256 price) external {
    require(msg.sender == ownerOf(tokenId), "msg.sender should be current owner of NFT");
    _forSalePrices[tokenId] = price;
  }
}
