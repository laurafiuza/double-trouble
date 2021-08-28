pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";


// SPDX-License-Identifier: MIT

contract CryptoPunks is ERC721URIStorage {
  constructor() ERC721("CryptoPunks", "PUNK") {
  }

  uint256 tokenCounter = 0;

  function createNft(address to) public returns (uint256) {
    _mint(to, tokenCounter);
    _setTokenURI(tokenCounter, "https://foo.bar");
    uint256 toReturn = tokenCounter;
    tokenCounter = tokenCounter + 1;

    return toReturn;
  }
}
