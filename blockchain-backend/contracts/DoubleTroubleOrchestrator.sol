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
    require(address(_troublesomeCollections[nftCollection]) == address(0), "Collection is already Troublesome");

    // Deploy troublesome contract for nftCollection
    _troublesomeCollections[nftCollection] = _dtFactory.makeNew(name, symbol, nftCollection, _feeWallet, address(this));
    _mint(msg.sender, _registeredCollections.length);
    _registeredCollections.push(nftCollection);
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
  // If tokenId is owned by an externally owned account, trblOwnerOf returns that account
  // if tokenId is owned by the troublesome contract of this DTO, return the owner per
  // the troublesome contract
  function trblOwnerOf(uint256 tokenId) external view returns (address) {
    // Try to reach for a troublesomeCollection for this DTO
    DoubleTrouble dtForDto = this.troublesomeCollection(address(this));
    if (address(dtForDto) != address(0)) {
      try dtForDto.ownerOf(tokenId) returns (address owner) {
        return owner;
      } catch (bytes memory /*lowLevelData*/) {
        // NOOP
      }
    }

    // If the above failed, it means DTO itself knows the trblOwner
    return ownerOf(tokenId);
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
    string memory originalAddr = toString(o);
    string memory troublesomeAddr= toString(t);
    string memory strTokenId = toString(tokenId);

    string[20] memory parts;
    uint256 lastPart = 0;
    parts[lastPart++] = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 400 400"><style>.base { fill: white; font-family: serif; font-size: 14px; }</style><rect width="100%" height="100%" fill="black" /><text x="10" y="20" class="base">';

    parts[lastPart++] = string(abi.encodePacked('TRBL #', strTokenId));
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

    string memory json = Base64.encode(bytes(string(abi.encodePacked('{"name": "TRBL #', strTokenId, '", "originalCollection": "',
                                                                      originalAddr, '", "troublesomeCollection": "',
                                                                      troublesomeAddr, '", "description": "There is one TRBL NFT for each collection made troublesome by our community. Whoever arrives first and makes an NFT collection troublesome gets the unique TRBL NFT for that collection as a prize. Feel free to use and interpret TRBL NFTs in any way you want.", "image": "data:image/svg+xml;base64,',
                                                                      Base64.encode(bytes(output)), '"}'))));
    output = string(abi.encodePacked('data:application/json;base64,', json));

    return output;
  }

  // Library functions below here

  function toString(uint256 value) internal pure returns (string memory) {
    // Inspired by OraclizeAPI's implementation - MIT license
    // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol
    if (value == 0) {
        return "0";
    }
    uint256 temp = value;
    uint256 digits;
    while (temp != 0) {
        digits++;
        temp /= 10;
    }
    bytes memory buffer = new bytes(digits);
    while (value != 0) {
        digits -= 1;
        buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
        value /= 10;
    }
    return string(buffer);
  }

  function toString(address x) internal pure returns (string memory) {
    bytes memory s = new bytes(40);
    for (uint i = 0; i < 20; i++) {
        bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
        bytes1 hi = bytes1(uint8(b) / 16);
        bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
        s[2*i] = char(hi);
        s[2*i+1] = char(lo);
    }
    return string(abi.encodePacked('0x', string(s)));
 }

  function char(bytes1 b) internal pure returns (bytes1 c) {
      if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
      else return bytes1(uint8(b) + 0x57);
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
  function makeNew(string memory name, string memory symbol, address nftCollection, address feeWallet, address dto)
        external returns (DoubleTrouble) {
    return new DoubleTrouble(name, symbol, nftCollection, feeWallet, dto);
  }
}

/// [MIT License]
/// @title Base64
/// @notice Provides a function for encoding some bytes in base64
/// @author Brecht Devos <brecht@loopring.org>
library Base64 {
    bytes internal constant TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    /// @notice Encodes some bytes to the base64 representation
    function encode(bytes memory data) internal pure returns (string memory) {
        uint256 len = data.length;
        if (len == 0) return "";

        // multiply by 4/3 rounded up
        uint256 encodedLen = 4 * ((len + 2) / 3);

        // Add some extra buffer at the end
        bytes memory result = new bytes(encodedLen + 32);

        bytes memory table = TABLE;

        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)

            for {
                let i := 0
            } lt(i, len) {

            } {
                i := add(i, 3)
                let input := and(mload(add(data, i)), 0xffffff)

                let out := mload(add(tablePtr, and(shr(18, input), 0x3F)))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(12, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(6, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(input, 0x3F))), 0xFF))
                out := shl(224, out)

                mstore(resultPtr, out)

                resultPtr := add(resultPtr, 4)
            }

            switch mod(len, 3)
            case 1 {
                mstore(sub(resultPtr, 2), shl(240, 0x3d3d))
            }
            case 2 {
                mstore(sub(resultPtr, 1), shl(248, 0x3d))
            }

            mstore(result, encodedLen)
        }

        return string(result);
    }
}
