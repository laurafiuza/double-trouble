pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "./DoubleTroubleOrchestrator.sol";
import "./Libraries.sol";

// SPDX-License-Identifier: MIT
contract DoubleTrouble is ERC721URIStorage {
  // nested mapping that keeps track of who owns the NFTs
  mapping (uint256 => uint256) _forSalePrices;
  mapping (uint256 => uint256) _lastPurchasePrices;
  mapping (uint256 => uint256) _lastPurchaseTimes;
  DoubleTroubleOrchestrator _dto;
  IERC721Metadata public _originalCollection;
  address _feeWallet;
  uint256 public _feeRate;
  uint256 public _daysForWithdraw;
  uint256 public _dtNumerator;
  uint256 public _dtDenominator;
  uint256[] _registeredTokens;

  event Buy(address oldOwner, address newOwner, uint256 tokenId, uint256 valuePaid, uint256 forSalePrice);
  event ForceBuy(address oldOwner, address newOwner, uint256 tokenId, uint256 valuePaid, uint256 lastPurchasePrice);
  event SetPrice(address msgSender, uint256 tokenId, uint256 price);
  event Withdraw(address owner, uint256 tokenId, uint256 lastPurchasePrice);

  constructor(string memory name, string memory symbol, address nftCollection, address feeWallet, address dto,
              uint256 daysForWithdraw, uint256 dtNumerator, uint256 dtDenominator, uint256 feeRate) ERC721(name, symbol) {
    require(nftCollection != address(0), "collection address cannot be zero");
    require(dto != address(0), "dto address cannot be zero");
    _originalCollection = IERC721Metadata(nftCollection);
    _feeWallet = feeWallet;
    _dto = DoubleTroubleOrchestrator(dto);
    _daysForWithdraw = daysForWithdraw;
    _dtNumerator = dtNumerator;
    _dtDenominator = dtDenominator;
    _feeRate = feeRate;
  }

  function originalCollection() external view returns (address) {
    return address(_originalCollection);
  }

  function safeTransferFrom(address, address, uint256, bytes memory) public override pure {
    revert("Please use buy or forceBuy");
  }

  function safeTransferFrom(address, address, uint256) public override pure {
    revert("Please use buy or forceBuy");
  }

  function transferFrom(address, address, uint256) public override pure {
    revert("Please use buy or forceBuy");
  }

  function forSalePrice(uint256 tokenId) external view returns (uint256) {
    return _forSalePrices[tokenId];
  }

  function lastPurchasePrice(uint256 tokenId) external view returns (uint256) {
    return _lastPurchasePrices[tokenId];
  }

  function lastPurchaseTime(uint256 tokenId) external view returns (uint256) {
    return _lastPurchaseTimes[tokenId];
  }

  function availableToWithdraw(uint256 tokenId) external view returns (uint256) {
    return _lastPurchaseTimes[tokenId] + (_daysForWithdraw * 1 days);
  }

  function timeToWithdraw(uint256 tokenId) external view returns (int256) {
    return int256(this.availableToWithdraw(tokenId) - block.timestamp);
  }

  function troublesomeTokenURI(uint256 tokenId) external view returns (string memory) {
    return _originalCollection.tokenURI(tokenId);
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    string memory output = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350"><style>.base { fill: white; font-family: serif; font-size: 16px; }</style><rect width="100%" height="100%" fill="black" /><text x="10" y="20" class="base">You are in trouble</text></svg>';

    string memory originalAddr = Stringify.toString(address(_originalCollection));
    string memory troublesomeAddr = Stringify.toString(address(this));
    string memory strTokenId = Stringify.toString(tokenId);
    string memory externalLink = string(abi.encodePacked('https://double-trouble.io/collections/', troublesomeAddr, '/', strTokenId));
    string memory json = Base64.encode(bytes(string(abi.encodePacked('{"name": "DEADBEEF", "external_link": "',
                                                                      externalLink, '", "originalCollection": "',
                                                                      originalAddr, '", "troublesomeCollection": "',
                                                                      troublesomeAddr, '", "description": "This NFT is only for sale in Double Trouble. Visit double-trouble.io to learn more.", "image": "data:image/svg+xml;base64,',
                                                                      Base64.encode(bytes(output)), '"}'))));
    return string(abi.encodePacked('data:application/json;base64,', json));
  }

  function setPrice(uint256 tokenId, uint256 price) external {
    // Putting up for sale for the first time
    if (_lastPurchasePrices[tokenId] == 0) {
      require(_originalCollection.getApproved(tokenId) == msg.sender ||
              _originalCollection.ownerOf(tokenId) == msg.sender, "msg.sender should be approved or owner of original NFT");
    // All times after
    } else {
      require(_isApprovedOrOwner(msg.sender, tokenId), "msg.sender should be approved or owner of NFT");
    }
    _forSalePrices[tokenId] = price;

    emit SetPrice(msg.sender, tokenId, price);
  }

  function buy(uint256 tokenId) payable external {
    require(_forSalePrices[tokenId] > 0, "NFT is not for sale");
    require(msg.value >= _forSalePrices[tokenId], "Value sent must be at least the for sale price");

    // Make NFT troublesome if this is the first time it's being purchased
    if (_lastPurchasePrices[tokenId] == 0) {
      require(_originalCollection.getApproved(tokenId) == address(this), "DoubleTrouble contract must be approved to operate this token");

      // In the original collection, the owner forever becomes the DoubleTrouble contract
      address owner = _originalCollection.ownerOf(tokenId);
      _originalCollection.transferFrom(owner, address(this), tokenId);

      // Mint an NFT in the DT contract so we start recording the true owner here
      _mint(owner, tokenId);
      _registeredTokens.push(tokenId);
    }

    emit Buy(ownerOf(tokenId), msg.sender, tokenId, msg.value, _forSalePrices[tokenId]);
    _completeBuy(msg.sender, tokenId, msg.value);
  }

  function withdraw(uint256 tokenId) payable external {
    require(_isApprovedOrOwner(msg.sender, tokenId), "msg.sender should be approved or owner of NFT");
    require(block.timestamp > this.availableToWithdraw(tokenId), "NFT not yet available to withdraw from Double Trouble");
    require(msg.value >= _lastPurchasePrices[tokenId] / _feeRate * 2, "Must pay fee to withdraw");

    uint256 pricePaid = _lastPurchasePrices[tokenId];
    emit Withdraw(ownerOf(tokenId), tokenId, pricePaid);

    // Transfer original NFT back to owner, and burn troublesome NFT
    _originalCollection.transferFrom(address(this), ownerOf(tokenId), tokenId);
    _burn(tokenId);
    _removeRegistered(tokenId);

    // Reset DT state for tokenId
    _lastPurchasePrices[tokenId] = 0;
    _forSalePrices[tokenId] = 0;
    _lastPurchaseTimes[tokenId] = 0;

    _sendFees(pricePaid / _feeRate);
  }

  function _removeRegistered(uint256 tokenId) internal {
    bool found = false;
    for (uint256 i = 0; i < _registeredTokens.length - 1; i++) {
      if (_registeredTokens[i] == tokenId) {
        found = true;
      }

      if (found) {
        _registeredTokens[i] = _registeredTokens[i + 1];
      }
    }

    require(found || _registeredTokens[_registeredTokens.length - 1] == tokenId, "tokenId not found in remove");
    _registeredTokens.pop();
  }


  function forceBuy(uint256 tokenId) payable external {
    require(_lastPurchasePrices[tokenId] > 0, "NFT was not yet purchased within DoubleTrouble");
    require(msg.value >= (_dtNumerator * _lastPurchasePrices[tokenId] / _dtDenominator), "Value sent must be at least twice the last purchase price");

    emit ForceBuy(ownerOf(tokenId), msg.sender, tokenId, msg.value, _lastPurchasePrices[tokenId]);
    _completeBuy(msg.sender, tokenId, msg.value);
  }

  function _completeBuy(address newOwner, uint256 tokenId, uint256 amountPaid) internal virtual {
    // Change owner, set last purchase price, and remove from sale
    address oldOwner = ownerOf(tokenId);
    _transfer(oldOwner, newOwner, tokenId);
    _lastPurchasePrices[tokenId] = amountPaid;
    _lastPurchaseTimes[tokenId] = block.timestamp;
    _forSalePrices[tokenId] = 0;
    uint256 feeToCharge = amountPaid / _feeRate;

    // Send ether to the old owner. Must be at the very end of the buy function to prevent reentrancy attacks
    // https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/
    (bool oldOwnersuccess, ) = oldOwner.call{value: amountPaid - 2 * feeToCharge}("");
    require(oldOwnersuccess, "Transfer to owner failed.");

    _sendFees(feeToCharge);
  }

  function _sendFees(uint256 feeToCharge) internal virtual {
    // Send fee to patron of this troublesome Collection
    address patron = _dto.patronOf(address(this));
    (bool patronSuccess, ) = patron.call{value: feeToCharge}("");

    // Send rest of the fee to the DT wallet
    uint256 rest = patronSuccess ? feeToCharge : 2 * feeToCharge;
    (bool feeWalletSuccess, ) = _feeWallet.call{value: rest}("");
    require(feeWalletSuccess, "Transfer to DT wallet failed.");
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return interfaceId == 0xdeadbeef || super.supportsInterface(interfaceId);
  }

  function registeredTokens() external view returns (uint256[] memory) {
    return _registeredTokens;
  }
}
