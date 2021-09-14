pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "./Libraries.sol";


// SPDX-License-Identifier: MIT
struct CollectionInfo {
  address addr;
  string name;
  string symbol;
  address patron;
}

struct Token {
  address collection;
  uint256 id;
}
contract PatronTokens is ERC721URIStorage {
  // Enumerable set of known tokens
  Token[] _registeredTokens;
  mapping(address => mapping (uint256 => bool)) _registeredTokensSet;

  // Enumerable set of known collections
  address[] _registeredCollections;
  mapping(address =>  bool) _registeredCollectionsSet;

  // Reference to the dt contract that controls this PatronTokens contract
  address public _dt;

  constructor(address dtAddr) ERC721("DoubleTrouble Patron Tokens", "PTRN") {
    _dt = dtAddr;
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return interfaceId == 0xdeadbeef || super.supportsInterface(interfaceId);
  }

  function registeredTokens() external view returns (Token[] memory) {
    return _registeredTokens;
  }

  function totalSupply() external view returns (uint256) {
    return _registeredCollections.length;
  }

  function registerToken(address collection, uint256 tokenId) public {
    require(msg.sender == _dt, "Only the DoubleTrouble contract can call this");
    if (!_registeredTokensSet[collection][tokenId]) {
      _registeredTokensSet[collection][tokenId] = true;
      _registeredTokens.push(Token(collection, tokenId));
    }
  }

  function tryToClaimPatronToken(address collection, address receiverOfNft) public {
    require(msg.sender == _dt, "Only the DoubleTrouble contract can call this");

    if (!_registeredCollectionsSet[collection]) {
      _registeredCollectionsSet[collection] = true;
      _registeredCollections.push(collection);

      // We mint a brand new NFT if this is the first call for this collection
      _safeMint(receiverOfNft, _registeredCollections.length - 1);
    }
  }

  function patronTokenIdForCollection(address collection) public view returns (bool, uint256) {
    for (uint i = 0; i < _registeredCollections.length; i++) {
      if (collection == address(_registeredCollections[i])) {
        return (true, i);
      }
    }
    // Collection not found
    return (false, 0);
  }

  function patronOf(address collection) public view returns (address) {
    (bool found, uint256 tokenId) = patronTokenIdForCollection(collection);
    if (!found) {
      return address(0);
    }
    return ownerOf(tokenId);
  }

  function patronedCollection(uint256 tokenId) public view returns (address) {
    return _registeredCollections[tokenId];
  }

  function patronedCollectionInfo(uint256 tokenId) public view returns (CollectionInfo memory) {
    IERC721Metadata c = IERC721Metadata(_registeredCollections[tokenId]);
    return CollectionInfo(_registeredCollections[tokenId], c.name(), c.symbol(), ownerOf(tokenId));
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(tokenId < _registeredCollections.length, "tokenId not present");
    string memory collectionAddr = Stringify.toString(_registeredCollections[tokenId]);
    string memory strTokenId = Stringify.toString(tokenId);

    string[20] memory parts;
    uint256 lastPart = 0;
    parts[lastPart++] = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 400 400"><style>.base { fill: white; font-family: serif; font-size: 14px; }</style><rect width="100%" height="100%" fill="black" /><text x="10" y="20" class="base">';

    parts[lastPart++] = string(abi.encodePacked('PTRN #', strTokenId));
    parts[lastPart++] = '</text>';

    try IERC721Metadata(_registeredCollections[tokenId]).name() returns (string memory name) {
      parts[lastPart++] = '<text x="10" y="40" class="base">';
      parts[lastPart++] = name;
      parts[lastPart++] = '</text>';
    } catch (bytes memory /*lowLevelData*/) {
      // NOOP
    }

    try IERC721Metadata(_registeredCollections[tokenId]).symbol() returns (string memory symbol) {
      parts[lastPart++] = '<text x="10" y="60" class="base">';
      parts[lastPart++] = symbol;
      parts[lastPart++] = '</text>';
    } catch (bytes memory /*lowLevelData*/) {
      // NOOP
    }

    parts[lastPart++] = '<text x="10" y="80" class="base">';
    parts[lastPart++] = string(abi.encodePacked('Collection: ', collectionAddr));

    parts[lastPart++] = '</text></svg>';

    string memory output;
    for (uint256 i = 0; i < lastPart; i++) {
      output = string(abi.encodePacked(output, parts[i]));
    }

    string memory json = Base64.encode(bytes(string(abi.encodePacked('{"name": "PTRN #', strTokenId, '", "collection": "',
                                                                      collectionAddr, '", "description": "Whoever owns this PTRN token is the Patron for this collection. Patrons automatically get a % fee for any NFT from this collection sold within Double Trouble.", "image": "data:image/svg+xml;base64,',
                                                                      Base64.encode(bytes(output)), '"}'))));
    output = string(abi.encodePacked('data:application/json;base64,', json));

    return output;
  }
}
