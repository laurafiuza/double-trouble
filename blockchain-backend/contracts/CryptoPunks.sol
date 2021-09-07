pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";


// SPDX-License-Identifier: MIT

contract CryptoPunks is ERC721URIStorage {
  constructor() ERC721("CryptoPunks", "PUNK") {}

  uint256 tokenCounter = 0;

  function createNft(address to) public returns (uint256) {
    _mint(to, tokenCounter);
    _setTokenURI(tokenCounter, "https://api.artblocks.io/token/0");
    tokenCounter++;

    _mint(to, tokenCounter);
    _setTokenURI(tokenCounter, "https://api.artblocks.io/token/1");
    tokenCounter++;

    _mint(to, tokenCounter);
    _setTokenURI(tokenCounter, "https://api.artblocks.io/token/2");
    tokenCounter++;

    return tokenCounter - 1;
  }
}
