pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "./Libraries.sol";

// Cannot include more than these two fields because otherwise the contract size gets above the 24k limit
struct TokenInfo {
   address collection;
   uint256 tokenId;
   uint256 lastPurchasePrice;
   uint256 forSalePrice;
   uint256 availableToWithdraw;
}

struct Token {
  address collection;
  uint256 id;
}

// SPDX-License-Identifier: MIT
contract DoubleTrouble is ERC721URIStorage {
  // nested mapping that keeps track of who owns the NFTs
  mapping(address => mapping (uint256 => uint256)) _forSalePrices;
  mapping(address => mapping (uint256 => uint256)) _lastPurchasePrices;
  mapping(address => mapping (uint256 => uint256)) _lastPurchaseTimes;
  mapping(address => mapping (uint256 => address)) _owners;
  address _feeWallet;
  uint256 public _feeRate;
  uint256 public _daysForWithdraw;
  uint256 public _dtNumerator;
  uint256 public _dtDenominator;

  // Enumerable set of known tokens
  Token[] _knownTokens;
  mapping(address => mapping (uint256 => bool)) _knownTokensSet;

  // Enumerable set of known collections
  address[] _knownCollections;
  mapping(address =>  bool) _knownCollectionsSet;

  event Buy(address oldOwner, address newOwner, address collection, uint256 tokenId, uint256 valueSent, uint256 amountPaid);
  event ForceBuy(address oldOwner, address newOwner, address collection, uint256 tokenId, uint256 valueSent, uint256 lastPurchasePrice, uint256 amountPaid);
  event SetPrice(address msgSender, address collection, uint256 tokenId, uint256 price);
  event Withdraw(address owner, address collection, uint256 tokenId, uint256 lastPurchasePrice);

  constructor(uint256 daysForWithdraw, uint256 dtNumerator, uint256 dtDenominator, uint256 feeRate,
              address feeWallet) ERC721("Patron Tokens", "PTRN") {
    _feeWallet = feeWallet;
    _daysForWithdraw = daysForWithdraw;
    _dtNumerator = dtNumerator;
    _dtDenominator = dtDenominator;
    _feeRate = feeRate;
  }

  function forSalePrice(address collection, uint256 tokenId) external view returns (uint256) {
    return _forSalePrices[collection][tokenId];
  }

  function lastPurchasePrice(address collection, uint256 tokenId) external view returns (uint256) {
    return _lastPurchasePrices[collection][tokenId];
  }

  function lastPurchaseTime(address collection, uint256 tokenId) external view returns (uint256) {
    return _lastPurchaseTimes[collection][tokenId];
  }

  function availableToWithdraw(address collection, uint256 tokenId) external view returns (uint256) {
    return _lastPurchaseTimes[collection][tokenId] + (_daysForWithdraw * 1 days);
  }

  function secondsToWithdraw(address collection, uint256 tokenId) external view returns (int256) {
    // Allow uints to underflow per https://ethereum-blockchain-developer.com/010-solidity-basics/03-integer-overflow-underflow/
    unchecked {
      return int256(this.availableToWithdraw(collection, tokenId) - block.timestamp);
    }
  }

  function originalTokenURI(address collection, uint256 tokenId) external view returns (string memory) {
    return IERC721Metadata(collection).tokenURI(tokenId);
  }

  function ownerOf(address collection, uint256 tokenId) public view returns (address) {
    return _owners[collection][tokenId];
  }

  function setPrice(address collection, uint256 tokenId, uint256 price) external {
    _addKnownToken(collection, tokenId, msg.sender);

    // Putting up for sale for the first time
    if (_lastPurchasePrices[collection][tokenId] == 0) {
      require(IERC721Metadata(collection).getApproved(tokenId) == msg.sender ||
              IERC721Metadata(collection).ownerOf(tokenId) == msg.sender, "msg.sender should be approved or owner of original NFT");
    // All times after
    } else {
      require(ownerOf(collection, tokenId) == msg.sender, "msg.sender should be owner of NFT");
    }
    _forSalePrices[collection][tokenId] = price;

    emit SetPrice(msg.sender, collection, tokenId, price);
  }

  function buy(address collection, uint256 tokenId) payable external {
    require(_forSalePrices[collection][tokenId] > 0, "NFT is not for sale");
    require(msg.value >= _forSalePrices[collection][tokenId], "Value sent must be at least the for sale price");
    _addKnownToken(collection, tokenId, msg.sender);

    // Make NFT troublesome if this is the first time it's being purchased
    if (_owners[collection][tokenId] == address(0)) {
      require(IERC721Metadata(collection).getApproved(tokenId) == address(this), "DoubleTrouble contract must be approved to operate this token");

      // In the original collection, the owner becomes the DoubleTrouble contract
      address owner = IERC721Metadata(collection).ownerOf(tokenId);
      IERC721Metadata(collection).transferFrom(owner, address(this), tokenId);
      _owners[collection][tokenId] = owner;
    }

    emit Buy(_owners[collection][tokenId], msg.sender, collection, tokenId, msg.value, _forSalePrices[collection][tokenId]);
    _completeBuy(_owners[collection][tokenId], msg.sender, collection, tokenId, _forSalePrices[collection][tokenId]);
  }

  function forceBuy(address collection, uint256 tokenId) payable external {
    require(_lastPurchasePrices[collection][tokenId] > 0, "NFT was not yet purchased within DoubleTrouble");
    uint256 amountToPay = _dtNumerator * _lastPurchasePrices[collection][tokenId] / _dtDenominator;
    require(msg.value >= amountToPay, "Value sent must be at least twice the last purchase price");
    _addKnownToken(collection, tokenId, msg.sender);

    emit ForceBuy(_owners[collection][tokenId], msg.sender, collection, tokenId, msg.value,
                  _lastPurchasePrices[collection][tokenId], amountToPay);
    _completeBuy(_owners[collection][tokenId], msg.sender, collection, tokenId, amountToPay);
  }

  function _completeBuy(address oldOwner, address newOwner, address collection, uint256 tokenId, uint256 amountToPay) internal virtual {
    require(_owners[collection][tokenId] == oldOwner, "old owner must match");
    // Change owner, set last purchase price, and remove from sale
    _owners[collection][tokenId] = newOwner;
    _lastPurchasePrices[collection][tokenId] = amountToPay;
    _lastPurchaseTimes[collection][tokenId] = block.timestamp;
    _forSalePrices[collection][tokenId] = 0;
    uint256 patronFee = amountToPay / _feeRate;

    // Send ether to the old owner. Must be at the very end of the buy function to prevent reentrancy attacks
    // https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/
    uint256 amountSent = amountToPay - 2 * patronFee;
    (bool oldOwnersuccess, ) = oldOwner.call{value: amountSent}("");
    require(oldOwnersuccess, "Transfer to owner failed.");

    _sendFees(collection, patronFee, msg.value - amountSent);
  }

  function _sendFees(address collection, uint256 patronFee, uint256 valueLeft) internal virtual {
    // Send fee to patron of this troublesome Collection
    address patron = patronOf(collection);
    (bool patronSuccess, ) = patron.call{value: patronFee}("");

    // Send rest of the fee to the DT wallet
    uint256 rest = patronSuccess ? valueLeft - patronFee : valueLeft;
    (bool feeWalletSuccess, ) = _feeWallet.call{value: rest}("");
    require(feeWalletSuccess, "Transfer to DT wallet failed.");
  }

  function withdraw(address collection, uint256 tokenId) payable external {
    require(_owners[collection][tokenId] == msg.sender, "msg.sender should be owner of NFT");
    require(block.timestamp > this.availableToWithdraw(collection, tokenId), "NFT not yet available to withdraw from Double Trouble");
    require(msg.value >= _lastPurchasePrices[collection][tokenId] / _feeRate * 2, "Must pay fee to withdraw");

    uint256 pricePaid = _lastPurchasePrices[collection][tokenId];
    emit Withdraw(ownerOf(tokenId), collection, tokenId, pricePaid);

    // Transfer original NFT back to owner, and burn troublesome NFT
    IERC721Metadata(collection).transferFrom(address(this), _owners[collection][tokenId], tokenId);

    // Reset DT state for token
    _owners[collection][tokenId] = address(0);
    _lastPurchasePrices[collection][tokenId] = 0;
    _forSalePrices[collection][tokenId] = 0;
    _lastPurchaseTimes[collection][tokenId] = 0;

    _sendFees(collection, pricePaid / _feeRate, msg.value);
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return interfaceId == 0xdeadbeef || super.supportsInterface(interfaceId);
  }

  function allKnownTokens() external view returns (TokenInfo[] memory) {
    TokenInfo[] memory ret = new TokenInfo[](_knownTokens.length);
    for (uint256 i = 0; i < _knownTokens.length; i++) {
      Token memory t = _knownTokens[i];
      ret[i] = TokenInfo(t.collection, t.id, _lastPurchasePrices[t.collection][t.id], _forSalePrices[t.collection][t.id],
                         _lastPurchaseTimes[t.collection][t.id] + (_daysForWithdraw * 1 days));
    }
    return ret;
  }

  function _addKnownToken(address collection, uint256 tokenId, address receiverOfNft) internal {
    if (!_knownTokensSet[collection][tokenId]) {
      _knownTokensSet[collection][tokenId] = true;
      _knownTokens.push(Token(collection, tokenId));

      if (!_knownCollectionsSet[collection]) {
        _knownCollectionsSet[collection] = true;
        _knownCollections.push(collection);

        // We mint a brand new NFT every time someone adds a new collection to Double Trouble
        _mint(receiverOfNft, _knownCollections.length - 1);
      }
    }
  }

  function patronTokenIdForCollection(address collection) public view returns (uint256) {
    for (uint i = 0; i < _knownCollections.length; i++) {
      if (collection == address(_knownCollections[i])) {
        return i;
      }
    }
    revert("Collection not found");
  }

  function patronOf(address collection) public view returns (address) {
    return ownerOf(patronTokenIdForCollection(collection));
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(tokenId < _knownCollections.length, "tokenId not present");
    string memory collectionAddr = Stringify.toString(_knownCollections[tokenId]);
    string memory strTokenId = Stringify.toString(tokenId);

    string[20] memory parts;
    uint256 lastPart = 0;
    parts[lastPart++] = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 400 400"><style>.base { fill: white; font-family: serif; font-size: 14px; }</style><rect width="100%" height="100%" fill="black" /><text x="10" y="20" class="base">';

    parts[lastPart++] = string(abi.encodePacked('PTRN #', strTokenId));
    parts[lastPart++] = '</text>';

    try IERC721Metadata(_knownCollections[tokenId]).name() returns (string memory name) {
      parts[lastPart++] = '<text x="10" y="40" class="base">';
      parts[lastPart++] = name;
      parts[lastPart++] = '</text>';
    } catch (bytes memory /*lowLevelData*/) {
      // NOOP
    }

    try IERC721Metadata(_knownCollections[tokenId]).symbol() returns (string memory symbol) {
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

  function _collectionName(uint256 tokenId) internal view returns (string memory) {
    return IERC721Metadata(_knownCollections[tokenId]).name();
  }

  function _collectionSymbol(uint256 tokenId) internal view returns (string memory) {
    return IERC721Metadata(_knownCollections[tokenId]).symbol();
  }
}
