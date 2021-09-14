pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "./DoubleTrouble.sol";
import "./Libraries.sol";

// SPDX-License-Identifier: MIT
contract DoubleTroubleOrchestrator is ERC721URIStorage {
  mapping (address => DoubleTrouble) public _troublesomeCollections;
  DoubleTroubleFactory _dtFactory;
  address _feeWallet;
  address[] _registeredCollections;

  event MakeTroublesomeCollection(address msgSender, address originalCollection, address troublesomeCollection,
                                  string name, string symbol);

  constructor(DoubleTroubleFactory dtFactory, address feeWallet) ERC721("Patron Tokens", "PTRN") {
    _feeWallet = feeWallet;
    _dtFactory = dtFactory;
  }

  function makeTroublesomeCollection(address nftCollection, string memory name, string memory symbol) external {
    require(address(_troublesomeCollections[nftCollection]) == address(0), "Collection is already Troublesome");

    // Deploy troublesome contract for nftCollection
    _troublesomeCollections[nftCollection] = _dtFactory.makeNew(name, symbol, nftCollection, _feeWallet, address(this), 30, 2, 1, 130);
    _mint(msg.sender, _registeredCollections.length);
    _registeredCollections.push(nftCollection);

    emit MakeTroublesomeCollection(msg.sender, nftCollection, address(_troublesomeCollections[nftCollection]), name, symbol);
  }

  function troublesomeCollection(address nftCollection) external view returns (DoubleTrouble) {
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

  function tokenIdForTroublesomeCollection(address troublesomeCollectionAddr) external view returns (uint256) {
    for (uint i = 0; i < _registeredCollections.length; i++) {
      if (troublesomeCollectionAddr == address(_troublesomeCollections[_registeredCollections[i]])) {
        return i;
      }
    }
    revert("Collection not found");
  }

  // This is the most meta code in this contract
  // If PTRN # tokenId is owned by an externally owned account, patronOfTokenId returns that account
  // if PTRN # tokenId is owned by the troublesome contract of this DTO, return the owner per
  // the troublesome contract
  function patronOfTokenId(uint256 tokenId) external view returns (address) {
    // Try to reach for a troublesomeCollection for this DTO
    DoubleTrouble dtForDto = this.troublesomeCollection(address(this));
    if (address(dtForDto) != address(0)) {
      try dtForDto.ownerOf(tokenId) returns (address owner) {
        return owner;
      } catch (bytes memory /*lowLevelData*/) {
        // NOOP
      }
    }

    // If the above failed, it means DTO itself knows the patron
    return ownerOf(tokenId);
  }

  function patronOf(address troublesomeCollectionAddr) external view returns (address) {
    return this.patronOfTokenId(this.tokenIdForTroublesomeCollection(troublesomeCollectionAddr));
  }

  function getOriginalCollectionName(uint256 tokenId) external view returns (string memory) {
    require(tokenId < _registeredCollections.length, "tokenId not present");
    return IERC721Metadata(_registeredCollections[tokenId]).name();
  }

  function getOriginalCollectionSymbol(uint256 tokenId) external view returns (string memory) {
    require(tokenId < _registeredCollections.length, "tokenId not present");
    return IERC721Metadata(_registeredCollections[tokenId]).symbol();
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(tokenId < _registeredCollections.length, "tokenId not present");
    address o;
    address t;
    (o, t) = this.registeredCollection(tokenId);
    string memory originalAddr = Stringify.toString(o);
    string memory troublesomeAddr= Stringify.toString(t);
    string memory strTokenId = Stringify.toString(tokenId);

    string[20] memory parts;
    uint256 lastPart = 0;
    parts[lastPart++] = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 400 400"><style>.base { fill: white; font-family: serif; font-size: 14px; }</style><rect width="100%" height="100%" fill="black" /><text x="10" y="20" class="base">';

    parts[lastPart++] = string(abi.encodePacked('PTRN #', strTokenId));
    parts[lastPart++] = '</text>';

    try this.getOriginalCollectionName(tokenId) returns (string memory name) {
      parts[lastPart++] = '<text x="10" y="40" class="base">';
      parts[lastPart++] = name;
      parts[lastPart++] = '</text>';
    } catch (bytes memory /*lowLevelData*/) {
      // NOOP
    }

    try this.getOriginalCollectionSymbol(tokenId) returns (string memory symbol) {
      parts[lastPart++] = '<text x="10" y="60" class="base">';
      parts[lastPart++] = symbol;
      parts[lastPart++] = '</text>';
    } catch (bytes memory /*lowLevelData*/) {
      // NOOP
    }

    parts[lastPart++] = '<text x="10" y="80" class="base">';
    parts[lastPart++] = string(abi.encodePacked('Original: ', originalAddr));
    parts[lastPart++] = '</text><text x="10" y="100" class="base">';

    parts[lastPart++] = string(abi.encodePacked('Troublesome: ', troublesomeAddr));
    parts[lastPart++] = '</text></svg>';

    string memory output;
    for (uint256 i = 0; i < lastPart; i++) {
      output = string(abi.encodePacked(output, parts[i]));
    }

    string memory json = Base64.encode(bytes(string(abi.encodePacked('{"name": "PTRN #', strTokenId, '", "originalCollection": "',
                                                                      originalAddr, '", "troublesomeCollection": "',
                                                                      troublesomeAddr, '", "description": "Whoever owns this PTRN token is the Patron for this collection. Patrons automatically get a % fee for any NFT from this collection sold within Double Trouble.", "image": "data:image/svg+xml;base64,',
                                                                      Base64.encode(bytes(output)), '"}'))));
    output = string(abi.encodePacked('data:application/json;base64,', json));

    return output;
  }
}

/*
* We need a Factory contract here because otherwise
* DoubleTroubleOrchestrator's code would have to include all of
* DoubleTrouble's code, and this would make DTO go above the 24KB Ethereum contract size limit.
*
* See more on this here: https://ethereum.stackexchange.com/questions/41501/contract-code-size-and-how-to-work-around-it
*/
contract DoubleTroubleFactory {
  function makeNew(string memory name, string memory symbol, address nftCollection, address feeWallet, address dto,
                  uint256 daysForWithdraw, uint256 dtNumerator, uint256 dtDenominator, uint256 feeRate)
        external returns (DoubleTrouble) {
    return new DoubleTrouble(name, symbol, nftCollection, feeWallet, dto,
                             daysForWithdraw, dtNumerator, dtDenominator, feeRate);
  }
}
