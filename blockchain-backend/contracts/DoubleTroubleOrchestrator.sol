pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "./DoubleTrouble.sol";

// SPDX-License-Identifier: MIT
contract DoubleTroubleOrchestrator is ERC721URIStorage {
  mapping (address => DoubleTrouble) public _troublesomeCollections;
  DoubleTroubleFactory _dtFactory;
  address _feeWallet;
  address[] _registeredCollections;

  constructor(DoubleTroubleFactory dtFactory, address feeWallet) ERC721("Double Trouble", "TRBL") {
    _feeWallet = feeWallet;
    _dtFactory = dtFactory;
  }

  function makeTroublesomeCollection(address nftCollection, string memory name, string memory symbol) external {
    _ensureSupportedNftContract(nftCollection);
    require(address(_troublesomeCollections[nftCollection]) == address(0), "Collection is already Troublesome");

    // Deploy troublesome contract for nftCollection
    _troublesomeCollections[nftCollection] = _dtFactory.makeNew(name, symbol, nftCollection, _feeWallet);
    _mint(msg.sender, _registeredCollections.length);
    _registeredCollections.push(nftCollection);
  }

  function troublesomeCollection(address nftCollection) external view returns (DoubleTrouble) {
    _ensureSupportedNftContract(nftCollection);
    return _troublesomeCollections[nftCollection];
  }

  function registeredCollections() external view returns (address[] memory, address[] memory) {
    address[] memory mappedCollections = new address[](_registeredCollections.length);
    for (uint i = 0; i < _registeredCollections.length; i++) {
      mappedCollections[i] = address(_troublesomeCollections[_registeredCollections[i]]);
    }

    return (_registeredCollections, mappedCollections);
  }

  function registeredCollection(uint256 tokenId) external view returns (address, address) {
    require(tokenId < _registeredCollections.length, "tokenId not present");
    address original = _registeredCollections[tokenId];
    return (original, address(_troublesomeCollections[original]));
  }

  function _ensureSupportedNftContract(address nftCollection) internal view {
    require(IERC721Metadata(nftCollection).supportsInterface(0x80ac58cd),  "collection must refer to an ERC721 address");
  }

  function tokenURI(uint256) public view virtual override returns (string memory) {
    revert("TODO");
  }
}

contract DoubleTroubleFactory {
  function makeNew(string memory name, string memory symbol, address nftCollection, address feeWallet)
        external returns (DoubleTrouble) {
    return new DoubleTrouble(name, symbol, nftCollection, feeWallet);
  }
}
