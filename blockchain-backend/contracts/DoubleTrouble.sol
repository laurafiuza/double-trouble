pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

// SPDX-License-Identifier: MIT
contract DoubleTrouble is ERC721URIStorage {
  // nested mapping that keeps track of who owns the NFTs
  mapping (uint256 => uint256) public _forSalePrices;
  mapping (uint256 => uint256) public _lastPurchasePrices;
  address _originalCollection;
  address _feeWallet;
  uint256 _feeRate = 100;
  uint256[] _registeredTokens;

  constructor(string memory name, string memory symbol, address nftCollection, address feeWallet) ERC721(name, symbol) {
    require(nftCollection != address(0), "collection address cannot be zero");
    require(IERC721Metadata(nftCollection).supportsInterface(0x80ac58cd), "collection must refer to an ERC721 address");
    _originalCollection = nftCollection;
    _feeWallet = feeWallet;
  }

  function makeTroublesome(uint256 tokenId, uint256 initialForSalePrice) external {
    require(IERC721Metadata(_originalCollection).getApproved(tokenId) == address(this), "DoubleTrouble contract must be approved to operate this token");

    // In the original collection, the owner forever becomes the DoubleTrouble contract
    address owner = IERC721Metadata(_originalCollection).ownerOf(tokenId);
    IERC721Metadata(_originalCollection).transferFrom(owner, address(this), tokenId);

    // Mint an NFT in the DT contract so we start recording the true owner here
    _mint(owner, tokenId);
    _forSalePrices[tokenId] = initialForSalePrice;
    _registeredTokens.push(tokenId);
  }

  function unmakeTroublesome(uint256 tokenId) external {
    require(msg.sender == ownerOf(tokenId), "msg.sender should be current owner of NFT");
    require(_lastPurchasePrices[tokenId] == 0, "Cannot remove NFT from DoubleTrouble if it was already bought by someone");

    // Transfer ownership of the NFT
    IERC721Metadata(_originalCollection).transferFrom(address(this), msg.sender, tokenId);
    _burn(tokenId);
    _removeRegistered(tokenId);
  }

  function _removeRegistered(uint256 tokenId) internal {
    bool found = false;
    for (uint256 i = 0; i < _registeredTokens.length - 1; i++) {
      if (found) {
        _registeredTokens[i] = _registeredTokens[i + 1];
      }

      if (_registeredTokens[i] == tokenId) {
        found = true;
      }
    }

    require(found || _registeredTokens[_registeredTokens.length - 1] == tokenId, "tokenId not found in remove");
    _registeredTokens.pop();
  }

  function originalCollection() external view returns (address) {
    return _originalCollection;
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
    require(ownerOf(tokenId) != address(0), "collection and tokenId combination is not present in DT");
    return _forSalePrices[tokenId];
  }

  function lastPurchasePrice(uint256 tokenId) external view returns (uint256) {
    require(ownerOf(tokenId) != address(0), "collection and tokenId combination is not present in DT");
    return _lastPurchasePrices[tokenId];
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    return IERC721Metadata(_originalCollection).tokenURI(tokenId);
  }

  function setPrice(uint256 tokenId, uint256 price) external {
    require(msg.sender == ownerOf(tokenId), "msg.sender should be current owner of NFT");
    _forSalePrices[tokenId] = price;
  }

  function buy(uint256 tokenId) payable external {
    require(_forSalePrices[tokenId] > 0, "NFT is not for sale");
    require(msg.value >= _forSalePrices[tokenId], "Value sent must be at least the for sale price");
    _completeBuy(msg.sender, tokenId, msg.value);
  }

  function forceBuy(uint256 tokenId) payable external {
    require(_lastPurchasePrices[tokenId] > 0, "NFT was not yet purchased within DoubleTrouble");
    require(msg.value >= (2 * _lastPurchasePrices[tokenId]), "Value sent must be at least twice the last purchase price");
    _completeBuy(msg.sender, tokenId, msg.value);
  }

  function _completeBuy(address newOwner, uint256 tokenId, uint256 amountPaid) internal virtual {
    // Change owner, set last purchase price, and remove from sale
    address oldOwner = ownerOf(tokenId);
    _transfer(oldOwner, newOwner, tokenId);
    _lastPurchasePrices[tokenId] = amountPaid;
    _forSalePrices[tokenId] = 0;
    uint256 feeToCharge = amountPaid / _feeRate;

    // Send ether to the old owner. Must be at the very end of the buy function to prevent reentrancy attacks
    // https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/
    (bool oldOwnersuccess, ) = oldOwner.call{value: amountPaid - feeToCharge}("");
    // Send ether to the DT wallet
    require(oldOwnersuccess, "Transfer to owner failed.");
    (bool feeWalletSuccess, ) = _feeWallet.call{value: feeToCharge}("");
    require(feeWalletSuccess, "Transfer to DT wallet failed.");
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
    return interfaceId == 0xdeadbeef || super.supportsInterface(interfaceId);
  }

  function registeredTokens() external view returns (uint256[] memory) {
    return _registeredTokens;
  }
}
