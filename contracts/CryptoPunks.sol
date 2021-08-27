pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";


// SPDX-License-Identifier: MIT

contract CryptoPunks is ERC721URIStorage {
  constructor() ERC721("CryptoPunks", "PUNK") {
  }

  function createNft(address to) public returns (uint256) {

    uint256 newItemId = 42;
    _mint(to, newItemId);
    _setTokenURI(newItemId, "https://foo.bar");

    return newItemId;
  }
}
