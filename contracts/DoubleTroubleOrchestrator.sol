pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

// SPDX-License-Identifier: MIT
contract DoubleTroubleOrchestrator {
  /*
  mapping (address => DoubleTrouble) public _troublesomeCollections;

  function makeTroublesomeNft(address nftCollection, uint256 tokenId) {
    require(IERC721Metadata(nftCollection).supportsInterface(0x80ac58cd),  "collection must refer to an ERC721 address");
    if (_troublesomeCollections[nftCollection] == address(0)) {
      makeTroublesomeCollection(nftCollection);
    }

  }

  function makeTroublesomeCollection(address nftCollection, string memory name, string memory symbol) {
    require(IERC721Metadata(nftCollection).supportsInterface(0x80ac58cd),  "collection must refer to an ERC721 address");
    require(_troublesomeCollections[collection] == address(0), "Collection is already Troublesome");

    // Deploy troublesome contract for nftCollection
    _troublesomeCollections[nftCollection] = new DoubleTrouble(name, symbol, nftCollection);
  }
  */
}
